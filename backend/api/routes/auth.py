"""
Auth Router — Registration, Login, OTP verification, Password reset.

Fixes applied:
  1. verify-otp and resend-otp accept JSON body OR query params
  2. verify-otp returns a JWT token on success (no separate login needed)
  3. SKIP_EMAIL_VERIFICATION=true in .env auto-verifies accounts (dev mode)
"""

import os
import uuid
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.db.setup import get_db
from backend.utils.auth import hash_password, verify_password, create_access_token
from backend.api.dependencies.rbac import get_current_user
from backend.db.models.models import User, ConsentRecord
from backend.api.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    ForgotPasswordRequest, VerifyResetOtpRequest, ResetPasswordRequest,
)
from backend.utils.email_validation import validate_email_domain
from backend.utils.email_service import generate_otp, send_otp_email, send_password_reset_email

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

OTP_EXPIRY_MINUTES = 2

# Read once at startup
SKIP_EMAIL_VERIFICATION = os.getenv("SKIP_EMAIL_VERIFICATION", "false").lower() == "true"


# ── Extra schemas for body-based OTP calls ────────────────────────────────────

class VerifyOtpBody(BaseModel):
    email: str
    otp_code: str


class ResendOtpBody(BaseModel):
    email: str


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
@limiter.limit("60/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # 1. Validate email domain
    is_valid, error_msg = await validate_email_domain(payload.email)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    # 2. Check for duplicate email
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # 3. Generate OTP
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # 4. Create user (status=pending until email verified)
    new_user = User(
        id=uuid.uuid4(),
        cognito_sub=f"local-{uuid.uuid4()}",
        role=payload.role.value,
        email=payload.email,
        password_hash=hash_password(payload.password),
        status="pending",
        email_verified=False,
        otp_code=otp,
        otp_expires_at=expires_at,
    )
    db.add(new_user)
    await db.flush()

    # 5. Consent record
    consent = ConsentRecord(
        id=uuid.uuid4(),
        user_id=new_user.id,
        consent_type="registration",
        consent_version="2025-v1",
    )
    db.add(consent)
    await db.commit()
    await db.refresh(new_user)

    # 6. Auto-create stub candidate profile
    if new_user.role == "candidate" and payload.name:
        from backend.db.models.models import CandidateProfile
        stub = CandidateProfile(
            id=uuid.uuid4(),
            user_id=new_user.id,
            full_name=payload.name.strip(),
        )
        db.add(stub)
        await db.commit()

    # ── Dev mode: skip email verification entirely ────────────────────────────
    if SKIP_EMAIL_VERIFICATION:
        new_user.email_verified = True
        new_user.status = "active"
        new_user.otp_code = None
        new_user.otp_expires_at = None
        await db.commit()

        token = create_access_token({
            "user_id": str(new_user.id),
            "email":   new_user.email,
            "role":    new_user.role,
        })
        return {
            "message":      "Account created and auto-verified (dev mode — SKIP_EMAIL_VERIFICATION=true).",
            "email":        new_user.email,
            "status":       "active",
            "access_token": token,
            "role":         new_user.role,
            "user_id":      str(new_user.id),
            "skip_otp":     True,   # tells frontend to skip OTP page
        }

    # ── Production: send OTP email ────────────────────────────────────────────
    sent = await send_otp_email(new_user.email, otp)
    if not sent:
        # Email failed but account is created — user can request resend
        return {
            "message": (
                "Account created but we could not send the verification email. "
                "Please use the resend-otp option on the verification page."
            ),
            "email":  new_user.email,
            "status": "pending",
        }

    return {
        "message": (
            f"Account created. A 6-digit verification code has been sent to {new_user.email}. "
            f"It expires in {OTP_EXPIRY_MINUTES} minutes."
        ),
        "email":  new_user.email,
        "status": "pending",
    }


# ── Verify OTP ─────────────────────────────────────────────────────────────────
# Accepts JSON body {"email":"...","otp_code":"..."} OR ?email=&otp= query params

@router.post("/verify-otp")
async def verify_otp(
    # JSON body (sent by frontend)
    body: Optional[VerifyOtpBody] = None,
    # Query params (Swagger / direct API calls)
    email: Optional[str] = Query(None),
    otp:   Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    resolved_email = (body.email    if body else None) or email
    resolved_otp   = (body.otp_code if body else None) or otp

    if not resolved_email or not resolved_otp:
        raise HTTPException(status_code=422, detail="email and otp_code are required.")

    result = await db.execute(select(User).where(User.email == resolved_email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    if user.email_verified:
        # Already verified — just return a token so user can proceed
        token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
        return {
            "message":      "Email is already verified.",
            "access_token": token,
            "role":         user.role,
            "user_id":      str(user.id),
            "email":        user.email,
        }

    if not user.otp_code:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail="OTP has expired (2-minute limit). Please use resend-otp to get a new code.",
        )

    if user.otp_code != resolved_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check the code and try again.")

    # Activate account
    user.email_verified = True
    user.status = "active"
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    # Return token immediately — frontend logs user in without a second /login call
    token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    return {
        "message":      "Email verified successfully.",
        "access_token": token,
        "role":         user.role,
        "user_id":      str(user.id),
        "email":        user.email,
    }


# ── Resend OTP ────────────────────────────────────────────────────────────────
# Accepts JSON body {"email":"..."} OR ?email= query param

@router.post("/resend-otp")
@limiter.limit("5/minute")
async def resend_otp(
    request: Request,
    body:  Optional[ResendOtpBody] = None,
    email: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    resolved_email = (body.email if body else None) or email

    if not resolved_email:
        raise HTTPException(status_code=422, detail="email is required.")

    result = await db.execute(select(User).where(User.email == resolved_email))
    user = result.scalar_one_or_none()

    # Generic response — don't reveal whether email exists
    if not user or user.email_verified:
        return {"message": "If that email is registered and unverified, a new OTP has been sent."}

    new_otp = generate_otp()
    user.otp_code = new_otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.commit()

    await send_otp_email(resolved_email, new_otp)
    return {"message": "If that email is registered and unverified, a new OTP has been sent."}


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
@limiter.limit("60/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email first. Check your inbox for the 6-digit code.",
        )
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive.")

    token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, user_id=str(user.id), email=user.email)


# ── Forgot Password ────────────────────────────────────────────────────────────

RESET_OTP_EXPIRY_MINUTES   = 2
RESET_TOKEN_EXPIRY_MINUTES = 15


@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user and user.email_verified:
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=RESET_OTP_EXPIRY_MINUTES)
        user.reset_token = None
        user.reset_token_expires_at = None
        await db.commit()
        await send_password_reset_email(payload.email, otp)

    return {"message": "If that email is registered, a password-reset code has been sent. Check your inbox."}


@router.post("/verify-reset-otp")
async def verify_reset_otp(payload: VerifyResetOtpRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    if not user.otp_code or not user.otp_expires_at:
        raise HTTPException(status_code=400, detail="No reset code found. Please request a new one.")
    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")
    if user.otp_code != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid reset code.")

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    return {
        "message":     "OTP verified. Use the reset_token to set your new password.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if user.reset_token != payload.reset_token:
        raise HTTPException(status_code=400, detail="Invalid reset token.")
    if not user.reset_token_expires_at or datetime.utcnow() > user.reset_token_expires_at:
        user.reset_token = None
        user.reset_token_expires_at = None
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired. Please start over.")

    user.password_hash = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}


# ── Me / Logout ───────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role,
        status=current_user.status,
    )


@router.post("/logout")
async def logout(_: User = Depends(get_current_user)):
    """Client discards the JWT. Server-side blacklist not implemented in MVP."""
    return {"message": "Logged out successfully."}
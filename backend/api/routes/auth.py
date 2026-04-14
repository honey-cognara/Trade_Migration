import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.utils.auth import hash_password, verify_password, create_access_token
from backend.api.dependencies.rbac import get_current_user
from backend.db.models.models import User, ConsentRecord
from backend.api.schemas.auth import (
    RegisterRequest, LoginRequest,
    VerifyOtpRequest, ResendOtpRequest,
    ForgotPasswordRequest, VerifyResetOtpRequest, ResetPasswordRequest,
    TokenResponse, MessageResponse, UserResponse,
)
from backend.utils.email_service import generate_otp, otp_expiry, send_otp_email

router = APIRouter()


# ── helpers ────────────────────────────────────────────────────────────────────

def _validate_password(password: str):
    """Raises 422 if password doesn't meet requirements."""
    if len(password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters.")
    if not any(c.isupper() for c in password):
        raise HTTPException(status_code=422, detail="Password must contain at least one uppercase letter.")
    if not any(c.isdigit() for c in password):
        raise HTTPException(status_code=422, detail="Password must contain at least one number.")


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create account → send OTP to email → user must verify before logging in."""
    _validate_password(payload.password)

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    otp = generate_otp()
    expires = otp_expiry()

    new_user = User(
        id=uuid.uuid4(),
        cognito_sub=f"local-{uuid.uuid4()}",
        role=payload.role.value,
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        status="pending",
        email_verified=False,
        otp_code=otp,
        otp_expires_at=expires,
    )
    db.add(new_user)

    consent = ConsentRecord(
        id=uuid.uuid4(),
        user_id=new_user.id,
        consent_type="registration",
        consent_version="2025-v1",
    )
    db.add(consent)
    await db.commit()

    send_otp_email(payload.email, otp, purpose="verification")

    return MessageResponse(message="Registration successful. Please check your email for the verification code.")


# ── Verify OTP ─────────────────────────────────────────────────────────────────

@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """Verify the OTP code → activate account → return JWT token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    if user.email_verified:
        # Already verified — just return a token
        token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
        return TokenResponse(access_token=token, role=user.role, user_id=str(user.id), email=user.email)

    if not user.otp_code or user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check and try again.")

    # Check expiry
    if user.otp_expires_at:
        exp = user.otp_expires_at
        # Make timezone-aware if needed
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")

    # Activate
    user.email_verified = True
    user.status = "active"
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, user_id=str(user.id), email=user.email)


# ── Resend OTP ─────────────────────────────────────────────────────────────────

@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(payload: ResendOtpRequest, db: AsyncSession = Depends(get_db)):
    """Resend verification OTP. Always returns a generic message to prevent enumeration."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user and not user.email_verified:
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = otp_expiry()
        await db.commit()
        send_otp_email(payload.email, otp, purpose="verification")

    return MessageResponse(message="If this email is registered and unverified, a new code has been sent.")


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before logging in.")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Please contact support.")

    token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, user_id=str(user.id), email=user.email)


# ── Forgot Password ────────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send password reset OTP. Always returns same message to prevent enumeration."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user and user.email_verified and user.status == "active":
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = otp_expiry()
        await db.commit()
        send_otp_email(payload.email, otp, purpose="reset")

    return MessageResponse(message="If this email is registered, a password reset code has been sent.")


# ── Verify Reset OTP ───────────────────────────────────────────────────────────

@router.post("/verify-reset-otp", response_model=TokenResponse)
async def verify_reset_otp(payload: VerifyResetOtpRequest, db: AsyncSession = Depends(get_db)):
    """Verify password reset OTP → return a short-lived reset token."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    if not user.otp_code or user.otp_code != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid reset code.")

    if user.otp_expires_at:
        exp = user.otp_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Clear OTP so it can't be reused
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    # Return a short-lived token scoped for password reset only
    from datetime import timedelta
    reset_token = create_access_token(
        {"user_id": str(user.id), "email": user.email, "role": user.role, "purpose": "reset"},
        expires_delta=timedelta(minutes=15)
    )
    return TokenResponse(access_token=reset_token, role=user.role, user_id=str(user.id), email=user.email)


# ── Reset Password ─────────────────────────────────────────────────────────────

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Set a new password using the reset token from verify-reset-otp."""
    from backend.utils.auth import decode_access_token
    _validate_password(payload.new_password)

    try:
        claims = decode_access_token(payload.reset_token)
    except HTTPException:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if claims.get("purpose") != "reset":
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    result = await db.execute(select(User).where(User.email == claims["email"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.password_hash = hash_password(payload.new_password)
    await db.commit()

    return MessageResponse(message="Password reset successfully. You can now log in with your new password.")


# ── Me ─────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        status=current_user.status,
    )


# ── Logout ─────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully. Please delete your token client-side."}

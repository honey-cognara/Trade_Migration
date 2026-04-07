import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.db.setup import get_db
from backend.utils.auth import hash_password, verify_password, create_access_token
from backend.api.dependencies.rbac import get_current_user
from backend.db.models.models import User, ConsentRecord
from backend.api.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from backend.utils.email_validation import validate_email_domain
from backend.utils.email_service import generate_otp, send_otp_email

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

OTP_EXPIRY_MINUTES = 2


@router.post("/register", status_code=201)
@limiter.limit("60/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # 1. Validate email domain (blocks disposable/fake + checks MX)
    is_valid, error_msg = await validate_email_domain(payload.email)
    if not is_valid:
        raise HTTPException(status_code=422, detail=error_msg)

    # 2. Check duplicate
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    # 3. Generate OTP (expires in 2 minutes)
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # 4. Create user with status=pending (cannot login until OTP verified)
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

    consent = ConsentRecord(
        id=uuid.uuid4(),
        user_id=new_user.id,
        consent_type="registration",
        consent_version="2025-v1",
    )
    db.add(consent)
    await db.commit()
    await db.refresh(new_user)

    # 5. Auto-create stub candidate profile
    if new_user.role == "candidate" and payload.name:
        from backend.db.models.models import CandidateProfile
        stub_profile = CandidateProfile(
            id=uuid.uuid4(),
            user_id=new_user.id,
            full_name=payload.name.strip(),
        )
        db.add(stub_profile)
        await db.commit()

    # 6. Send OTP email
    sent = await send_otp_email(payload.email, otp)
    if not sent:
        return {
            "message": "Account created but we could not send the OTP email. Please use resend-otp endpoint.",
            "email": payload.email,
            "status": "pending",
        }

    return {
        "message": f"Account created. A 6-digit verification code has been sent to {payload.email}. It expires in {OTP_EXPIRY_MINUTES} minutes.",
        "email": payload.email,
        "status": "pending",
    }


@router.post("/verify-otp")
async def verify_otp(email: str, otp: str, db: AsyncSession = Depends(get_db)):
    """
    Verify the 6-digit OTP sent to the user's email.
    Activates the account on success.
    """
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")

    if user.email_verified:
        return {"message": "Email is already verified. You can log in."}

    if not user.otp_code:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    if datetime.utcnow() > user.otp_expires_at:
        raise HTTPException(
            status_code=400,
            detail=f"OTP has expired (2-minute limit). Please use /auth/resend-otp to get a new code."
        )

    if user.otp_code != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP. Please check the code and try again.")

    # Activate account
    user.email_verified = True
    user.status = "active"
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()

    return {"message": "Email verified successfully. You can now log in."}


@router.post("/resend-otp")
@limiter.limit("5/minute")
async def resend_otp(request: Request, email: str, db: AsyncSession = Depends(get_db)):
    """Resend a fresh 2-minute OTP to the given email."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Don't reveal if email exists
    if not user or user.email_verified:
        return {"message": "If that email is registered and unverified, a new OTP has been sent."}

    new_otp = generate_otp()
    user.otp_code = new_otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    await db.commit()

    await send_otp_email(email, new_otp)
    return {"message": "If that email is registered and unverified, a new OTP has been sent."}


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
            detail="Please verify your email first. Enter the 6-digit code sent to your inbox, or request a new one via /auth/resend-otp."
        )
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive.")

    token = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, user_id=str(user.id), email=user.email)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=str(current_user.id), email=current_user.email, role=current_user.role, status=current_user.status)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully. Please delete your token."}

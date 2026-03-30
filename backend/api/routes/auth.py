import uuid
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

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        id=uuid.uuid4(),
        cognito_sub=f"local-{uuid.uuid4()}",
        role=payload.role.value,
        email=payload.email,
        password_hash=hash_password(payload.password),
        status="active",
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

    # Auto-create a stub candidate profile so the registered name is not lost
    if new_user.role == "candidate" and payload.name:
        from backend.db.models.models import CandidateProfile
        stub_profile = CandidateProfile(
            id=uuid.uuid4(),
            user_id=new_user.id,
            full_name=payload.name.strip(),
        )
        db.add(stub_profile)
        await db.commit()

    token = create_access_token({
        "user_id": str(new_user.id),
        "email": new_user.email,
        "role": new_user.role,
    })
    return TokenResponse(access_token=token, role=new_user.role, user_id=str(new_user.id), email=new_user.email)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
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

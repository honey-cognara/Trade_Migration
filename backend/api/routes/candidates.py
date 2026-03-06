"""
Candidates Router – Candidate profile management.

Actions:
  - Create / update candidate profile
  - Publish / unpublish profile
  - View received EOIs

Access: candidate role (own profile), admin (read all).
"""

import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.db.models.models import CandidateProfile, ExpressionOfInterest, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CandidateProfileCreate(BaseModel):
    full_name: str
    nationality: Optional[str] = None
    country_of_residence: Optional[str] = None
    trade_category: Optional[str] = None
    is_electrical_worker: bool = False
    years_experience: Optional[int] = None
    languages: Optional[List[dict]] = None
    profile_summary: Optional[str] = None


class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    country_of_residence: Optional[str] = None
    trade_category: Optional[str] = None
    is_electrical_worker: Optional[bool] = None
    years_experience: Optional[int] = None
    languages: Optional[List[dict]] = None
    profile_summary: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _profile_to_dict(p: CandidateProfile) -> dict:
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "full_name": p.full_name,
        "nationality": p.nationality,
        "country_of_residence": p.country_of_residence,
        "trade_category": p.trade_category,
        "is_electrical_worker": p.is_electrical_worker,
        "years_experience": p.years_experience,
        "languages": p.languages,
        "profile_summary": p.profile_summary,
        "published": p.published,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


async def _get_own_profile(user_id, db) -> CandidateProfile:
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/profile", status_code=201)
async def create_profile(
    payload: CandidateProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Create a candidate profile for the authenticated user."""
    existing = await _get_own_profile(current_user.id, db)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PUT to update.")

    profile = CandidateProfile(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return _profile_to_dict(profile)


@router.get("/profile")
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Return the authenticated candidate's own profile."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create one first.")
    return _profile_to_dict(profile)


@router.put("/profile")
async def update_profile(
    payload: CandidateProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Update the authenticated candidate's profile."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create one first.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return _profile_to_dict(profile)


@router.post("/profile/publish")
async def publish_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Publish the candidate's profile so employers can discover them."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not profile.full_name or not profile.trade_category:
        raise HTTPException(
            status_code=400,
            detail="Profile must have a full name and trade category before publishing."
        )

    profile.published = True
    await db.commit()
    return {"published": True, "candidate_id": str(profile.id)}


@router.post("/profile/unpublish")
async def unpublish_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Unpublish (hide) the candidate's profile."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.published = False
    await db.commit()
    return {"published": False, "candidate_id": str(profile.id)}


@router.delete("/profile", status_code=204)
async def delete_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Permanently delete the authenticated candidate's profile."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()
    return None


@router.get("/eois")
async def get_received_eois(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Return all EOIs received by the authenticated candidate."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(ExpressionOfInterest)
        .where(ExpressionOfInterest.candidate_id == profile.id)
        .order_by(ExpressionOfInterest.created_at.desc())
    )
    eois = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "employer_company_id": str(e.employer_company_id),
            "job_title": e.job_title,
            "message": e.message,
            "sponsorship_flag": e.sponsorship_flag,
            "status": e.status,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in eois
    ]

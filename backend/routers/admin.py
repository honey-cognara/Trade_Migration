"""
Admin Router – Platform administration endpoints.

Actions:
  - View and approve/reject pending employer registrations
  - Unpublish candidate profiles
  - List all users

Access: admin role only.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.core.database import get_db
from backend.core.rbac import require_roles
from backend.models.models import EmployerCompany, CandidateProfile, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class VerifyEmployerRequest(BaseModel):
    action: str  # "approve" or "reject"


# ── Employers ─────────────────────────────────────────────────────────────────

@router.get("/employers/pending")
async def list_pending_employers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all employer companies awaiting admin verification."""
    result = await db.execute(
        select(EmployerCompany)
        .where(EmployerCompany.verification_status == "pending")
        .order_by(EmployerCompany.created_at.asc())
    )
    employers = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "company_name": e.company_name,
            "abn_or_identifier": e.abn_or_identifier,
            "contact_name": e.contact_name,
            "contact_email": e.contact_email,
            "industry": e.industry,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in employers
    ]


@router.post("/employers/{employer_id}/verify")
async def verify_employer(
    employer_id: str,
    payload: VerifyEmployerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    """Approve or reject an employer company registration."""
    if payload.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.id == employer_id)
    )
    employer = result.scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")

    employer.verification_status = "approved" if payload.action == "approve" else "rejected"
    await db.commit()
    return {
        "id": str(employer.id),
        "company_name": employer.company_name,
        "verification_status": employer.verification_status,
        "updated_by": str(current_user.id),
    }


@router.get("/employers")
async def list_all_employers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all employer companies with their verification status."""
    result = await db.execute(select(EmployerCompany).order_by(EmployerCompany.created_at.desc()))
    employers = result.scalars().all()
    return [
        {
            "id": str(e.id),
            "company_name": e.company_name,
            "industry": e.industry,
            "verification_status": e.verification_status,
            "contact_email": e.contact_email,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in employers
    ]


# ── Candidates ────────────────────────────────────────────────────────────────

@router.post("/candidates/{candidate_id}/unpublish")
async def admin_unpublish_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    """Force-unpublish a candidate profile."""
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == candidate_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    profile.published = False
    await db.commit()
    return {
        "candidate_id": str(profile.id),
        "published": False,
        "unpublished_by": str(current_user.id),
    }


@router.get("/candidates")
async def list_all_candidates(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all candidate profiles (published and unpublished)."""
    result = await db.execute(
        select(CandidateProfile).order_by(CandidateProfile.created_at.desc())
    )
    profiles = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "full_name": p.full_name,
            "trade_category": p.trade_category,
            "nationality": p.nationality,
            "published": p.published,
            "is_electrical_worker": p.is_electrical_worker,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in profiles
    ]


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all registered users."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]

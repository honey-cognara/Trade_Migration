"""
Admin Router – Platform administration endpoints.

Actions:
  - View and approve/reject pending employer registrations
  - Unpublish candidate profiles
  - List all users

Access: admin role only.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import EmployerCompany, CandidateProfile, User

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

    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")

    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.id == emp_uuid)
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
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all employer companies with their verification status."""
    result = await db.execute(select(EmployerCompany).order_by(EmployerCompany.created_at.desc()).limit(limit).offset(offset))
    employers = result.scalars().all()
    rows = [
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
    return rows


@router.get("/companies")
async def list_all_companies(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Alias for /employers — return all employer companies."""
    result = await db.execute(select(EmployerCompany).order_by(EmployerCompany.created_at.desc()).limit(limit).offset(offset))
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
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == cand_uuid)
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
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all candidate profiles (published and unpublished)."""
    result = await db.execute(
        select(CandidateProfile).order_by(CandidateProfile.created_at.desc()).limit(limit).offset(offset)
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


@router.get("/candidates/{candidate_id}")
async def get_candidate_by_id(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent")),
):
    """Return a single candidate profile by ID."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")
    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "nationality": profile.nationality,
        "country_of_residence": profile.country_of_residence,
        "trade_category": profile.trade_category,
        "is_electrical_worker": profile.is_electrical_worker,
        "years_experience": profile.years_experience,
        "languages": profile.languages,
        "profile_summary": profile.profile_summary,
        "published": profile.published,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
    }


@router.delete("/candidates/{candidate_id}", status_code=204)
async def admin_delete_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Permanently delete a candidate profile (admin only)."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")
    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    await db.delete(profile)
    await db.commit()
    return None


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all registered users."""
    result = await db.execute(select(User).order_by(User.created_at.desc()).limit(limit).offset(offset))
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


@router.get("/employers/{employer_id}")
async def get_employer_by_id(
    employer_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent")),
):
    """Return a single employer company by ID."""
    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")
    result = await db.execute(select(EmployerCompany).where(EmployerCompany.id == emp_uuid))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employer not found")
    return {
        "id": str(emp.id),
        "company_name": emp.company_name,
        "abn_or_identifier": emp.abn_or_identifier,
        "contact_name": emp.contact_name,
        "contact_email": emp.contact_email,
        "industry": emp.industry,
        "verification_status": emp.verification_status,
        "created_at": emp.created_at.isoformat() if emp.created_at else None,
    }


@router.delete("/employers/{employer_id}", status_code=204)
async def admin_delete_employer(
    employer_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Permanently delete an employer company (admin only)."""
    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")
    result = await db.execute(select(EmployerCompany).where(EmployerCompany.id == emp_uuid))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employer not found")
    await db.delete(emp)
    await db.commit()
    return None


class UserStatusUpdate(BaseModel):
    status: str  # "active" | "inactive"


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Activate or deactivate a user account."""
    if payload.status not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'inactive'")
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="user_id must be a valid UUID")
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = payload.status
    await db.commit()
    return {"id": str(user.id), "email": user.email, "status": user.status}

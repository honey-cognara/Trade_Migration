"""
Employers Router – Employer company management and candidate discovery.

Actions:
  - Create / update employer company profile
  - Search and filter published candidates
  - Submit an Expression of Interest (EOI)

Access: employer role; search/EOI requires verification_status == 'approved'.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.core.database import get_db
from backend.core.rbac import get_current_user, require_roles
from backend.models.models import EmployerCompany, CandidateProfile, ExpressionOfInterest, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    company_name: str
    abn_or_identifier: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    industry: Optional[str] = None


class EOICreate(BaseModel):
    candidate_id: str
    job_title: Optional[str] = None
    message: Optional[str] = None
    sponsorship_flag: bool = False


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_approved_company(user_id, db) -> EmployerCompany:
    """Return the employer's company if it is approved; raise 403 otherwise."""
    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == user_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found. Please register first.")
    if company.verification_status != "approved":
        raise HTTPException(
            status_code=403,
            detail=f"Your company registration is '{company.verification_status}'. "
                   "Await admin approval to access this feature."
        )
    return company


# ── Company endpoints ──────────────────────────────────────────────────────────

@router.post("/company", status_code=201)
async def create_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Register an employer company. Starts in 'pending' verification status."""
    existing = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Company profile already exists. Use PUT to update.")

    company = EmployerCompany(
        id=uuid.uuid4(),
        owner_user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return {
        "id": str(company.id),
        "company_name": company.company_name,
        "verification_status": company.verification_status,
        "message": "Company registered. An admin will review and approve your registration.",
    }


@router.put("/company")
async def update_company(
    payload: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Update an existing company profile."""
    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found. Please register first.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)
    return {
        "id": str(company.id),
        "company_name": company.company_name,
        "verification_status": company.verification_status,
    }


@router.get("/company")
async def get_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Return the authenticated employer's company profile."""
    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": str(company.id),
        "company_name": company.company_name,
        "abn_or_identifier": company.abn_or_identifier,
        "contact_name": company.contact_name,
        "contact_email": company.contact_email,
        "industry": company.industry,
        "verification_status": company.verification_status,
        "created_at": company.created_at.isoformat() if company.created_at else None,
    }


# ── Candidate search ───────────────────────────────────────────────────────────

@router.get("/candidates")
async def search_candidates(
    trade_category: Optional[str] = Query(None),
    country_of_residence: Optional[str] = Query(None),
    min_years_experience: Optional[int] = Query(None),
    is_electrical_worker: Optional[bool] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Search published candidate profiles with optional filters."""
    await _get_approved_company(current_user.id, db)

    filters = [CandidateProfile.published == True]
    if trade_category:
        filters.append(CandidateProfile.trade_category == trade_category)
    if country_of_residence:
        filters.append(CandidateProfile.country_of_residence == country_of_residence)
    if min_years_experience is not None:
        filters.append(CandidateProfile.years_experience >= min_years_experience)
    if is_electrical_worker is not None:
        filters.append(CandidateProfile.is_electrical_worker == is_electrical_worker)

    result = await db.execute(
        select(CandidateProfile)
        .where(and_(*filters))
        .order_by(CandidateProfile.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    profiles = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "full_name": p.full_name,
            "nationality": p.nationality,
            "country_of_residence": p.country_of_residence,
            "trade_category": p.trade_category,
            "is_electrical_worker": p.is_electrical_worker,
            "years_experience": p.years_experience,
            "languages": p.languages,
            "profile_summary": p.profile_summary,
        }
        for p in profiles
    ]


@router.get("/candidates/{candidate_id}")
async def get_candidate_profile(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """View a single published candidate profile."""
    await _get_approved_company(current_user.id, db)

    result = await db.execute(
        select(CandidateProfile).where(
            and_(CandidateProfile.id == candidate_id, CandidateProfile.published == True)
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found or profile is not published")
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
    }


# ── EOI submission ─────────────────────────────────────────────────────────────

@router.post("/eoi", status_code=201)
async def submit_eoi(
    payload: EOICreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Submit an Expression of Interest to a published candidate."""
    company = await _get_approved_company(current_user.id, db)

    # Verify candidate exists and is published
    result = await db.execute(
        select(CandidateProfile).where(
            and_(CandidateProfile.id == payload.candidate_id, CandidateProfile.published == True)
        )
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found or not accepting EOIs")

    eoi = ExpressionOfInterest(
        id=uuid.uuid4(),
        employer_company_id=company.id,
        candidate_id=candidate.id,
        job_title=payload.job_title,
        message=payload.message,
        sponsorship_flag=payload.sponsorship_flag,
        status="unread",
    )
    db.add(eoi)
    await db.commit()
    await db.refresh(eoi)
    return {
        "id": str(eoi.id),
        "candidate_id": str(eoi.candidate_id),
        "employer_company_id": str(eoi.employer_company_id),
        "job_title": eoi.job_title,
        "status": eoi.status,
        "created_at": eoi.created_at.isoformat() if eoi.created_at else None,
    }

"""
Employers Router – Employer company management and candidate discovery.

Actions:
  - Create / update employer company profile
  - Browse approved employer company profiles (candidates & authenticated users)
  - Search and filter published candidates
  - Submit an Expression of Interest (EOI)

Access: employer role; search/EOI requires verification_status == 'approved'.
  GET /companies and GET /companies/{id} are accessible to all authenticated users.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.db.models.models import EmployerCompany, CandidateProfile, ExpressionOfInterest, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    abn_or_identifier: Optional[str] = Field(None, max_length=50)
    contact_name: Optional[str] = Field(None, max_length=200)
    contact_email: Optional[str] = Field(None, max_length=254)
    industry: Optional[str] = Field(None, max_length=100)


class EOICreate(BaseModel):
    candidate_id: str
    job_title: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = Field(None, max_length=2000)
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


@router.delete("/company", status_code=204)
async def delete_my_company(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Delete the authenticated employer's company profile."""
    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    await db.delete(company)
    await db.commit()
    return None


# ── Public employer browsing (candidates can view approved employer profiles) ──

@router.get("/companies")
async def list_approved_companies(
    industry: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    List all approved employer companies.
    Accessible to all authenticated users (candidates, migration agents, etc.)
    so candidates can browse prospective employers.
    """
    query = (
        select(EmployerCompany)
        .where(EmployerCompany.verification_status == "approved")
        .order_by(EmployerCompany.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if industry:
        query = query.where(EmployerCompany.industry == industry)
    result = await db.execute(query)
    companies = result.scalars().all()
    return [_company_public_dict(c) for c in companies]


@router.get("/companies/{company_id}")
async def get_company_profile(
    company_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Get a single approved employer company profile.
    Accessible to all authenticated users so candidates can view prospective employers.
    """
    try:
        co_uuid = uuid.UUID(company_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="company_id must be a valid UUID")

    result = await db.execute(
        select(EmployerCompany).where(
            and_(EmployerCompany.id == co_uuid, EmployerCompany.verification_status == "approved")
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Employer company not found or not yet approved")
    return _company_public_dict(company)


def _company_public_dict(c: EmployerCompany) -> dict:
    return {
        "id": str(c.id),
        "company_name": c.company_name,
        "industry": c.industry,
        "contact_name": c.contact_name,
        "contact_email": c.contact_email,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


# ── Candidate search ───────────────────────────────────────────────────────────

@router.get("/candidates")
async def search_candidates(
    trade_category: Optional[str] = Query(None),
    country_of_residence: Optional[str] = Query(None),
    min_years_experience: Optional[int] = Query(None),
    is_electrical_worker: Optional[bool] = Query(None),
    work_type: Optional[str] = Query(None, description="Filter by work type: domestic/industrial/commercial/powerlines"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Search published candidate profiles. Returns basic info only (full profile requires candidate consent)."""
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
    if work_type:
        # JSONB array contains the given work type value
        from sqlalchemy import cast
        from sqlalchemy.dialects.postgresql import JSONB
        filters.append(
            CandidateProfile.work_types.cast(JSONB).contains([work_type])
        )

    result = await db.execute(
        select(CandidateProfile)
        .where(and_(*filters))
        .order_by(CandidateProfile.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    profiles = result.scalars().all()
    # Return basic info only — full profile access requires candidate's explicit consent
    return [
        {
            "id": str(p.id),
            "full_name": p.full_name,
            "nationality": p.nationality,
            "country_of_residence": p.country_of_residence,
            "trade_category": p.trade_category,
            "is_electrical_worker": p.is_electrical_worker,
            "years_experience": p.years_experience,
            "work_types": p.work_types,
        }
        for p in profiles
    ]


@router.get("/candidates/{candidate_id}")
async def get_candidate_profile(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """
    View a candidate's full profile.
    Requires the candidate to have granted consent to this employer company.
    Basic search results are available without consent via GET /employers/candidates.
    """
    company = await _get_approved_company(current_user.id, db)

    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(
        select(CandidateProfile).where(
            and_(CandidateProfile.id == cand_uuid, CandidateProfile.published == True)
        )
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found or profile is not published")

    # Check candidate has granted consent for this employer to view full profile
    from backend.db.models.models import CandidateEmployerConsent
    consent_res = await db.execute(
        select(CandidateEmployerConsent).where(
            and_(
                CandidateEmployerConsent.candidate_id == profile.id,
                CandidateEmployerConsent.employer_company_id == company.id,
                CandidateEmployerConsent.is_active == True,
            )
        )
    )
    consent = consent_res.scalar_one_or_none()
    if not consent:
        raise HTTPException(
            status_code=403,
            detail=(
                "The candidate has not yet granted you access to their full profile. "
                "You can view basic info in search results. "
                "The candidate must grant consent via their profile settings."
            )
        )

    return {
        "id": str(profile.id),
        "full_name": profile.full_name,
        "nationality": profile.nationality,
        "country_of_residence": profile.country_of_residence,
        "trade_category": profile.trade_category,
        "is_electrical_worker": profile.is_electrical_worker,
        "years_experience": profile.years_experience,
        "languages": profile.languages,
        "work_types": profile.work_types,
        "profile_summary": profile.profile_summary,
        "consent_granted": True,
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

    try:
        cand_uuid = uuid.UUID(payload.candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    # Verify candidate exists and is published
    result = await db.execute(
        select(CandidateProfile).where(
            and_(CandidateProfile.id == cand_uuid, CandidateProfile.published == True)
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

"""
Candidates Router – Candidate profile management, consent, and visa share approvals.

Actions:
  - Create / update candidate profile (including work_types)
  - Publish / unpublish profile
  - View received EOIs
  - Grant / revoke employer consent to view full profile
  - Approve / revoke visa document sharing per employer

Access: candidate role (own profile), admin (read all).
"""

import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.db.models.models import (
    CandidateProfile, ExpressionOfInterest, User,
    CandidateEmployerConsent, VisaShareApproval, EmployerCompany,
    CandidateRecommendedCourse, ElectricalWorkerScore,
    VisaApplication, ApplicantDocument, VisaCaseAssignment,
)

router = APIRouter()

VALID_WORK_TYPES = {"domestic", "industrial", "commercial", "powerlines"}


# ── Schemas ───────────────────────────────────────────────────────────────────

class CandidateProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    nationality: Optional[str] = Field(None, max_length=100)
    country_of_residence: Optional[str] = Field(None, max_length=100)
    trade_category: Optional[str] = Field(None, max_length=100)
    is_electrical_worker: bool = False
    years_experience: Optional[int] = Field(None, ge=0, le=70)
    languages: Optional[List[dict]] = None
    work_types: Optional[List[str]] = None
    profile_summary: Optional[str] = Field(None, max_length=2000)

    @field_validator("work_types")
    @classmethod
    def validate_work_types(cls, v):
        if v is not None:
            invalid = set(v) - VALID_WORK_TYPES
            if invalid:
                raise ValueError(
                    f"Invalid work_types: {invalid}. "
                    f"Allowed: {sorted(VALID_WORK_TYPES)}"
                )
        return v


class CandidateProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    nationality: Optional[str] = Field(None, max_length=100)
    country_of_residence: Optional[str] = Field(None, max_length=100)
    trade_category: Optional[str] = Field(None, max_length=100)
    is_electrical_worker: Optional[bool] = None
    years_experience: Optional[int] = Field(None, ge=0, le=70)
    languages: Optional[List[dict]] = None
    work_types: Optional[List[str]] = None
    profile_summary: Optional[str] = Field(None, max_length=2000)

    @field_validator("work_types")
    @classmethod
    def validate_work_types(cls, v):
        if v is not None:
            invalid = set(v) - VALID_WORK_TYPES
            if invalid:
                raise ValueError(
                    f"Invalid work_types: {invalid}. "
                    f"Allowed: {sorted(VALID_WORK_TYPES)}"
                )
        return v


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
        "work_types": p.work_types,
        "profile_summary": p.profile_summary,
        "published": p.published,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


async def _get_own_profile(user_id, db) -> CandidateProfile:
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


# ── Profile Endpoints ─────────────────────────────────────────────────────────

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

    if profile.is_electrical_worker:
        from backend.processors.electrical_scoring import score_electrical_worker
        try:
            await score_electrical_worker(profile.id, db)
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(
                "Failed to auto-score candidate %s after profile update: %s", profile.id, e
            )
    else:
        from backend.db.models.models import ElectricalWorkerScore
        old_score_res = await db.execute(
            select(ElectricalWorkerScore).where(ElectricalWorkerScore.candidate_id == profile.id)
        )
        old_score = old_score_res.scalar_one_or_none()
        if old_score:
            await db.delete(old_score)
            await db.commit()

    return _profile_to_dict(profile)


@router.post("/profile/publish")
async def publish_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Publish the candidate's profile so employers can discover them."""
    from backend.db.models.models import ConsentRecord
    consent_res = await db.execute(
        select(ConsentRecord).where(ConsentRecord.user_id == current_user.id)
    )
    consents = consent_res.scalars().all()
    has_registration_consent = any(c.consent_type == "registration" for c in consents)

    if not has_registration_consent:
        raise HTTPException(
            status_code=403,
            detail="Cannot publish profile: mandatory registration consent is missing."
        )

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

    # Delete child records first (no DB cascade)
    for model in (CandidateRecommendedCourse, CandidateEmployerConsent,
                  VisaShareApproval, ExpressionOfInterest, ApplicantDocument):
        rows = await db.execute(select(model).where(model.candidate_id == profile.id))
        for row in rows.scalars().all():
            await db.delete(row)

    # Delete visa applications + their case assignments (no DB cascade)
    va_rows = await db.execute(
        select(VisaApplication).where(VisaApplication.candidate_id == profile.id)
    )
    for va in va_rows.scalars().all():
        assign_rows = await db.execute(
            select(VisaCaseAssignment).where(VisaCaseAssignment.visa_application_id == va.id)
        )
        for assignment in assign_rows.scalars().all():
            await db.delete(assignment)
        await db.delete(va)

    # Delete electrical score if exists
    score_res = await db.execute(
        select(ElectricalWorkerScore).where(ElectricalWorkerScore.candidate_id == profile.id)
    )
    score = score_res.scalar_one_or_none()
    if score:
        await db.delete(score)

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


# ── Employer Consent Endpoints ────────────────────────────────────────────────

@router.post("/consent/employer/{employer_id}", status_code=201)
async def grant_employer_consent(
    employer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """
    Grant an employer company access to view your full profile.
    Employers see only basic info in search until consent is granted.
    """
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")

    emp_res = await db.execute(
        select(EmployerCompany).where(EmployerCompany.id == emp_uuid)
    )
    employer = emp_res.scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer company not found")

    existing = await db.execute(
        select(CandidateEmployerConsent).where(
            and_(
                CandidateEmployerConsent.candidate_id == profile.id,
                CandidateEmployerConsent.employer_company_id == emp_uuid,
                CandidateEmployerConsent.is_active == True,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Consent already granted to this employer.")

    # Re-activate if revoked before, else create new
    revoked = await db.execute(
        select(CandidateEmployerConsent).where(
            and_(
                CandidateEmployerConsent.candidate_id == profile.id,
                CandidateEmployerConsent.employer_company_id == emp_uuid,
                CandidateEmployerConsent.is_active == False,
            )
        )
    )
    record = revoked.scalar_one_or_none()
    if record:
        record.is_active = True
        record.granted_at = datetime.utcnow()
        record.revoked_at = None
    else:
        record = CandidateEmployerConsent(
            id=uuid.uuid4(),
            candidate_id=profile.id,
            employer_company_id=emp_uuid,
            is_active=True,
        )
        db.add(record)

    await db.commit()
    await db.refresh(record)
    return {
        "id": str(record.id),
        "candidate_id": str(record.candidate_id),
        "employer_company_id": str(record.employer_company_id),
        "employer_name": employer.company_name,
        "is_active": record.is_active,
        "granted_at": record.granted_at.isoformat() if record.granted_at else None,
    }


@router.get("/consent/employers")
async def list_employer_consents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """List all employers the candidate has granted profile access to."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(CandidateEmployerConsent, EmployerCompany)
        .join(EmployerCompany, CandidateEmployerConsent.employer_company_id == EmployerCompany.id)
        .where(CandidateEmployerConsent.candidate_id == profile.id)
        .order_by(CandidateEmployerConsent.granted_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": str(c.id),
            "employer_company_id": str(c.employer_company_id),
            "employer_name": e.company_name,
            "is_active": c.is_active,
            "granted_at": c.granted_at.isoformat() if c.granted_at else None,
            "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
        }
        for c, e in rows
    ]


@router.delete("/consent/employer/{employer_id}", status_code=200)
async def revoke_employer_consent(
    employer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Revoke an employer's access to your full profile."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")

    result = await db.execute(
        select(CandidateEmployerConsent).where(
            and_(
                CandidateEmployerConsent.candidate_id == profile.id,
                CandidateEmployerConsent.employer_company_id == emp_uuid,
                CandidateEmployerConsent.is_active == True,
            )
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="No active consent found for this employer.")

    record.is_active = False
    record.revoked_at = datetime.utcnow()
    await db.commit()
    return {"message": "Consent revoked.", "employer_company_id": employer_id}


# ── Visa Share Approval Endpoints ─────────────────────────────────────────────

@router.post("/visa-share/{eoi_id}/approve", status_code=201)
async def approve_visa_share(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """
    Approve sharing visa/migration documents with the employer who sent this EOI.
    The employer can then request a compiled PDF export of your visa documents.
    Requirement: the EOI must belong to you.
    """
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        eoi_uuid = uuid.UUID(eoi_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="eoi_id must be a valid UUID")

    eoi_res = await db.execute(
        select(ExpressionOfInterest).where(
            and_(
                ExpressionOfInterest.id == eoi_uuid,
                ExpressionOfInterest.candidate_id == profile.id,
            )
        )
    )
    eoi = eoi_res.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found or does not belong to you.")

    existing = await db.execute(
        select(VisaShareApproval).where(
            and_(
                VisaShareApproval.candidate_id == profile.id,
                VisaShareApproval.eoi_id == eoi_uuid,
                VisaShareApproval.is_active == True,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Visa share already approved for this EOI.")

    approval = VisaShareApproval(
        id=uuid.uuid4(),
        candidate_id=profile.id,
        employer_company_id=eoi.employer_company_id,
        eoi_id=eoi_uuid,
        is_active=True,
    )
    db.add(approval)
    await db.commit()
    await db.refresh(approval)
    return {
        "id": str(approval.id),
        "candidate_id": str(approval.candidate_id),
        "employer_company_id": str(approval.employer_company_id),
        "eoi_id": str(approval.eoi_id),
        "is_active": approval.is_active,
        "approved_at": approval.approved_at.isoformat() if approval.approved_at else None,
    }


@router.post("/visa-share/{eoi_id}/revoke", status_code=200)
async def revoke_visa_share(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Revoke visa document sharing approval for a specific EOI."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        eoi_uuid = uuid.UUID(eoi_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="eoi_id must be a valid UUID")

    result = await db.execute(
        select(VisaShareApproval).where(
            and_(
                VisaShareApproval.candidate_id == profile.id,
                VisaShareApproval.eoi_id == eoi_uuid,
                VisaShareApproval.is_active == True,
            )
        )
    )
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="No active visa share approval found for this EOI.")

    approval.is_active = False
    approval.revoked_at = datetime.utcnow()
    await db.commit()
    return {"message": "Visa share approval revoked.", "eoi_id": eoi_id}


@router.get("/visa-shares")
async def list_visa_share_approvals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """List all visa document sharing approvals granted by this candidate."""
    profile = await _get_own_profile(current_user.id, db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = await db.execute(
        select(VisaShareApproval, EmployerCompany)
        .join(EmployerCompany, VisaShareApproval.employer_company_id == EmployerCompany.id)
        .where(VisaShareApproval.candidate_id == profile.id)
        .order_by(VisaShareApproval.approved_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": str(a.id),
            "employer_company_id": str(a.employer_company_id),
            "employer_name": e.company_name,
            "eoi_id": str(a.eoi_id),
            "is_active": a.is_active,
            "approved_at": a.approved_at.isoformat() if a.approved_at else None,
            "revoked_at": a.revoked_at.isoformat() if a.revoked_at else None,
        }
        for a, e in rows
    ]

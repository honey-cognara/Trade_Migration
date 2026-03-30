"""
EOI Router – Expression of Interest management.

Actions:
  - Submit an EOI (employer)
  - Candidate views received EOIs
  - Mark EOI as read

Note: EOI creation is also available via /employers/eoi for convenience.
      This router provides a standalone EOI interface.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.db.models.models import (
    ExpressionOfInterest, EmployerCompany, CandidateProfile, User
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class EOISubmit(BaseModel):
    candidate_id: str
    job_title: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = Field(None, max_length=2000)
    sponsorship_flag: bool = False

class EOIUpdate(BaseModel):
    job_title: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = Field(None, max_length=2000)
    sponsorship_flag: Optional[bool] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def submit_eoi(
    payload: EOISubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Submit an Expression of Interest to a published candidate."""
    try:
        cand_uuid = uuid.UUID(payload.candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    # Get employer's approved company
    result = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Employer company not found")
    if company.verification_status != "approved":
        raise HTTPException(status_code=403, detail="Company not yet approved")

    # Verify candidate is published
    result = await db.execute(
        select(CandidateProfile).where(
            and_(CandidateProfile.id == cand_uuid, CandidateProfile.published == True)
        )
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found or not published")

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


@router.get("/received")
async def get_received_eois(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Return all EOIs received by the authenticated candidate."""
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

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


@router.patch("/{eoi_id}/read")
async def mark_eoi_read(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """Mark an EOI as read."""
    try:
        eoi_uuid = uuid.UUID(eoi_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="eoi_id must be a valid UUID")

    # Ensure this EOI belongs to the current candidate
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    result = await db.execute(
        select(ExpressionOfInterest).where(
            and_(
                ExpressionOfInterest.id == eoi_uuid,
                ExpressionOfInterest.candidate_id == profile.id,
            )
        )
    )
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")

    eoi.status = "read"
    await db.commit()
    return {"id": str(eoi.id), "status": "read"}


@router.get("/{eoi_id}")
async def get_eoi(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer", "candidate", "admin", "company_admin")),
):
    """Get a specific EOI."""
    try:
        eoi_uuid = uuid.UUID(eoi_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="eoi_id must be a valid UUID")

    result = await db.execute(select(ExpressionOfInterest).where(ExpressionOfInterest.id == eoi_uuid))
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")
        
    if current_user.role == "employer":
        result_comp = await db.execute(select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id))
        company = result_comp.scalar_one_or_none()
        if not company or eoi.employer_company_id != company.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this EOI")
    elif current_user.role == "candidate":
        result_cand = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
        candidate = result_cand.scalar_one_or_none()
        if not candidate or eoi.candidate_id != candidate.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this EOI")
            
    return {
        "id": str(eoi.id),
        "candidate_id": str(eoi.candidate_id),
        "employer_company_id": str(eoi.employer_company_id),
        "job_title": eoi.job_title,
        "message": eoi.message,
        "sponsorship_flag": eoi.sponsorship_flag,
        "status": eoi.status,
        "created_at": eoi.created_at.isoformat() if eoi.created_at else None,
    }


@router.put("/{eoi_id}")
async def update_eoi(
    eoi_id: str,
    payload: EOIUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer")),
):
    """Update an EOI before it is read by the candidate."""
    try:
        eoi_uuid = uuid.UUID(eoi_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="eoi_id must be a valid UUID")

    result = await db.execute(select(ExpressionOfInterest).where(ExpressionOfInterest.id == eoi_uuid))
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")
        
    result_comp = await db.execute(select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id))
    company = result_comp.scalar_one_or_none()
    if not company or eoi.employer_company_id != company.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this EOI")
        
    if eoi.status == "read":
        raise HTTPException(status_code=400, detail="Cannot update an EOI that has already been read")
        
    if payload.job_title is not None:
        eoi.job_title = payload.job_title
    if payload.message is not None:
        eoi.message = payload.message
    if payload.sponsorship_flag is not None:
        eoi.sponsorship_flag = payload.sponsorship_flag
        
    await db.commit()
    await db.refresh(eoi)
    return {
        "id": str(eoi.id),
        "job_title": eoi.job_title,
        "status": eoi.status,
    }


@router.delete("/{eoi_id}", status_code=204)
async def delete_eoi(
    eoi_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("employer", "admin")),
):
    """Withdraw/Delete an EOI."""
    try:
        eoi_uuid = uuid.UUID(eoi_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="eoi_id must be a valid UUID")

    result = await db.execute(select(ExpressionOfInterest).where(ExpressionOfInterest.id == eoi_uuid))
    eoi = result.scalar_one_or_none()
    if not eoi:
        raise HTTPException(status_code=404, detail="EOI not found")
        
    if current_user.role == "employer":
        result_comp = await db.execute(select(EmployerCompany).where(EmployerCompany.owner_user_id == current_user.id))
        company = result_comp.scalar_one_or_none()
        if not company or eoi.employer_company_id != company.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this EOI")
            
    await db.delete(eoi)
    await db.commit()
    return None

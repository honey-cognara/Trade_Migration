"""
Visa Applications Router – Case management for company admins and migration agents.
Access: company_admin, migration_agent, admin.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.db.models.models import VisaApplication, CandidateProfile, User, VisaCaseAssignment

router = APIRouter()

VISA_ROLES = ("company_admin", "migration_agent", "admin")
ALLOWED_STATUSES = {"draft", "submitted", "under_review", "approved", "rejected"}


class VisaApplicationCreate(BaseModel):
    candidate_id: str
    employer_company_id: Optional[str] = None
    country_of_application: Optional[str] = None
    notes: Optional[str] = None


class VisaStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class VisaApplicationUpdate(BaseModel):
    employer_company_id: Optional[str] = None
    country_of_application: Optional[str] = None
    notes: Optional[str] = None


@router.post("/", status_code=201)
async def create_visa_application(
    payload: VisaApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*VISA_ROLES)),
):
    """Create a new visa application case for a candidate."""
    try:
        cand_uuid = uuid.UUID(payload.candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    emp_uuid = None
    if payload.employer_company_id:
        try:
            emp_uuid = uuid.UUID(payload.employer_company_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="employer_company_id must be a valid UUID")

    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    application = VisaApplication(
        id=uuid.uuid4(),
        candidate_id=cand_uuid,
        employer_company_id=emp_uuid,
        status="draft",
        country_of_application=payload.country_of_application,
        notes=payload.notes,
        created_by_user_id=current_user.id,
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return _application_to_dict(application)


@router.get("/")
async def list_visa_applications(
    status: Optional[str] = Query(None, description="Filter by status: draft/submitted/under_review/approved/rejected"),
    candidate_id: Optional[str] = Query(None, description="Filter by candidate UUID"),
    country_of_application: Optional[str] = Query(None, description="Filter by country"),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*VISA_ROLES)),
):
    """List visa applications with optional filters (status, candidate, country)."""
    query = select(VisaApplication).order_by(VisaApplication.updated_at.desc())
    if status:
        if status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}")
        query = query.where(VisaApplication.status == status)
    if candidate_id:
        try:
            cand_uuid = uuid.UUID(candidate_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")
        query = query.where(VisaApplication.candidate_id == cand_uuid)
    if country_of_application:
        query = query.where(VisaApplication.country_of_application.ilike(f"%{country_of_application}%"))
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return [_application_to_dict(a) for a in result.scalars().all()]


@router.get("/{application_id}")
async def get_visa_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*VISA_ROLES)),
):
    """Get a single visa application by ID."""
    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="application_id must be a valid UUID")

    result = await db.execute(select(VisaApplication).where(VisaApplication.id == app_uuid))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Visa application not found")
    return _application_to_dict(application)


@router.put("/{application_id}/status")
async def update_visa_status(
    application_id: str,
    payload: VisaStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*VISA_ROLES)),
):
    """Update the status and/or notes of a visa application."""
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Allowed: {', '.join(ALLOWED_STATUSES)}")

    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="application_id must be a valid UUID")

    result = await db.execute(select(VisaApplication).where(VisaApplication.id == app_uuid))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Visa application not found")

    application.status = payload.status
    if payload.notes is not None:
        application.notes = payload.notes

    await db.commit()
    await db.refresh(application)
    return {**_application_to_dict(application), "updated_by": str(current_user.id)}


@router.put("/{application_id}")
async def update_visa_application(
    application_id: str,
    payload: VisaApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(*VISA_ROLES)),
):
    """Update fields of an existing visa application."""
    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="application_id must be a valid UUID")

    result = await db.execute(select(VisaApplication).where(VisaApplication.id == app_uuid))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Visa application not found")

    if payload.employer_company_id is not None:
        try:
            application.employer_company_id = uuid.UUID(payload.employer_company_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="employer_company_id must be a valid UUID")
    if payload.country_of_application is not None:
        application.country_of_application = payload.country_of_application
    if payload.notes is not None:
        application.notes = payload.notes

    await db.commit()
    await db.refresh(application)
    return _application_to_dict(application)


@router.delete("/{application_id}", status_code=204)
async def delete_visa_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*VISA_ROLES)),
):
    """Delete a visa application case."""
    try:
        app_uuid = uuid.UUID(application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="application_id must be a valid UUID")

    result = await db.execute(select(VisaApplication).where(VisaApplication.id == app_uuid))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Visa application not found")

    # Delete child assignments first (no DB cascade)
    assign_res = await db.execute(
        select(VisaCaseAssignment).where(VisaCaseAssignment.visa_application_id == app_uuid)
    )
    for assignment in assign_res.scalars().all():
        await db.delete(assignment)

    await db.delete(application)
    await db.commit()
    return None


def _application_to_dict(a: VisaApplication) -> dict:
    return {
        "id": str(a.id),
        "candidate_id": str(a.candidate_id),
        "employer_company_id": str(a.employer_company_id) if a.employer_company_id else None,
        "status": a.status,
        "country_of_application": a.country_of_application,
        "notes": a.notes,
        "created_by_user_id": str(a.created_by_user_id),
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
    }

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
from backend.db.models.models import VisaApplication, CandidateProfile, User

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
    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == payload.candidate_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    application = VisaApplication(
        id=uuid.uuid4(),
        candidate_id=payload.candidate_id,
        employer_company_id=payload.employer_company_id or None,
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
    status: Optional[str] = Query(None),
    candidate_id: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*VISA_ROLES)),
):
    """List all visa applications, with optional filters."""
    query = select(VisaApplication).order_by(VisaApplication.updated_at.desc())
    if status:
        query = query.where(VisaApplication.status == status)
    if candidate_id:
        query = query.where(VisaApplication.candidate_id == candidate_id)
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
    result = await db.execute(select(VisaApplication).where(VisaApplication.id == application_id))
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

    result = await db.execute(select(VisaApplication).where(VisaApplication.id == application_id))
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
    result = await db.execute(select(VisaApplication).where(VisaApplication.id == application_id))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Visa application not found")

    if payload.employer_company_id is not None:
        application.employer_company_id = payload.employer_company_id
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
    result = await db.execute(select(VisaApplication).where(VisaApplication.id == application_id))
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Visa application not found")

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

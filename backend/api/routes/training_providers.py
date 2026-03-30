"""
Training Providers Router – Training provider and course management.
Access: training_provider (manage own); admin/company_admin/employer/migration_agent (read + recommend).
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.db.models.models import (
    TrainingProvider, TrainingCourse, CandidateRecommendedCourse, User
)

router = APIRouter()


class ProviderCreate(BaseModel):
    name: str
    contact_email: Optional[str] = None
    website_url: Optional[str] = None
    country: Optional[str] = None


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    trade_category: str = "electrical"
    delivery_mode: Optional[str] = None
    location: Optional[str] = None


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    website_url: Optional[str] = None
    country: Optional[str] = None
    status: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    trade_category: Optional[str] = None
    delivery_mode: Optional[str] = None
    location: Optional[str] = None


@router.post("/provider", status_code=201)
async def create_provider(
    payload: ProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("training_provider")),
):
    """Register a training provider profile."""
    provider = TrainingProvider(id=uuid.uuid4(), **payload.model_dump(), status="active")
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return _provider_to_dict(provider)


@router.get("/provider")
async def get_all_providers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent", "employer", "training_provider")),
):
    """Return all active training providers."""
    result = await db.execute(
        select(TrainingProvider).where(TrainingProvider.status == "active").order_by(TrainingProvider.created_at.desc())
    )
    return [_provider_to_dict(p) for p in result.scalars().all()]


@router.get("/provider/{provider_id}")
async def get_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent", "employer", "training_provider")),
):
    """Return a single active training provider."""
    try:
        prov_uuid = uuid.UUID(provider_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="provider_id must be a valid UUID")

    result = await db.execute(select(TrainingProvider).where(TrainingProvider.id == prov_uuid))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")
    return _provider_to_dict(provider)


@router.put("/provider/{provider_id}")
async def update_provider(
    provider_id: str,
    payload: ProviderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("training_provider", "admin")),
):
    """Update training provider profile."""
    try:
        prov_uuid = uuid.UUID(provider_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="provider_id must be a valid UUID")

    result = await db.execute(select(TrainingProvider).where(TrainingProvider.id == prov_uuid))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")
        
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(provider, key, value)
        
    await db.commit()
    await db.refresh(provider)
    return _provider_to_dict(provider)


@router.delete("/provider/{provider_id}", status_code=204)
async def delete_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Delete a training provider profile."""
    try:
        prov_uuid = uuid.UUID(provider_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="provider_id must be a valid UUID")

    result = await db.execute(select(TrainingProvider).where(TrainingProvider.id == prov_uuid))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")
        
    await db.delete(provider)
    await db.commit()
    return None


@router.post("/provider/{provider_id}/courses", status_code=201)
async def create_course(
    provider_id: str,
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("training_provider", "admin")),
):
    """Publish a new course under a specific provider."""
    try:
        prov_uuid = uuid.UUID(provider_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="provider_id must be a valid UUID")

    result = await db.execute(select(TrainingProvider).where(TrainingProvider.id == prov_uuid))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Training provider not found")

    course = TrainingCourse(id=uuid.uuid4(), provider_id=provider.id, **payload.model_dump())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return _course_to_dict(course)


@router.get("/courses")
async def list_courses(
    trade_category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent", "employer", "training_provider", "candidate")),
):
    """Return all published courses, optionally filtered by trade category."""
    query = select(TrainingCourse).order_by(TrainingCourse.created_at.desc())
    if trade_category:
        query = query.where(TrainingCourse.trade_category == trade_category)
    result = await db.execute(query)
    return [_course_to_dict(c) for c in result.scalars().all()]


@router.get("/courses/{course_id}")
async def get_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent", "employer", "training_provider", "candidate")),
):
    """Return a single course."""
    try:
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="course_id must be a valid UUID")

    result = await db.execute(select(TrainingCourse).where(TrainingCourse.id == course_uuid))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Training course not found")
    return _course_to_dict(course)


@router.put("/courses/{course_id}")
async def update_course(
    course_id: str,
    payload: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("training_provider", "admin")),
):
    """Update a course."""
    try:
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="course_id must be a valid UUID")

    result = await db.execute(select(TrainingCourse).where(TrainingCourse.id == course_uuid))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Training course not found")
        
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, key, value)
        
    await db.commit()
    await db.refresh(course)
    return _course_to_dict(course)


@router.delete("/courses/{course_id}", status_code=204)
async def delete_course(
    course_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("training_provider", "admin")),
):
    """Delete a course."""
    try:
        course_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="course_id must be a valid UUID")

    result = await db.execute(select(TrainingCourse).where(TrainingCourse.id == course_uuid))
    course = result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Training course not found")
        
    await db.delete(course)
    await db.commit()
    return None


@router.post("/recommend/{candidate_id}/{course_id}", status_code=201)
async def recommend_course(
    candidate_id: str,
    course_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "company_admin", "employer", "migration_agent")),
):
    """Link a training course recommendation to a candidate."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
        crs_uuid = uuid.UUID(course_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id and course_id must be valid UUIDs")

    recommendation = CandidateRecommendedCourse(
        id=uuid.uuid4(), candidate_id=cand_uuid,
        course_id=crs_uuid, linked_by_user_id=current_user.id,
    )
    db.add(recommendation)
    await db.commit()
    await db.refresh(recommendation)
    return {
        "id": str(recommendation.id),
        "candidate_id": str(recommendation.candidate_id),
        "course_id": str(recommendation.course_id),
        "linked_by_user_id": str(recommendation.linked_by_user_id),
        "created_at": recommendation.created_at.isoformat() if recommendation.created_at else None,
    }


@router.get("/recommend/{candidate_id}")
async def get_candidate_courses(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "employer", "migration_agent", "candidate")),
):
    """Return all courses recommended to a specific candidate."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(
        select(CandidateRecommendedCourse)
        .where(CandidateRecommendedCourse.candidate_id == cand_uuid)
        .order_by(CandidateRecommendedCourse.created_at.desc())
    )
    return [
        {
            "id": str(r.id),
            "course_id": str(r.course_id),
            "linked_by_user_id": str(r.linked_by_user_id),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in result.scalars().all()
    ]


@router.delete("/recommend/{recommendation_id}", status_code=204)
async def delete_recommendation(
    recommendation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "company_admin", "employer", "migration_agent")),
):
    """Delete a training course recommendation."""
    try:
        rec_uuid = uuid.UUID(recommendation_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="recommendation_id must be a valid UUID")

    result = await db.execute(select(CandidateRecommendedCourse).where(CandidateRecommendedCourse.id == rec_uuid))
    recommendation = result.scalar_one_or_none()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    await db.delete(recommendation)
    await db.commit()
    return None


def _provider_to_dict(p: TrainingProvider) -> dict:
    return {
        "id": str(p.id), "name": p.name, "contact_email": p.contact_email,
        "website_url": p.website_url, "country": p.country, "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _course_to_dict(c: TrainingCourse) -> dict:
    return {
        "id": str(c.id), "provider_id": str(c.provider_id), "title": c.title,
        "description": c.description, "trade_category": c.trade_category,
        "delivery_mode": c.delivery_mode, "location": c.location,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }

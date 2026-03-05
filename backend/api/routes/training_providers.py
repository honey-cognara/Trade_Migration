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


@router.post("/courses", status_code=201)
async def create_course(
    provider_id: str,
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("training_provider", "admin")),
):
    """Publish a new course (electrical only in MVP)."""
    result = await db.execute(select(TrainingProvider).where(TrainingProvider.id == provider_id))
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


@router.post("/recommend/{candidate_id}/{course_id}", status_code=201)
async def recommend_course(
    candidate_id: str,
    course_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "company_admin", "employer", "migration_agent")),
):
    """Link a training course recommendation to a candidate."""
    recommendation = CandidateRecommendedCourse(
        id=uuid.uuid4(), candidate_id=candidate_id,
        course_id=course_id, linked_by_user_id=current_user.id,
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
    result = await db.execute(
        select(CandidateRecommendedCourse)
        .where(CandidateRecommendedCourse.candidate_id == candidate_id)
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

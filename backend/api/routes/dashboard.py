"""
Dashboard API Router
Returns aggregated stats for the Company Admin / Migration Agent dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import (
    CandidateProfile, EmployerCompany, VisaApplication,
    ExpressionOfInterest, ElectricalWorkerScore, User
)

router = APIRouter()

DASHBOARD_ROLES = ("admin", "company_admin", "migration_agent")


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*DASHBOARD_ROLES)),
):
    """
    Returns high-level stats for the admin dashboard homepage.
    Used by: Company Admin, Migration Agent, Admin roles.
    """

    # Total candidates
    total_candidates = await db.scalar(select(func.count(CandidateProfile.id)))

    # Published candidates
    published_candidates = await db.scalar(
        select(func.count(CandidateProfile.id))
        .where(CandidateProfile.published == True)
    )

    # Total employers
    total_employers = await db.scalar(select(func.count(EmployerCompany.id)))

    # Employers by verification status
    employer_status_rows = await db.execute(
        select(EmployerCompany.verification_status, func.count(EmployerCompany.id))
        .group_by(EmployerCompany.verification_status)
    )
    employer_status = {row[0]: row[1] for row in employer_status_rows.fetchall()}

    # Visa applications by status
    visa_status_rows = await db.execute(
        select(VisaApplication.status, func.count(VisaApplication.id))
        .group_by(VisaApplication.status)
    )
    visa_by_status = {row[0]: row[1] for row in visa_status_rows.fetchall()}

    # Total EOIs
    total_eois = await db.scalar(select(func.count(ExpressionOfInterest.id)))
    unread_eois = await db.scalar(
        select(func.count(ExpressionOfInterest.id))
        .where(ExpressionOfInterest.status == "unread")
    )

    # Candidates by trade category
    trade_rows = await db.execute(
        select(CandidateProfile.trade_category, func.count(CandidateProfile.id))
        .group_by(CandidateProfile.trade_category)
    )
    candidates_by_trade = {row[0] or "unspecified": row[1] for row in trade_rows.fetchall()}

    # Electrical workers scored
    scored_electrical = await db.scalar(select(func.count(ElectricalWorkerScore.id)))

    return {
        "candidates": {
            "total": total_candidates,
            "published": published_candidates,
            "unpublished": (total_candidates or 0) - (published_candidates or 0),
            "by_trade": candidates_by_trade,
        },
        "employers": {
            "total": total_employers,
            "by_status": employer_status,
        },
        "visa_applications": {
            "by_status": visa_by_status,
            "total": sum(visa_by_status.values()) if visa_by_status else 0,
        },
        "expressions_of_interest": {
            "total": total_eois,
            "unread": unread_eois,
        },
        "electrical_scoring": {
            "candidates_scored": scored_electrical,
        },
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*DASHBOARD_ROLES)),
):
    """
    Returns recently updated visa applications for the case queue.
    """
    result = await db.execute(
        select(
            VisaApplication.id,
            VisaApplication.status,
            VisaApplication.country_of_application,
            VisaApplication.created_at,
            VisaApplication.updated_at,
            CandidateProfile.full_name.label("candidate_name"),
            EmployerCompany.company_name.label("employer_name"),
        )
        .join(CandidateProfile, VisaApplication.candidate_id == CandidateProfile.id)
        .outerjoin(EmployerCompany, VisaApplication.employer_company_id == EmployerCompany.id)
        .order_by(VisaApplication.updated_at.desc())
        .limit(limit)
    )
    rows = result.fetchall()
    return [
        {
            "visa_application_id": str(r.id),
            "candidate_name": r.candidate_name,
            "employer_name": r.employer_name,
            "status": r.status,
            "country": r.country_of_application,
            "last_updated": r.updated_at.isoformat() if r.updated_at else None,
        }
        for r in rows
    ]


@router.get("/pending-employers")
async def get_pending_employers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*DASHBOARD_ROLES)),
):
    """
    Returns employers awaiting admin verification.
    """
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
            "contact_email": e.contact_email,
            "industry": e.industry,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in employers
    ]

"""
Dashboard API Router
Role-specific dashboard stats for every authenticated role.
GET /dashboard/stats   — shared stats (admin / company_admin / migration_agent)
GET /dashboard/my      — smart endpoint: returns role-specific dashboard for ANY role
GET /dashboard/recent-activity
GET /dashboard/pending-employers
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles, get_current_user
from backend.db.models.models import (
    CandidateProfile, EmployerCompany, VisaApplication,
    ExpressionOfInterest, ElectricalWorkerScore, User,
    ApplicantDocument, CandidateEmployerConsent, VisaShareApproval,
    VisaCaseAssignment, TrainingProvider, TrainingCourse,
    CandidateRecommendedCourse,
)

router = APIRouter()

DASHBOARD_ROLES = ("admin", "company_admin", "migration_agent")


# ── Shared admin/agent/company_admin stats ────────────────────────────────────

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*DASHBOARD_ROLES)),
):
    """
    High-level system stats for admin, company_admin, migration_agent.
    """
    total_candidates = await db.scalar(select(func.count(CandidateProfile.id)))
    published_candidates = await db.scalar(
        select(func.count(CandidateProfile.id)).where(CandidateProfile.published == True)
    )
    total_employers = await db.scalar(select(func.count(EmployerCompany.id)))

    employer_status_rows = await db.execute(
        select(EmployerCompany.verification_status, func.count(EmployerCompany.id))
        .group_by(EmployerCompany.verification_status)
    )
    employer_status = {row[0]: row[1] for row in employer_status_rows.fetchall()}

    visa_status_rows = await db.execute(
        select(VisaApplication.status, func.count(VisaApplication.id))
        .group_by(VisaApplication.status)
    )
    visa_by_status = {row[0]: row[1] for row in visa_status_rows.fetchall()}

    total_eois = await db.scalar(select(func.count(ExpressionOfInterest.id)))
    unread_eois = await db.scalar(
        select(func.count(ExpressionOfInterest.id))
        .where(ExpressionOfInterest.status == "unread")
    )

    trade_rows = await db.execute(
        select(CandidateProfile.trade_category, func.count(CandidateProfile.id))
        .group_by(CandidateProfile.trade_category)
    )
    candidates_by_trade = {row[0] or "unspecified": row[1] for row in trade_rows.fetchall()}

    scored_electrical = await db.scalar(select(func.count(ElectricalWorkerScore.id)))

    users_by_role_rows = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    users_by_role = {row[0]: row[1] for row in users_by_role_rows.fetchall()}

    return {
        "role": "admin/company_admin/migration_agent",
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
        "users_by_role": users_by_role,
    }


# ── Universal role-aware dashboard ───────────────────────────────────────────

@router.get("/my")
async def my_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a personalised dashboard for the authenticated user.
    Works for ALL roles: candidate, employer, company_admin, admin,
    migration_agent, training_provider.
    """
    role = current_user.role

    if role == "candidate":
        return await _candidate_dashboard(db, current_user)
    elif role == "employer":
        return await _employer_dashboard(db, current_user)
    elif role == "company_admin":
        return await _company_admin_dashboard(db, current_user)
    elif role == "admin":
        return await _admin_dashboard(db, current_user)
    elif role == "migration_agent":
        return await _agent_dashboard(db, current_user)
    elif role == "training_provider":
        return await _training_provider_dashboard(db, current_user)
    else:
        return {"role": role, "message": "No specific dashboard configured for this role."}


# ── Role-specific helpers ──────────────────────────────────────────────────────

async def _candidate_dashboard(db: AsyncSession, user: User) -> dict:
    # Profile
    profile_res = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == user.id)
    )
    profile = profile_res.scalar_one_or_none()

    doc_count = 0
    eois_received = 0
    unread_eois = 0
    consents_given = 0
    visa_shares = 0

    if profile:
        doc_count = await db.scalar(
            select(func.count(ApplicantDocument.id))
            .where(ApplicantDocument.candidate_id == profile.id)
        ) or 0

        eois_received = await db.scalar(
            select(func.count(ExpressionOfInterest.id))
            .where(ExpressionOfInterest.candidate_id == profile.id)
        ) or 0

        unread_eois = await db.scalar(
            select(func.count(ExpressionOfInterest.id))
            .where(
                ExpressionOfInterest.candidate_id == profile.id,
                ExpressionOfInterest.status == "unread",
            )
        ) or 0

        consents_given = await db.scalar(
            select(func.count(CandidateEmployerConsent.id))
            .where(
                CandidateEmployerConsent.candidate_id == profile.id,
                CandidateEmployerConsent.is_active == True,
            )
        ) or 0

        visa_shares = await db.scalar(
            select(func.count(VisaShareApproval.id))
            .where(
                VisaShareApproval.candidate_id == profile.id,
                VisaShareApproval.is_active == True,
            )
        ) or 0

    return {
        "role": "candidate",
        "welcome": f"Welcome, {user.email}",
        "profile": {
            "exists": profile is not None,
            "full_name": profile.full_name if profile else None,
            "trade_category": profile.trade_category if profile else None,
            "published": profile.published if profile else False,
            "years_experience": profile.years_experience if profile else None,
        },
        "documents": {
            "uploaded": doc_count,
        },
        "expressions_of_interest": {
            "received": eois_received,
            "unread": unread_eois,
            "read": eois_received - unread_eois,
        },
        "employer_access": {
            "consents_given": consents_given,
            "visa_shares_approved": visa_shares,
        },
        "quick_actions": [
            {"label": "View / Edit Profile", "endpoint": "GET /candidates/profile"},
            {"label": "Upload Document", "endpoint": "POST /documents/"},
            {"label": "View EOIs", "endpoint": "GET /candidates/eois"},
            {"label": "Manage Consent", "endpoint": "GET /candidates/consent/employers"},
        ],
    }


async def _employer_dashboard(db: AsyncSession, user: User) -> dict:
    company_res = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == user.id)
    )
    company = company_res.scalar_one_or_none()

    eois_sent = 0
    if company:
        eois_sent = await db.scalar(
            select(func.count(ExpressionOfInterest.id))
            .where(ExpressionOfInterest.employer_company_id == company.id)
        ) or 0

    return {
        "role": "employer",
        "welcome": f"Welcome, {user.email}",
        "company": {
            "exists": company is not None,
            "company_name": company.company_name if company else None,
            "industry": company.industry if company else None,
            "verification_status": company.verification_status if company else None,
            "approved": company.verification_status == "approved" if company else False,
        },
        "activity": {
            "eois_sent": eois_sent,
        },
        "quick_actions": [
            {"label": "View Company Profile", "endpoint": "GET /employers/company"},
            {"label": "Browse Candidates", "endpoint": "GET /employers/candidates"},
            {"label": "Browse Companies", "endpoint": "GET /employers/companies"},
            {"label": "Send EOI", "endpoint": "POST /eoi/"},
        ],
    }


async def _company_admin_dashboard(db: AsyncSession, user: User) -> dict:
    company_res = await db.execute(
        select(EmployerCompany).where(EmployerCompany.owner_user_id == user.id)
    )
    company = company_res.scalar_one_or_none()

    eois_sent = 0
    if company:
        eois_sent = await db.scalar(
            select(func.count(ExpressionOfInterest.id))
            .where(ExpressionOfInterest.employer_company_id == company.id)
        ) or 0

    total_candidates = await db.scalar(select(func.count(CandidateProfile.id))) or 0
    published = await db.scalar(
        select(func.count(CandidateProfile.id)).where(CandidateProfile.published == True)
    ) or 0
    pending_employers = await db.scalar(
        select(func.count(EmployerCompany.id))
        .where(EmployerCompany.verification_status == "pending")
    ) or 0

    return {
        "role": "company_admin",
        "welcome": f"Welcome, {user.email}",
        "my_company": {
            "exists": company is not None,
            "company_name": company.company_name if company else None,
            "verification_status": company.verification_status if company else None,
            "eois_sent": eois_sent,
        },
        "platform_overview": {
            "total_candidates": total_candidates,
            "published_candidates": published,
            "pending_employer_approvals": pending_employers,
        },
        "quick_actions": [
            {"label": "Browse Candidates", "endpoint": "GET /employers/candidates"},
            {"label": "Dashboard Stats", "endpoint": "GET /dashboard/stats"},
            {"label": "Pending Employers", "endpoint": "GET /dashboard/pending-employers"},
            {"label": "Recent Activity", "endpoint": "GET /dashboard/recent-activity"},
        ],
    }


async def _admin_dashboard(db: AsyncSession, user: User) -> dict:
    total_candidates = await db.scalar(select(func.count(CandidateProfile.id))) or 0
    published_candidates = await db.scalar(
        select(func.count(CandidateProfile.id)).where(CandidateProfile.published == True)
    ) or 0
    total_employers = await db.scalar(select(func.count(EmployerCompany.id))) or 0

    employer_status_rows = await db.execute(
        select(EmployerCompany.verification_status, func.count(EmployerCompany.id))
        .group_by(EmployerCompany.verification_status)
    )
    employer_status = {row[0]: row[1] for row in employer_status_rows.fetchall()}

    visa_status_rows = await db.execute(
        select(VisaApplication.status, func.count(VisaApplication.id))
        .group_by(VisaApplication.status)
    )
    visa_by_status = {row[0]: row[1] for row in visa_status_rows.fetchall()}

    total_eois = await db.scalar(select(func.count(ExpressionOfInterest.id))) or 0
    unread_eois = await db.scalar(
        select(func.count(ExpressionOfInterest.id))
        .where(ExpressionOfInterest.status == "unread")
    ) or 0

    users_by_role_rows = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    users_by_role = {row[0]: row[1] for row in users_by_role_rows.fetchall()}

    scored = await db.scalar(select(func.count(ElectricalWorkerScore.id))) or 0

    return {
        "role": "admin",
        "welcome": f"Welcome, {user.email}",
        "candidates": {
            "total": total_candidates,
            "published": published_candidates,
            "unpublished": total_candidates - published_candidates,
        },
        "employers": {
            "total": total_employers,
            "by_status": employer_status,
        },
        "visa_applications": {
            "total": sum(visa_by_status.values()) if visa_by_status else 0,
            "by_status": visa_by_status,
        },
        "expressions_of_interest": {
            "total": total_eois,
            "unread": unread_eois,
        },
        "users_by_role": users_by_role,
        "electrical_scoring": {"candidates_scored": scored},
        "quick_actions": [
            {"label": "Manage Candidates", "endpoint": "GET /admin/candidates"},
            {"label": "Verify Employers", "endpoint": "GET /admin/employers/pending"},
            {"label": "Manage Users", "endpoint": "GET /admin/users"},
            {"label": "Full Stats", "endpoint": "GET /dashboard/stats"},
        ],
    }


async def _agent_dashboard(db: AsyncSession, user: User) -> dict:
    my_cases = await db.scalar(
        select(func.count(VisaCaseAssignment.id))
        .where(
            VisaCaseAssignment.agent_user_id == user.id,
            VisaCaseAssignment.status == "active",
        )
    ) or 0

    visa_status_rows = await db.execute(
        select(VisaApplication.status, func.count(VisaApplication.id))
        .join(VisaCaseAssignment, VisaCaseAssignment.visa_application_id == VisaApplication.id)
        .where(VisaCaseAssignment.agent_user_id == user.id)
        .group_by(VisaApplication.status)
    )
    my_visas_by_status = {row[0]: row[1] for row in visa_status_rows.fetchall()}

    total_candidates = await db.scalar(
        select(func.count(CandidateProfile.id)).where(CandidateProfile.published == True)
    ) or 0

    return {
        "role": "migration_agent",
        "welcome": f"Welcome, {user.email}",
        "my_cases": {
            "active": my_cases,
            "by_visa_status": my_visas_by_status,
        },
        "available_candidates": {
            "published": total_candidates,
        },
        "quick_actions": [
            {"label": "My Cases", "endpoint": "GET /agents/cases"},
            {"label": "Assign Case", "endpoint": "POST /agents/cases/assign"},
            {"label": "Recent Activity", "endpoint": "GET /dashboard/recent-activity"},
            {"label": "Ask AI about Candidate", "endpoint": "POST /rag/ask"},
        ],
    }


async def _training_provider_dashboard(db: AsyncSession, user: User) -> dict:
    # TrainingProvider is not linked to User by user_id in the schema,
    # so we return platform-wide counts visible to any training_provider user.
    total_providers = await db.scalar(select(func.count(TrainingProvider.id))) or 0
    total_courses = await db.scalar(select(func.count(TrainingCourse.id))) or 0
    total_recommendations = await db.scalar(select(func.count(CandidateRecommendedCourse.id))) or 0

    return {
        "role": "training_provider",
        "welcome": f"Welcome, {user.email}",
        "platform": {
            "total_providers": total_providers,
            "total_courses": total_courses,
            "total_recommendations": total_recommendations,
        },
        "quick_actions": [
            {"label": "Create Provider Profile", "endpoint": "POST /training/provider"},
            {"label": "List All Providers", "endpoint": "GET /training/provider"},
            {"label": "List All Courses", "endpoint": "GET /training/courses"},
        ],
    }


# ── Shared helpers (admin/agent/company_admin only) ───────────────────────────

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

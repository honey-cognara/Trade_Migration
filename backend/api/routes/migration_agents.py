import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import (
    User, VisaApplication, VisaCaseAssignment, ApplicantDocument, CandidateProfile
)

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class AssignCaseRequest(BaseModel):
    visa_application_id: str


class UpdateCaseNoteRequest(BaseModel):
    notes: str
    status: str  # draft, submitted, under_review, approved, rejected


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/ping")
async def ping(current_user: User = Depends(require_roles("migration_agent", "admin"))):
    return {"message": "pong"}

@router.post("/cases/assign", status_code=201)
async def assign_case_to_me(
    payload: AssignCaseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("migration_agent")),
):
    """
    Assigns an existing Visa Application to the authenticated Migration Agent.
    """
    try:
        visa_uuid = uuid.UUID(payload.visa_application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid visa application ID")

    # Check if case exists
    res = await db.execute(select(VisaApplication).where(VisaApplication.id == visa_uuid))
    visa_case = res.scalar_one_or_none()
    if not visa_case:
        raise HTTPException(status_code=404, detail="Visa application not found")

    # Check if already assigned to this agent
    chk = await db.execute(
        select(VisaCaseAssignment)
        .where(
            (VisaCaseAssignment.visa_application_id == visa_uuid) & 
            (VisaCaseAssignment.agent_user_id == current_user.id)
        )
    )
    if chk.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Case is already assigned to you.")

    assignment = VisaCaseAssignment(
        id=uuid.uuid4(),
        visa_application_id=visa_uuid,
        agent_user_id=current_user.id
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    return {
        "id": str(assignment.id),
        "visa_application_id": str(assignment.visa_application_id),
        "agent_user_id": str(assignment.agent_user_id),
        "status": assignment.status
    }


@router.get("/cases")
async def get_my_assigned_cases(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("migration_agent", "admin")),
):
    """
    Returns visa case assignments.
    - migration_agent: only their own active assignments
    - admin: all active assignments across all agents
    """
    base_query = (
        select(VisaCaseAssignment)
        .options(selectinload(VisaCaseAssignment.visa_application))
        .where(VisaCaseAssignment.status == "active")
    )
    if current_user.role == "migration_agent":
        base_query = base_query.where(VisaCaseAssignment.agent_user_id == current_user.id)

    res = await db.execute(base_query)
    assignments = res.scalars().all()

    return [
        {
            "assignment_id": str(a.id),
            "visa_application_id": str(a.visa_application.id),
            "candidate_id": str(a.visa_application.candidate_id),
            "status": a.visa_application.status,
            "country_of_application": a.visa_application.country_of_application,
            "assigned_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in assignments if a.visa_application
    ]


@router.get("/cases/{visa_application_id}")
async def get_case_details(
    visa_application_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("migration_agent")),
):
    """
    Returns full details of the assigned case, including the document checklist.
    """
    try:
        visa_uuid = uuid.UUID(visa_application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid visa application ID")

    # Ensure assigned
    chk = await db.execute(
        select(VisaCaseAssignment)
        .where(
            (VisaCaseAssignment.visa_application_id == visa_uuid) & 
            (VisaCaseAssignment.agent_user_id == current_user.id) &
            (VisaCaseAssignment.status == "active")
        )
    )
    if not chk.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Case is not assigned to you")

    # Fetch Case & Documents
    res = await db.execute(
        select(VisaApplication)
        .options(selectinload(VisaApplication.candidate))
        .where(VisaApplication.id == visa_uuid)
    )
    visa_case = res.scalar_one_or_none()

    doc_res = await db.execute(
        select(ApplicantDocument).where(ApplicantDocument.candidate_id == visa_case.candidate_id)
    )
    docs = doc_res.scalars().all()

    return {
        "visa_application_id": str(visa_case.id),
        "candidate_name": visa_case.candidate.full_name if visa_case.candidate else "Unknown",
        "status": visa_case.status,
        "country_of_application": visa_case.country_of_application,
        "notes": visa_case.notes,
        "documents_uploaded_count": len(docs),
        "documents": [
            {
                "id": str(d.id),
                "document_group": d.document_group,
                "document_type": d.document_type,
                "file_name": d.file_name
            } for d in docs
        ]
    }


@router.put("/cases/{visa_application_id}")
async def update_case(
    visa_application_id: str,
    payload: UpdateCaseNoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("migration_agent")),
):
    """
    Update notes and status for the assigned case.
    """
    try:
        visa_uuid = uuid.UUID(visa_application_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid visa application ID")

    # Ensure assigned
    chk = await db.execute(
        select(VisaCaseAssignment)
        .where(
            (VisaCaseAssignment.visa_application_id == visa_uuid) & 
            (VisaCaseAssignment.agent_user_id == current_user.id) &
            (VisaCaseAssignment.status == "active")
        )
    )
    if not chk.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Case is not assigned to you")

    # Update case
    res = await db.execute(select(VisaApplication).where(VisaApplication.id == visa_uuid))
    visa_case = res.scalar_one_or_none()

    visa_case.notes = payload.notes
    visa_case.status = payload.status
    await db.commit()
    await db.refresh(visa_case)

    return {
        "id": str(visa_case.id),
        "status": visa_case.status,
        "notes": visa_case.notes
    }

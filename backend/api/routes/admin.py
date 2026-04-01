"""
Admin Router – Platform administration endpoints.

Actions:
  - View and approve/reject pending employer registrations
  - Search candidates and employers (CRM searchable per business requirement)
  - Unpublish candidate profiles
  - Export compiled candidate PDF (for migration/immigration partners)
  - Manage users

Access: admin role only (except get_candidate_by_id which allows company_admin/migration_agent).
"""

import uuid
import io
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import EmployerCompany, CandidateProfile, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class VerifyEmployerRequest(BaseModel):
    action: str  # "approve" or "reject"


class UserStatusUpdate(BaseModel):
    status: str  # "active" | "inactive"


# ── Employers ─────────────────────────────────────────────────────────────────

@router.get("/employers/pending")
async def list_pending_employers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Return all employer companies awaiting admin verification."""
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
            "abn_or_identifier": e.abn_or_identifier,
            "contact_name": e.contact_name,
            "contact_email": e.contact_email,
            "industry": e.industry,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in employers
    ]


@router.post("/employers/{employer_id}/verify")
async def verify_employer(
    employer_id: str,
    payload: VerifyEmployerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    """Approve or reject an employer company registration."""
    if payload.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")
    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")
    result = await db.execute(select(EmployerCompany).where(EmployerCompany.id == emp_uuid))
    employer = result.scalar_one_or_none()
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    employer.verification_status = "approved" if payload.action == "approve" else "rejected"
    await db.commit()
    return {
        "id": str(employer.id),
        "company_name": employer.company_name,
        "verification_status": employer.verification_status,
        "updated_by": str(current_user.id),
    }


@router.get("/employers")
async def list_all_employers(
    search: str = Query(None, description="Search by company name or contact email"),
    status: str = Query(None, description="Filter: pending / approved / rejected"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """List all employers. Searchable by name/email, filterable by status."""
    query = select(EmployerCompany).order_by(EmployerCompany.created_at.desc())
    if search:
        query = query.where(
            or_(
                EmployerCompany.company_name.ilike(f"%{search}%"),
                EmployerCompany.contact_email.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(EmployerCompany.verification_status == status)
    result = await db.execute(query.limit(limit).offset(offset))
    return [
        {
            "id": str(e.id),
            "company_name": e.company_name,
            "industry": e.industry,
            "verification_status": e.verification_status,
            "contact_email": e.contact_email,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in result.scalars().all()
    ]


@router.get("/companies")
async def list_all_companies(
    search: str = Query(None),
    status: str = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Alias for /admin/employers."""
    query = select(EmployerCompany).order_by(EmployerCompany.created_at.desc())
    if search:
        query = query.where(
            or_(
                EmployerCompany.company_name.ilike(f"%{search}%"),
                EmployerCompany.contact_email.ilike(f"%{search}%"),
            )
        )
    if status:
        query = query.where(EmployerCompany.verification_status == status)
    result = await db.execute(query.limit(limit).offset(offset))
    return [
        {
            "id": str(e.id),
            "company_name": e.company_name,
            "industry": e.industry,
            "verification_status": e.verification_status,
            "contact_email": e.contact_email,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in result.scalars().all()
    ]


# ── Candidates ────────────────────────────────────────────────────────────────

@router.post("/candidates/{candidate_id}/unpublish")
async def admin_unpublish_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    """Force-unpublish a candidate profile."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")
    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    profile.published = False
    await db.commit()
    return {"candidate_id": str(profile.id), "published": False, "unpublished_by": str(current_user.id)}


@router.get("/candidates")
async def list_all_candidates(
    search: str = Query(None, description="Search by full name"),
    trade_category: str = Query(None, description="Filter by trade category"),
    nationality: str = Query(None, description="Filter by nationality"),
    published: bool = Query(None, description="Filter by published status"),
    is_electrical_worker: bool = Query(None, description="Filter electrical workers"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """List all candidate profiles. Searchable by name, filterable by trade/nationality/status."""
    query = select(CandidateProfile).order_by(CandidateProfile.created_at.desc())
    if search:
        query = query.where(CandidateProfile.full_name.ilike(f"%{search}%"))
    if trade_category:
        query = query.where(CandidateProfile.trade_category.ilike(f"%{trade_category}%"))
    if nationality:
        query = query.where(CandidateProfile.nationality.ilike(f"%{nationality}%"))
    if published is not None:
        query = query.where(CandidateProfile.published == published)
    if is_electrical_worker is not None:
        query = query.where(CandidateProfile.is_electrical_worker == is_electrical_worker)
    result = await db.execute(query.limit(limit).offset(offset))
    return [
        {
            "id": str(p.id),
            "full_name": p.full_name,
            "trade_category": p.trade_category,
            "nationality": p.nationality,
            "country_of_residence": p.country_of_residence,
            "work_types": p.work_types,
            "published": p.published,
            "is_electrical_worker": p.is_electrical_worker,
            "years_experience": p.years_experience,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in result.scalars().all()
    ]


@router.get("/candidates/{candidate_id}")
async def get_candidate_by_id(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent")),
):
    """Return a single candidate profile by ID (full details)."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")
    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")
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
        "published": profile.published,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
    }


@router.get("/candidates/{candidate_id}/export-pdf")
async def export_candidate_pdf(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "migration_agent")),
):
    """
    Compile a candidate's full profile + all uploaded PDF documents into one PDF.
    Used by migration agents to share with immigration/partner organisations.
    """
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate not found")

    from backend.db.models.models import ApplicantDocument
    docs_result = await db.execute(
        select(ApplicantDocument)
        .where(ApplicantDocument.candidate_id == cand_uuid)
        .order_by(ApplicantDocument.uploaded_at.asc())
    )
    documents = docs_result.scalars().all()

    pdf_bytes = _build_candidate_pdf(profile, documents)
    safe_name = "".join(c for c in profile.full_name if c.isalnum() or c in " _-").strip()
    filename = f"candidate_{safe_name}_{str(cand_uuid)[:8]}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _fmt_languages(languages) -> str:
    if not languages:
        return "—"
    parts = []
    for lang in languages:
        if isinstance(lang, dict):
            name = lang.get("name", "")
            level = lang.get("level", "")
            parts.append(f"{name} ({level})" if level else name)
        else:
            parts.append(str(lang))
    return ", ".join(parts) if parts else "—"


def _build_candidate_pdf(profile: CandidateProfile, documents: list) -> bytes:
    """Build a compiled PDF: profile summary page + appended PDF documents."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    import PyPDF2
    from datetime import datetime as dt

    profile_buf = io.BytesIO()
    doc = SimpleDocTemplate(
        profile_buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], fontSize=18, spaceAfter=6)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=13, spaceAfter=4)
    body = ParagraphStyle("body", parent=styles["Normal"], fontSize=10, spaceAfter=3)
    footer_style = ParagraphStyle("footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    story = []
    story.append(Paragraph("Tradie Migration App — Candidate Export", h1))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#003366")))
    story.append(Spacer(1, 0.4*cm))

    fields = [
        ("Full Name", profile.full_name or "—"),
        ("Nationality", profile.nationality or "—"),
        ("Country of Residence", profile.country_of_residence or "—"),
        ("Trade Category", profile.trade_category or "—"),
        ("Electrical Worker", "Yes" if profile.is_electrical_worker else "No"),
        ("Years Experience", str(profile.years_experience) if profile.years_experience is not None else "—"),
        ("Work Types", ", ".join(profile.work_types) if profile.work_types else "—"),
        ("Languages", _fmt_languages(profile.languages)),
        ("Profile Published", "Yes" if profile.published else "No"),
        ("Profile ID", str(profile.id)),
    ]
    tdata = [[Paragraph(f"<b>{k}</b>", body), Paragraph(v, body)] for k, v in fields]
    t = Table(tdata, colWidths=[5*cm, 12*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f0f4f8")),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cccccc")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f9f9f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*cm))

    if profile.profile_summary:
        story.append(Paragraph("<b>Profile Summary</b>", h2))
        story.append(Paragraph(profile.profile_summary, body))
        story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph("<b>Uploaded Documents</b>", h2))
    if not documents:
        story.append(Paragraph("No documents uploaded.", body))
    else:
        ddata = [[
            Paragraph("<b>#</b>", body), Paragraph("<b>File Name</b>", body),
            Paragraph("<b>Group</b>", body), Paragraph("<b>Type</b>", body),
            Paragraph("<b>Uploaded</b>", body),
        ]]
        for i, d in enumerate(documents, 1):
            uploaded = d.uploaded_at.strftime("%Y-%m-%d") if d.uploaded_at else "—"
            ddata.append([
                Paragraph(str(i), body), Paragraph(d.file_name or "—", body),
                Paragraph(d.document_group or "—", body), Paragraph(d.document_type or "—", body),
                Paragraph(uploaded, body),
            ])
        dt_table = Table(ddata, colWidths=[1*cm, 6*cm, 3*cm, 3.5*cm, 3.5*cm])
        dt_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#003366")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#cccccc")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9f9f9")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(dt_table)

    story.append(Spacer(1, 1*cm))
    story.append(Paragraph(
        f"<i>Generated: {dt.utcnow().strftime('%Y-%m-%d %H:%M UTC')} — Tradie Migration App</i>",
        footer_style
    ))
    doc.build(story)
    profile_pdf_bytes = profile_buf.getvalue()

    # Merge with any PDF documents on disk
    import os
    merger = PyPDF2.PdfMerger()
    merger.append(io.BytesIO(profile_pdf_bytes))
    for doc_record in documents:
        if not doc_record.file_name.lower().endswith(".pdf"):
            continue
        file_path = os.path.join("uploads", doc_record.s3_key)
        if os.path.exists(file_path):
            try:
                merger.append(file_path)
            except Exception:
                pass
    output = io.BytesIO()
    merger.write(output)
    merger.close()
    return output.getvalue()


@router.delete("/candidates/{candidate_id}", status_code=204)
async def admin_delete_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Permanently delete a candidate profile (admin only)."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")
    result = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_uuid))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    await db.delete(profile)
    await db.commit()
    return None


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    email: str = Query(None, description="Search by email"),
    role: str = Query(None, description="Filter by role"),
    status: str = Query(None, description="Filter by status: active/inactive"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """List all users. Searchable by email, filterable by role and status."""
    query = select(User).order_by(User.created_at.desc())
    if email:
        query = query.where(User.email.ilike(f"%{email}%"))
    if role:
        query = query.where(User.role == role)
    if status:
        query = query.where(User.status == status)
    result = await db.execute(query.limit(limit).offset(offset))
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "role": u.role,
            "status": u.status,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in result.scalars().all()
    ]


@router.get("/employers/{employer_id}")
async def get_employer_by_id(
    employer_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "migration_agent")),
):
    """Return a single employer company by ID."""
    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")
    result = await db.execute(select(EmployerCompany).where(EmployerCompany.id == emp_uuid))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employer not found")
    return {
        "id": str(emp.id),
        "company_name": emp.company_name,
        "abn_or_identifier": emp.abn_or_identifier,
        "contact_name": emp.contact_name,
        "contact_email": emp.contact_email,
        "industry": emp.industry,
        "verification_status": emp.verification_status,
        "created_at": emp.created_at.isoformat() if emp.created_at else None,
    }


@router.delete("/employers/{employer_id}", status_code=204)
async def admin_delete_employer(
    employer_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Permanently delete an employer company (admin only)."""
    try:
        emp_uuid = uuid.UUID(employer_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="employer_id must be a valid UUID")
    result = await db.execute(select(EmployerCompany).where(EmployerCompany.id == emp_uuid))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=404, detail="Employer not found")
    await db.delete(emp)
    await db.commit()
    return None


@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Activate or deactivate a user account."""
    if payload.status not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'inactive'")
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="user_id must be a valid UUID")
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = payload.status
    await db.commit()
    return {"id": str(user.id), "email": user.email, "status": user.status}

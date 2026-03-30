"""
Documents Router – Applicant document upload, listing, download, and deletion.

Actions:
  - Upload a document file (candidate)
  - List documents for a candidate (candidate / employer / admin / migration_agent)
  - Download a document file  (candidate / employer / admin / migration_agent)
  - Delete a document record + file (candidate owns it, or admin)

Files are stored on the local filesystem under the ``uploads/`` directory
managed by ``backend.utils.file_storage``.  No AWS S3 or cloud storage is used.
"""

import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import ApplicantDocument, CandidateProfile, User
from backend.utils.file_storage import (
    build_storage_key,
    save_upload,
    delete_file,
    file_exists,
    get_absolute_path,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────

MAX_UPLOAD_BYTES = 10 * 1024 * 1024          # 10 MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validate_upload(file: UploadFile) -> None:
    """Raise 400/413 for disallowed file types or oversized uploads."""
    import os
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not allowed. "
                   f"Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Content type '{file.content_type}' is not allowed.",
        )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def upload_document(
    document_group: str,
    document_type: str,
    file: UploadFile = File(...),
    issuing_country: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """
    Upload a document file for the authenticated candidate.

    - Accepts PDF, DOC, DOCX, JPG, PNG (max 10 MB).
    - Stores the file on the local filesystem.
    - Creates an ``ApplicantDocument`` database record.
    - Triggers electrical worker re-scoring if applicable.
    """
    # 1. Validate file type & size up-front
    _validate_upload(file)

    # 2. Ensure user has a candidate profile
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Must create a candidate profile before uploading documents.",
        )

    # 3. Read bytes and enforce size limit
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the 10 MB size limit ({len(file_bytes)} bytes received).",
        )

    # 4. Persist to local filesystem
    storage_key = build_storage_key(str(profile.id), file.filename or "upload")
    try:
        await save_upload(storage_key, file_bytes)
    except OSError as exc:
        logger.error("Failed to save upload for candidate %s: %s", profile.id, exc)
        raise HTTPException(status_code=500, detail="File could not be saved. Please try again.")

    # 5. Create DB record
    new_doc = ApplicantDocument(
        id=uuid.uuid4(),
        candidate_id=profile.id,
        visa_application_id=None,
        document_group=document_group,
        document_type=document_type,
        issuing_country=issuing_country,
        file_name=file.filename or "upload",
        s3_key=storage_key,           # re-using column for local path key
        uploaded_by_user_id=current_user.id,
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    # 6. Trigger electrical scoring if needed
    if profile.is_electrical_worker:
        from backend.processors.electrical_scoring import score_electrical_worker
        try:
            await score_electrical_worker(profile.id, db)
        except Exception as exc:
            logger.warning(
                "Auto-scoring failed for candidate %s after upload: %s", profile.id, exc
            )

    return {
        "id": str(new_doc.id),
        "candidate_id": str(new_doc.candidate_id),
        "document_group": new_doc.document_group,
        "document_type": new_doc.document_type,
        "issuing_country": new_doc.issuing_country,
        "file_name": new_doc.file_name,
        "storage_key": new_doc.s3_key,
        "uploaded_at": new_doc.uploaded_at.isoformat() if new_doc.uploaded_at else None,
    }


@router.get("/{candidate_id}")
async def list_candidate_documents(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("candidate", "employer", "company_admin", "admin", "migration_agent")
    ),
):
    """
    List all documents for a specific candidate.
    Candidates may only view their own documents.
    Employers, admins, and migration agents may view any candidate's documents.
    """
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    # Candidates are restricted to their own documents
    if current_user.role == "candidate":
        prof_res = await db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
        )
        caller_prof = prof_res.scalar_one_or_none()
        if not caller_prof or caller_prof.id != cand_uuid:
            raise HTTPException(status_code=403, detail="You can only view your own documents.")

    result = await db.execute(
        select(ApplicantDocument)
        .where(ApplicantDocument.candidate_id == cand_uuid)
        .order_by(ApplicantDocument.uploaded_at.desc())
    )
    docs = result.scalars().all()

    return [
        {
            "id": str(d.id),
            "document_group": d.document_group,
            "document_type": d.document_type,
            "issuing_country": d.issuing_country,
            "file_name": d.file_name,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "file_available": file_exists(d.s3_key),
        }
        for d in docs
    ]


@router.get("/download/{document_id}")
async def download_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles("candidate", "employer", "company_admin", "admin", "migration_agent")
    ),
):
    """
    Download a specific document by its ID.

    Candidates may only download their own documents.
    Employers, admins, and migration agents may download any document.
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="document_id must be a valid UUID")

    result = await db.execute(
        select(ApplicantDocument).where(ApplicantDocument.id == doc_uuid)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Candidates are restricted to their own documents
    if current_user.role == "candidate":
        prof_res = await db.execute(
            select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
        )
        profile = prof_res.scalar_one_or_none()
        if not profile or doc.candidate_id != profile.id:
            raise HTTPException(status_code=403, detail="Not authorised to download this document.")

    abs_path = get_absolute_path(doc.s3_key)
    if not file_exists(doc.s3_key):
        raise HTTPException(
            status_code=404,
            detail="File not found on server. It may have been deleted.",
        )

    return FileResponse(
        path=abs_path,
        filename=doc.file_name,
        media_type="application/octet-stream",
    )


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate", "admin")),
):
    """
    Delete a document record and its file from disk.
    Candidates may only delete their own documents.  Admins may delete any.
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="document_id must be a valid UUID")

    result = await db.execute(
        select(ApplicantDocument).where(ApplicantDocument.id == doc_uuid)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if current_user.role == "candidate":
        if doc.uploaded_by_user_id != current_user.id:
            raise HTTPException(
                status_code=403, detail="Not authorised to delete this document."
            )

    # Delete DB record first, then file (avoids orphan records on file-delete failure)
    storage_key = doc.s3_key
    candidate_id = doc.candidate_id

    await db.delete(doc)
    await db.commit()

    # Delete file from disk (non-fatal if already gone)
    delete_file(storage_key)

    # Re-run electrical scoring after document removal
    prof_res = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == candidate_id)
    )
    profile = prof_res.scalar_one_or_none()
    if profile and profile.is_electrical_worker:
        from backend.processors.electrical_scoring import score_electrical_worker
        try:
            await score_electrical_worker(profile.id, db)
        except Exception as exc:
            logger.warning(
                "Auto-scoring failed for candidate %s after document deletion: %s",
                profile.id, exc,
            )

    return None

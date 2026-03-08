import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import ApplicantDocument, CandidateProfile, User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class DocumentUploadRequest(BaseModel):
    document_group: str
    document_type: str
    issuing_country: Optional[str] = None
    file_name: str


class DocumentResponse(BaseModel):
    id: str
    candidate_id: str
    document_group: str
    document_type: str
    issuing_country: Optional[str] = None
    file_name: str
    s3_key: str
    uploaded_at: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def simulate_document_upload(
    payload: DocumentUploadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate")),
):
    """
    Simulates a document upload.
    In AWS, this would return a pre-signed S3 URL.
    For this MVP, it just registers the metadata in the database.
    """
    # 1. Ensure user has a candidate profile
    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=400, detail="Must create a candidate profile before uploading documents.")

    # 2. Assign a mock S3 key
    fake_s3_key = f"uploads/{profile.id}/{uuid.uuid4()}_{payload.file_name}"

    # 3. Create document record
    new_doc = ApplicantDocument(
        id=uuid.uuid4(),
        candidate_id=profile.id,
        visa_application_id=None,
        document_group=payload.document_group,
        document_type=payload.document_type,
        issuing_country=payload.issuing_country,
        file_name=payload.file_name,
        s3_key=fake_s3_key,
        uploaded_by_user_id=current_user.id
    )
    db.add(new_doc)
    await db.commit()
    await db.refresh(new_doc)

    # Phase 3: Trigger Electrical Scoring automatically if this is an electrical worker
    if profile.is_electrical_worker:
        from backend.processors.electrical_scoring import score_electrical_worker
        try:
            await score_electrical_worker(profile.id, db)
        except Exception as e:
            # We log but do not fail the upload
            print(f"Failed to auto-score candidate {profile.id} after document upload: {e}")

    return {
        "id": str(new_doc.id),
        "candidate_id": str(new_doc.candidate_id),
        "document_group": new_doc.document_group,
        "document_type": new_doc.document_type,
        "issuing_country": new_doc.issuing_country,
        "file_name": new_doc.file_name,
        "s3_key": new_doc.s3_key,
        "uploaded_at": new_doc.uploaded_at.isoformat() if new_doc.uploaded_at else None,
        "simulated_presigned_url": f"https://mock-s3-bucket.s3.amazonaws.com/{fake_s3_key}?signature=mock123"
    }


@router.get("/{candidate_id}")
async def list_candidate_documents(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate", "employer", "company_admin", "admin", "migration_agent")),
):
    """
    List all documents for a specific candidate.
    Candidates can only view their own. Admins/Employers can view published ones (access control simplified here).
    """
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    # If the user is a candidate, ensure they are only querying their own documents
    if current_user.role == "candidate":
        prof_res = await db.execute(select(CandidateProfile).where(CandidateProfile.user_id == current_user.id))
        caller_prof = prof_res.scalar_one_or_none()
        if not caller_prof or caller_prof.id != cand_uuid:
            raise HTTPException(status_code=403, detail="You can only view your own documents.")

    # Fetch documents
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
            "download_url": f"https://mock-s3-bucket.s3.amazonaws.com/{d.s3_key}?signature=view123"
        }
        for d in docs
    ]


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("candidate", "admin")),
):
    """
    Delete a document record.
    Candidates can delete their own; admins can delete any.
    """
    try:
        doc_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="document_id must be a valid UUID")

    result = await db.execute(select(ApplicantDocument).where(ApplicantDocument.id == doc_uuid))
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if current_user.role == "candidate":
        if doc.uploaded_by_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this document.")

    await db.delete(doc)
    await db.commit()
    
    # Phase 3: Trigger Electrical Scoring recalculation if they delete a document
    # Fetch profile to see if they are an electrical worker
    prof_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == doc.candidate_id))
    profile = prof_res.scalar_one_or_none()
    if profile and profile.is_electrical_worker:
        from backend.processors.electrical_scoring import score_electrical_worker
        try:
            await score_electrical_worker(profile.id, db)
        except Exception as e:
            print(f"Failed to auto-score candidate {profile.id} after document deletion: {e}")

    return None

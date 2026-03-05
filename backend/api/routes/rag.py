"""
RAG Router – AI-powered document Q&A assistant.

Endpoints:
  POST /rag/ask                              – Ask a question about a candidate's documents
  GET  /rag/candidates/{candidate_id}/chunks – List stored text chunks (debug)
  POST /rag/ingest/{candidate_id}/{doc_id}  – Ingest a document (extract → embed → store)

Access: admin, company_admin, migration_agent, employer.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import require_roles
from backend.db.models.models import TextChunk, CandidateProfile, ApplicantDocument, User
from backend.services.rag_service import process_and_store_document, answer_question

router = APIRouter()

RAG_ROLES = ("admin", "company_admin", "migration_agent", "employer")


# ── Schemas ───────────────────────────────────────────────────────────────────

class RAGQuery(BaseModel):
    candidate_id: str
    question: str
    top_k: int = 5


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/ask")
async def ask_question(
    payload: RAGQuery,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*RAG_ROLES)),
):
    """
    Ask a natural-language question about a specific candidate's uploaded documents.

    The system retrieves the most relevant document chunks using pgvector cosine
    similarity and passes them as context to Bedrock Claude to generate a grounded answer.

    - If no documents have been ingested, returns status='no_documents'.
    - In local/dev mode (USE_STUB_EMBEDDINGS=true), returns a stub answer.
    """
    # Verify candidate exists — cast str → UUID for asyncpg compatibility
    try:
        cid_uuid = uuid.UUID(payload.candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == cid_uuid)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    try:
        return await answer_question(
            db=db,
            candidate_id=str(cid_uuid),
            question=payload.question,
            top_k=payload.top_k,
        )
    except Exception as exc:
        import traceback
        raise HTTPException(
            status_code=500,
            detail=f"RAG error: {type(exc).__name__}: {str(exc)}\n{traceback.format_exc()[-1500:]}"
        )


@router.post("/ingest/{candidate_id}/{document_id}", status_code=201)
async def ingest_document(
    candidate_id: str,
    document_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*RAG_ROLES)),
):
    """
    Ingest an uploaded document for a candidate into the RAG vector store.

    Pipeline:
      1. Extract text from the file (PDF or DOCX).
      2. Split into overlapping chunks.
      3. Embed each chunk with AWS Bedrock Titan.
      4. Store TextChunk rows in Postgres / pgvector.

    Args (path params):
      candidate_id: UUID of the CandidateProfile.
      document_id:  UUID of an existing ApplicantDocument record.

    Body: multipart/form-data with a 'file' field (.pdf or .docx).
    """
    # Validate candidate — cast str → UUID for asyncpg compatibility
    try:
        cid_uuid = uuid.UUID(candidate_id)
        did_uuid = uuid.UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id and document_id must be valid UUIDs")

    cand_result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == cid_uuid)
    )
    if not cand_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Validate document record
    doc_result = await db.execute(
        select(ApplicantDocument).where(ApplicantDocument.id == did_uuid)
    )
    if not doc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Document record not found")

    # Read file bytes
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = await process_and_store_document(
            db=db,
            candidate_id=candidate_id,
            source_document_id=document_id,
            file_bytes=file_bytes,
            file_name=file.filename or "upload",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return result


@router.get("/candidates/{candidate_id}/chunks")
async def list_text_chunks(
    candidate_id: str,
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(*RAG_ROLES)),
):
    """
    List stored text chunks for a candidate (for inspection / debugging).
    Shows chunk text (truncated to 300 chars) and whether an embedding exists.
    """
    # Cast str → UUID for asyncpg compatibility
    try:
        cid_uuid = uuid.UUID(candidate_id)
    except ValueError:
        cid_uuid = None

    result = await db.execute(
        select(TextChunk)
        .where(TextChunk.candidate_id == cid_uuid)
        .order_by(TextChunk.created_at.asc())
        .limit(limit)
    )
    chunks = result.scalars().all()

    if not chunks:
        return {
            "candidate_id": candidate_id,
            "chunk_count": 0,
            "chunks": [],
            "message": "No chunks found. Use POST /rag/ingest/{candidate_id}/{document_id} to ingest a document.",
        }

    return {
        "candidate_id": candidate_id,
        "chunk_count": len(chunks),
        "chunks": [
            {
                "id": str(c.id),
                "source_document_id": str(c.source_document_id),
                "chunk_text": c.chunk_text[:300] + "..." if len(c.chunk_text) > 300 else c.chunk_text,
                "has_embedding": c.embedding is not None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in chunks
        ],
    }

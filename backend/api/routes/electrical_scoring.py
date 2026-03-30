"""
Electrical Scoring Router – Trigger and view electrical worker scores.

Actions:
  - Trigger / re-run scoring for an electrical worker candidate
  - View stored score breakdown

Access: admin, company_admin (trigger); employer, migration_agent (read).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.db.setup import get_db
from backend.api.dependencies.rbac import get_current_user, require_roles
from backend.processors.electrical_scoring import calculate_electrical_score, ScoringInput
from backend.db.models.models import (
    CandidateProfile, ApplicantDocument, ElectricalWorkerScore, User
)

import uuid

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _run_and_store_score(candidate_id: str, db: AsyncSession) -> dict:
    """Core scoring logic: load candidate data, calculate score, persist result."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == cand_uuid)
    )
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not candidate.is_electrical_worker:
        raise HTTPException(
            status_code=400,
            detail="Candidate is not flagged as an electrical worker. "
                   "Set is_electrical_worker=true on the profile first."
        )

    # Load uploaded document types for this candidate
    docs_result = await db.execute(
        select(ApplicantDocument.document_type)
        .where(ApplicantDocument.candidate_id == candidate.id)
    )
    doc_types = [row[0] for row in docs_result.fetchall()]

    scoring_input = ScoringInput(
        candidate_id=str(candidate.id),
        trade_type=candidate.trade_category or "",
        years_experience=candidate.years_experience or 0,
        uploaded_document_types=doc_types,
        languages=candidate.languages or [],
    )
    score_result = calculate_electrical_score(scoring_input)

    # Upsert score record
    existing = await db.execute(
        select(ElectricalWorkerScore).where(ElectricalWorkerScore.candidate_id == candidate.id)
    )
    score_record = existing.scalar_one_or_none()

    if score_record:
        score_record.trade_type_score = score_result.trade_type_score
        score_record.experience_score = score_result.experience_score
        score_record.certification_score = score_result.certification_score
        score_record.safety_compliance_score = score_result.safety_compliance_score
        score_record.english_score = score_result.english_score
        score_record.total_score = score_result.total_score
        score_record.scoring_version = score_result.scoring_version
    else:
        score_record = ElectricalWorkerScore(
            id=uuid.uuid4(),
            candidate_id=candidate.id,
            trade_type_score=score_result.trade_type_score,
            experience_score=score_result.experience_score,
            certification_score=score_result.certification_score,
            safety_compliance_score=score_result.safety_compliance_score,
            english_score=score_result.english_score,
            total_score=score_result.total_score,
            scoring_version=score_result.scoring_version,
        )
        db.add(score_record)

    await db.commit()
    await db.refresh(score_record)

    return {
        "candidate_id": str(candidate.id),
        "total_score": score_record.total_score,
        "scoring_version": score_record.scoring_version,
        "breakdown": score_result.breakdown,
        "created_at": score_record.created_at.isoformat() if score_record.created_at else None,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/{candidate_id}")
async def trigger_score(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin")),
):
    """Trigger or re-run electrical worker scoring for a candidate."""
    return await _run_and_store_score(candidate_id, db)


@router.get("/{candidate_id}")
async def get_score(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin", "company_admin", "employer", "migration_agent")),
):
    """View the stored electrical worker score and breakdown for a candidate."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(
        select(ElectricalWorkerScore).where(ElectricalWorkerScore.candidate_id == cand_uuid)
    )
    score_record = result.scalar_one_or_none()

    if not score_record:
        raise HTTPException(
            status_code=404,
            detail="No score found for this candidate. "
                   "Trigger scoring via POST /scoring/{candidate_id} first."
        )

    # Load candidate for breakdown context
    candidate_result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == cand_uuid)
    )
    candidate = candidate_result.scalar_one_or_none()

    return {
        "candidate_id": str(score_record.candidate_id),
        "full_name": candidate.full_name if candidate else None,
        "total_score": score_record.total_score,
        "scoring_version": score_record.scoring_version,
        "breakdown": {
            "trade_type":        {"score": score_record.trade_type_score,        "max": 25},
            "experience":        {"score": score_record.experience_score,         "max": 25},
            "certifications":    {"score": score_record.certification_score,      "max": 25},
            "safety_compliance": {"score": score_record.safety_compliance_score,  "max": 15},
            "english":           {"score": score_record.english_score,            "max": 10},
        },
        "created_at": score_record.created_at.isoformat() if score_record.created_at else None,
    }

@router.delete("/{candidate_id}", status_code=204)
async def delete_score(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    """Delete a candidate's electrical worker score."""
    try:
        cand_uuid = uuid.UUID(candidate_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="candidate_id must be a valid UUID")

    result = await db.execute(select(ElectricalWorkerScore).where(ElectricalWorkerScore.candidate_id == cand_uuid))
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=404, detail="Score not found")
        
    await db.delete(score)
    await db.commit()
    return None

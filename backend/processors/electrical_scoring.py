"""
Electrical Worker Scoring – Rule-Based Engine (v1.0)
Calculates a suitability score for electrical worker candidates.

Scoring Rubric (v1.0) — Total: 100 points
─────────────────────────────────────────
  trade_type_score        : 0–25   (recognised trade type match)
  experience_score        : 0–25   (years of experience)
  certification_score     : 0–25   (uploaded electrical certs & trade docs)
  safety_compliance_score : 0–15   (safety/compliance evidence)
  english_score           : 0–10   (language proficiency evidence)
─────────────────────────────────────────
"""

import uuid
from dataclasses import dataclass
from typing import List

SCORING_VERSION = "v1.0"

# Recognised electrical trade types and their base scores
TRADE_TYPE_SCORES = {
    "licensed_electrician": 25,
    "electrical_engineer": 22,
    "electrical_technician": 18,
    "instrumentation_technician": 15,
    "electrical_apprentice": 10,
    "other_electrical": 5,
}

# Electrical certification document types (from proposal doc taxonomy)
ELECTRICAL_CERT_TYPES = {
    "trade_certificate",
    "apprenticeship_certificate",
    "vocational_certificate",
    "skills_assessment_result",
    "academic_transcript",
}

# Safety/compliance evidence document types
SAFETY_DOC_TYPES = {
    "police_certificate",
    "medical_result",
    "employment_reference",
}

# English language evidence document types
ENGLISH_DOC_TYPES = {
    "english_test_result",
}


@dataclass
class ScoringInput:
    candidate_id: str
    trade_type: str                  # from CandidateProfile.trade_category
    years_experience: int
    uploaded_document_types: List[str]  # list of document_type values from ApplicantDocument
    languages: List[dict]               # e.g. [{"name": "English", "level": "B2"}]


@dataclass
class ScoringResult:
    candidate_id: str
    trade_type_score: int
    experience_score: int
    certification_score: int
    safety_compliance_score: int
    english_score: int
    total_score: int
    scoring_version: str
    breakdown: dict


def score_trade_type(trade_type: str) -> int:
    """Maps candidate trade type to a score out of 25."""
    normalised = trade_type.lower().replace(" ", "_") if trade_type else ""
    return TRADE_TYPE_SCORES.get(normalised, 5)


def score_experience(years: int) -> int:
    """Scores years of experience out of 25."""
    if years is None or years < 0:
        return 0
    if years >= 10:
        return 25
    if years >= 7:
        return 20
    if years >= 5:
        return 15
    if years >= 3:
        return 10
    if years >= 1:
        return 5
    return 0


def score_certifications(doc_types: List[str]) -> int:
    """Scores uploaded electrical certification documents out of 25."""
    found = set(doc_types) & ELECTRICAL_CERT_TYPES
    count = len(found)
    if count >= 3:
        return 25
    if count == 2:
        return 18
    if count == 1:
        return 10
    return 0


def score_safety_compliance(doc_types: List[str]) -> int:
    """Scores safety and compliance evidence out of 15."""
    found = set(doc_types) & SAFETY_DOC_TYPES
    count = len(found)
    if count >= 3:
        return 15
    if count == 2:
        return 10
    if count == 1:
        return 5
    return 0


def score_english(doc_types: List[str], languages: List[dict]) -> int:
    """Scores English language proficiency out of 10."""
    # Check for an uploaded English test result
    if "english_test_result" in doc_types:
        return 10

    # Fall back to self-reported language level
    for lang in (languages or []):
        if "english" in lang.get("name", "").lower():
            level = lang.get("level", "").upper()
            level_scores = {"C2": 10, "C1": 9, "B2": 7, "B1": 5, "A2": 3, "A1": 1}
            return level_scores.get(level, 3)

    return 0


def calculate_electrical_score(input_data: ScoringInput) -> ScoringResult:
    """
    Main scoring function. Call this when:
    - A candidate is tagged as is_electrical_worker = True
    - A new document is uploaded for an electrical worker candidate
    - An admin triggers a manual re-score
    """
    trade_type_score = score_trade_type(input_data.trade_type)
    experience_score = score_experience(input_data.years_experience)
    certification_score = score_certifications(input_data.uploaded_document_types)
    safety_compliance_score = score_safety_compliance(input_data.uploaded_document_types)
    english_score = score_english(input_data.uploaded_document_types, input_data.languages)

    total = (
        trade_type_score +
        experience_score +
        certification_score +
        safety_compliance_score +
        english_score
    )

    return ScoringResult(
        candidate_id=input_data.candidate_id,
        trade_type_score=trade_type_score,
        experience_score=experience_score,
        certification_score=certification_score,
        safety_compliance_score=safety_compliance_score,
        english_score=english_score,
        total_score=total,
        scoring_version=SCORING_VERSION,
        breakdown={
            "trade_type": {"score": trade_type_score, "max": 25, "input": input_data.trade_type},
            "experience": {"score": experience_score, "max": 25, "input": f"{input_data.years_experience} years"},
            "certifications": {"score": certification_score, "max": 25,
                               "matched": list(set(input_data.uploaded_document_types) & ELECTRICAL_CERT_TYPES)},
            "safety_compliance": {"score": safety_compliance_score, "max": 15,
                                  "matched": list(set(input_data.uploaded_document_types) & SAFETY_DOC_TYPES)},
            "english": {"score": english_score, "max": 10},
        }
    )


async def score_electrical_worker(candidate_id, db) -> None:
    """
    Async DB-aware helper: loads candidate data, runs scoring, and upserts the result.
    Called automatically after profile updates and document uploads/deletions.

    Args:
        candidate_id: UUID object (or str-castable) of the CandidateProfile.
        db: AsyncSession instance.
    """
    from sqlalchemy import select
    from backend.db.models.models import (
        CandidateProfile, ApplicantDocument, ElectricalWorkerScore
    )

    cand_result = await db.execute(
        select(CandidateProfile).where(CandidateProfile.id == candidate_id)
    )
    candidate = cand_result.scalar_one_or_none()
    if not candidate or not candidate.is_electrical_worker:
        return

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

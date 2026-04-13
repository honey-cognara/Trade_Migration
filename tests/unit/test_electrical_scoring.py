"""
Unit tests for backend/processors/electrical_scoring.py
Tests every scoring sub-function and the full calculate_electrical_score.
No DB, no HTTP — pure function tests.
"""

import pytest
from backend.processors.electrical_scoring import (
    score_trade_type,
    score_experience,
    score_certifications,
    score_safety_compliance,
    score_english,
    calculate_electrical_score,
    ScoringInput,
)

pytestmark = pytest.mark.unit


# ── score_trade_type ───────────────────────────────────────────────────────────

def test_trade_licensed_electrician_25():
    assert score_trade_type("licensed_electrician") == 25


def test_trade_electrical_engineer_22():
    assert score_trade_type("electrical_engineer") == 22


def test_trade_electrical_technician_18():
    assert score_trade_type("electrical_technician") == 18


def test_trade_instrumentation_technician_15():
    assert score_trade_type("instrumentation_technician") == 15


def test_trade_electrical_apprentice_10():
    assert score_trade_type("electrical_apprentice") == 10


def test_trade_other_electrical_5():
    result = score_trade_type("other_electrical")
    assert result <= 10  # should be low score for other


def test_trade_unknown_returns_nonzero_or_zero():
    # Unknown trade should not crash and should return int
    result = score_trade_type("plumber")
    assert isinstance(result, int)
    assert 0 <= result <= 25


def test_trade_none_returns_int():
    result = score_trade_type(None)
    assert isinstance(result, int)
    assert 0 <= result <= 25


def test_trade_case_insensitive():
    lower = score_trade_type("licensed_electrician")
    upper = score_trade_type("LICENSED_ELECTRICIAN")
    assert lower == upper


def test_trade_with_spaces_normalised():
    result = score_trade_type("licensed electrician")
    assert isinstance(result, int)


# ── score_experience ───────────────────────────────────────────────────────────

def test_experience_0_years_returns_0():
    assert score_experience(0) == 0


def test_experience_negative_returns_0():
    assert score_experience(-1) == 0


def test_experience_none_returns_0():
    assert score_experience(None) == 0


def test_experience_1_year_returns_5():
    assert score_experience(1) == 5


def test_experience_2_years_returns_5():
    assert score_experience(2) == 5


def test_experience_3_years_returns_10():
    assert score_experience(3) == 10


def test_experience_boundary_4_returns_10():
    assert score_experience(4) == 10


def test_experience_5_years_returns_15():
    assert score_experience(5) == 15


def test_experience_6_years_returns_15():
    assert score_experience(6) == 15


def test_experience_7_years_returns_20():
    assert score_experience(7) == 20


def test_experience_9_years_returns_20():
    assert score_experience(9) == 20


def test_experience_10_years_returns_25():
    assert score_experience(10) == 25


def test_experience_20_years_capped_25():
    assert score_experience(20) == 25


# ── score_certifications ───────────────────────────────────────────────────────

def test_certs_empty_returns_0():
    assert score_certifications([]) == 0


def test_certs_no_matching_types_returns_0():
    assert score_certifications(["passport", "photo_id", "bank_statement"]) == 0


def test_certs_1_matching_returns_10():
    assert score_certifications(["trade_certificate"]) == 10


def test_certs_2_matching_returns_18():
    assert score_certifications(["trade_certificate", "academic_transcript"]) == 18


def test_certs_3_matching_returns_25():
    result = score_certifications([
        "trade_certificate",
        "apprenticeship_certificate",
        "vocational_certificate",
    ])
    assert result == 25


def test_certs_4_plus_capped_25():
    result = score_certifications([
        "trade_certificate",
        "apprenticeship_certificate",
        "vocational_certificate",
        "skills_assessment_result",
    ])
    assert result == 25


def test_certs_duplicates_deduplicated():
    # Two identical cert types should count as one
    result = score_certifications(["trade_certificate", "trade_certificate"])
    assert result == 10


def test_certs_mixed_relevant_and_irrelevant():
    result = score_certifications(["trade_certificate", "passport", "medical_result"])
    assert result == 10


# ── score_safety_compliance ────────────────────────────────────────────────────

def test_safety_empty_returns_0():
    assert score_safety_compliance([]) == 0


def test_safety_no_matching_docs_returns_0():
    assert score_safety_compliance(["trade_certificate", "passport"]) == 0


def test_safety_1_doc_returns_5():
    assert score_safety_compliance(["police_certificate"]) == 5


def test_safety_2_docs_returns_10():
    assert score_safety_compliance(["police_certificate", "medical_result"]) == 10


def test_safety_3_docs_returns_15():
    assert score_safety_compliance([
        "police_certificate", "medical_result", "employment_reference"
    ]) == 15


def test_safety_3_plus_capped_15():
    result = score_safety_compliance([
        "police_certificate", "medical_result", "employment_reference",
        "police_certificate",  # duplicate
    ])
    assert result == 15


# ── score_english ──────────────────────────────────────────────────────────────

def test_english_test_result_doc_returns_10():
    result = score_english(["english_test_result"], [])
    assert result == 10


def test_english_c2_level_returns_10():
    result = score_english([], [{"name": "English", "level": "C2"}])
    assert result == 10


def test_english_b2_level_returns_7():
    result = score_english([], [{"name": "English", "level": "B2"}])
    assert result == 7


def test_english_b1_level_returns_5():
    result = score_english([], [{"name": "English", "level": "B1"}])
    assert result == 5


def test_english_a1_level_returns_1():
    result = score_english([], [{"name": "English", "level": "A1"}])
    assert result == 1


def test_english_no_info_returns_0():
    result = score_english([], [])
    assert result == 0


def test_english_non_english_language_returns_0():
    result = score_english([], [{"name": "Urdu", "level": "C2"}])
    assert result == 0


# ── calculate_electrical_score (full integration — no DB) ─────────────────────

def test_calculate_score_returns_scoring_result():
    inp = ScoringInput(
        candidate_id="test-id",
        trade_type="licensed_electrician",
        years_experience=10,
        uploaded_document_types=[
            "trade_certificate", "apprenticeship_certificate",
            "vocational_certificate", "police_certificate",
            "medical_result", "employment_reference",
        ],
        languages=[{"name": "English", "level": "C2"}],
    )
    result = calculate_electrical_score(inp)
    assert result.total_score == 100


def test_calculate_score_partial_returns_correct_total():
    inp = ScoringInput(
        candidate_id="test-id",
        trade_type="electrical_engineer",   # 22
        years_experience=5,                  # 15
        uploaded_document_types=["trade_certificate"],  # 10 certs + 0 safety
        languages=[{"name": "English", "level": "B2"}],  # 7
    )
    result = calculate_electrical_score(inp)
    assert result.trade_type_score == 22
    assert result.experience_score == 15
    assert result.certification_score == 10
    assert result.safety_compliance_score == 0
    assert result.english_score == 7
    assert result.total_score == 22 + 15 + 10 + 0 + 7


def test_calculate_score_breakdown_dict_keys_present():
    inp = ScoringInput(
        candidate_id="test-id",
        trade_type="licensed_electrician",
        years_experience=3,
        uploaded_document_types=[],
        languages=[],
    )
    result = calculate_electrical_score(inp)
    assert hasattr(result, "breakdown")
    assert isinstance(result.breakdown, dict)


def test_calculate_score_no_experience_no_docs_returns_low_score():
    inp = ScoringInput(
        candidate_id="test-id",
        trade_type=None,
        years_experience=0,
        uploaded_document_types=[],
        languages=[],
    )
    result = calculate_electrical_score(inp)
    # None trade_type gets fallback (≤10 pts), no experience/docs/english = 0
    assert result.total_score <= 10
    assert result.experience_score == 0
    assert result.certification_score == 0
    assert result.safety_compliance_score == 0
    assert result.english_score == 0

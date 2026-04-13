"""
Integration tests for /employers/* endpoints.
Covers: company CRUD, browse companies, search candidates, EOI submission.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


def _company_payload(**overrides):
    base = {
        "company_name": f"Test Company {uuid.uuid4().hex[:6]}",
        "abn_or_identifier": "12345678901",
        "contact_name": "John Smith",
        "contact_email": "john@company.com",
        "industry": "Construction",
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# COMPANY CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def test_create_company_as_employer_returns_201(client, employer_user):
    r = await client.post("/employers/company", json=_company_payload(),
                          headers=employer_user["headers"])
    assert r.status_code == 201


async def test_create_company_as_candidate_returns_403(client, candidate_user):
    r = await client.post("/employers/company", json=_company_payload(),
                          headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_create_duplicate_company_returns_400(client, employer_user, approved_company):
    r = await client.post("/employers/company", json=_company_payload(),
                          headers=employer_user["headers"])
    assert r.status_code == 400


async def test_get_own_company_returns_200(client, employer_user, approved_company):
    r = await client.get("/employers/company", headers=employer_user["headers"])
    assert r.status_code == 200
    assert r.json()["id"] == str(approved_company.id)


async def test_get_company_no_company_returns_404(client, employer_user):
    r = await client.get("/employers/company", headers=employer_user["headers"])
    assert r.status_code == 404


async def test_update_company_returns_200(client, employer_user, approved_company):
    r = await client.put("/employers/company",
                         json={"company_name": "Updated Co", "industry": "Mining"},
                         headers=employer_user["headers"])
    assert r.status_code == 200
    assert r.json()["company_name"] == "Updated Co"


async def test_delete_company_returns_200(client, employer_user, approved_company):
    r = await client.delete("/employers/company", headers=employer_user["headers"])
    assert r.status_code in (200, 204)


# ══════════════════════════════════════════════════════════════════════════════
# BROWSE COMPANIES
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_approved_companies_returns_list(client, candidate_user, approved_company):
    r = await client.get("/employers/companies", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    ids = [c["id"] for c in r.json()]
    assert str(approved_company.id) in ids


async def test_list_companies_excludes_pending(client, candidate_user, pending_company):
    r = await client.get("/employers/companies", headers=candidate_user["headers"])
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert str(pending_company.id) not in ids


async def test_get_single_company_returns_200(client, candidate_user, approved_company):
    r = await client.get(f"/employers/companies/{approved_company.id}",
                         headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_get_nonexistent_company_returns_404(client, candidate_user):
    r = await client.get(f"/employers/companies/{uuid.uuid4()}",
                         headers=candidate_user["headers"])
    assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# SEARCH CANDIDATES
# ══════════════════════════════════════════════════════════════════════════════

async def test_search_candidates_approved_employer_returns_list(
    client, employer_user, approved_company, published_profile
):
    r = await client.get("/employers/candidates", headers=employer_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_search_candidates_pending_employer_returns_403(
    client, employer_user, pending_company
):
    r = await client.get("/employers/candidates", headers=employer_user["headers"])
    assert r.status_code == 403


async def test_search_candidates_only_published_profiles_shown(
    client, employer_user, approved_company, candidate_profile
):
    # candidate_profile is NOT published
    r = await client.get("/employers/candidates", headers=employer_user["headers"])
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert str(candidate_profile.id) not in ids


async def test_get_candidate_profile_with_consent_returns_200(
    client, employer_user, approved_company,
    candidate_user, published_profile, db_session
):
    from backend.db.models.models import CandidateEmployerConsent
    consent = CandidateEmployerConsent(
        id=uuid.uuid4(),
        candidate_id=published_profile.id,
        employer_company_id=approved_company.id,
        is_active=True,
    )
    db_session.add(consent)
    await db_session.flush()

    r = await client.get(f"/employers/candidates/{published_profile.id}",
                         headers=employer_user["headers"])
    assert r.status_code == 200


async def test_get_candidate_profile_without_consent_returns_403(
    client, employer_user, approved_company, published_profile
):
    r = await client.get(f"/employers/candidates/{published_profile.id}",
                         headers=employer_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# SUBMIT EOI via /employers/eoi
# ══════════════════════════════════════════════════════════════════════════════

async def test_submit_eoi_approved_employer_returns_201(
    client, employer_user, approved_company, published_profile
):
    r = await client.post("/employers/eoi", json={
        "candidate_id": str(published_profile.id),
        "job_title": "Senior Electrician",
        "message": "We want to hire you.",
        "sponsorship_flag": True,
    }, headers=employer_user["headers"])
    assert r.status_code == 201


async def test_submit_eoi_pending_employer_returns_403(
    client, employer_user, pending_company, published_profile
):
    r = await client.post("/employers/eoi", json={
        "candidate_id": str(published_profile.id),
        "job_title": "Electrician",
        "message": "Interested.",
        "sponsorship_flag": False,
    }, headers=employer_user["headers"])
    assert r.status_code == 403

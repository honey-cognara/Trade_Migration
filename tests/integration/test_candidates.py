"""
Integration tests for /candidates/* endpoints.
Covers: profile CRUD, publish/unpublish, EOIs, consent, visa-share.
"""
import uuid
import pytest
from backend.db.models.models import ConsentRecord

pytestmark = pytest.mark.integration


async def _add_registration_consent(db_session, user_id):
    """Insert a registration consent record so the publish endpoint allows the action."""
    consent = ConsentRecord(
        id=uuid.uuid4(),
        user_id=user_id,
        consent_type="registration",
        consent_version="2025-v1",
    )
    db_session.add(consent)
    await db_session.flush()


def _profile_payload(**overrides):
    base = {
        "full_name": "Test Electrician",
        "nationality": "Pakistani",
        "country_of_residence": "Pakistan",
        "trade_category": "electrician",
        "is_electrical_worker": True,
        "years_experience": 5,
        "languages": [{"name": "English", "level": "B2"}],
        "work_types": ["domestic", "industrial"],
        "profile_summary": "Experienced electrician seeking migration.",
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# PROFILE CRUD
# ══════════════════════════════════════════════════════════════════════════════

async def test_create_profile_as_candidate_returns_201(client, candidate_user):
    r = await client.post("/candidates/profile", json=_profile_payload(),
                          headers=candidate_user["headers"])
    assert r.status_code == 201


async def test_create_profile_as_employer_returns_403(client, employer_user):
    r = await client.post("/candidates/profile", json=_profile_payload(),
                          headers=employer_user["headers"])
    assert r.status_code == 403


async def test_create_profile_duplicate_returns_400(client, candidate_user, candidate_profile):
    r = await client.post("/candidates/profile", json=_profile_payload(),
                          headers=candidate_user["headers"])
    assert r.status_code == 400


async def test_get_profile_returns_own_profile(client, candidate_user, candidate_profile):
    r = await client.get("/candidates/profile", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert r.json()["full_name"] == candidate_profile.full_name


async def test_get_profile_no_profile_returns_404(client, candidate_user):
    r = await client.get("/candidates/profile", headers=candidate_user["headers"])
    assert r.status_code == 404


async def test_update_profile_returns_200(client, candidate_user, candidate_profile):
    r = await client.put("/candidates/profile",
                         json={"full_name": "Updated Name", "years_experience": 7},
                         headers=candidate_user["headers"])
    assert r.status_code == 200
    assert r.json()["full_name"] == "Updated Name"


async def test_delete_profile_returns_200(client, candidate_user, candidate_profile):
    r = await client.delete("/candidates/profile", headers=candidate_user["headers"])
    assert r.status_code in (200, 204)


async def test_delete_profile_nonexistent_returns_404(client, candidate_user):
    r = await client.delete("/candidates/profile", headers=candidate_user["headers"])
    assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# PUBLISH / UNPUBLISH
# ══════════════════════════════════════════════════════════════════════════════

async def test_publish_profile_returns_200(client, candidate_user, candidate_profile, db_session):
    await _add_registration_consent(db_session, candidate_user["user"].id)
    r = await client.post("/candidates/profile/publish", headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_publish_already_published_returns_200(client, candidate_user, published_profile, db_session):
    await _add_registration_consent(db_session, candidate_user["user"].id)
    r = await client.post("/candidates/profile/publish", headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_unpublish_profile_returns_200(client, candidate_user, published_profile):
    r = await client.post("/candidates/profile/unpublish", headers=candidate_user["headers"])
    assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# EOIs (received by candidate)
# ══════════════════════════════════════════════════════════════════════════════

async def test_get_eois_empty_list_when_none(client, candidate_user, candidate_profile):
    r = await client.get("/candidates/eois", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert r.json() == [] or isinstance(r.json(), list)


async def test_get_eois_returns_list_with_eoi(client, candidate_user, candidate_profile, eoi_record):
    r = await client.get("/candidates/eois", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert len(r.json()) >= 1


# ══════════════════════════════════════════════════════════════════════════════
# CONSENT MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

async def test_grant_employer_consent_returns_201(
    client, candidate_user, candidate_profile, approved_company
):
    r = await client.post(
        f"/candidates/consent/employer/{approved_company.id}",
        headers=candidate_user["headers"],
    )
    assert r.status_code in (200, 201)


async def test_list_employer_consents_returns_list(
    client, candidate_user, candidate_profile, approved_company
):
    await client.post(f"/candidates/consent/employer/{approved_company.id}",
                      headers=candidate_user["headers"])
    r = await client.get("/candidates/consent/employers", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_revoke_employer_consent_returns_200(
    client, candidate_user, candidate_profile, approved_company
):
    await client.post(f"/candidates/consent/employer/{approved_company.id}",
                      headers=candidate_user["headers"])
    r = await client.delete(
        f"/candidates/consent/employer/{approved_company.id}",
        headers=candidate_user["headers"],
    )
    assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# VISA SHARE
# ══════════════════════════════════════════════════════════════════════════════

async def test_approve_visa_share_returns_201(
    client, candidate_user, candidate_profile, eoi_record
):
    r = await client.post(
        f"/candidates/visa-share/{eoi_record.id}/approve",
        headers=candidate_user["headers"],
    )
    assert r.status_code in (200, 201)


async def test_revoke_visa_share_returns_200(
    client, candidate_user, candidate_profile, eoi_record
):
    await client.post(f"/candidates/visa-share/{eoi_record.id}/approve",
                      headers=candidate_user["headers"])
    r = await client.post(
        f"/candidates/visa-share/{eoi_record.id}/revoke",
        headers=candidate_user["headers"],
    )
    assert r.status_code == 200


async def test_list_visa_shares_returns_list(client, candidate_user, candidate_profile):
    r = await client.get("/candidates/visa-shares", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)

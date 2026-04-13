"""
Integration tests for /scoring/* endpoints.
Covers: trigger scoring, get score, delete score + RBAC.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


# ══════════════════════════════════════════════════════════════════════════════
# TRIGGER SCORING
# ══════════════════════════════════════════════════════════════════════════════

async def test_trigger_scoring_as_admin_returns_200(
    client, admin_user, candidate_profile, applicant_document
):
    r = await client.post(
        f"/scoring/{candidate_profile.id}",
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_trigger_scoring_as_company_admin_returns_200(
    client, company_admin_user, candidate_profile, applicant_document
):
    r = await client.post(
        f"/scoring/{candidate_profile.id}",
        headers=company_admin_user["headers"],
    )
    assert r.status_code == 200


async def test_trigger_scoring_as_candidate_returns_403(
    client, candidate_user, candidate_profile
):
    r = await client.post(
        f"/scoring/{candidate_profile.id}",
        headers=candidate_user["headers"],
    )
    assert r.status_code == 403


async def test_trigger_scoring_nonelectrical_worker_returns_400(
    client, admin_user, db_session, candidate_profile
):
    candidate_profile.is_electrical_worker = False
    await db_session.flush()
    r = await client.post(
        f"/scoring/{candidate_profile.id}",
        headers=admin_user["headers"],
    )
    assert r.status_code == 400


async def test_trigger_scoring_nonexistent_candidate_returns_404(client, admin_user):
    r = await client.post(f"/scoring/{uuid.uuid4()}", headers=admin_user["headers"])
    assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# GET SCORE
# ══════════════════════════════════════════════════════════════════════════════

async def test_get_score_after_trigger_returns_breakdown(
    client, admin_user, candidate_profile, applicant_document
):
    await client.post(f"/scoring/{candidate_profile.id}", headers=admin_user["headers"])
    r = await client.get(f"/scoring/{candidate_profile.id}", headers=admin_user["headers"])
    assert r.status_code == 200
    data = r.json()
    assert "total_score" in data
    assert isinstance(data["total_score"], int)


async def test_get_score_nonexistent_returns_404(client, admin_user):
    r = await client.get(f"/scoring/{uuid.uuid4()}", headers=admin_user["headers"])
    assert r.status_code == 404


async def test_get_score_as_employer_returns_200(
    client, employer_user, approved_company, admin_user,
    candidate_profile, applicant_document
):
    await client.post(f"/scoring/{candidate_profile.id}", headers=admin_user["headers"])
    r = await client.get(f"/scoring/{candidate_profile.id}", headers=employer_user["headers"])
    assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# DELETE SCORE
# ══════════════════════════════════════════════════════════════════════════════

async def test_delete_score_as_admin_returns_200(
    client, admin_user, candidate_profile, applicant_document
):
    await client.post(f"/scoring/{candidate_profile.id}", headers=admin_user["headers"])
    r = await client.delete(f"/scoring/{candidate_profile.id}", headers=admin_user["headers"])
    assert r.status_code in (200, 204)


async def test_delete_score_as_employer_returns_403(
    client, employer_user, admin_user, candidate_profile, applicant_document
):
    await client.post(f"/scoring/{candidate_profile.id}", headers=admin_user["headers"])
    r = await client.delete(f"/scoring/{candidate_profile.id}", headers=employer_user["headers"])
    assert r.status_code == 403

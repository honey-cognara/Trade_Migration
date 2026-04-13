"""
Integration tests for /eoi/* endpoints.
Covers: submit, get received, mark read, get by id, update, delete + RBAC.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


def _eoi_payload(candidate_id, company_id=None, **overrides):
    base = {
        "candidate_id": str(candidate_id),
        "job_title": "Senior Electrician",
        "message": "We are very interested in hiring you.",
        "sponsorship_flag": True,
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# SUBMIT EOI
# ══════════════════════════════════════════════════════════════════════════════

async def test_submit_eoi_as_employer_returns_201(
    client, employer_user, approved_company, published_profile
):
    r = await client.post("/eoi/", json=_eoi_payload(published_profile.id),
                          headers=employer_user["headers"])
    assert r.status_code == 201


async def test_submit_eoi_as_candidate_returns_403(
    client, candidate_user, published_profile
):
    r = await client.post("/eoi/", json=_eoi_payload(published_profile.id),
                          headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_submit_eoi_as_admin_returns_403(
    client, admin_user, published_profile
):
    r = await client.post("/eoi/", json=_eoi_payload(published_profile.id),
                          headers=admin_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# GET RECEIVED EOIs (candidate side)
# ══════════════════════════════════════════════════════════════════════════════

async def test_get_received_eois_as_candidate_returns_list(
    client, candidate_user, candidate_profile, eoi_record
):
    r = await client.get("/eoi/received", headers=candidate_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


async def test_get_received_eois_as_employer_returns_403(client, employer_user):
    r = await client.get("/eoi/received", headers=employer_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# MARK EOI READ
# ══════════════════════════════════════════════════════════════════════════════

async def test_mark_eoi_read_as_candidate_returns_200(
    client, candidate_user, candidate_profile, eoi_record
):
    r = await client.patch(f"/eoi/{eoi_record.id}/read", headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_mark_eoi_read_already_read_returns_200(
    client, candidate_user, candidate_profile, eoi_record, db_session
):
    eoi_record.status = "read"
    await db_session.flush()
    r = await client.patch(f"/eoi/{eoi_record.id}/read", headers=candidate_user["headers"])
    assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# GET EOI BY ID
# ══════════════════════════════════════════════════════════════════════════════

async def test_get_eoi_by_id_as_employer_returns_200(
    client, employer_user, approved_company, eoi_record
):
    r = await client.get(f"/eoi/{eoi_record.id}", headers=employer_user["headers"])
    assert r.status_code == 200


async def test_get_eoi_by_id_as_candidate_returns_200(
    client, candidate_user, candidate_profile, eoi_record
):
    r = await client.get(f"/eoi/{eoi_record.id}", headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_get_eoi_by_id_as_training_provider_returns_403(
    client, training_provider_user, eoi_record
):
    r = await client.get(f"/eoi/{eoi_record.id}", headers=training_provider_user["headers"])
    assert r.status_code == 403


async def test_get_nonexistent_eoi_returns_404(client, employer_user, approved_company):
    r = await client.get(f"/eoi/{uuid.uuid4()}", headers=employer_user["headers"])
    assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# UPDATE EOI
# ══════════════════════════════════════════════════════════════════════════════

async def test_update_eoi_as_employer_returns_200(
    client, employer_user, approved_company, eoi_record
):
    r = await client.put(f"/eoi/{eoi_record.id}",
                         json={"message": "Updated message.", "sponsorship_flag": False},
                         headers=employer_user["headers"])
    assert r.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# DELETE EOI
# ══════════════════════════════════════════════════════════════════════════════

async def test_delete_eoi_as_employer_returns_200(
    client, employer_user, approved_company, eoi_record
):
    r = await client.delete(f"/eoi/{eoi_record.id}", headers=employer_user["headers"])
    assert r.status_code in (200, 204)


async def test_delete_eoi_as_admin_returns_200(
    client, admin_user, eoi_record
):
    r = await client.delete(f"/eoi/{eoi_record.id}", headers=admin_user["headers"])
    assert r.status_code in (200, 204)


async def test_delete_eoi_as_candidate_returns_403(
    client, candidate_user, eoi_record
):
    r = await client.delete(f"/eoi/{eoi_record.id}", headers=candidate_user["headers"])
    assert r.status_code == 403

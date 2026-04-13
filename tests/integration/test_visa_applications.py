"""
Integration tests for /visa/* endpoints.
Covers: create, list, get, update status/notes, delete + RBAC.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


def _visa_payload(candidate_id, **overrides):
    base = {
        "candidate_id": str(candidate_id),
        "country_of_application": "Australia",
        "notes": "Initial application notes",
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# CREATE
# ══════════════════════════════════════════════════════════════════════════════

async def test_create_visa_app_as_company_admin_returns_201(
    client, company_admin_user, candidate_profile
):
    r = await client.post("/visa/", json=_visa_payload(candidate_profile.id),
                          headers=company_admin_user["headers"])
    assert r.status_code == 201


async def test_create_visa_app_as_migration_agent_returns_201(
    client, migration_agent_user, candidate_profile
):
    r = await client.post("/visa/", json=_visa_payload(candidate_profile.id),
                          headers=migration_agent_user["headers"])
    assert r.status_code == 201


async def test_create_visa_app_as_candidate_returns_403(
    client, candidate_user, candidate_profile
):
    r = await client.post("/visa/", json=_visa_payload(candidate_profile.id),
                          headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_create_visa_app_as_employer_returns_403(
    client, employer_user, candidate_profile
):
    r = await client.post("/visa/", json=_visa_payload(candidate_profile.id),
                          headers=employer_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# LIST
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_visa_apps_as_admin_returns_list(client, admin_user, visa_application):
    r = await client.get("/visa/", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_list_visa_apps_as_migration_agent_returns_list(
    client, migration_agent_user, visa_application
):
    r = await client.get("/visa/", headers=migration_agent_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_list_visa_apps_as_candidate_returns_403(client, candidate_user):
    r = await client.get("/visa/", headers=candidate_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# GET / UPDATE / DELETE
# ══════════════════════════════════════════════════════════════════════════════

async def test_get_visa_app_returns_200(client, admin_user, visa_application):
    r = await client.get(f"/visa/{visa_application.id}", headers=admin_user["headers"])
    assert r.status_code == 200
    assert r.json()["id"] == str(visa_application.id)


async def test_get_nonexistent_visa_app_returns_404(client, admin_user):
    r = await client.get(f"/visa/{uuid.uuid4()}", headers=admin_user["headers"])
    assert r.status_code == 404


async def test_update_visa_status_to_submitted_returns_200(
    client, company_admin_user, visa_application
):
    r = await client.put(
        f"/visa/{visa_application.id}/status",
        json={"status": "submitted"},
        headers=company_admin_user["headers"],
    )
    assert r.status_code == 200
    assert r.json()["status"] == "submitted"


async def test_update_visa_status_to_approved_returns_200(
    client, admin_user, visa_application
):
    r = await client.put(
        f"/visa/{visa_application.id}/status",
        json={"status": "approved"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_update_visa_app_notes_returns_200(client, company_admin_user, visa_application):
    r = await client.put(
        f"/visa/{visa_application.id}",
        json={"notes": "Updated notes after review."},
        headers=company_admin_user["headers"],
    )
    assert r.status_code == 200


async def test_delete_visa_app_as_admin_returns_200(client, admin_user, visa_application):
    r = await client.delete(f"/visa/{visa_application.id}", headers=admin_user["headers"])
    assert r.status_code in (200, 204)


async def test_delete_visa_app_as_employer_returns_403(client, employer_user, visa_application):
    r = await client.delete(f"/visa/{visa_application.id}", headers=employer_user["headers"])
    assert r.status_code == 403

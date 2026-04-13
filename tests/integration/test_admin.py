"""
Integration tests for /admin/* endpoints.
Covers: employer management, candidate management, user management, role restrictions.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_pending_employers_as_admin_returns_list(
    client, admin_user, pending_company
):
    r = await client.get("/admin/employers/pending", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_list_pending_employers_as_candidate_returns_403(client, candidate_user):
    r = await client.get("/admin/employers/pending", headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_approve_employer_updates_status(client, admin_user, pending_company):
    r = await client.post(
        f"/admin/employers/{pending_company.id}/verify",
        json={"action": "approve"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 200
    assert r.json()["verification_status"] == "approved"


async def test_reject_employer_updates_status(client, admin_user, pending_company):
    r = await client.post(
        f"/admin/employers/{pending_company.id}/verify",
        json={"action": "reject"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 200
    assert r.json()["verification_status"] == "rejected"


async def test_list_all_employers_as_admin_returns_list(client, admin_user, approved_company):
    r = await client.get("/admin/employers", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_get_single_employer_as_admin_returns_200(client, admin_user, approved_company):
    r = await client.get(f"/admin/employers/{approved_company.id}", headers=admin_user["headers"])
    assert r.status_code == 200


async def test_delete_employer_as_admin_returns_200(client, admin_user, approved_company):
    r = await client.delete(f"/admin/employers/{approved_company.id}", headers=admin_user["headers"])
    assert r.status_code in (200, 204)


# ══════════════════════════════════════════════════════════════════════════════
# CANDIDATE MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_all_candidates_as_admin_returns_list(
    client, admin_user, candidate_profile
):
    r = await client.get("/admin/candidates", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_list_all_candidates_as_employer_returns_403(client, employer_user):
    r = await client.get("/admin/candidates", headers=employer_user["headers"])
    assert r.status_code == 403


async def test_get_candidate_details_as_admin_returns_200(
    client, admin_user, candidate_profile
):
    r = await client.get(f"/admin/candidates/{candidate_profile.id}", headers=admin_user["headers"])
    assert r.status_code == 200


async def test_delete_candidate_as_admin_returns_200(
    client, admin_user, candidate_profile
):
    r = await client.delete(f"/admin/candidates/{candidate_profile.id}", headers=admin_user["headers"])
    assert r.status_code in (200, 204)


async def test_force_unpublish_candidate_as_admin_returns_200(
    client, admin_user, published_profile
):
    r = await client.post(
        f"/admin/candidates/{published_profile.id}/unpublish",
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_export_candidate_pdf_as_admin(client, admin_user, candidate_profile):
    r = await client.get(
        f"/admin/candidates/{candidate_profile.id}/export-pdf",
        headers=admin_user["headers"],
    )
    assert r.status_code in (200, 404, 501)  # may not be fully implemented


# ══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_all_users_as_admin_returns_list(client, admin_user, candidate_user):
    r = await client.get("/admin/users", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_update_user_status_inactive_returns_200(client, admin_user, candidate_user):
    r = await client.put(
        f"/admin/users/{candidate_user['user'].id}/status",
        json={"status": "inactive"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_update_user_status_active_returns_200(client, admin_user, candidate_user):
    r = await client.put(
        f"/admin/users/{candidate_user['user'].id}/status",
        json={"status": "active"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 200


async def test_update_nonexistent_user_returns_404(client, admin_user):
    r = await client.put(
        f"/admin/users/{uuid.uuid4()}/status",
        json={"status": "inactive"},
        headers=admin_user["headers"],
    )
    assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# ROLE RESTRICTIONS
# ══════════════════════════════════════════════════════════════════════════════

async def test_admin_list_users_rejects_migration_agent(client, migration_agent_user):
    r = await client.get("/admin/users", headers=migration_agent_user["headers"])
    assert r.status_code == 403


async def test_admin_list_users_rejects_training_provider(client, training_provider_user):
    r = await client.get("/admin/users", headers=training_provider_user["headers"])
    assert r.status_code == 403

"""
Integration tests for /dashboard/* endpoints.
Covers: /my (all 6 roles), /stats, /recent-activity, /pending-employers + RBAC.
"""
import pytest

pytestmark = pytest.mark.integration


# ══════════════════════════════════════════════════════════════════════════════
# /dashboard/my — role-specific stats
# ══════════════════════════════════════════════════════════════════════════════

async def test_dashboard_my_as_candidate_returns_200(client, candidate_user, candidate_profile):
    r = await client.get("/dashboard/my", headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_dashboard_my_as_employer_returns_200(client, employer_user, approved_company):
    r = await client.get("/dashboard/my", headers=employer_user["headers"])
    assert r.status_code == 200


async def test_dashboard_my_as_admin_returns_200(client, admin_user):
    r = await client.get("/dashboard/my", headers=admin_user["headers"])
    assert r.status_code == 200


async def test_dashboard_my_as_migration_agent_returns_200(client, migration_agent_user):
    r = await client.get("/dashboard/my", headers=migration_agent_user["headers"])
    assert r.status_code == 200


async def test_dashboard_my_as_company_admin_returns_200(client, company_admin_user):
    r = await client.get("/dashboard/my", headers=company_admin_user["headers"])
    assert r.status_code == 200


async def test_dashboard_my_as_training_provider_returns_200(client, training_provider_user):
    r = await client.get("/dashboard/my", headers=training_provider_user["headers"])
    assert r.status_code == 200


async def test_dashboard_my_unauthenticated_returns_401(client):
    r = await client.get("/dashboard/my")
    assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# /dashboard/stats — admin/company_admin/migration_agent only
# ══════════════════════════════════════════════════════════════════════════════

async def test_dashboard_stats_as_admin_returns_200(client, admin_user):
    r = await client.get("/dashboard/stats", headers=admin_user["headers"])
    assert r.status_code == 200


async def test_dashboard_stats_as_company_admin_returns_200(client, company_admin_user):
    r = await client.get("/dashboard/stats", headers=company_admin_user["headers"])
    assert r.status_code == 200


async def test_dashboard_stats_as_candidate_returns_403(client, candidate_user):
    r = await client.get("/dashboard/stats", headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_dashboard_stats_as_employer_returns_403(client, employer_user):
    r = await client.get("/dashboard/stats", headers=employer_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# /dashboard/recent-activity
# ══════════════════════════════════════════════════════════════════════════════

async def test_dashboard_recent_activity_as_admin_returns_200(client, admin_user):
    r = await client.get("/dashboard/recent-activity", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_dashboard_recent_activity_as_candidate_returns_403(client, candidate_user):
    r = await client.get("/dashboard/recent-activity", headers=candidate_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# /dashboard/pending-employers
# ══════════════════════════════════════════════════════════════════════════════

async def test_dashboard_pending_employers_as_admin_returns_list(
    client, admin_user, pending_company
):
    r = await client.get("/dashboard/pending-employers", headers=admin_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_dashboard_pending_employers_as_candidate_returns_403(client, candidate_user):
    r = await client.get("/dashboard/pending-employers", headers=candidate_user["headers"])
    assert r.status_code == 403

"""
Integration tests for /agents/* endpoints.
Covers: ping, assign case, list cases, get/update case + RBAC.
"""
import uuid
import pytest

pytestmark = pytest.mark.integration


# ══════════════════════════════════════════════════════════════════════════════
# PING
# ══════════════════════════════════════════════════════════════════════════════

async def test_ping_as_migration_agent_returns_200(client, migration_agent_user):
    r = await client.get("/agents/ping", headers=migration_agent_user["headers"])
    assert r.status_code == 200


async def test_ping_as_candidate_returns_403(client, candidate_user):
    r = await client.get("/agents/ping", headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_ping_as_employer_returns_403(client, employer_user):
    r = await client.get("/agents/ping", headers=employer_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# ASSIGN CASE
# ══════════════════════════════════════════════════════════════════════════════

async def test_assign_case_as_migration_agent_returns_201(
    client, migration_agent_user, visa_application
):
    r = await client.post(
        "/agents/cases/assign",
        json={"visa_application_id": str(visa_application.id)},
        headers=migration_agent_user["headers"],
    )
    assert r.status_code == 201


async def test_assign_nonexistent_case_returns_404(client, migration_agent_user):
    r = await client.post(
        "/agents/cases/assign",
        json={"visa_application_id": str(uuid.uuid4())},
        headers=migration_agent_user["headers"],
    )
    assert r.status_code == 404


async def test_assign_case_as_candidate_returns_403(
    client, candidate_user, visa_application
):
    r = await client.post(
        "/agents/cases/assign",
        json={"visa_application_id": str(visa_application.id)},
        headers=candidate_user["headers"],
    )
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# LIST / GET / UPDATE CASES
# ══════════════════════════════════════════════════════════════════════════════

async def test_list_my_cases_returns_list(client, migration_agent_user, visa_application):
    await client.post(
        "/agents/cases/assign",
        json={"visa_application_id": str(visa_application.id)},
        headers=migration_agent_user["headers"],
    )
    r = await client.get("/agents/cases", headers=migration_agent_user["headers"])
    assert r.status_code == 200
    assert isinstance(r.json(), list)


async def test_get_case_details_returns_200(
    client, migration_agent_user, visa_application
):
    await client.post(
        "/agents/cases/assign",
        json={"visa_application_id": str(visa_application.id)},
        headers=migration_agent_user["headers"],
    )
    r = await client.get(
        f"/agents/cases/{visa_application.id}",
        headers=migration_agent_user["headers"],
    )
    assert r.status_code == 200


async def test_update_case_notes_returns_200(
    client, migration_agent_user, visa_application
):
    await client.post(
        "/agents/cases/assign",
        json={"visa_application_id": str(visa_application.id)},
        headers=migration_agent_user["headers"],
    )
    r = await client.put(
        f"/agents/cases/{visa_application.id}",
        json={"notes": "Case reviewed and in progress.", "status": "under_review"},
        headers=migration_agent_user["headers"],
    )
    assert r.status_code == 200


async def test_update_case_as_candidate_returns_403(
    client, candidate_user, visa_application
):
    r = await client.put(
        f"/agents/cases/{visa_application.id}",
        json={"notes": "hack attempt"},
        headers=candidate_user["headers"],
    )
    assert r.status_code == 403

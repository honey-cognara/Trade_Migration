"""
Tests for /agents (Migration Agents) endpoints.

Covers:
  GET  /agents/ping          – public sanity check
  GET  /agents/cases         – get assigned cases (migration_agent only)
  POST /agents/cases/assign  – assign a visa case to the agent
"""
import pytest
import uuid
from httpx import AsyncClient

VALID_PASSWORD = "SecurePass!123"


def _unique_email():
    return f"agent_{uuid.uuid4().hex[:8]}@example.com"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


async def _register(client, role):
    res = await client.post("/auth/register", json={
        "email": _unique_email(), "password": VALID_PASSWORD, "role": role
    })
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


# ── Ping ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_agents_ping(client: AsyncClient):
    """GET /agents/ping is open and returns pong."""
    res = await client.get("/agents/ping")
    assert res.status_code == 200
    assert res.json()["message"] == "pong"


# ── RBAC checks ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_cases_unauthenticated(client: AsyncClient):
    """Must be authenticated to view cases."""
    res = await client.get("/agents/cases")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_cases_wrong_role(client: AsyncClient):
    """Candidates and employers cannot access agent cases."""
    for role in ("candidate", "employer"):
        token = await _register(client, role)
        res = await client.get("/agents/cases", headers=_auth(token))
        assert res.status_code == 403, f"Expected 403 for role '{role}', got {res.status_code}"


@pytest.mark.asyncio
async def test_get_cases_returns_empty_list(client: AsyncClient):
    """A new migration agent has no assigned cases."""
    token = await _register(client, "migration_agent")
    res = await client.get("/agents/cases", headers=_auth(token))
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) == 0


# ── Assign case ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_assign_case_invalid_uuid(client: AsyncClient):
    """Assigning with a non-UUID application id returns 422."""
    token = await _register(client, "migration_agent")
    res = await client.post("/agents/cases/assign", json={
        "visa_application_id": "not-a-uuid"
    }, headers=_auth(token))
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_assign_case_not_found(client: AsyncClient):
    """Assigning a non-existent visa application returns 404."""
    token = await _register(client, "migration_agent")
    res = await client.post("/agents/cases/assign", json={
        "visa_application_id": str(uuid.uuid4())
    }, headers=_auth(token))
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_assign_case_wrong_role(client: AsyncClient):
    """Only migration_agent role can assign cases."""
    for role in ("candidate", "employer", "admin"):
        token = await _register(client, role)
        res = await client.post("/agents/cases/assign", json={
            "visa_application_id": str(uuid.uuid4())
        }, headers=_auth(token))
        assert res.status_code == 403, f"Expected 403 for role '{role}', got {res.status_code}"

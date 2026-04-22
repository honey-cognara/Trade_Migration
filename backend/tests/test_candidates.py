"""
Tests for /candidates endpoints.

Covers:
  POST /candidates/profile          – create
  GET  /candidates/profile          – get own
  PUT  /candidates/profile          – update
  POST /candidates/profile/publish  – publish (with consent check)
  POST /candidates/profile/unpublish
  DELETE /candidates/profile
  GET  /candidates/eois
"""
import pytest
import uuid
from httpx import AsyncClient

VALID_PASSWORD = "SecurePass!123"


def _unique_email():
    return f"cand_{uuid.uuid4().hex[:8]}@example.com"


async def _register_and_login(client, role="candidate"):
    """Register a user, return (token, email)."""
    email = _unique_email()
    res = await client.post("/auth/register", json={
        "email": email, "password": VALID_PASSWORD, "role": role
    })
    assert res.status_code == 201, res.text
    return res.json()["access_token"], email


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


PROFILE_PAYLOAD = {
    "full_name": "Ali Hassan",
    "nationality": "Pakistani",
    "country_of_residence": "Pakistan",
    "trade_category": "electrician",
    "is_electrical_worker": True,
    "years_experience": 5,
    "languages": [{"name": "English", "level": "B2"}],
    "profile_summary": "Experienced electrician seeking migration opportunities.",
}


# ── Create profile ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_candidate_profile_success(client: AsyncClient):
    token, _ = await _register_and_login(client, "candidate")
    res = await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["full_name"] == "Ali Hassan"
    assert data["trade_category"] == "electrician"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_profile_duplicate_rejected(client: AsyncClient):
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))
    res = await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_profile_wrong_role_rejected(client: AsyncClient):
    """An employer cannot create a candidate profile."""
    token, _ = await _register_and_login(client, "employer")
    res = await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_create_profile_unauthenticated(client: AsyncClient):
    res = await client.post("/candidates/profile", json=PROFILE_PAYLOAD)
    assert res.status_code == 401


# ── Get own profile ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_profile_success(client: AsyncClient):
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))

    res = await client.get("/candidates/profile", headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["full_name"] == "Ali Hassan"


@pytest.mark.asyncio
async def test_get_profile_not_found(client: AsyncClient):
    """A new candidate with no profile should get 404."""
    token, _ = await _register_and_login(client, "candidate")
    res = await client.get("/candidates/profile", headers=_auth(token))
    assert res.status_code == 404


# ── Update profile ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_profile_success(client: AsyncClient):
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))

    res = await client.put("/candidates/profile", json={
        "full_name": "Ali Hassan Updated",
        "years_experience": 8,
    }, headers=_auth(token))
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Ali Hassan Updated"
    assert data["years_experience"] == 8


# ── Publish / Unpublish ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_publish_profile_success(client: AsyncClient):
    """Candidate with consent (from registration) can publish their profile."""
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))

    res = await client.post("/candidates/profile/publish", headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["published"] is True


@pytest.mark.asyncio
async def test_unpublish_profile_success(client: AsyncClient):
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))
    await client.post("/candidates/profile/publish", headers=_auth(token))

    res = await client.post("/candidates/profile/unpublish", headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["published"] is False


# ── Delete profile ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_profile_success(client: AsyncClient):
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))

    res = await client.delete("/candidates/profile", headers=_auth(token))
    assert res.status_code == 204

    # Should now be gone
    res2 = await client.get("/candidates/profile", headers=_auth(token))
    assert res2.status_code == 404


# ── EOIs received ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_eois_empty_list(client: AsyncClient):
    """A candidate with a profile but no EOIs gets an empty list."""
    token, _ = await _register_and_login(client, "candidate")
    await client.post("/candidates/profile", json=PROFILE_PAYLOAD, headers=_auth(token))

    res = await client.get("/candidates/eois", headers=_auth(token))
    assert res.status_code == 200
    assert res.json() == []

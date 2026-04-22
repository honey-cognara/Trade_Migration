"""
Tests for the /auth endpoints.

Covers:
  POST /auth/register  – success & duplicate email
  POST /auth/login     – success, bad password, missing fields
  GET  /auth/me        – authenticated, unauthenticated
  POST /auth/logout
"""
import pytest
import uuid
from httpx import AsyncClient


# ── Helpers ───────────────────────────────────────────────────────────────────

def _unique_email() -> str:
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


VALID_PASSWORD = "SecurePass!123"
ROLES = ["candidate", "employer", "admin", "migration_agent", "training_provider"]


# ── Registration ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_candidate_success(client: AsyncClient):
    """A new user can register as a candidate and receives a token."""
    res = await client.post("/auth/register", json={
        "email": _unique_email(),
        "password": VALID_PASSWORD,
        "role": "candidate",
    })
    assert res.status_code == 201, res.text
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "candidate"
    assert "user_id" in data
    assert "email" in data


@pytest.mark.asyncio
@pytest.mark.parametrize("role", ROLES)
async def test_register_all_roles(client: AsyncClient, role: str):
    """All valid user roles can register."""
    res = await client.post("/auth/register", json={
        "email": _unique_email(),
        "password": VALID_PASSWORD,
        "role": role,
    })
    assert res.status_code == 201, f"Role '{role}' registration failed: {res.text}"


@pytest.mark.asyncio
async def test_register_duplicate_email_rejected(client: AsyncClient):
    """Registering twice with the same email returns 400."""
    email = _unique_email()
    payload = {"email": email, "password": VALID_PASSWORD, "role": "candidate"}

    res1 = await client.post("/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_role_rejected(client: AsyncClient):
    """Registering with an invalid role returns 422."""
    res = await client.post("/auth/register", json={
        "email": _unique_email(),
        "password": VALID_PASSWORD,
        "role": "hacker",
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_register_missing_fields_rejected(client: AsyncClient):
    """Registering without a required field returns 422."""
    res = await client.post("/auth/register", json={"email": _unique_email()})
    assert res.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """A registered user can login and receives a token."""
    email = _unique_email()
    await client.post("/auth/register", json={
        "email": email, "password": VALID_PASSWORD, "role": "employer"
    })

    res = await client.post("/auth/login", json={
        "email": email, "password": VALID_PASSWORD
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "employer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Login with wrong password returns 401."""
    email = _unique_email()
    await client.post("/auth/register", json={
        "email": email, "password": VALID_PASSWORD, "role": "candidate"
    })

    res = await client.post("/auth/login", json={
        "email": email, "password": "WrongPassword!"
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    """Login with a non-existent email returns 401."""
    res = await client.post("/auth/login", json={
        "email": "nobody@nowhere.com", "password": "whatever"
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_login_missing_fields(client: AsyncClient):
    """Login without providing all required fields returns 422."""
    res = await client.post("/auth/login", json={"email": "only@email.com"})
    assert res.status_code == 422


# ── GET /auth/me ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    """Calling GET /auth/me without a token returns 401."""
    res = await client.get("/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient):
    """Calling GET /auth/me with a valid token returns current user info."""
    email = _unique_email()
    reg = await client.post("/auth/register", json={
        "email": email, "password": VALID_PASSWORD, "role": "candidate"
    })
    token = reg.json()["access_token"]

    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == email
    assert data["role"] == "candidate"


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    """Calling GET /auth/me with a garbage token returns 401."""
    res = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert res.status_code == 401


# ── POST /auth/logout ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_logout_success(client: AsyncClient):
    """Logout with a valid token returns 200."""
    reg = await client.post("/auth/register", json={
        "email": _unique_email(), "password": VALID_PASSWORD, "role": "candidate"
    })
    token = reg.json()["access_token"]

    res = await client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "message" in res.json()

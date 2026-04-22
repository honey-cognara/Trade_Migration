"""
Tests for /employers endpoints.

Covers:
  POST /employers/company    – create company
  GET  /employers/company    – get own company
  PUT  /employers/company    – update company
  DELETE /employers/company  – delete company
  GET  /employers/candidates – search (requires approved company)
  POST /employers/eoi        – submit EOI (requires approved company)
"""
import pytest
import uuid
from httpx import AsyncClient

VALID_PASSWORD = "SecurePass!123"


def _unique_email():
    return f"emp_{uuid.uuid4().hex[:8]}@example.com"


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


async def _register_employer(client):
    """Register an employer, return token."""
    res = await client.post("/auth/register", json={
        "email": _unique_email(), "password": VALID_PASSWORD, "role": "employer"
    })
    assert res.status_code == 201, res.text
    return res.json()["access_token"]


COMPANY_PAYLOAD = {
    "company_name": "Sparky Solutions Pty Ltd",
    "abn_or_identifier": "12345678900",
    "contact_name": "John Smith",
    "contact_email": "john@sparky.com.au",
    "industry": "Electrical",
}


# ── Create company ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_company_success(client: AsyncClient):
    token = await _register_employer(client)
    res = await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["company_name"] == "Sparky Solutions Pty Ltd"
    assert data["verification_status"] == "pending"


@pytest.mark.asyncio
async def test_create_company_duplicate_rejected(client: AsyncClient):
    token = await _register_employer(client)
    await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))
    res = await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_create_company_wrong_role(client: AsyncClient):
    """Candidates cannot create employer companies."""
    res = await client.post("/auth/register", json={
        "email": _unique_email(), "password": VALID_PASSWORD, "role": "candidate"
    })
    token = res.json()["access_token"]
    res = await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_create_company_unauthenticated(client: AsyncClient):
    res = await client.post("/employers/company", json=COMPANY_PAYLOAD)
    assert res.status_code == 401


# ── Get company ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_company_success(client: AsyncClient):
    token = await _register_employer(client)
    await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))

    res = await client.get("/employers/company", headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["company_name"] == "Sparky Solutions Pty Ltd"


@pytest.mark.asyncio
async def test_get_company_not_found(client: AsyncClient):
    """Employer with no company gets 404."""
    token = await _register_employer(client)
    res = await client.get("/employers/company", headers=_auth(token))
    assert res.status_code == 404


# ── Update company ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_company_success(client: AsyncClient):
    token = await _register_employer(client)
    await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))

    updated = {**COMPANY_PAYLOAD, "company_name": "Updated Sparky Ltd"}
    res = await client.put("/employers/company", json=updated, headers=_auth(token))
    assert res.status_code == 200
    assert res.json()["company_name"] == "Updated Sparky Ltd"


# ── Delete company ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_company_success(client: AsyncClient):
    token = await _register_employer(client)
    await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))

    res = await client.delete("/employers/company", headers=_auth(token))
    assert res.status_code == 204

    # Should now return 404
    res2 = await client.get("/employers/company", headers=_auth(token))
    assert res2.status_code == 404


# ── Candidate search (requires approved company) ──────────────────────────────

@pytest.mark.asyncio
async def test_search_candidates_requires_approved_company(client: AsyncClient):
    """Employer with 'pending' company cannot search candidates."""
    token = await _register_employer(client)
    await client.post("/employers/company", json=COMPANY_PAYLOAD, headers=_auth(token))

    res = await client.get("/employers/candidates", headers=_auth(token))
    # verification_status is 'pending', so should be 403
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_search_candidates_no_company(client: AsyncClient):
    """Employer with no company profile gets 404 on candidate search."""
    token = await _register_employer(client)
    res = await client.get("/employers/candidates", headers=_auth(token))
    assert res.status_code == 404

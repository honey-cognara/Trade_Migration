"""
Security tests — JWT attacks, RBAC boundaries, business rule enforcement.
These tests verify that the API actively resists common attack patterns.
"""
import uuid
import pytest
from datetime import timedelta
from jose import jwt

from backend.utils.auth import create_access_token, SECRET_KEY, ALGORITHM

pytestmark = pytest.mark.security


# ══════════════════════════════════════════════════════════════════════════════
# JWT ATTACKS
# ══════════════════════════════════════════════════════════════════════════════

async def test_no_token_on_protected_endpoint_returns_401(client):
    r = await client.get("/auth/me")
    assert r.status_code == 401


async def test_malformed_bearer_token_returns_401(client):
    r = await client.get("/auth/me", headers={"Authorization": "Bearer not.a.real.jwt"})
    assert r.status_code == 401


async def test_missing_bearer_prefix_returns_401(client):
    token = create_access_token({"user_id": "abc", "role": "candidate"})
    r = await client.get("/auth/me", headers={"Authorization": token})  # no "Bearer "
    assert r.status_code == 401


async def test_tampered_jwt_payload_returns_401(client, candidate_user):
    token = candidate_user["token"]
    parts = token.split(".")
    import base64, json
    payload = json.loads(base64.b64decode(parts[1] + "==").decode())
    payload["role"] = "admin"  # attempt privilege escalation
    tampered_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).rstrip(b"=").decode()
    tampered_token = f"{parts[0]}.{tampered_payload}.{parts[2]}"
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert r.status_code == 401


async def test_jwt_signed_with_wrong_secret_returns_401(client, candidate_user):
    fake_token = jwt.encode(
        {"user_id": str(candidate_user["user"].id), "role": "candidate"},
        "completely-wrong-secret",
        algorithm=ALGORITHM,
    )
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {fake_token}"})
    assert r.status_code == 401


async def test_expired_jwt_returns_401(client, candidate_user):
    expired_token = create_access_token(
        {"user_id": str(candidate_user["user"].id), "role": "candidate"},
        expires_delta=timedelta(seconds=-1),
    )
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert r.status_code == 401


async def test_jwt_missing_user_id_claim_returns_401(client):
    token = create_access_token({"role": "admin"})  # no user_id
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


async def test_jwt_with_nonexistent_user_id_returns_401(client):
    token = create_access_token({"user_id": str(uuid.uuid4()), "role": "admin"})
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# RBAC BOUNDARIES — each role hitting a forbidden endpoint
# ══════════════════════════════════════════════════════════════════════════════

async def test_candidate_cannot_access_admin_users_endpoint(client, candidate_user):
    r = await client.get("/admin/users", headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_employer_cannot_access_admin_users_endpoint(client, employer_user):
    r = await client.get("/admin/users", headers=employer_user["headers"])
    assert r.status_code == 403


async def test_training_provider_cannot_access_visa_endpoint(client, training_provider_user):
    r = await client.get("/visa/", headers=training_provider_user["headers"])
    assert r.status_code == 403


async def test_migration_agent_cannot_create_employer_company(client, migration_agent_user):
    r = await client.post("/employers/company",
                          json={"company_name": "Hack Co", "industry": "hack"},
                          headers=migration_agent_user["headers"])
    assert r.status_code == 403


async def test_candidate_cannot_submit_eoi(client, candidate_user):
    r = await client.post("/eoi/",
                          json={"candidate_id": str(uuid.uuid4()), "job_title": "Hack", "message": "x"},
                          headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_employer_cannot_trigger_electrical_scoring(client, employer_user):
    r = await client.post(f"/scoring/{uuid.uuid4()}", headers=employer_user["headers"])
    assert r.status_code == 403


async def test_candidate_cannot_call_rag_ask(client, candidate_user):
    r = await client.post("/rag/ask",
                          json={"candidate_id": str(uuid.uuid4()), "question": "What certs?"},
                          headers=candidate_user["headers"])
    assert r.status_code == 403


async def test_training_provider_cannot_delete_users(client, training_provider_user):
    r = await client.put(f"/admin/users/{uuid.uuid4()}/status",
                         json={"status": "inactive"},
                         headers=training_provider_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# BUSINESS RULE SECURITY
# ══════════════════════════════════════════════════════════════════════════════

async def test_unverified_email_cannot_login(client, unverified_user):
    r = await client.post("/auth/login", json={
        "email": unverified_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 403
    assert "verify" in r.json()["detail"].lower()


async def test_inactive_account_cannot_login(client, inactive_user):
    r = await client.post("/auth/login", json={
        "email": inactive_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 403


async def test_inactive_account_token_rejected_on_protected_endpoint(
    client, inactive_user
):
    # Even with a valid JWT, inactive account should be rejected
    r = await client.get("/auth/me", headers=inactive_user["headers"])
    assert r.status_code == 403


async def test_employer_cannot_view_candidate_without_consent(
    client, employer_user, approved_company, published_profile
):
    r = await client.get(f"/employers/candidates/{published_profile.id}",
                         headers=employer_user["headers"])
    assert r.status_code == 403


async def test_pending_employer_cannot_search_candidates(
    client, employer_user, pending_company
):
    r = await client.get("/employers/candidates", headers=employer_user["headers"])
    assert r.status_code == 403


# ══════════════════════════════════════════════════════════════════════════════
# INPUT VALIDATION / INJECTION DEFENSE
# ══════════════════════════════════════════════════════════════════════════════

async def test_sql_special_chars_in_email_handled_safely(client):
    r = await client.post("/auth/login", json={
        "email": "'; DROP TABLE users; --@gmail.com",
        "password": "TestPass123",
    })
    assert r.status_code in (401, 422)  # not 500


async def test_xss_payload_in_name_field_returns_422_or_stored_safely(client):
    r = await client.post("/auth/register", json={
        "name": "<script>alert('xss')</script>",
        "email": f"xss_{uuid.uuid4().hex[:6]}@gmail.com",
        "password": "StrongPass1",
        "role": "candidate",
    })
    # Either rejected (422) or stored as plain text (201) — never executed
    assert r.status_code in (201, 422)


async def test_oversized_name_field_returns_422(client):
    r = await client.post("/auth/register", json={
        "name": "A" * 500,  # exceeds max_length=120
        "email": f"big_{uuid.uuid4().hex[:6]}@gmail.com",
        "password": "StrongPass1",
        "role": "candidate",
    })
    assert r.status_code == 422


async def test_negative_top_k_in_rag_query_returns_422(client, admin_user, candidate_profile):
    r = await client.post("/rag/ask", json={
        "candidate_id": str(candidate_profile.id),
        "question": "What certifications does the candidate have?",
        "top_k": -5,
    }, headers=admin_user["headers"])
    assert r.status_code == 422


async def test_reset_password_enumeration_same_response(client):
    """forgot-password must return identical response for known and unknown emails."""
    r1 = await client.post("/auth/forgot-password", json={"email": "real@gmail.com"})
    r2 = await client.post("/auth/forgot-password", json={"email": "fake_xyz_999@gmail.com"})
    assert r1.status_code == r2.status_code == 200
    assert r1.json()["message"] == r2.json()["message"]

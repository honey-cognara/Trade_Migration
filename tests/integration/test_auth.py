"""
Integration tests for /auth/* endpoints.
Covers: register, verify-otp, resend-otp, login, forgot-password,
        verify-reset-otp, reset-password, /me, logout.
"""
import uuid
import pytest
from datetime import datetime, timedelta
from sqlalchemy import select

from backend.db.models.models import User
from backend.utils.auth import hash_password, create_access_token

pytestmark = pytest.mark.integration

# ── Helpers ────────────────────────────────────────────────────────────────────

def _reg_payload(**overrides):
    base = {
        "name": "Test User",
        "email": f"user_{uuid.uuid4().hex[:8]}@gmail.com",
        "password": "StrongPass1",
        "role": "candidate",
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# REGISTER
# ══════════════════════════════════════════════════════════════════════════════

async def test_register_valid_candidate_returns_201(client):
    r = await client.post("/auth/register", json=_reg_payload())
    assert r.status_code == 201


async def test_register_valid_employer_returns_201(client):
    r = await client.post("/auth/register", json=_reg_payload(role="employer"))
    assert r.status_code == 201


async def test_register_duplicate_email_returns_400(client, db_session):
    payload = _reg_payload()
    await client.post("/auth/register", json=payload)
    r = await client.post("/auth/register", json=payload)
    assert r.status_code == 400


async def test_register_weak_password_no_uppercase_returns_422(client):
    r = await client.post("/auth/register", json=_reg_payload(password="weakpass1"))
    assert r.status_code == 422


async def test_register_weak_password_no_digit_returns_422(client):
    r = await client.post("/auth/register", json=_reg_payload(password="WeakPassNoDigit"))
    assert r.status_code == 422


async def test_register_weak_password_too_short_returns_422(client):
    r = await client.post("/auth/register", json=_reg_payload(password="Ab1"))
    assert r.status_code == 422


async def test_register_blocked_email_domain_returns_422(client):
    r = await client.post("/auth/register", json=_reg_payload(email="test@mailinator.com"))
    assert r.status_code == 422


async def test_register_invalid_email_format_returns_422(client):
    r = await client.post("/auth/register", json=_reg_payload(email="notanemail"))
    assert r.status_code == 422


async def test_register_sets_status_pending_and_email_unverified(client, db_session):
    payload = _reg_payload()
    await client.post("/auth/register", json=payload)
    result = await db_session.execute(select(User).where(User.email == payload["email"]))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.status == "pending"
    assert user.email_verified is False


# ══════════════════════════════════════════════════════════════════════════════
# VERIFY OTP
# ══════════════════════════════════════════════════════════════════════════════

async def test_verify_otp_correct_code_activates_account(client, db_session):
    payload = _reg_payload()
    await client.post("/auth/register", json=payload)
    result = await db_session.execute(select(User).where(User.email == payload["email"]))
    user = result.scalar_one_or_none()
    otp = user.otp_code

    r = await client.post("/auth/verify-otp", params={"email": payload["email"], "otp": otp})
    assert r.status_code == 200
    await db_session.refresh(user)
    assert user.email_verified is True
    assert user.status == "active"
    assert user.otp_code is None


async def test_verify_otp_wrong_code_returns_400(client, db_session):
    payload = _reg_payload()
    await client.post("/auth/register", json=payload)
    r = await client.post("/auth/verify-otp", params={"email": payload["email"], "otp": "000000"})
    assert r.status_code == 400


async def test_verify_otp_expired_code_returns_400(client, db_session):
    payload = _reg_payload()
    await client.post("/auth/register", json=payload)
    result = await db_session.execute(select(User).where(User.email == payload["email"]))
    user = result.scalar_one_or_none()
    otp = user.otp_code
    # Expire the OTP manually
    user.otp_expires_at = datetime.utcnow() - timedelta(minutes=5)
    await db_session.flush()

    r = await client.post("/auth/verify-otp", params={"email": payload["email"], "otp": otp})
    assert r.status_code == 400


async def test_verify_otp_already_verified_returns_200(client, candidate_user):
    r = await client.post(
        "/auth/verify-otp",
        params={"email": candidate_user["user"].email, "otp": "123456"},
    )
    assert r.status_code == 200
    assert "already verified" in r.json()["message"].lower()


async def test_verify_otp_unknown_email_returns_404(client):
    r = await client.post("/auth/verify-otp", params={"email": "nobody@gmail.com", "otp": "123456"})
    assert r.status_code == 404


# ══════════════════════════════════════════════════════════════════════════════
# RESEND OTP
# ══════════════════════════════════════════════════════════════════════════════

async def test_resend_otp_unverified_user_sends_new_code(client, db_session):
    payload = _reg_payload()
    await client.post("/auth/register", json=payload)
    result = await db_session.execute(select(User).where(User.email == payload["email"]))
    user = result.scalar_one_or_none()
    old_otp = user.otp_code

    r = await client.post("/auth/resend-otp", params={"email": payload["email"]})
    assert r.status_code == 200
    await db_session.refresh(user)
    assert user.otp_code != old_otp  # new OTP generated


async def test_resend_otp_verified_user_returns_generic_message(client, candidate_user):
    r = await client.post("/auth/resend-otp", params={"email": candidate_user["user"].email})
    assert r.status_code == 200


async def test_resend_otp_unknown_email_returns_generic_message(client):
    r = await client.post("/auth/resend-otp", params={"email": "nobody@gmail.com"})
    assert r.status_code == 200  # no enumeration — always 200


# ══════════════════════════════════════════════════════════════════════════════
# LOGIN
# ══════════════════════════════════════════════════════════════════════════════

async def test_login_valid_credentials_returns_token(client, candidate_user):
    r = await client.post("/auth/login", json={
        "email": candidate_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password_returns_401(client, candidate_user):
    r = await client.post("/auth/login", json={
        "email": candidate_user["user"].email,
        "password": "WrongPass999",
    })
    assert r.status_code == 401


async def test_login_unknown_email_returns_401(client):
    r = await client.post("/auth/login", json={
        "email": "nobody@gmail.com",
        "password": "TestPass123",
    })
    assert r.status_code == 401


async def test_login_unverified_email_returns_403(client, unverified_user):
    r = await client.post("/auth/login", json={
        "email": unverified_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 403


async def test_login_inactive_account_returns_403(client, inactive_user):
    r = await client.post("/auth/login", json={
        "email": inactive_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 403


async def test_login_returns_correct_role_in_response(client, employer_user):
    r = await client.post("/auth/login", json={
        "email": employer_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 200
    assert r.json()["role"] == "employer"


async def test_login_token_contains_user_id(client, candidate_user):
    r = await client.post("/auth/login", json={
        "email": candidate_user["user"].email,
        "password": "TestPass123",
    })
    data = r.json()
    assert data["user_id"] == str(candidate_user["user"].id)


# ══════════════════════════════════════════════════════════════════════════════
# FORGOT PASSWORD
# ══════════════════════════════════════════════════════════════════════════════

async def test_forgot_password_known_email_returns_generic_message(client, candidate_user):
    r = await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    assert r.status_code == 200
    assert "sent" in r.json()["message"].lower() or "registered" in r.json()["message"].lower()


async def test_forgot_password_unknown_email_returns_same_generic_message(client, candidate_user):
    r1 = await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    r2 = await client.post("/auth/forgot-password", json={"email": "nobody_xyz@gmail.com"})
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["message"] == r2.json()["message"]  # no enumeration


async def test_forgot_password_stores_otp_in_db(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    assert candidate_user["user"].otp_code is not None
    assert len(candidate_user["user"].otp_code) == 6


async def test_forgot_password_unverified_account_no_otp(client, db_session, unverified_user):
    await client.post("/auth/forgot-password", json={"email": unverified_user["user"].email})
    await db_session.refresh(unverified_user["user"])
    assert unverified_user["user"].otp_code is None  # not sent for unverified


async def test_verify_reset_otp_correct_returns_reset_token(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    otp = candidate_user["user"].otp_code

    r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": otp,
    })
    assert r.status_code == 200
    assert "reset_token" in r.json()


async def test_verify_reset_otp_wrong_code_returns_400(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": "000000",
    })
    assert r.status_code == 400


async def test_verify_reset_otp_expired_returns_400(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    otp = candidate_user["user"].otp_code
    candidate_user["user"].otp_expires_at = datetime.utcnow() - timedelta(minutes=5)
    await db_session.flush()

    r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": otp,
    })
    assert r.status_code == 400


async def test_reset_password_valid_token_updates_hash(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    otp = candidate_user["user"].otp_code

    otp_r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": otp,
    })
    reset_token = otp_r.json()["reset_token"]

    r = await client.post("/auth/reset-password", json={
        "email": candidate_user["user"].email,
        "reset_token": reset_token,
        "new_password": "NewPass456",
    })
    assert r.status_code == 200
    assert "successfully" in r.json()["message"].lower()


async def test_reset_password_invalid_token_returns_400(client, candidate_user):
    r = await client.post("/auth/reset-password", json={
        "email": candidate_user["user"].email,
        "reset_token": "totally-fake-token",
        "new_password": "NewPass456",
    })
    assert r.status_code == 400


async def test_reset_password_weak_new_password_returns_422(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    otp = candidate_user["user"].otp_code
    otp_r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": otp,
    })
    reset_token = otp_r.json()["reset_token"]
    r = await client.post("/auth/reset-password", json={
        "email": candidate_user["user"].email,
        "reset_token": reset_token,
        "new_password": "weak",
    })
    assert r.status_code == 422


async def test_reset_password_old_password_rejected_after_reset(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    otp = candidate_user["user"].otp_code
    otp_r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": otp,
    })
    reset_token = otp_r.json()["reset_token"]
    await client.post("/auth/reset-password", json={
        "email": candidate_user["user"].email,
        "reset_token": reset_token,
        "new_password": "NewPass456",
    })
    # Old password should no longer work
    r = await client.post("/auth/login", json={
        "email": candidate_user["user"].email,
        "password": "TestPass123",
    })
    assert r.status_code == 401


async def test_reset_token_single_use(client, db_session, candidate_user):
    await client.post("/auth/forgot-password", json={"email": candidate_user["user"].email})
    await db_session.refresh(candidate_user["user"])
    otp = candidate_user["user"].otp_code
    otp_r = await client.post("/auth/verify-reset-otp", json={
        "email": candidate_user["user"].email, "otp": otp,
    })
    reset_token = otp_r.json()["reset_token"]
    await client.post("/auth/reset-password", json={
        "email": candidate_user["user"].email,
        "reset_token": reset_token,
        "new_password": "NewPass456",
    })
    # Second use of same token must fail
    r = await client.post("/auth/reset-password", json={
        "email": candidate_user["user"].email,
        "reset_token": reset_token,
        "new_password": "AnotherPass789",
    })
    assert r.status_code == 400


# ══════════════════════════════════════════════════════════════════════════════
# /me  &  /logout
# ══════════════════════════════════════════════════════════════════════════════

async def test_get_me_authenticated_returns_user_info(client, candidate_user):
    r = await client.get("/auth/me", headers=candidate_user["headers"])
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == candidate_user["user"].email
    assert data["role"] == "candidate"


async def test_get_me_no_token_returns_401(client):
    r = await client.get("/auth/me")
    assert r.status_code == 401


async def test_get_me_expired_token_returns_401(client, candidate_user):
    from datetime import timedelta
    expired_token = create_access_token(
        {"user_id": str(candidate_user["user"].id), "role": "candidate"},
        expires_delta=timedelta(seconds=-1),
    )
    r = await client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert r.status_code == 401


async def test_logout_authenticated_returns_200(client, candidate_user):
    r = await client.post("/auth/logout", headers=candidate_user["headers"])
    assert r.status_code == 200


async def test_logout_no_token_returns_401(client):
    r = await client.post("/auth/logout")
    assert r.status_code == 401

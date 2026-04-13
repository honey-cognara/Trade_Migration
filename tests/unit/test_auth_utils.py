"""
Unit tests for backend/utils/auth.py
Tests: hash_password, verify_password, create_access_token, decode_access_token
No DB, no HTTP.
"""

import pytest
from datetime import timedelta
from fastapi import HTTPException
from jose import jwt

from backend.utils.auth import (
    hash_password, verify_password,
    create_access_token, decode_access_token,
    SECRET_KEY, ALGORITHM,
)

pytestmark = pytest.mark.unit


# ── hash_password ──────────────────────────────────────────────────────────────

def test_hash_password_returns_bcrypt_format():
    result = hash_password("mypassword")
    assert result.startswith("$2b$")


def test_hash_password_is_not_plaintext():
    pw = "mypassword"
    assert hash_password(pw) != pw


def test_hash_password_same_input_different_salts():
    pw = "mypassword"
    h1 = hash_password(pw)
    h2 = hash_password(pw)
    assert h1 != h2  # bcrypt uses random salts


# ── verify_password ────────────────────────────────────────────────────────────

def test_verify_password_correct_returns_true():
    pw = "mypassword"
    assert verify_password(pw, hash_password(pw)) is True


def test_verify_password_wrong_returns_false():
    assert verify_password("wrongpassword", hash_password("mypassword")) is False


def test_verify_password_empty_plain_returns_false():
    assert verify_password("", hash_password("mypassword")) is False


def test_verify_password_unicode_password():
    pw = "Pässwörd123"
    assert verify_password(pw, hash_password(pw)) is True


# ── create_access_token ────────────────────────────────────────────────────────

def test_create_access_token_returns_string():
    token = create_access_token({"user_id": "abc", "role": "candidate"})
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_has_exp_claim():
    token = create_access_token({"user_id": "abc"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload


def test_create_access_token_contains_data():
    token = create_access_token({"user_id": "test-123", "role": "admin"})
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["user_id"] == "test-123"
    assert payload["role"] == "admin"


def test_create_access_token_custom_expiry():
    token = create_access_token({"user_id": "abc"}, expires_delta=timedelta(minutes=5))
    from datetime import datetime, timezone
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = (exp - now).total_seconds()
    assert 240 < diff < 360  # ~5 minutes


# ── decode_access_token ────────────────────────────────────────────────────────

def test_decode_valid_token_returns_payload():
    token = create_access_token({"user_id": "test-id", "role": "employer"})
    payload = decode_access_token(token)
    assert payload["user_id"] == "test-id"
    assert payload["role"] == "employer"


def test_decode_tampered_signature_raises_401():
    token = create_access_token({"user_id": "abc"})
    tampered = token[:-4] + "XXXX"
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(tampered)
    assert exc_info.value.status_code == 401


def test_decode_expired_token_raises_401():
    token = create_access_token({"user_id": "abc"}, expires_delta=timedelta(seconds=-1))
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == 401


def test_decode_wrong_secret_raises_401():
    token = jwt.encode({"user_id": "abc", "exp": 9999999999}, "wrong-secret", algorithm=ALGORITHM)
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token(token)
    assert exc_info.value.status_code == 401


def test_decode_garbage_string_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token("not.a.jwt")
    assert exc_info.value.status_code == 401


def test_decode_empty_string_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        decode_access_token("")
    assert exc_info.value.status_code == 401

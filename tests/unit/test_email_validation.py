"""
Unit tests for backend/utils/email_validation.py
Tests: blocklist, MX record checks, malformed emails.
dns.resolver is mocked — no real DNS queries.
"""

import pytest
from unittest.mock import patch, MagicMock

pytestmark = pytest.mark.unit


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _validate(email: str, dns_raises=None, dns_returns_mx=True):
    """Run validate_email_domain with optionally mocked dns.resolver."""
    import dns.resolver as resolver_mod

    def _fake_resolve(domain, record_type, lifetime=5):
        if dns_raises:
            raise dns_raises()
        if dns_returns_mx:
            mock_answer = MagicMock()
            return [mock_answer]
        raise resolver_mod.NoAnswer

    with patch("dns.resolver.resolve", side_effect=_fake_resolve):
        from backend.utils.email_validation import validate_email_domain
        return await validate_email_domain(email)


# ── Blocked domains ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_blocked_domain_mailinator_rejected():
    ok, msg = await _validate("user@mailinator.com")
    assert ok is False
    assert "real email" in msg.lower() or "disposable" in msg.lower()


@pytest.mark.asyncio
async def test_blocked_domain_example_com_rejected():
    ok, msg = await _validate("user@example.com")
    assert ok is False


@pytest.mark.asyncio
async def test_blocked_domain_test_com_rejected():
    ok, msg = await _validate("user@test.com")
    assert ok is False


@pytest.mark.asyncio
async def test_blocked_domain_yopmail_rejected():
    ok, msg = await _validate("user@yopmail.com")
    assert ok is False


@pytest.mark.asyncio
async def test_blocked_domain_guerrillamail_rejected():
    ok, msg = await _validate("user@guerrillamail.com")
    assert ok is False


@pytest.mark.asyncio
async def test_domain_case_insensitive_blocked():
    ok, msg = await _validate("user@MAILINATOR.COM")
    assert ok is False


# ── Valid domains ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_valid_domain_gmail_with_mx_accepted():
    ok, msg = await _validate("user@gmail.com", dns_returns_mx=True)
    assert ok is True
    assert msg == ""


@pytest.mark.asyncio
async def test_valid_domain_cognaratraining_accepted():
    ok, msg = await _validate("honey@cognaratraining.com", dns_returns_mx=True)
    assert ok is True


# ── Bad MX / DNS failures ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_no_mx_record_rejected():
    import dns.resolver
    ok, msg = await _validate("user@realdomain.com", dns_raises=dns.resolver.NoAnswer)
    assert ok is False
    assert "valid" in msg.lower() or "domain" in msg.lower()


@pytest.mark.asyncio
async def test_nxdomain_rejects_domain():
    import dns.resolver
    ok, msg = await _validate("user@nonexistent-xyz-abc.com", dns_raises=dns.resolver.NXDOMAIN)
    assert ok is False


@pytest.mark.asyncio
async def test_dns_timeout_rejects_domain():
    import dns.resolver
    ok, msg = await _validate("user@slow-domain.com", dns_raises=dns.resolver.Timeout)
    assert ok is False


# ── Malformed emails ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_malformed_email_no_at_rejected():
    ok, msg = await _validate("notanemailaddress")
    assert ok is False


@pytest.mark.asyncio
async def test_malformed_email_empty_rejected():
    ok, msg = await _validate("")
    assert ok is False

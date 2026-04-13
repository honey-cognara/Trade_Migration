"""Integration tests for GET /health"""
import pytest

pytestmark = pytest.mark.integration


async def test_health_returns_200(client):
    r = await client.get("/health")
    assert r.status_code == 200


async def test_health_response_has_status_ok(client):
    r = await client.get("/health")
    data = r.json()
    assert data["status"] == "ok"
    assert "service" in data

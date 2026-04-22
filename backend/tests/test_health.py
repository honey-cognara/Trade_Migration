"""Tests for the /health endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """GET /health → 200 with correct schema."""
    response = await client.get("/health")
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "tradie-migration-api"
    assert "version" in data


@pytest.mark.asyncio
async def test_unknown_route_returns_404(client: AsyncClient):
    """GET /this/does/not/exist → 404."""
    response = await client.get("/this/does/not/exist")
    assert response.status_code == 404

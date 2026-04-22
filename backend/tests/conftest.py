"""
Pytest configuration for the Tradie Migration App.

Uses pytest-asyncio in 'auto' mode (set in pytest.ini) so all async test
functions run automatically. The client fixture gives each test an isolated
httpx client routed through the FastAPI app.

DB tables are created lazily on first use via the FastAPI app's lifespan.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from backend.main import app


@pytest_asyncio.fixture()
async def client():
    """
    A fresh httpx AsyncClient per test backed by the real FastAPI app.
    The FastAPI app's startup (lifespan) handles DB initialisation.
    Each request gets its own DB session from the pool.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as c:
        yield c

"""
Root conftest.py — shared fixtures for all tests.

Strategy:
- Real PostgreSQL test DB (tradie_test) — catches real query bugs
- NullPool engine per test — eliminates asyncio event loop cross-contamination
- Per-test isolation via SAVEPOINT + rollback
- httpx AsyncClient with ASGITransport — no running server needed
- Mock external services globally: Gmail SMTP, OpenAI, dns.resolver
"""

import uuid
import asyncio
import pytest
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

# ── Load .env.test BEFORE any app imports ─────────────────────────────────────
_ENV_TEST = Path(__file__).parent / ".env.test"
load_dotenv(dotenv_path=_ENV_TEST, override=True)

# ── App imports (after env is loaded) ─────────────────────────────────────────
import os
import httpx
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from backend.main import app
from backend.db.setup import get_db
from backend.db.models.models import (
    Base, User, CandidateProfile, EmployerCompany,
    VisaApplication, ExpressionOfInterest, ApplicantDocument,
    TrainingProvider, TrainingCourse, ConsentRecord,
)
from backend.utils.auth import hash_password, create_access_token

DATABASE_URL = os.environ["DATABASE_URL"]

# ══════════════════════════════════════════════════════════════════════════════
# ONE-TIME SCHEMA SETUP (runs before any test, synchronously via asyncio.run)
# ══════════════════════════════════════════════════════════════════════════════

async def _init_schema():
    engine = create_async_engine(
        DATABASE_URL,
        poolclass=NullPool,
        connect_args={"server_settings": {"lock_timeout": "5000"}},  # 5s lock timeout
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for sql in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP",
            "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS work_types JSONB",
        ]:
            try:
                await conn.execute(text(sql))
            except Exception:
                pass
    await engine.dispose()


def pytest_configure(config):
    """Run schema setup once before collection."""
    load_dotenv(dotenv_path=_ENV_TEST, override=True)
    try:
        asyncio.run(_init_schema())
    except Exception as e:
        print(f"\n[conftest] Schema init warning: {e} — continuing with existing schema.")


# ══════════════════════════════════════════════════════════════════════════════
# FUNCTION-SCOPED: fresh NullPool engine + session per test
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
async def db_session():
    """
    Creates a fresh NullPool engine per test.  Opens a session with an outer
    transaction + SAVEPOINT so route handlers can call commit() freely (they
    only release the SAVEPOINT; the outer transaction is never committed).
    Everything is rolled back in teardown.
    NullPool + function loop scope prevents cross-loop connection reuse.
    """
    engine = create_async_engine(DATABASE_URL, poolclass=NullPool, echo=False)
    session = AsyncSession(engine, expire_on_commit=False)
    await session.begin()                            # outer transaction
    nested = await session.begin_nested()            # SAVEPOINT

    yield session

    # Teardown: rollback everything regardless of what route handlers committed
    try:
        await nested.rollback()
    except Exception:
        pass  # SAVEPOINT already released by a route handler commit — that's fine
    try:
        await session.rollback()                     # rollback outer transaction
    except Exception:
        pass
    await session.close()
    await engine.dispose()


# ══════════════════════════════════════════════════════════════════════════════
# FUNCTION-SCOPED: HTTP client with DB override
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
async def client(db_session, monkeypatch):
    """AsyncClient wired to the FastAPI app, sharing the test db_session.
    init_db() is skipped (schema already set up by pytest_configure).
    """
    from unittest.mock import AsyncMock
    import backend.main as _main_mod
    monkeypatch.setattr(_main_mod, "init_db", AsyncMock(return_value=None))

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c
    app.dependency_overrides.clear()


# ══════════════════════════════════════════════════════════════════════════════
# GLOBAL MOCKS — autouse so external services are NEVER called
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture(autouse=True)
async def disable_rate_limiter():
    """Disable slowapi rate limiting in-process for all tests.
    Patches BOTH the main.py limiter AND auth.py's own limiter instance.
    """
    from backend.main import limiter as main_limiter
    import backend.api.routes.auth as auth_module
    auth_limiter = auth_module.limiter

    # Disable both limiter instances
    for lim in (main_limiter, auth_limiter):
        lim.enabled = False
        lim._check_request_limit = lambda *args, **kwargs: None
    yield
    for lim in (main_limiter, auth_limiter):
        lim.enabled = True
        # Restore by deleting the instance override so class method is used again
        try:
            del lim.__dict__['_check_request_limit']
        except (KeyError, AttributeError):
            pass


@pytest.fixture(autouse=True)
def mock_smtp(monkeypatch):
    """Prevent real Gmail SMTP calls in all tests."""
    import smtplib
    from unittest.mock import MagicMock, AsyncMock
    mock = MagicMock()
    mock.__enter__ = MagicMock(return_value=mock)
    mock.__exit__ = MagicMock(return_value=False)
    monkeypatch.setattr(smtplib, "SMTP", MagicMock(return_value=mock))
    import backend.utils.email_service as es
    monkeypatch.setattr(es, "_dispatch", AsyncMock(return_value=True))


@pytest.fixture(autouse=True)
def mock_openai(monkeypatch):
    """Prevent real OpenAI API calls in all tests."""
    import backend.vector.embeddings as emb
    from unittest.mock import AsyncMock, MagicMock
    fake_client = MagicMock()
    fake_client.aembed_query = AsyncMock(return_value=[0.0] * 1536)
    fake_client.aembed_documents = AsyncMock(return_value=[[0.0] * 1536])
    monkeypatch.setattr(emb, "_embeddings_client", fake_client)
    monkeypatch.setattr(emb, "embed_text", AsyncMock(return_value=[0.0] * 1536))
    monkeypatch.setattr(emb, "embed_texts", AsyncMock(return_value=[[0.0] * 1536]))


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _make_token(user: User) -> str:
    return create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_user(db: AsyncSession, *, role: str, email: str,
                        status: str = "active", email_verified: bool = True) -> dict:
    user = User(
        id=uuid.uuid4(),
        cognito_sub=f"local-{uuid.uuid4()}",
        role=role,
        email=email,
        password_hash=hash_password("TestPass123"),
        status=status,
        email_verified=email_verified,
    )
    db.add(user)
    await db.flush()
    token = _make_token(user)
    return {"user": user, "token": token, "headers": _auth_headers(token)}


# ══════════════════════════════════════════════════════════════════════════════
# ROLE FIXTURES
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
async def candidate_user(db_session):
    return await _create_user(db_session, role="candidate",
                               email=f"candidate_{uuid.uuid4().hex[:8]}@test.com")


@pytest.fixture
async def employer_user(db_session):
    return await _create_user(db_session, role="employer",
                               email=f"employer_{uuid.uuid4().hex[:8]}@test.com")


@pytest.fixture
async def admin_user(db_session):
    return await _create_user(db_session, role="admin",
                               email=f"admin_{uuid.uuid4().hex[:8]}@test.com")


@pytest.fixture
async def company_admin_user(db_session):
    return await _create_user(db_session, role="company_admin",
                               email=f"cadmin_{uuid.uuid4().hex[:8]}@test.com")


@pytest.fixture
async def migration_agent_user(db_session):
    return await _create_user(db_session, role="migration_agent",
                               email=f"agent_{uuid.uuid4().hex[:8]}@test.com")


@pytest.fixture
async def training_provider_user(db_session):
    return await _create_user(db_session, role="training_provider",
                               email=f"provider_{uuid.uuid4().hex[:8]}@test.com")


@pytest.fixture
async def unverified_user(db_session):
    return await _create_user(
        db_session, role="candidate",
        email=f"unverified_{uuid.uuid4().hex[:8]}@test.com",
        status="pending", email_verified=False,
    )


@pytest.fixture
async def inactive_user(db_session):
    return await _create_user(
        db_session, role="candidate",
        email=f"inactive_{uuid.uuid4().hex[:8]}@test.com",
        status="inactive",
    )


# ══════════════════════════════════════════════════════════════════════════════
# PRE-BUILT DATA FIXTURES
# ══════════════════════════════════════════════════════════════════════════════

@pytest.fixture
async def candidate_profile(db_session, candidate_user):
    profile = CandidateProfile(
        id=uuid.uuid4(),
        user_id=candidate_user["user"].id,
        full_name="Test Candidate",
        nationality="Pakistani",
        country_of_residence="Pakistan",
        trade_category="electrician",
        is_electrical_worker=True,
        years_experience=5,
        languages=[{"name": "English", "level": "B2"}],
        work_types=["domestic", "industrial"],
        published=False,
    )
    db_session.add(profile)
    await db_session.flush()
    return profile


@pytest.fixture
async def published_profile(db_session, candidate_user):
    profile = CandidateProfile(
        id=uuid.uuid4(),
        user_id=candidate_user["user"].id,
        full_name="Published Candidate",
        trade_category="electrician",
        is_electrical_worker=True,
        years_experience=8,
        languages=[{"name": "English", "level": "C1"}],
        published=True,
    )
    db_session.add(profile)
    await db_session.flush()
    return profile


@pytest.fixture
async def approved_company(db_session, employer_user):
    company = EmployerCompany(
        id=uuid.uuid4(),
        owner_user_id=employer_user["user"].id,
        company_name=f"Test Co {uuid.uuid4().hex[:6]}",
        abn_or_identifier="12345678901",
        contact_name="John Smith",
        contact_email="john@testco.com",
        industry="Construction",
        verification_status="approved",
    )
    db_session.add(company)
    await db_session.flush()
    return company


@pytest.fixture
async def pending_company(db_session, employer_user):
    company = EmployerCompany(
        id=uuid.uuid4(),
        owner_user_id=employer_user["user"].id,
        company_name=f"Pending Co {uuid.uuid4().hex[:6]}",
        verification_status="pending",
    )
    db_session.add(company)
    await db_session.flush()
    return company


@pytest.fixture
async def visa_application(db_session, candidate_profile, company_admin_user):
    app_obj = VisaApplication(
        id=uuid.uuid4(),
        candidate_id=candidate_profile.id,
        status="draft",
        country_of_application="Australia",
        notes="Test visa application",
        created_by_user_id=company_admin_user["user"].id,
    )
    db_session.add(app_obj)
    await db_session.flush()
    return app_obj


@pytest.fixture
async def eoi_record(db_session, approved_company, candidate_profile):
    eoi = ExpressionOfInterest(
        id=uuid.uuid4(),
        employer_company_id=approved_company.id,
        candidate_id=candidate_profile.id,
        job_title="Electrician",
        message="We are interested in hiring you.",
        sponsorship_flag=True,
        status="unread",
    )
    db_session.add(eoi)
    await db_session.flush()
    return eoi


@pytest.fixture
async def training_provider_obj(db_session):
    provider = TrainingProvider(
        id=uuid.uuid4(),
        name=f"Test RTO {uuid.uuid4().hex[:6]}",
        contact_email="rto@test.com",
        website_url="https://testrto.com",
        country="Australia",
        status="active",
    )
    db_session.add(provider)
    await db_session.flush()
    return provider


@pytest.fixture
async def training_course(db_session, training_provider_obj):
    course = TrainingCourse(
        id=uuid.uuid4(),
        provider_id=training_provider_obj.id,
        title="Electrical Safety Fundamentals",
        description="Core safety training for electricians",
        trade_category="electrical",
        delivery_mode="online",
    )
    db_session.add(course)
    await db_session.flush()
    return course


@pytest.fixture
async def applicant_document(db_session, candidate_profile, candidate_user):
    doc = ApplicantDocument(
        id=uuid.uuid4(),
        candidate_id=candidate_profile.id,
        document_group="qualifications",
        document_type="trade_certificate",
        issuing_country="Pakistan",
        file_name="trade_cert.pdf",
        s3_key=f"{candidate_profile.id}/{uuid.uuid4().hex}_trade_cert.pdf",
        uploaded_by_user_id=candidate_user["user"].id,
    )
    db_session.add(doc)
    await db_session.flush()
    return doc

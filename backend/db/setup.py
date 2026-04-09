"""
Database connection, session factory, and engine setup.
Uses async SQLAlchemy for FastAPI compatibility.
"""

import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

_logger = logging.getLogger(__name__)

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:123@localhost:5433/tradie_migration"
)

# ── Engine ─────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# ── Session Factory ────────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Dependency for FastAPI routes ──────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """Yields an async database session for use in FastAPI dependency injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Creates all tables and enables pgvector extension.
    pgvector is optional - if not installed, RAG endpoints will not work
    but all other endpoints remain fully functional.
    """
    from backend.db.models.models import Base
    pgvector_ok = False

    # Attempt to load extension in one transaction
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            import os as _os
            _os.environ["PGVECTOR_PG_EXTENSION_OK"] = "true"
            _logger.info("pgvector extension enabled.")
            pgvector_ok = True
        except Exception as e:
            import os as _os
            _os.environ["PGVECTOR_PG_EXTENSION_OK"] = "false"
            _logger.warning("pgvector not available: %s", type(e).__name__)
            _logger.warning("RAG embedding endpoints disabled. All other endpoints work fine.")

    # Create tables in a fresh transaction to avoid Aborted state
    async with engine.begin() as conn:
        if pgvector_ok:
            try:
                await conn.run_sync(Base.metadata.create_all)
                _logger.info("All database tables created.")
            except Exception as e:
                _logger.error("Failed creating all tables: %s", e)
        else:
            _logger.info("Creating non-vector tables only...")
            from backend.db.models.models import (
                User, CandidateProfile, EmployerCompany, VisaApplication,
                ApplicantDocument, ExpressionOfInterest, ElectricalWorkerScore,
                ConsentRecord, TrainingProvider, TrainingCourse,
                CandidateRecommendedCourse, VisaCaseAssignment
            )
            safe_tables = [
                User.__table__, CandidateProfile.__table__,
                EmployerCompany.__table__, VisaApplication.__table__,
                ApplicantDocument.__table__, ExpressionOfInterest.__table__,
                ElectricalWorkerScore.__table__, ConsentRecord.__table__,
                TrainingProvider.__table__, TrainingCourse.__table__,
                CandidateRecommendedCourse.__table__, VisaCaseAssignment.__table__,
            ]
            for table in safe_tables:
                try:
                    await conn.run_sync(lambda c, t=table: t.create(c, checkfirst=True))
                except Exception as te:
                    _logger.warning("Skipped table '%s': %s", table.name, te)

    # Safe column / table migrations for new features
    async with engine.begin() as conn:
        for sql in [
            "ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS work_types JSONB",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(6)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP",
        ]:
            try:
                await conn.execute(text(sql))
            except Exception as e:
                _logger.warning("Migration skipped (%s): %s", sql[:60], e)

        from backend.db.models.models import CandidateEmployerConsent, VisaShareApproval
        for tbl in [CandidateEmployerConsent.__table__, VisaShareApproval.__table__]:
            try:
                await conn.run_sync(lambda c, t=tbl: t.create(c, checkfirst=True))
            except Exception as e:
                _logger.warning("Skipped table '%s': %s", tbl.name, e)

    _logger.info("Database initialisation complete.")

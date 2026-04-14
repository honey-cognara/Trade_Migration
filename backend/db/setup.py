"""
Database connection, session factory, and engine setup.
Uses async SQLAlchemy for FastAPI compatibility.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

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
            print("[OK] pgvector extension enabled.")
            pgvector_ok = True
        except Exception as e:
            import os as _os
            _os.environ["PGVECTOR_PG_EXTENSION_OK"] = "false"
            print(f"[WARN] pgvector not available: {type(e).__name__}")
            print("[WARN] RAG embedding endpoints disabled. All other endpoints work fine.")

    # Create tables in a fresh transaction to avoid Aborted state
    async with engine.begin() as conn:
        if pgvector_ok:
            try:
                await conn.run_sync(Base.metadata.create_all)
                print("[OK] All database tables created.")
            except Exception as e:
                print(f"[ERROR] Failed creating all tables: {e}")
        else:
            print("[INFO] Creating non-vector tables only...")
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
                    print(f"[WARN] Skipped table '{table.name}': {te}")

    # ── Add new columns if they don't exist (safe for existing DBs) ──────────
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP",
        # Update existing active users so they are not locked out
        "UPDATE users SET email_verified = TRUE WHERE status = 'active' AND email_verified IS NULL",
        "UPDATE users SET email_verified = TRUE WHERE status = 'active' AND email_verified = FALSE",
    ]
    async with engine.begin() as conn:
        for sql in migrations:
            try:
                await conn.execute(text(sql))
            except Exception as me:
                print(f"[WARN] Migration skipped: {me}")

    print("[OK] Database initialisation complete.")

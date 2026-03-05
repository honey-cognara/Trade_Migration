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


# ── Init DB (create tables + enable pgvector) ──────────────────────────────────
async def init_db():
    """
    Creates all tables and enables pgvector extension.
    pgvector is optional - if not installed, RAG endpoints will not work
    but all other endpoints remain fully functional.
    """
    from backend.db.models.models import Base

    async with engine.begin() as conn:
        # Try to enable pgvector - warn but do not crash if not installed
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            import os as _os
            _os.environ["PGVECTOR_PG_EXTENSION_OK"] = "true"
            print("[OK] pgvector extension enabled.")
        except Exception as e:
            import os as _os
            _os.environ["PGVECTOR_PG_EXTENSION_OK"] = "false"
            print(f"[WARN] pgvector not available: {type(e).__name__}")
            print("[WARN] RAG embedding endpoints disabled. All other endpoints work fine.")

        # Create all tables - skip TextChunk (vector column) if pgvector missing
        try:
            await conn.run_sync(Base.metadata.create_all)
            print("[OK] All database tables created.")
        except Exception as e:
            print(f"[WARN] Some tables could not be created (likely missing pgvector): {e}")
            print("[INFO] Creating non-vector tables only...")
            from backend.db.models.models import (
                User, CandidateProfile, EmployerCompany, VisaApplication,
                ApplicantDocument, ExpressionOfInterest, ElectricalWorkerScore,
                ConsentRecord, TrainingProvider, TrainingCourse,
                CandidateRecommendedCourse
            )
            safe_tables = [
                User.__table__, CandidateProfile.__table__,
                EmployerCompany.__table__, VisaApplication.__table__,
                ApplicantDocument.__table__, ExpressionOfInterest.__table__,
                ElectricalWorkerScore.__table__, ConsentRecord.__table__,
                TrainingProvider.__table__, TrainingCourse.__table__,
                CandidateRecommendedCourse.__table__,
            ]
            for table in safe_tables:
                try:
                    await conn.run_sync(lambda c, t=table: t.create(c, checkfirst=True))
                except Exception as te:
                    print(f"[WARN] Skipped table '{table.name}': {te}")

    print("[OK] Database initialisation complete.")

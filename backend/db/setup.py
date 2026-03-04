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
    "postgresql+asyncpg://postgres:tradie123@localhost:5432/tradie_migration"
)
# ── Engine ─────────────────────────────────────────────────────────────────────
engine = create_async_engine(
    DATABASE_URL,
    echo=True,          # Set False in production
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
    Call once on startup (or use Alembic migrations in production).
    """
    from backend.db.models.models import Base

    async with engine.begin() as conn:
        # Enable pgvector extension first
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create all tables from ORM models
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created and pgvector enabled.")

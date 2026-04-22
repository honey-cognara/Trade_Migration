import asyncio
from logging.config import fileConfig
import os

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool

from alembic import context
from dotenv import load_dotenv

load_dotenv()

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your models here
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.db.models.models import Base
target_metadata = Base.metadata

def get_url():
    # Use the local docker host manually to ensure migrations always run correctly locally
    # It avoids .env mismatch issues
    
    # Check if a specific url is forced for testing (like we do in the pytest suite later)
    url = os.getenv("TEST_DATABASE_URL")
    if url: return url
    
    return os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:123@localhost:5432/tradie_migration")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    connectable = create_async_engine(
        get_url(),
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

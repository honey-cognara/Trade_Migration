"""
Tradie Migration App – FastAPI Entry Point
Registers all routers, configures CORS, and initialises the database on startup.
"""

import os as _os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

from backend.db.setup import init_db
from backend.api.routes import (
    auth,
    dashboard,
    admin,
    candidates,
    employers,
    visa_applications,
    eoi,
    electrical_scoring,
    training_providers,
    rag,
    documents,
    migration_agents,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks (DB init + uploads dir) then yield for request handling."""
    # Ensure the uploads directory exists on startup
    from backend.utils.file_storage import UPLOADS_BASE
    _os.makedirs(UPLOADS_BASE, exist_ok=True)
    await init_db()
    yield


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Tradie Migration App API",
    description=(
        "Prototype API for the Tradie Migration App. "
        "Supports candidate onboarding, employer search, EOI submission, "
        "visa case management, electrical worker scoring, and RAG Q&A."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
_raw_origins = _os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
_ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,               prefix="/auth",      tags=["Authentication"])
app.include_router(dashboard.router,          prefix="/dashboard", tags=["Dashboard"])
app.include_router(admin.router,              prefix="/admin",     tags=["Admin"])
app.include_router(candidates.router,         prefix="/candidates",tags=["Candidates"])
app.include_router(employers.router,          prefix="/employers", tags=["Employers"])
app.include_router(visa_applications.router,  prefix="/visa",      tags=["Visa Applications"])
app.include_router(eoi.router,                prefix="/eoi",       tags=["Expressions of Interest"])
app.include_router(electrical_scoring.router, prefix="/scoring",   tags=["Electrical Scoring"])
app.include_router(training_providers.router, prefix="/training",  tags=["Training Providers"])
app.include_router(rag.router,                prefix="/rag",       tags=["RAG / AI Assistant"])
app.include_router(documents.router,          prefix="/documents", tags=["Document Management"])
app.include_router(migration_agents.router,   prefix="/agents",    tags=["Migration Agents"])


# ── Static file serving for uploads ───────────────────────────────────────────
# Documents are downloaded through the authenticated /documents/download/{id}
# endpoint.  The uploads directory is NOT exposed directly here to prevent
# unauthenticated access to private files.

# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Quick liveness probe."""
    return {"status": "ok", "service": "tradie-migration-api", "version": "0.1.0"}

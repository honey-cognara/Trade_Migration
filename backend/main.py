"""
Tradie Migration App – FastAPI Entry Point
Registers all routers, configures CORS, and initialises the database on startup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.database import init_db
from backend.routers import (
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
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup tasks (DB init) then yield for request handling."""
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

# ── CORS ──────────────────────────────────────────────────────────────────────
# Permissive for prototype; tighten for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Quick liveness probe."""
    return {"status": "ok", "service": "tradie-migration-api", "version": "0.1.0"}

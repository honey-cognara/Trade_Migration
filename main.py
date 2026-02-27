"""
Tradie Migration App – FastAPI Backend Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.database import init_db
from backend.routers import (
    auth, candidates, employers, admin,
    visa_applications, eoi, electrical_scoring,
    training_providers, rag, dashboard
)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run DB init on startup."""
    await init_db()
    yield
    print("🛑 Shutting down...")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Tradie Migration App API",
    version="0.1.0-prototype",
    description="MVP backend for overseas tradesperson migration matching platform.",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router,               prefix="/api/v1/auth",              tags=["Auth"])
app.include_router(candidates.router,         prefix="/api/v1/candidates",        tags=["Candidates"])
app.include_router(employers.router,          prefix="/api/v1/employers",         tags=["Employers"])
app.include_router(admin.router,              prefix="/api/v1/admin",             tags=["Admin"])
app.include_router(visa_applications.router,  prefix="/api/v1/visa-applications", tags=["Visa Applications"])
app.include_router(eoi.router,                prefix="/api/v1/eoi",               tags=["Expressions of Interest"])
app.include_router(electrical_scoring.router, prefix="/api/v1/scoring",           tags=["Electrical Scoring"])
app.include_router(training_providers.router, prefix="/api/v1/training",          tags=["Training Providers"])
app.include_router(rag.router,                prefix="/api/v1/rag",               tags=["RAG Assistant"])
app.include_router(dashboard.router,          prefix="/api/v1/dashboard",         tags=["Dashboard"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": "Tradie Migration App", "version": "0.1.0-prototype"}

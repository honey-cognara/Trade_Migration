"""
Tradie Migration App – FastAPI Entry Point
Registers all routers, configures CORS, and initialises the database on startup.
"""

import os as _os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

from backend.db.setup import init_db
from backend.api.routes import (
    auth,
    oauth,
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
    docs_url=None,   # disable default /docs — we serve a custom one below
    redoc_url=None,  # disable default /redoc
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
app.include_router(oauth.router,              prefix="/auth",      tags=["Social Login"])
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


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """Quick liveness probe."""
    return {"status": "ok", "service": "tradie-migration-api", "version": "0.1.0"}


# ── Custom Role-Aware Swagger UI ───────────────────────────────────────────────
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    """
    Role-aware Swagger UI. After authenticating with a JWT token,
    only the endpoints relevant to your role are displayed.
    """
    html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tradie Migration API – Role-Aware Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    /* ── Global reset ── */
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; background: #0f172a; font-family: 'Inter', sans-serif; }
    body { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }

    /* ── Role banner ── */
    #role-banner {
      position: sticky; top: 0; z-index: 9999;
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 24px;
      background: #1e293b; border-bottom: 2px solid #334155;
      font-size: 14px; color: #94a3b8;
    }
    #role-banner .logo { font-weight: 700; font-size: 16px; color: #38bdf8; }
    #role-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 5px 14px; border-radius: 999px;
      font-weight: 600; font-size: 13px;
      background: #0f172a; border: 1px solid #475569;
    }
    #role-badge .dot { width: 8px; height: 8px; border-radius: 50%; background: #64748b; }
    #role-badge.candidate  { border-color: #22c55e; color: #4ade80; }
    #role-badge.candidate .dot  { background: #22c55e; }
    #role-badge.employer   { border-color: #3b82f6; color: #60a5fa; }
    #role-badge.employer .dot   { background: #3b82f6; }
    #role-badge.admin      { border-color: #f59e0b; color: #fbbf24; }
    #role-badge.admin .dot { background: #f59e0b; }
    #role-badge.company_admin { border-color: #8b5cf6; color: #a78bfa; }
    #role-badge.company_admin .dot { background: #8b5cf6; }
    #role-badge.migration_agent { border-color: #06b6d4; color: #22d3ee; }
    #role-badge.migration_agent .dot { background: #06b6d4; }
    #role-badge.training_provider { border-color: #ec4899; color: #f472b6; }
    #role-badge.training_provider .dot { background: #ec4899; }

    /* ── Dashboard panel ── */
    #dashboard-panel {
      display: none;
      margin: 16px 24px;
      background: #1e293b; border: 1px solid #334155; border-radius: 10px;
      overflow: hidden;
    }
    #dashboard-panel.visible { display: block; }
    #dashboard-title {
      padding: 12px 18px; font-weight: 700; font-size: 15px;
      background: #0f172a; border-bottom: 1px solid #334155; color: #38bdf8;
    }
    #dashboard-body { padding: 16px 18px; }
    #dashboard-body pre {
      margin: 0; color: #94a3b8; font-size: 12px;
      white-space: pre-wrap; word-break: break-word;
      max-height: 300px; overflow-y: auto;
    }
    .dash-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px; margin-bottom: 14px;
    }
    .dash-card {
      background: #0f172a; border: 1px solid #334155; border-radius: 8px;
      padding: 12px 16px; text-align: center;
    }
    .dash-card .value { font-size: 26px; font-weight: 700; color: #38bdf8; }
    .dash-card .label { font-size: 11px; color: #64748b; margin-top: 2px; text-transform: uppercase; }
    .quick-actions { margin-top: 10px; }
    .quick-actions h4 { font-size: 12px; color: #64748b; text-transform: uppercase; margin: 0 0 8px; }
    .qa-item {
      display: inline-flex; align-items: center; gap: 6px;
      background: #0f172a; border: 1px solid #334155; border-radius: 6px;
      padding: 4px 10px; margin: 3px 3px 3px 0; font-size: 12px; color: #94a3b8;
    }
    .qa-item code { color: #38bdf8; font-size: 11px; }

    /* ── Section visibility ── */
    .swagger-ui .opblock-tag-section { transition: opacity 0.2s; }
    .swagger-ui .opblock-tag-section.role-hidden {
      display: none !important;
    }

    /* ── Swagger UI colour overrides ── */
    #swagger-ui { flex: 1; }
    .swagger-ui { background: #0f172a; }
    .swagger-ui .info .title { color: #38bdf8; }
    .swagger-ui .scheme-container { background: #1e293b; padding: 12px 20px; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>

<!-- Role Banner -->
<div id="role-banner">
  <div class="logo">⚡ Tradie Migration API</div>
  <div style="display:flex; align-items:center; gap:12px;">
    <span id="filter-hint" style="font-size:12px; color:#475569;">
      🔒 Authorize with a JWT token to see your role dashboard
    </span>
    <span id="role-badge">
      <span class="dot"></span>
      <span id="role-text">Not Authenticated</span>
    </span>
    <button onclick="resetFilter()" style="
      background:#334155; border:none; color:#94a3b8; padding:5px 12px;
      border-radius:6px; cursor:pointer; font-size:12px;">
      Show All
    </button>
  </div>
</div>

<!-- Dashboard Panel -->
<div id="dashboard-panel">
  <div id="dashboard-title">📊 My Dashboard</div>
  <div id="dashboard-body">
    <div id="dash-grid" class="dash-grid"></div>
    <div id="dash-welcome" style="font-size:13px; color:#64748b; margin-bottom:10px;"></div>
    <div id="dash-actions" class="quick-actions"></div>
  </div>
</div>

<!-- Swagger UI container -->
<div id="swagger-ui"></div>

<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
<script>
// ── Role → allowed Swagger section tags ───────────────────────────────────────
const ROLE_TAGS = {
  candidate: [
    'Authentication',
    'Candidates',
    'Expressions of Interest',
    'Document Management',
    'Dashboard',    // /dashboard/my
  ],
  employer: [
    'Authentication',
    'Employers',
    'Expressions of Interest',
    'Dashboard',    // /dashboard/my
  ],
  company_admin: [
    'Authentication',
    'Dashboard',
    'Employers',
    'Expressions of Interest',
    'Admin',
  ],
  admin: null,  // null = show everything
  migration_agent: [
    'Authentication',
    'Dashboard',
    'Migration Agents',
    'Visa Applications',
    'Electrical Scoring',
    'RAG / AI Assistant',
    'Candidates',
    'Document Management',
  ],
  training_provider: [
    'Authentication',
    'Training Providers',
    'Dashboard',    // /dashboard/my
  ],
};

// ── Role colours for badge ─────────────────────────────────────────────────────
const ROLE_LABELS = {
  candidate:        '👷 Candidate',
  employer:         '🏢 Employer',
  admin:            '🔑 Admin',
  company_admin:    '🏭 Company Admin',
  migration_agent:  '✈️ Migration Agent',
  training_provider:'📚 Training Provider',
};

// ── Decode JWT payload (no verification – display only) ───────────────────────
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch { return null; }
}

// ── Apply role filter to Swagger UI sections ──────────────────────────────────
function applyRoleFilter(role) {
  const allowed = ROLE_TAGS[role];
  const sections = document.querySelectorAll('.opblock-tag-section');
  sections.forEach(section => {
    if (!allowed) {
      section.classList.remove('role-hidden');
      return;
    }
    const tagEl = section.querySelector('[data-tag]');
    const tag = tagEl ? tagEl.getAttribute('data-tag') : '';
    if (allowed.some(a => tag.toLowerCase().includes(a.toLowerCase()))) {
      section.classList.remove('role-hidden');
    } else {
      section.classList.add('role-hidden');
    }
  });

  // Update badge
  const badge = document.getElementById('role-badge');
  const roleText = document.getElementById('role-text');
  const hint = document.getElementById('filter-hint');
  badge.className = 'role-badge ' + (role || '');
  roleText.textContent = ROLE_LABELS[role] || role;
  hint.textContent = allowed
    ? `Showing ${allowed.length} sections for your role`
    : 'Admin: All sections visible';
}

function resetFilter() {
  document.querySelectorAll('.opblock-tag-section').forEach(s => s.classList.remove('role-hidden'));
  const hint = document.getElementById('filter-hint');
  hint.textContent = 'Showing all sections';
}

// ── Fetch & render /dashboard/my ──────────────────────────────────────────────
async function loadDashboard(token) {
  try {
    const res = await fetch('/dashboard/my', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    const data = await res.json();

    const panel = document.getElementById('dashboard-panel');
    const grid = document.getElementById('dash-grid');
    const welcome = document.getElementById('dash-welcome');
    const actions = document.getElementById('dash-actions');

    panel.classList.add('visible');
    welcome.textContent = data.welcome || '';

    // Build stat cards from numeric values in the response
    grid.innerHTML = '';
    function addCards(obj, prefix) {
      if (!obj || typeof obj !== 'object') return;
      Object.entries(obj).forEach(([k, v]) => {
        if (typeof v === 'number') {
          grid.innerHTML += `
            <div class="dash-card">
              <div class="value">${v}</div>
              <div class="label">${(prefix ? prefix + ' ' : '') + k.replace(/_/g,' ')}</div>
            </div>`;
        } else if (v && typeof v === 'object' && !Array.isArray(v)) {
          addCards(v, k.replace(/_/g,' '));
        }
      });
    }
    addCards(data);

    // Quick actions
    if (data.quick_actions && data.quick_actions.length) {
      actions.innerHTML = '<h4>Quick Actions</h4>';
      data.quick_actions.forEach(a => {
        actions.innerHTML += `
          <span class="qa-item">
            ${a.label} <code>${a.endpoint}</code>
          </span>`;
      });
    }
  } catch (e) {
    console.warn('Dashboard load failed:', e);
  }
}

// ── Watch for token in Swagger UI authorisation ───────────────────────────────
let _lastToken = null;

function checkForToken() {
  // Swagger UI stores the token in the input inside the authorize modal
  // and also internally. We check localStorage and the SwaggerUI auth state.
  let token = null;

  // Check localStorage (swagger-ui stores it here)
  try {
    const raw = localStorage.getItem('authorized');
    if (raw) {
      const parsed = JSON.parse(raw);
      const entry = parsed && (parsed.BearerAuth || parsed.bearerAuth || Object.values(parsed)[0]);
      if (entry && entry.value) token = entry.value;
    }
  } catch {}

  // Also check the visible authorize button value via SwaggerUI object
  if (!token && window._swaggerUI) {
    try {
      const auth = window._swaggerUI.authSelectors.authorized();
      const first = auth && auth.first();
      if (first) token = first.get('value');
    } catch {}
  }

  if (token && token !== _lastToken) {
    _lastToken = token;
    const payload = decodeJwt(token);
    const role = payload && (payload.role || payload.sub_role);
    if (role) {
      setTimeout(() => applyRoleFilter(role), 300); // wait for DOM
      loadDashboard(token);
    }
  }
}

// ── Init Swagger UI ───────────────────────────────────────────────────────────
window.onload = function () {
  const ui = SwaggerUIBundle({
    url: '/openapi.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'BaseLayout',
    deepLinking: true,
    persistAuthorization: true,
    onComplete: function () {
      // Start polling for token after UI is ready
      setInterval(checkForToken, 800);
    }
  });
  window._swaggerUI = ui;
};
</script>
</body>
</html>"""
    return HTMLResponse(content=html)


@app.get("/redoc", include_in_schema=False)
async def redoc():
    html = """<!DOCTYPE html>
<html>
<head>
  <title>Tradie Migration API – ReDoc</title>
  <meta charset="utf-8"/>
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet"/>
  <style>body { margin: 0; padding: 0; }</style>
</head>
<body>
  <redoc spec-url='/openapi.json'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js"></script>
</body>
</html>"""
    return HTMLResponse(content=html)

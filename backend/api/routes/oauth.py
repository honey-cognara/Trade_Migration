"""
OAuth2 Social Login — Google & LinkedIn (Authorization Code flow).

Flow:
  1. Frontend opens  GET /auth/google   or  GET /auth/linkedin
  2. Backend redirects user to provider's consent screen
  3. Provider redirects to  GET /auth/google/callback  or  GET /auth/linkedin/callback
  4. Backend exchanges code → access token → user profile
  5. Backend upserts User row, mints a JWT, and redirects browser to:
       {FRONTEND_URL}/oauth-callback?token=<JWT>&role=<role>&user_id=<id>

Environment variables required:
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
  LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
  OAUTH_REDIRECT_BASE   (e.g. http://localhost:8000)   — backend public URL
  FRONTEND_URL          (e.g. http://localhost:5173)   — React dev server
"""

import os
import uuid
import secrets
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from backend.db.setup import get_db
from backend.db.models.models import User, ConsentRecord
from backend.utils.auth import create_access_token

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

LINKEDIN_CLIENT_ID     = os.getenv("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")

# Where OAuth providers send the code back to (this backend)
OAUTH_REDIRECT_BASE = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8000")

# Where the frontend lives (to redirect after login)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

GOOGLE_REDIRECT_URI   = f"{OAUTH_REDIRECT_BASE}/auth/google/callback"
LINKEDIN_REDIRECT_URI = f"{OAUTH_REDIRECT_BASE}/auth/linkedin/callback"

# Simple in-process state store (prevents CSRF; fine for single-process MVP)
_STATE_STORE: dict[str, dict] = {}


def _new_state(role: str = "candidate") -> str:
    state = secrets.token_urlsafe(24)
    _STATE_STORE[state] = {"role": role}
    return state


def _consume_state(state: str) -> dict | None:
    return _STATE_STORE.pop(state, None)


# ══════════════════════════════════════════════════════════════════════════════
# GOOGLE
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/google")
async def google_login(role: str = Query("candidate")):
    """Redirect browser to Google's OAuth2 consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env")

    state = _new_state(role)
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "state":         state,
        "access_type":   "online",
        "prompt":        "select_account",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(
    code:  str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Exchange auth code for tokens, fetch profile, upsert user, return JWT."""
    meta = _consume_state(state)
    if meta is None:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=invalid_state")

    role = meta.get("role", "candidate")

    # 1. Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri":  GOOGLE_REDIRECT_URI,
                "grant_type":    "authorization_code",
            },
        )
    if token_res.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_token_failed")

    access_token = token_res.json().get("access_token")

    # 2. Fetch user profile
    async with httpx.AsyncClient() as client:
        profile_res = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if profile_res.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_profile_failed")

    profile = profile_res.json()
    email      = profile.get("email", "").lower()
    name       = profile.get("name", "")
    google_sub = profile.get("sub", "")

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    # 3. Upsert user
    user = await _upsert_oauth_user(db, email=email, name=name,
                                    provider="google", provider_id=google_sub,
                                    role=role)

    # 4. Mint JWT and redirect frontend
    jwt = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    params = urlencode({"token": jwt, "role": user.role, "user_id": str(user.id)})
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?{params}")


# ══════════════════════════════════════════════════════════════════════════════
# LINKEDIN
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/linkedin")
async def linkedin_login(role: str = Query("candidate")):
    """Redirect browser to LinkedIn's OAuth2 consent screen."""
    if not LINKEDIN_CLIENT_ID:
        raise HTTPException(status_code=501, detail="LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env")

    state = _new_state(role)
    params = {
        "response_type": "code",
        "client_id":     LINKEDIN_CLIENT_ID,
        "redirect_uri":  LINKEDIN_REDIRECT_URI,
        "state":         state,
        "scope":         "openid profile email",
    }
    url = "https://www.linkedin.com/oauth/v2/authorization?" + urlencode(params)
    return RedirectResponse(url)


@router.get("/linkedin/callback")
async def linkedin_callback(
    code:  str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Exchange auth code for tokens, fetch profile, upsert user, return JWT."""
    meta = _consume_state(state)
    if meta is None:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=invalid_state")

    role = meta.get("role", "candidate")

    # 1. Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  LINKEDIN_REDIRECT_URI,
                "client_id":     LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if token_res.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=linkedin_token_failed")

    access_token = token_res.json().get("access_token")

    # 2. Fetch user profile via OpenID Connect userinfo endpoint
    async with httpx.AsyncClient() as client:
        profile_res = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if profile_res.status_code != 200:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=linkedin_profile_failed")

    profile = profile_res.json()
    email        = profile.get("email", "").lower()
    given        = profile.get("given_name", "")
    family       = profile.get("family_name", "")
    name         = f"{given} {family}".strip() or profile.get("name", "")
    linkedin_sub = profile.get("sub", "")

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    # 3. Upsert user
    user = await _upsert_oauth_user(db, email=email, name=name,
                                    provider="linkedin", provider_id=linkedin_sub,
                                    role=role)

    # 4. Mint JWT and redirect frontend
    jwt = create_access_token({"user_id": str(user.id), "email": user.email, "role": user.role})
    params = urlencode({"token": jwt, "role": user.role, "user_id": str(user.id)})
    return RedirectResponse(f"{FRONTEND_URL}/oauth-callback?{params}")


# ══════════════════════════════════════════════════════════════════════════════
# SHARED UPSERT HELPER
# ══════════════════════════════════════════════════════════════════════════════

async def _upsert_oauth_user(
    db: AsyncSession,
    *,
    email: str,
    name: str,
    provider: str,
    provider_id: str,
    role: str,
) -> User:
    """Find existing user by email or create a new one for OAuth sign-in."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Existing user — activate if still pending (edge case: signed up via email but never verified)
        if user.status == "pending":
            user.email_verified = True
            user.status = "active"
            await db.commit()
        return user

    # New user — create account, auto-verified via OAuth
    cognito_sub = f"{provider}-{provider_id or uuid.uuid4().hex}"
    new_user = User(
        id=uuid.uuid4(),
        cognito_sub=cognito_sub,
        role=role,
        email=email,
        password_hash=None,       # no password for OAuth users
        status="active",
        email_verified=True,      # provider already verified the email
    )
    db.add(new_user)
    await db.flush()

    # Consent record for new users
    consent = ConsentRecord(
        id=uuid.uuid4(),
        user_id=new_user.id,
        consent_type="registration",
        consent_version="2025-v1",
    )
    db.add(consent)

    # Auto-create stub candidate profile if role is candidate
    if role == "candidate" and name:
        from backend.db.models.models import CandidateProfile
        stub = CandidateProfile(
            id=uuid.uuid4(),
            user_id=new_user.id,
            full_name=name,
        )
        db.add(stub)

    await db.commit()
    await db.refresh(new_user)
    return new_user

"""
Comprehensive endpoint test suite — Tradie Migration App.
Tests all endpoints against business logic requirements.

Usage:
    python test_endpoints.py

Prerequisites:
    - pip install requests reportlab
    - Server: uvicorn backend.main:app --reload --port 8000
    - Docker pgvector container running on port 5432
"""

import sys
import io
import uuid
import requests

sys.stdout.reconfigure(encoding="utf-8")

BASE = "http://localhost:8000"
passed = 0
failed = 0
_failures = []


def check(name: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  [PASS] {name}")
    else:
        failed += 1
        _failures.append((name, detail))
        print(f"  [FAIL] {name}  |  {detail}")


def section(title: str):
    print(f"\n{'='*64}")
    print(f"  {title}")
    print(f"{'='*64}")


def tok(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(email: str, password: str) -> str:
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    return r.json().get("access_token", "") if r.ok else ""


# ══════════════════════════════════════════════════════════════════════════════
# SETUP
# ══════════════════════════════════════════════════════════════════════════════

uid = str(uuid.uuid4())[:8]
PASSWORD = "Test@1234"
USERS = {
    "candidate":        f"cand_{uid}@test.com",
    "employer":         f"emp_{uid}@test.com",
    "admin":            f"admin_{uid}@test.com",
    "migration_agent":  f"agent_{uid}@test.com",
    "company_admin":    f"cadmin_{uid}@test.com",
    "training_provider":f"prov_{uid}@test.com",
}

section("SETUP — Register & Login all roles")
for role, email in USERS.items():
    r = requests.post(f"{BASE}/auth/register", json={
        "name": f"Test {role.title()}", "email": email, "password": PASSWORD, "role": role,
    })
    check(f"Register {role}", r.status_code == 201, f"status={r.status_code} {r.text[:80]}")

TOKENS = {role: login(email, PASSWORD) for role, email in USERS.items()}
for role, t in TOKENS.items():
    check(f"Login {role}", bool(t), "empty token")


# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════

section("AUTH")

r = requests.get(f"{BASE}/auth/me", headers=tok(TOKENS["candidate"]))
check("GET /auth/me candidate", r.status_code == 200 and r.json().get("role") == "candidate")

r = requests.get(f"{BASE}/auth/me", headers=tok(TOKENS["admin"]))
check("GET /auth/me admin role=admin", r.status_code == 200 and r.json().get("role") == "admin")

r = requests.get(f"{BASE}/auth/me")
check("GET /auth/me no token -> 401", r.status_code == 401)

r = requests.post(f"{BASE}/auth/logout", headers=tok(TOKENS["candidate"]))
check("POST /auth/logout", r.status_code == 200)

r = requests.post(f"{BASE}/auth/register", json={
    "name": "Test Candidate", "email": USERS["candidate"], "password": PASSWORD, "role": "candidate",
})
check("Register duplicate email -> 400", r.status_code == 400)

r = requests.post(f"{BASE}/auth/register", json={
    "name": "Test Weak", "email": f"weak_{uid}@test.com", "password": "abc", "role": "candidate",
})
check("Register weak password -> 400/422", r.status_code in (400, 422))


# ══════════════════════════════════════════════════════════════════════════════
# CANDIDATE PROFILE
# ══════════════════════════════════════════════════════════════════════════════

section("CANDIDATE PROFILE")

# Registration auto-creates a stub profile — delete it so POST creates a full one
_stub = requests.get(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]))
if _stub.ok:
    requests.delete(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]))

r = requests.post(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]), json={
    "full_name": "Ali Hassan",
    "nationality": "Pakistani",
    "country_of_residence": "Pakistan",
    "trade_category": "Electrician",
    "is_electrical_worker": True,
    "years_experience": 8,
    "languages": [{"name": "English", "level": "B2"}, {"name": "Urdu", "level": "C2"}],
    "work_types": ["domestic", "industrial", "commercial"],
    "profile_summary": "Experienced Pakistani electrician seeking work in Australia.",
})
check("POST /candidates/profile", r.status_code == 201, r.text[:120])
CAND_PROFILE_ID = r.json().get("id", "") if r.ok else ""

check("Profile has work_types in response", r.ok and r.json().get("work_types") == ["domestic", "industrial", "commercial"])

r = requests.post(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]), json={
    "full_name": "Ali Hassan", "trade_category": "Electrician"
})
check("POST /candidates/profile duplicate -> 400", r.status_code == 400)

r = requests.get(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]))
check("GET /candidates/profile", r.status_code == 200 and r.json()["full_name"] == "Ali Hassan")
check("Profile response includes work_types", "work_types" in r.json())

r = requests.put(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]), json={
    "work_types": ["domestic", "powerlines"],
    "years_experience": 10,
})
check("PUT /candidates/profile update work_types", r.status_code == 200)
check("work_types updated correctly", r.ok and r.json().get("work_types") == ["domestic", "powerlines"])

r = requests.put(f"{BASE}/candidates/profile", headers=tok(TOKENS["candidate"]), json={
    "work_types": ["domestic", "INVALID"],
})
check("PUT /candidates/profile invalid work_type -> 422", r.status_code == 422)

r = requests.get(f"{BASE}/candidates/profile")
check("GET /candidates/profile no auth -> 401", r.status_code == 401)

r = requests.get(f"{BASE}/candidates/profile", headers=tok(TOKENS["employer"]))
check("GET /candidates/profile employer role -> 403", r.status_code == 403)

r = requests.post(f"{BASE}/candidates/profile/publish", headers=tok(TOKENS["candidate"]))
check("POST /candidates/profile/publish", r.status_code == 200 and r.json()["published"] == True)

r = requests.post(f"{BASE}/candidates/profile/unpublish", headers=tok(TOKENS["candidate"]))
check("POST /candidates/profile/unpublish", r.status_code == 200 and r.json()["published"] == False)

requests.post(f"{BASE}/candidates/profile/publish", headers=tok(TOKENS["candidate"]))


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYER COMPANY
# ══════════════════════════════════════════════════════════════════════════════

section("EMPLOYER COMPANY")

r = requests.post(f"{BASE}/employers/company", headers=tok(TOKENS["employer"]), json={
    "company_name": "Volt Masters Pty Ltd",
    "abn_or_identifier": "12345678901",
    "contact_name": "Jane Smith",
    "contact_email": "jane@voltmasters.com.au",
    "industry": "Electrical Services",
})
check("POST /employers/company", r.status_code == 201, r.text[:120])
EMP_COMPANY_ID = r.json().get("id", "") if r.ok else ""

r = requests.post(f"{BASE}/employers/company", headers=tok(TOKENS["employer"]), json={
    "company_name": "Another Company"
})
check("POST /employers/company duplicate -> 400", r.status_code == 400)

r = requests.get(f"{BASE}/employers/company", headers=tok(TOKENS["employer"]))
check("GET /employers/company", r.status_code == 200 and r.json()["company_name"] == "Volt Masters Pty Ltd")

r = requests.put(f"{BASE}/employers/company", headers=tok(TOKENS["employer"]), json={
    "company_name": "Volt Masters Updated",
    "industry": "Electrical & Solar",
    "contact_name": "Jane Smith",
    "contact_email": "jane@voltmasters.com.au",
})
check("PUT /employers/company", r.status_code == 200)

r = requests.get(f"{BASE}/employers/candidates", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates pending company -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — EMPLOYER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

section("ADMIN — Employer Management")

r = requests.get(f"{BASE}/admin/employers/pending", headers=tok(TOKENS["admin"]))
check("GET /admin/employers/pending", r.status_code == 200 and isinstance(r.json(), list))

r = requests.post(f"{BASE}/admin/employers/{EMP_COMPANY_ID}/verify",
    headers=tok(TOKENS["admin"]), json={"action": "approve"})
check("POST /admin/employers/verify approve", r.status_code == 200 and r.json()["verification_status"] == "approved")

r = requests.post(f"{BASE}/admin/employers/{EMP_COMPANY_ID}/verify",
    headers=tok(TOKENS["admin"]), json={"action": "invalid"})
check("POST /admin/employers/verify bad action -> 400", r.status_code == 400)

r = requests.get(f"{BASE}/admin/employers", headers=tok(TOKENS["admin"]))
check("GET /admin/employers", r.status_code == 200 and isinstance(r.json(), list))

r = requests.get(f"{BASE}/admin/employers?search=Volt", headers=tok(TOKENS["admin"]))
check("GET /admin/employers?search=Volt", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/employers?status=approved", headers=tok(TOKENS["admin"]))
check("GET /admin/employers?status=approved", r.status_code == 200)

r = requests.get(f"{BASE}/admin/employers?search=nonexistent_xyz", headers=tok(TOKENS["admin"]))
check("GET /admin/employers?search=nonexistent -> empty list", r.status_code == 200 and r.json() == [])

r = requests.get(f"{BASE}/admin/employers/{EMP_COMPANY_ID}", headers=tok(TOKENS["admin"]))
check("GET /admin/employers/{id}", r.status_code == 200)

r = requests.get(f"{BASE}/admin/employers", headers=tok(TOKENS["employer"]))
check("GET /admin/employers employer role -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — CANDIDATE CRM SEARCH
# ══════════════════════════════════════════════════════════════════════════════

section("ADMIN — Candidate CRM Search")

r = requests.get(f"{BASE}/admin/candidates", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates", r.status_code == 200 and isinstance(r.json(), list))

r = requests.get(f"{BASE}/admin/candidates?search=Ali", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates?search=Ali", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/candidates?trade_category=Electrician", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates?trade_category=Electrician", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/candidates?nationality=Pakistani", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates?nationality=Pakistani", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/candidates?published=true", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates?published=true", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/candidates?is_electrical_worker=true", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates?is_electrical_worker=true", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/candidates?search=xyznonexistent", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates?search=xyznonexistent -> empty", r.status_code == 200 and r.json() == [])

r = requests.get(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}", headers=tok(TOKENS["admin"]))
check("GET /admin/candidates/{id}", r.status_code == 200)
check("Admin candidate detail has work_types", r.ok and "work_types" in r.json())

r = requests.get(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}", headers=tok(TOKENS["migration_agent"]))
check("GET /admin/candidates/{id} migration_agent", r.status_code == 200)

r = requests.get(f"{BASE}/admin/candidates", headers=tok(TOKENS["employer"]))
check("GET /admin/candidates employer -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════════

section("ADMIN — User Management")

r = requests.get(f"{BASE}/admin/users", headers=tok(TOKENS["admin"]))
check("GET /admin/users", r.status_code == 200 and isinstance(r.json(), list))

r = requests.get(f"{BASE}/admin/users?role=candidate", headers=tok(TOKENS["admin"]))
check("GET /admin/users?role=candidate", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/users?email=test.com", headers=tok(TOKENS["admin"]))
check("GET /admin/users?email=test.com", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/admin/users?status=active", headers=tok(TOKENS["admin"]))
check("GET /admin/users?status=active", r.status_code == 200)

r = requests.get(f"{BASE}/admin/users?role=employer&status=active", headers=tok(TOKENS["admin"]))
check("GET /admin/users combined filters", r.status_code == 200)


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN — PDF EXPORT
# ══════════════════════════════════════════════════════════════════════════════

section("ADMIN — PDF Export")

r = requests.get(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}/export-pdf",
    headers=tok(TOKENS["admin"]))
check("GET /admin/candidates/{id}/export-pdf admin -> 200", r.status_code == 200)
check("PDF content-type is application/pdf", "application/pdf" in r.headers.get("content-type", ""))
check("PDF content-disposition attachment", "attachment" in r.headers.get("content-disposition", "").lower())
check("PDF size > 1KB", len(r.content) > 1024)

r = requests.get(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}/export-pdf",
    headers=tok(TOKENS["migration_agent"]))
check("GET /admin/candidates/{id}/export-pdf migration_agent -> 200", r.status_code == 200)

r = requests.get(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}/export-pdf",
    headers=tok(TOKENS["employer"]))
check("GET /admin/candidates/{id}/export-pdf employer -> 403", r.status_code == 403)

r = requests.get(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}/export-pdf",
    headers=tok(TOKENS["candidate"]))
check("GET /admin/candidates/{id}/export-pdf candidate -> 403", r.status_code == 403)

r = requests.get(f"{BASE}/admin/candidates/{str(uuid.uuid4())}/export-pdf",
    headers=tok(TOKENS["admin"]))
check("GET /admin/candidates/nonexistent/export-pdf -> 404", r.status_code == 404)

r = requests.get(f"{BASE}/admin/candidates/bad-uuid/export-pdf",
    headers=tok(TOKENS["admin"]))
check("GET /admin/candidates/bad-uuid/export-pdf -> 422", r.status_code == 422)


# ══════════════════════════════════════════════════════════════════════════════
# EMPLOYER SEARCH (after approval)
# ══════════════════════════════════════════════════════════════════════════════

section("EMPLOYER SEARCH")

r = requests.get(f"{BASE}/employers/candidates", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates approved", r.status_code == 200 and isinstance(r.json(), list))

r = requests.get(f"{BASE}/employers/candidates?trade_category=Electrician", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates?trade_category", r.status_code == 200)

r = requests.get(f"{BASE}/employers/candidates?work_type=domestic", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates?work_type=domestic", r.status_code == 200)

r = requests.get(f"{BASE}/employers/candidates?work_type=powerlines", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates?work_type=powerlines", r.status_code == 200)

r = requests.get(f"{BASE}/employers/candidates?min_years_experience=5", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates?min_years_experience=5", r.status_code == 200)

r = requests.get(f"{BASE}/employers/candidates?is_electrical_worker=true", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates?is_electrical_worker=true", r.status_code == 200)

# Search returns basic info only — full profile requires consent
if CAND_PROFILE_ID:
    search_result = requests.get(f"{BASE}/employers/candidates", headers=tok(TOKENS["employer"])).json()
    if search_result:
        check("Search results have work_types", "work_types" in search_result[0])
        check("Search results do NOT expose profile_summary (basic info only)",
              "profile_summary" not in search_result[0])

r = requests.get(f"{BASE}/employers/candidates/{CAND_PROFILE_ID}", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates/{id} no consent -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# CONSENT SYSTEM
# ══════════════════════════════════════════════════════════════════════════════

section("CANDIDATE EMPLOYER CONSENT")

r = requests.post(f"{BASE}/candidates/consent/employer/{EMP_COMPANY_ID}",
    headers=tok(TOKENS["candidate"]))
check("POST /candidates/consent/employer/{id} grant", r.status_code == 201, r.text[:120])
check("Consent response has employer_name", r.ok and "employer_name" in r.json())

r = requests.post(f"{BASE}/candidates/consent/employer/{EMP_COMPANY_ID}",
    headers=tok(TOKENS["candidate"]))
check("POST consent duplicate -> 400", r.status_code == 400)

r = requests.get(f"{BASE}/candidates/consent/employers", headers=tok(TOKENS["candidate"]))
_consents = r.json() if r.ok and isinstance(r.json(), list) else []
check("GET /candidates/consent/employers", r.status_code == 200 and len(_consents) >= 1)
check("Consent list has is_active=True", bool(_consents) and _consents[0]["is_active"] == True)

# Full profile now accessible
r = requests.get(f"{BASE}/employers/candidates/{CAND_PROFILE_ID}", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates/{id} after consent -> 200", r.status_code == 200)
check("Full profile has profile_summary", r.ok and "profile_summary" in r.json())
check("Full profile has work_types", r.ok and "work_types" in r.json())
check("Full profile has languages", r.ok and "languages" in r.json())

r = requests.post(f"{BASE}/candidates/consent/employer/not-a-uuid",
    headers=tok(TOKENS["candidate"]))
check("POST consent invalid UUID -> 422", r.status_code == 422)

r = requests.post(f"{BASE}/candidates/consent/employer/{str(uuid.uuid4())}",
    headers=tok(TOKENS["candidate"]))
check("POST consent nonexistent employer -> 404", r.status_code == 404)

r = requests.delete(f"{BASE}/candidates/consent/employer/{EMP_COMPANY_ID}",
    headers=tok(TOKENS["candidate"]))
check("DELETE /candidates/consent/employer/{id} revoke", r.status_code == 200)

r = requests.get(f"{BASE}/employers/candidates/{CAND_PROFILE_ID}", headers=tok(TOKENS["employer"]))
check("GET /employers/candidates/{id} after revoke -> 403", r.status_code == 403)

r = requests.delete(f"{BASE}/candidates/consent/employer/{EMP_COMPANY_ID}",
    headers=tok(TOKENS["candidate"]))
check("DELETE consent already revoked -> 404", r.status_code == 404)

# Re-grant for EOI tests
requests.post(f"{BASE}/candidates/consent/employer/{EMP_COMPANY_ID}", headers=tok(TOKENS["candidate"]))

# Wrong role
r = requests.post(f"{BASE}/candidates/consent/employer/{EMP_COMPANY_ID}",
    headers=tok(TOKENS["employer"]))
check("POST consent employer role -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# EOI
# ══════════════════════════════════════════════════════════════════════════════

section("EXPRESSIONS OF INTEREST")

r = requests.post(f"{BASE}/eoi/", headers=tok(TOKENS["employer"]), json={
    "candidate_id": CAND_PROFILE_ID,
    "job_title": "Senior Electrician — Solar Installation",
    "message": "We need an experienced electrician for solar projects in Sydney.",
    "sponsorship_flag": True,
})
check("POST /eoi/ submit", r.status_code == 201, r.text[:120])
EOI_ID = r.json().get("id", "") if r.ok else ""

r = requests.get(f"{BASE}/eoi/received", headers=tok(TOKENS["candidate"]))
check("GET /eoi/received", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/candidates/eois", headers=tok(TOKENS["candidate"]))
check("GET /candidates/eois", r.status_code == 200 and len(r.json()) >= 1)

r = requests.patch(f"{BASE}/eoi/{EOI_ID}/read", headers=tok(TOKENS["candidate"]))
check("PATCH /eoi/{id}/read", r.status_code == 200)

r = requests.get(f"{BASE}/eoi/{EOI_ID}", headers=tok(TOKENS["candidate"]))
check("GET /eoi/{id} candidate", r.status_code == 200)

r = requests.get(f"{BASE}/eoi/{EOI_ID}", headers=tok(TOKENS["employer"]))
check("GET /eoi/{id} employer", r.status_code == 200)

r = requests.get(f"{BASE}/eoi/{EOI_ID}", headers=tok(TOKENS["migration_agent"]))
check("GET /eoi/{id} non-participant -> 403", r.status_code == 403)

# Submit EOI to unpublished candidate (should fail)
requests.post(f"{BASE}/candidates/profile/unpublish", headers=tok(TOKENS["candidate"]))
r = requests.post(f"{BASE}/eoi/", headers=tok(TOKENS["employer"]), json={
    "candidate_id": CAND_PROFILE_ID, "job_title": "Test"
})
check("POST /eoi/ to unpublished candidate -> 404", r.status_code == 404)
requests.post(f"{BASE}/candidates/profile/publish", headers=tok(TOKENS["candidate"]))


# ══════════════════════════════════════════════════════════════════════════════
# VISA SHARE APPROVAL
# ══════════════════════════════════════════════════════════════════════════════

section("VISA SHARE APPROVAL")

r = requests.post(f"{BASE}/candidates/visa-share/{EOI_ID}/approve",
    headers=tok(TOKENS["candidate"]))
check("POST /candidates/visa-share/{eoi_id}/approve", r.status_code == 201, r.text[:120])
check("Approval response has employer_company_id", r.ok and "employer_company_id" in r.json())

r = requests.post(f"{BASE}/candidates/visa-share/{EOI_ID}/approve",
    headers=tok(TOKENS["candidate"]))
check("POST visa-share duplicate -> 400", r.status_code == 400)

r = requests.get(f"{BASE}/candidates/visa-shares", headers=tok(TOKENS["candidate"]))
_vshares = r.json() if r.ok and isinstance(r.json(), list) else []
check("GET /candidates/visa-shares", r.status_code == 200 and len(_vshares) >= 1)
check("Visa share has employer_name", bool(_vshares) and "employer_name" in _vshares[0])
check("Visa share is_active=True", bool(_vshares) and _vshares[0]["is_active"] == True)

r = requests.post(f"{BASE}/candidates/visa-share/{str(uuid.uuid4())}/approve",
    headers=tok(TOKENS["candidate"]))
check("POST visa-share nonexistent EOI -> 404", r.status_code == 404)

r = requests.post(f"{BASE}/candidates/visa-share/bad-uuid/approve",
    headers=tok(TOKENS["candidate"]))
check("POST visa-share invalid UUID -> 422", r.status_code == 422)

r = requests.post(f"{BASE}/candidates/visa-share/{EOI_ID}/revoke",
    headers=tok(TOKENS["candidate"]))
check("POST /candidates/visa-share/{id}/revoke", r.status_code == 200)

r = requests.get(f"{BASE}/candidates/visa-shares", headers=tok(TOKENS["candidate"]))
_vshares2 = r.json() if r.ok and isinstance(r.json(), list) else []
check("Visa share is_active=False after revoke", bool(_vshares2) and _vshares2[0]["is_active"] == False)

r = requests.post(f"{BASE}/candidates/visa-share/{EOI_ID}/revoke",
    headers=tok(TOKENS["candidate"]))
check("POST visa-share revoke already revoked -> 404", r.status_code == 404)

r = requests.post(f"{BASE}/candidates/visa-share/{EOI_ID}/approve",
    headers=tok(TOKENS["employer"]))
check("POST visa-share employer role -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# VISA APPLICATIONS
# ══════════════════════════════════════════════════════════════════════════════

section("VISA APPLICATIONS")

r = requests.post(f"{BASE}/visa/", headers=tok(TOKENS["company_admin"]), json={
    "candidate_id": CAND_PROFILE_ID,
    "employer_company_id": EMP_COMPANY_ID,
    "country_of_application": "Australia",
    "notes": "Initial visa application for skilled migration.",
})
check("POST /visa/ create", r.status_code == 201, r.text[:120])
VISA_ID = r.json().get("id", "") if r.ok else ""

r = requests.get(f"{BASE}/visa/", headers=tok(TOKENS["company_admin"]))
check("GET /visa/ list", r.status_code == 200 and isinstance(r.json(), list))

r = requests.get(f"{BASE}/visa/?status=draft", headers=tok(TOKENS["admin"]))
check("GET /visa/?status=draft", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/visa/?country_of_application=Australia", headers=tok(TOKENS["admin"]))
check("GET /visa/?country_of_application=Australia", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/visa/?candidate_id={CAND_PROFILE_ID}", headers=tok(TOKENS["admin"]))
check("GET /visa/?candidate_id filter", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/visa/?status=invalid", headers=tok(TOKENS["admin"]))
check("GET /visa/?status=invalid -> 400", r.status_code == 400)

r = requests.get(f"{BASE}/visa/?candidate_id=not-a-uuid", headers=tok(TOKENS["admin"]))
check("GET /visa/?candidate_id=not-a-uuid -> 422", r.status_code == 422)

r = requests.get(f"{BASE}/visa/{VISA_ID}", headers=tok(TOKENS["migration_agent"]))
check("GET /visa/{id}", r.status_code == 200)

r = requests.put(f"{BASE}/visa/{VISA_ID}/status", headers=tok(TOKENS["company_admin"]), json={
    "status": "submitted", "notes": "All documents submitted."
})
check("PUT /visa/{id}/status -> submitted", r.status_code == 200 and r.json()["status"] == "submitted")

r = requests.put(f"{BASE}/visa/{VISA_ID}/status", headers=tok(TOKENS["admin"]), json={"status": "under_review"})
check("PUT /visa/{id}/status -> under_review", r.status_code == 200)

r = requests.put(f"{BASE}/visa/{VISA_ID}/status", headers=tok(TOKENS["admin"]), json={"status": "BAD"})
check("PUT /visa/{id}/status invalid -> 400", r.status_code == 400)

r = requests.put(f"{BASE}/visa/{VISA_ID}", headers=tok(TOKENS["company_admin"]), json={
    "country_of_application": "Australia",
    "notes": "Updated notes after agent review.",
})
check("PUT /visa/{id} update fields", r.status_code == 200)

r = requests.get(f"{BASE}/visa/", headers=tok(TOKENS["employer"]))
check("GET /visa/ employer -> 403", r.status_code == 403)

r = requests.get(f"{BASE}/visa/", headers=tok(TOKENS["candidate"]))
check("GET /visa/ candidate -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# MIGRATION AGENTS
# ══════════════════════════════════════════════════════════════════════════════

section("MIGRATION AGENTS")

r = requests.get(f"{BASE}/agents/ping", headers=tok(TOKENS["migration_agent"]))
check("GET /agents/ping agent -> 200", r.status_code == 200)

r = requests.get(f"{BASE}/agents/ping", headers=tok(TOKENS["admin"]))
check("GET /agents/ping admin -> 200", r.status_code == 200)

r = requests.get(f"{BASE}/agents/ping")
check("GET /agents/ping unauthenticated -> 401", r.status_code == 401)

r = requests.post(f"{BASE}/agents/cases/assign", headers=tok(TOKENS["migration_agent"]), json={
    "visa_application_id": VISA_ID
})
check("POST /agents/cases/assign", r.status_code == 201, r.text[:120])

r = requests.get(f"{BASE}/agents/cases", headers=tok(TOKENS["migration_agent"]))
check("GET /agents/cases agent sees own cases", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/agents/cases", headers=tok(TOKENS["admin"]))
check("GET /agents/cases admin sees all", r.status_code == 200)

r = requests.get(f"{BASE}/agents/cases/{VISA_ID}", headers=tok(TOKENS["migration_agent"]))
check("GET /agents/cases/{id}", r.status_code == 200)
check("Agent case has candidate info", r.ok and "candidate_name" in r.json())
check("Agent case has document_count", r.ok and "document_count" in r.json())

r = requests.put(f"{BASE}/agents/cases/{VISA_ID}", headers=tok(TOKENS["migration_agent"]), json={
    "notes": "Certificate III reviewed. Qualifications partially recognised.",
    "status": "under_review",
})
check("PUT /agents/cases/{id}", r.status_code == 200)

r = requests.get(f"{BASE}/agents/cases", headers=tok(TOKENS["employer"]))
check("GET /agents/cases employer -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# ELECTRICAL SCORING
# ══════════════════════════════════════════════════════════════════════════════

section("ELECTRICAL SCORING")

r = requests.post(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["admin"]))
check("POST /scoring/{id} trigger", r.status_code in (200, 201), r.text[:120])

r = requests.get(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["admin"]))
check("GET /scoring/{id}", r.status_code == 200)
check("Score has total_score", r.ok and "total_score" in r.json())
check("Score has breakdown fields", r.ok and "breakdown" in r.json() and "experience" in r.json().get("breakdown", {}))

r = requests.get(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["employer"]))
check("GET /scoring/{id} employer", r.status_code == 200)

r = requests.get(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["migration_agent"]))
check("GET /scoring/{id} agent", r.status_code == 200)

r = requests.get(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["candidate"]))
check("GET /scoring/{id} candidate -> 403", r.status_code == 403)

r = requests.delete(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["admin"]))
check("DELETE /scoring/{id} admin", r.status_code == 204)

r = requests.delete(f"{BASE}/scoring/{CAND_PROFILE_ID}", headers=tok(TOKENS["employer"]))
check("DELETE /scoring/{id} employer -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENTS
# ══════════════════════════════════════════════════════════════════════════════

section("DOCUMENTS")

try:
    from reportlab.pdfgen import canvas as rlc
    buf = io.BytesIO()
    c = rlc.Canvas(buf)
    c.drawString(100, 750, "Ali Hassan — Certificate III in Electrotechnology")
    c.drawString(100, 730, "Issued by: TAFE NSW, Australia, 2023")
    c.save()
    PDF_BYTES = buf.getvalue()
except ImportError:
    PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"

r = requests.post(f"{BASE}/documents/",
    headers=tok(TOKENS["candidate"]),
    data={
        "document_group": "certification",
        "document_type": "trade_certificate",
        "issuing_country": "Australia",
    },
    files={"file": ("cert_iii.pdf", PDF_BYTES, "application/pdf")},
)
check("POST /documents/ upload PDF", r.status_code == 201, r.text[:120])
DOC_ID = r.json().get("id", "") if r.ok else ""

r = requests.get(f"{BASE}/documents/{CAND_PROFILE_ID}", headers=tok(TOKENS["candidate"]))
check("GET /documents/{candidate_id}", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/documents/{CAND_PROFILE_ID}", headers=tok(TOKENS["admin"]))
check("GET /documents/{candidate_id} admin", r.status_code == 200)

r = requests.get(f"{BASE}/documents/{CAND_PROFILE_ID}", headers=tok(TOKENS["migration_agent"]))
check("GET /documents/{candidate_id} agent", r.status_code == 200)

r = requests.get(f"{BASE}/documents/download/{DOC_ID}", headers=tok(TOKENS["candidate"]))
check("GET /documents/download/{id} candidate", r.status_code == 200)

r = requests.get(f"{BASE}/documents/download/{DOC_ID}", headers=tok(TOKENS["admin"]))
check("GET /documents/download/{id} admin", r.status_code == 200)

r = requests.post(f"{BASE}/documents/",
    headers=tok(TOKENS["candidate"]),
    data={"document_group": "certification", "document_type": "trade_certificate"},
    files={"file": ("script.exe", b"binary", "application/octet-stream")},
)
check("POST /documents/ unsupported type -> 400", r.status_code == 400)

r = requests.post(f"{BASE}/documents/",
    headers=tok(TOKENS["employer"]),
    data={"document_group": "certification", "document_type": "trade_certificate"},
    files={"file": ("test.pdf", PDF_BYTES, "application/pdf")},
)
check("POST /documents/ employer -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# RAG — Access Control
# ══════════════════════════════════════════════════════════════════════════════

section("RAG — Access Control (CRM admin/agent only)")

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["employer"]), json={
    "candidate_id": CAND_PROFILE_ID,
    "question": "What certificates does this candidate have?",
})
check("POST /rag/ask employer -> 403 (CRM restricted per business logic)", r.status_code == 403)

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["candidate"]), json={
    "candidate_id": CAND_PROFILE_ID, "question": "What certificates do I have?",
})
check("POST /rag/ask candidate -> 403", r.status_code == 403)

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["training_provider"]), json={
    "candidate_id": CAND_PROFILE_ID, "question": "test",
})
check("POST /rag/ask training_provider -> 403", r.status_code == 403)

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["admin"]), json={
    "candidate_id": CAND_PROFILE_ID, "question": "What qualifications does this candidate have?",
})
check("POST /rag/ask admin -> allowed (200 or 500 if OpenAI down)", r.status_code in (200, 500))

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["migration_agent"]), json={
    "candidate_id": CAND_PROFILE_ID, "question": "Describe work experience.",
})
check("POST /rag/ask migration_agent -> allowed", r.status_code in (200, 500))

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["admin"]), json={
    "candidate_id": str(uuid.uuid4()), "question": "Test",
})
check("POST /rag/ask nonexistent candidate -> 404", r.status_code == 404)

r = requests.post(f"{BASE}/rag/ask", headers=tok(TOKENS["admin"]), json={
    "candidate_id": CAND_PROFILE_ID, "question": "ab",  # too short
})
check("POST /rag/ask question too short -> 422", r.status_code == 422)

r = requests.get(f"{BASE}/rag/candidates/{CAND_PROFILE_ID}/chunks",
    headers=tok(TOKENS["admin"]))
check("GET /rag/chunks admin -> 200", r.status_code == 200)

r = requests.get(f"{BASE}/rag/candidates/{CAND_PROFILE_ID}/chunks",
    headers=tok(TOKENS["employer"]))
check("GET /rag/chunks employer -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# TRAINING PROVIDERS & COURSES
# ══════════════════════════════════════════════════════════════════════════════

section("TRAINING PROVIDERS & COURSES")

r = requests.post(f"{BASE}/training/provider", headers=tok(TOKENS["training_provider"]), json={
    "name": "TAFE NSW Electrical",
    "contact_email": "electrical@tafensw.edu.au",
    "website_url": "https://www.tafensw.edu.au",
    "country": "Australia",
})
check("POST /training/provider", r.status_code == 201, r.text[:120])
PROVIDER_ID = r.json().get("id", "") if r.ok else ""

r = requests.get(f"{BASE}/training/provider")
check("GET /training/provider (public)", r.status_code == 200)

r = requests.get(f"{BASE}/training/provider/{PROVIDER_ID}")
check("GET /training/provider/{id} (public)", r.status_code == 200)

r = requests.put(f"{BASE}/training/provider/{PROVIDER_ID}", headers=tok(TOKENS["training_provider"]), json={
    "name": "TAFE NSW Electrical — Updated",
    "contact_email": "info@tafensw.edu.au",
    "country": "Australia",
})
check("PUT /training/provider/{id}", r.status_code == 200)

r = requests.post(f"{BASE}/training/provider/{PROVIDER_ID}/courses",
    headers=tok(TOKENS["training_provider"]), json={
    "title": "Cert III in Electrotechnology (Bridging for International Electricians)",
    "description": "Bridging course to gain Australian licensing recognition.",
    "trade_category": "electrical",
    "delivery_mode": "blended",
    "location": "Sydney, NSW",
})
check("POST /training/courses create", r.status_code == 201, r.text[:120])
COURSE_ID = r.json().get("id", "") if r.ok else ""

r = requests.get(f"{BASE}/training/courses")
check("GET /training/courses (public)", r.status_code == 200)

r = requests.get(f"{BASE}/training/courses?trade_category=electrical")
check("GET /training/courses?trade_category=electrical", r.status_code == 200 and len(r.json()) >= 1)

r = requests.get(f"{BASE}/training/courses/{COURSE_ID}")
check("GET /training/courses/{id}", r.status_code == 200)

r = requests.put(f"{BASE}/training/courses/{COURSE_ID}",
    headers=tok(TOKENS["training_provider"]), json={
    "title": "Cert III Electrotechnology Bridging — v2",
    "trade_category": "electrical",
    "delivery_mode": "online",
})
check("PUT /training/courses/{id}", r.status_code == 200)

r = requests.post(f"{BASE}/training/recommend/{CAND_PROFILE_ID}/{COURSE_ID}",
    headers=tok(TOKENS["admin"]))
check("POST /training/recommend admin", r.status_code == 201)

r = requests.post(f"{BASE}/training/recommend/{CAND_PROFILE_ID}/{COURSE_ID}",
    headers=tok(TOKENS["migration_agent"]))
check("POST /training/recommend duplicate -> 400/409", r.status_code in (400, 409))

r = requests.get(f"{BASE}/training/recommend/{CAND_PROFILE_ID}",
    headers=tok(TOKENS["admin"]))
check("GET /training/recommend/{candidate_id}", r.status_code == 200 and len(r.json()) >= 1)

r = requests.post(f"{BASE}/training/recommend/{CAND_PROFILE_ID}/{COURSE_ID}",
    headers=tok(TOKENS["candidate"]))
check("POST /training/recommend candidate role -> 403", r.status_code == 403)


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ══════════════════════════════════════════════════════════════════════════════

section("DASHBOARD")

r = requests.get(f"{BASE}/dashboard/stats", headers=tok(TOKENS["admin"]))
check("GET /dashboard/stats admin", r.status_code == 200)

r = requests.get(f"{BASE}/dashboard/stats", headers=tok(TOKENS["company_admin"]))
check("GET /dashboard/stats company_admin", r.status_code == 200)

r = requests.get(f"{BASE}/dashboard/stats", headers=tok(TOKENS["migration_agent"]))
check("GET /dashboard/stats migration_agent", r.status_code == 200)

r = requests.get(f"{BASE}/dashboard/stats", headers=tok(TOKENS["employer"]))
check("GET /dashboard/stats employer -> 403", r.status_code == 403)

r = requests.get(f"{BASE}/dashboard/stats", headers=tok(TOKENS["candidate"]))
check("GET /dashboard/stats candidate -> 403", r.status_code == 403)

r = requests.get(f"{BASE}/dashboard/stats")
check("GET /dashboard/stats unauthenticated -> 401", r.status_code == 401)

r = requests.get(f"{BASE}/dashboard/recent-activity", headers=tok(TOKENS["admin"]))
check("GET /dashboard/recent-activity", r.status_code == 200)

r = requests.get(f"{BASE}/dashboard/pending-employers", headers=tok(TOKENS["admin"]))
check("GET /dashboard/pending-employers", r.status_code == 200)


# ══════════════════════════════════════════════════════════════════════════════
# ADMIN ACTIONS
# ══════════════════════════════════════════════════════════════════════════════

section("ADMIN ACTIONS")

r = requests.post(f"{BASE}/admin/candidates/{CAND_PROFILE_ID}/unpublish",
    headers=tok(TOKENS["admin"]))
check("POST /admin/candidates/{id}/unpublish", r.status_code == 200 and r.json()["published"] == False)

r = requests.post(f"{BASE}/admin/candidates/{str(uuid.uuid4())}/unpublish",
    headers=tok(TOKENS["admin"]))
check("POST /admin/candidates/nonexistent/unpublish -> 404", r.status_code == 404)

# Get a user ID to test status update
users = requests.get(f"{BASE}/admin/users?role=employer", headers=tok(TOKENS["admin"])).json()
if isinstance(users, list) and users:
    USER_ID = users[0]["id"]
    r = requests.put(f"{BASE}/admin/users/{USER_ID}/status",
        headers=tok(TOKENS["admin"]), json={"status": "inactive"})
    check("PUT /admin/users/{id}/status -> inactive", r.status_code == 200 and r.json()["status"] == "inactive")

    r = requests.put(f"{BASE}/admin/users/{USER_ID}/status",
        headers=tok(TOKENS["admin"]), json={"status": "active"})
    check("PUT /admin/users/{id}/status -> active", r.status_code == 200 and r.json()["status"] == "active")

    r = requests.put(f"{BASE}/admin/users/{USER_ID}/status",
        headers=tok(TOKENS["admin"]), json={"status": "suspended"})
    check("PUT /admin/users/{id}/status invalid value -> 400", r.status_code == 400)


# ══════════════════════════════════════════════════════════════════════════════
# VALIDATION & EDGE CASES
# ══════════════════════════════════════════════════════════════════════════════

section("VALIDATION & EDGE CASES")

r = requests.get(f"{BASE}/admin/candidates/not-a-uuid", headers=tok(TOKENS["admin"]))
check("Invalid UUID in path -> 422", r.status_code == 422)

r = requests.get(f"{BASE}/admin/employers/not-a-uuid", headers=tok(TOKENS["admin"]))
check("Invalid UUID employer path -> 422", r.status_code == 422)

r = requests.get(f"{BASE}/admin/candidates/{str(uuid.uuid4())}", headers=tok(TOKENS["admin"]))
check("Non-existent candidate -> 404", r.status_code == 404)

r = requests.get(f"{BASE}/admin/employers/{str(uuid.uuid4())}", headers=tok(TOKENS["admin"]))
check("Non-existent employer -> 404", r.status_code == 404)

r = requests.post(f"{BASE}/visa/", headers=tok(TOKENS["company_admin"]), json={
    "candidate_id": "not-a-uuid",
    "country_of_application": "Australia",
})
check("POST /visa/ invalid candidate_id -> 422", r.status_code == 422)

r = requests.post(f"{BASE}/candidates/profile", headers=tok(TOKENS["admin"]), json={
    "full_name": "Test", "trade_category": "Electrician"
})
check("POST /candidates/profile admin role -> 403", r.status_code == 403)

r = requests.post(f"{BASE}/eoi/", headers=tok(TOKENS["employer"]), json={
    "candidate_id": str(uuid.uuid4()),
    "job_title": "Test EOI",
})
check("POST /eoi/ nonexistent candidate -> 404", r.status_code == 404)


# ══════════════════════════════════════════════════════════════════════════════
# RESULTS
# ══════════════════════════════════════════════════════════════════════════════

section("FINAL RESULTS")
total = passed + failed
print(f"\n  Total  : {total}")
print(f"  PASS   : {passed}")
print(f"  FAIL   : {failed}")

if _failures:
    print(f"\n  Failed tests:")
    for name, detail in _failures:
        print(f"    [FAIL] {name}  |  {detail}")

print()
if failed == 0:
    print(f"  ALL {total} TESTS PASSED")
else:
    print(f"  {failed} TEST(S) FAILED")
    sys.exit(1)

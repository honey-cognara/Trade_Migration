"""Full endpoint test suite."""
import urllib.request, json, sys, os
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://localhost:8000'
results = []

def req(method, path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    try:
        r = urllib.request.urlopen(
            urllib.request.Request(url, data=data, headers=headers, method=method),
            timeout=15
        )
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, {}
    except Exception as ex:
        return 0, {'error': str(ex)}

def chk(method, path, body=None, token=None, expect=(200, 299), label=''):
    s, resp = req(method, path, body, token)
    ok = expect[0] <= s <= expect[1]
    sym = 'PASS' if ok else 'FAIL'
    tag = f' [{label}]' if label else ''
    print(f'  {sym} {s:3d}  {method:<6} {path}{tag}')
    if not ok:
        print(f'         => {str(resp)[:250]}')
    results.append((ok, s, method, path, label))
    return s, resp

# ── HEALTH ────────────────────────────────────────────────────────────────────
print('=== HEALTH ===')
chk('GET', '/health')

# ── REGISTER ──────────────────────────────────────────────────────────────────
print('\n=== REGISTER ===')
chk('POST', '/auth/register', {'name':'Test Candidate','email':'testcand@example.com','password':'TestPass1','role':'candidate'}, expect=(200, 409))
chk('POST', '/auth/register', {'name':'Test Employer','email':'testemployer@example.com','password':'TestPass1','role':'employer'}, expect=(200, 409))
chk('POST', '/auth/register', {'name':'Test Admin','email':'testadmin@example.com','password':'TestPass1','role':'admin'}, expect=(200, 409))
chk('POST', '/auth/register', {'name':'Test Agent','email':'testagent@example.com','password':'TestPass1','role':'migration_agent'}, expect=(200, 409))
# Invalid password (no uppercase) — should 422
chk('POST', '/auth/register', {'name':'Bad','email':'bad@x.com','password':'weakpass','role':'candidate'}, expect=(422, 422), label='weak password')
# Invalid role — should 422
chk('POST', '/auth/register', {'name':'Bad','email':'bad2@x.com','password':'TestPass1','role':'tradie'}, expect=(422, 422), label='invalid role')

# ── LOGIN ─────────────────────────────────────────────────────────────────────
print('\n=== LOGIN ===')
_, r = chk('POST', '/auth/login', {'email':'testcand@example.com','password':'TestPass1'})
CAND = r.get('access_token', '')
_, r = chk('POST', '/auth/login', {'email':'testemployer@example.com','password':'TestPass1'})
EMP = r.get('access_token', '')
_, r = chk('POST', '/auth/login', {'email':'testadmin@example.com','password':'TestPass1'})
ADM = r.get('access_token', '')
_, r = chk('POST', '/auth/login', {'email':'testagent@example.com','password':'TestPass1'})
AGT = r.get('access_token', '')
chk('POST', '/auth/login', {'email':'testcand@example.com','password':'WrongPass'}, expect=(401, 401), label='wrong password')
print(f'  Tokens OK: cand={bool(CAND)} emp={bool(EMP)} admin={bool(ADM)} agent={bool(AGT)}')

# ── AUTH/ME ───────────────────────────────────────────────────────────────────
print('\n=== /auth/me ===')
chk('GET', '/auth/me', token=CAND, label='with token')
chk('GET', '/auth/me', label='no token => 401', expect=(401, 403))
chk('GET', '/auth/me', token='fake.token.here', label='invalid token => 401', expect=(401, 403))

# ── CANDIDATE PROFILE ─────────────────────────────────────────────────────────
print('\n=== CANDIDATE PROFILE ===')
chk('GET', '/candidates/profile', token=CAND)
chk('PUT', '/candidates/profile', {
    'full_name': 'Test Candidate', 'trade_category': 'Electrician',
    'years_experience': 5, 'profile_summary': 'Experienced electrician seeking Australian work',
    'nationality': 'Pakistani', 'country_of_residence': 'Pakistan'
}, token=CAND)
chk('POST', '/candidates/profile/publish', token=CAND)
chk('POST', '/candidates/profile/unpublish', token=CAND)
chk('GET', '/candidates/profile', label='no auth => 401', expect=(401, 403))
chk('GET', '/candidates/eois', token=CAND)

# ── EMPLOYER COMPANY ──────────────────────────────────────────────────────────
print('\n=== EMPLOYER COMPANY ===')
chk('POST', '/employers/company', {
    'company_name': 'Test Corp Pty Ltd', 'industry': 'Construction',
    'state': 'NSW', 'contact_email': 'hr@testcorp.com.au', 'abn': '12345678901'
}, token=EMP, expect=(200, 409))
chk('GET', '/employers/company', token=EMP)
chk('GET', '/employers/company', label='no auth => 401', expect=(401, 403))
# Newly registered companies are 'pending' admin approval => 403 is correct behavior
chk('GET', '/employers/candidates', token=EMP, label='pending company => 403', expect=(403, 403))
chk('GET', '/employers/candidates', label='no auth => 401', expect=(401, 403))

# ── DASHBOARD — critical access control check ─────────────────────────────────
print('\n=== DASHBOARD (access control) ===')
chk('GET', '/dashboard/stats', label='NO AUTH => 401', expect=(401, 403))
chk('GET', '/dashboard/stats', token=CAND, label='candidate => 403', expect=(401, 403))
chk('GET', '/dashboard/stats', token=EMP, label='employer => 403', expect=(401, 403))
chk('GET', '/dashboard/stats', token=ADM, label='admin => 200')
chk('GET', '/dashboard/recent-activity', label='NO AUTH => 401', expect=(401, 403))
chk('GET', '/dashboard/recent-activity', token=ADM, label='admin => 200')
chk('GET', '/dashboard/pending-employers', label='NO AUTH => 401', expect=(401, 403))
chk('GET', '/dashboard/pending-employers', token=ADM, label='admin => 200')

# ── ADMIN ─────────────────────────────────────────────────────────────────────
print('\n=== ADMIN ===')
chk('GET', '/admin/users', token=ADM)
chk('GET', '/admin/candidates', token=ADM)
chk('GET', '/admin/employers', token=ADM)
chk('GET', '/admin/companies', token=ADM)
chk('GET', '/admin/employers/pending', token=ADM)
chk('GET', '/admin/users', label='no auth => 401', expect=(401, 403))
chk('GET', '/admin/users', token=CAND, label='candidate => 403', expect=(401, 403))
chk('GET', '/admin/users', token=EMP, label='employer => 403', expect=(401, 403))

# ── VISA APPLICATIONS ─────────────────────────────────────────────────────────
print('\n=== VISA APPLICATIONS ===')
# Visa apps are managed by company_admin, migration_agent, admin only
chk('GET', '/visa/', token=ADM, label='admin => 200')
chk('GET', '/visa/', token=AGT, label='agent => 200')
chk('GET', '/visa/', token=CAND, label='candidate => 403', expect=(401, 403))
chk('GET', '/visa/', token=EMP, label='employer => 403', expect=(401, 403))
chk('GET', '/visa/', label='no auth => 401', expect=(401, 403))

# ── EOI ───────────────────────────────────────────────────────────────────────
print('\n=== EOI ===')
# /eoi/received is for CANDIDATES (they receive EOIs from employers)
chk('GET', '/eoi/received', token=CAND, label='candidate => 200')
chk('GET', '/eoi/received', token=EMP, label='employer => 403 (they send, not receive)', expect=(401, 403))
chk('GET', '/eoi/received', label='no auth => 401', expect=(401, 403))

# ── ELECTRICAL SCORING ────────────────────────────────────────────────────────
print('\n=== ELECTRICAL SCORING ===')
# Scoring requires admin, company_admin, employer, migration_agent (not plain candidate)
chk('GET', '/scoring/00000000-0000-0000-0000-000000000001', token=ADM, expect=(200, 404))
chk('GET', '/scoring/not-uuid', token=ADM, expect=(422, 422), label='invalid UUID => 422')
chk('GET', '/scoring/00000000-0000-0000-0000-000000000001', token=CAND, label='candidate => 403', expect=(401, 403))
chk('GET', '/scoring/00000000-0000-0000-0000-000000000001', label='no auth => 401', expect=(401, 403))

# ── TRAINING ─────────────────────────────────────────────────────────────────
print('\n=== TRAINING PROVIDERS ===')
chk('GET', '/training/courses', token=CAND)
chk('GET', '/training/courses', label='no auth => 401', expect=(401, 403))
chk('POST', '/training/provider', {
    'provider_name': 'Test RTO', 'rto_number': 'RTO99999',
    'contact_email': 'info@rto.com.au', 'state': 'VIC'
}, token=ADM, expect=(200, 409))
chk('GET', '/training/provider', token=ADM)

# ── MIGRATION AGENTS ─────────────────────────────────────────────────────────
print('\n=== MIGRATION AGENTS ===')
chk('GET', '/agents/cases', token=AGT)
chk('GET', '/agents/cases', token=ADM, label='admin => 200')
chk('GET', '/agents/cases', label='no auth => 401', expect=(401, 403))
chk('GET', '/agents/cases', token=CAND, label='candidate => 403', expect=(401, 403))
chk('GET', '/agents/ping', token=AGT)
chk('GET', '/agents/ping', token=ADM, label='admin => 200')
chk('GET', '/agents/ping', label='no auth => 401', expect=(401, 403))

# ── DOCUMENTS ────────────────────────────────────────────────────────────────
print('\n=== DOCUMENTS ===')
chk('GET', '/documents/00000000-0000-0000-0000-000000000001', token=CAND, expect=(200, 404))
chk('GET', '/documents/not-uuid', token=CAND, expect=(422, 422), label='invalid UUID => 422')
chk('GET', '/documents/00000000-0000-0000-0000-000000000001', label='no auth => 401', expect=(401, 403))
chk('GET', '/documents/download/00000000-0000-0000-0000-000000000001', token=CAND, expect=(200, 404))
chk('GET', '/documents/download/00000000-0000-0000-0000-000000000001', label='no auth => 401', expect=(401, 403))

# ── RAG ───────────────────────────────────────────────────────────────────────
print('\n=== RAG / LangChain ===')
# RAG is restricted to admin, company_admin, migration_agent, employer (NOT plain candidate)
chk('GET', '/rag/candidates/not-uuid/chunks', token=ADM, expect=(422, 422), label='invalid UUID => 422')
chk('GET', '/rag/candidates/00000000-0000-0000-0000-000000000001/chunks', token=ADM, expect=(200, 404))
chk('GET', '/rag/candidates/00000000-0000-0000-0000-000000000001/chunks', label='no auth => 401', expect=(401, 403))
chk('GET', '/rag/candidates/00000000-0000-0000-0000-000000000001/chunks', token=CAND, label='plain candidate => 403', expect=(401, 403))
chk('POST', '/rag/ask', {
    'candidate_id': '00000000-0000-0000-0000-000000000001',
    'question': 'What trade does this candidate have?',
    'top_k': 5
}, token=ADM, expect=(200, 404), label='RAG ask (admin, no docs => 404 candidate)')
chk('POST', '/rag/ask', {
    'candidate_id': '00000000-0000-0000-0000-000000000001',
    'question': 'x',  # too short
    'top_k': 5
}, token=ADM, expect=(422, 422), label='question too short => 422')
chk('POST', '/rag/ask', {
    'candidate_id': '00000000-0000-0000-0000-000000000001',
    'question': 'What trade?',
    'top_k': 99  # over limit
}, token=ADM, expect=(422, 422), label='top_k too large => 422')
chk('POST', '/rag/ask', label='no auth => 401', expect=(401, 403))

# ── SUMMARY ───────────────────────────────────────────────────────────────────
total = len(results)
passed = sum(1 for r in results if r[0])
failed = [r for r in results if not r[0]]
print(f'\n{"="*60}')
print(f'RESULTS: {passed}/{total} passed, {len(failed)} failed')
if failed:
    print('\nFAILED TESTS:')
    for r in failed:
        tag = f' [{r[4]}]' if r[4] else ''
        print(f'  {r[2]} {r[3]}{tag}  => HTTP {r[1]}')
else:
    print('All checks passed!')

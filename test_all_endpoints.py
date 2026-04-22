import asyncio
import httpx

ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjYwZGEzNWQtNzcwZC00YWQ3LWFiOGYtNjZjMDQzNGU1NTlkIiwiZW1haWwiOiJhZG1pbl8xNzcyNzQ5Mzk4QHQuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzcyODM1Nzk5fQ.iBf4lvLu7CmQ9DO3DIQ9rz2QOPej0SycLnAsTP7RucU"
CANDIDATE_ID = "d6c3a4d7-e709-4861-83e7-357c7c6f2d62"
BASE_URL = "http://127.0.0.1:8000"

async def test_endpoint(client, method, path, headers=None, json_data=None, expected_status=None):
    url = f"{BASE_URL}{path}"
    try:
        response = await client.request(method, url, headers=headers, json=json_data)
        status = response.status_code
        is_success = expected_status is None and status < 400 or status == expected_status
        result = "PASS" if is_success else "FAIL"
        
        # Determine actual status description for report
        print(f"[{result}] {method:<6} {url}")
        print(f"       Returned {status}: {response.text[:100]}...")
        return {"method": method, "path": path, "status": status, "result": result, "response": response.text[:150]}
    except Exception as e:
        print(f"[ERROR] {method} {url} - {str(e)}")
        return {"method": method, "path": path, "status": "ERROR", "result": "FAIL", "response": str(e)}

async def run_tests():
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    results = []
    async with httpx.AsyncClient() as client:
        # 1. Health check
        print("--- Public Endpoints ---")
        results.append(await test_endpoint(client, "GET", "/health", expected_status=200))
        
        # 2. Invalid Login (Testing 401 unauth/422 invalid)
        print("\n--- Invalid Auth ---")
        results.append(await test_endpoint(client, "POST", "/auth/login", json_data={"email": "bad", "password": "123"}, expected_status=422))
        
        # 3. Secure endpoints without token (expect 401/403)
        print("\n--- Security Check (No Token) ---")
        results.append(await test_endpoint(client, "GET", "/auth/me", expected_status=401))
        
        # 4. Secure endpoints with token
        print("\n--- Secure Endpoints (With Admin Token) ---")
        results.append(await test_endpoint(client, "GET", "/auth/me", headers=headers, expected_status=200))
        results.append(await test_endpoint(client, "GET", "/dashboard/stats", headers=headers))
        results.append(await test_endpoint(client, "GET", "/admin/employers/pending", headers=headers))
        results.append(await test_endpoint(client, "GET", f"/candidates/{CANDIDATE_ID}/cv", headers=headers))
        
        # 5. Invalid Path
        print("\n--- Error Handling ---")
        results.append(await test_endpoint(client, "GET", "/api/not_found_lmao", expected_status=404))
    
    # Save Report
    with open("C:\\Users\\Dell\\.gemini\\antigravity\\brain\\04d30533-fb29-4747-9edb-d2f671220639\\api_test_results.md", "w", encoding="utf-8") as f:
        f.write("# API Execution Test Report\n\n")
        f.write("| Method | Endpoint | Expected Result | Actual Status | Details |\n")
        f.write("|---|---|---|---|---|\n")
        for res in results:
            icon = "✅" if res['result'] == 'PASS' else "❌"
            safe_resp = res['response'].replace('\n', ' ').replace('|', '-') if res['response'] else ''
            f.write(f"| {res['method']} | `{res['path']}` | {icon} {res['result']} | {res['status']} | {safe_resp} |\n")

if __name__ == "__main__":
    asyncio.run(run_tests())

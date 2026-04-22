import json

with open("schema.json", "r") as f:
    schema = json.load(f)

paths = schema.get("paths", {})

markdown_lines = [
    "# REST API Analysis Report",
    "",
    "## 1. Overview",
    f"Total endpoints discovered: **{sum(len(methods) for methods in paths.values())}** across **{len(paths)}** unique paths.",
    "",
    "## 2. REST API Compliance Check",
    "Restful APIs typically follow these conventions:",
    "- Use HTTP methods appropriately (GET, POST, PUT, DELETE).",
    "- Use plural nouns for resources (e.g., `/users` instead of `/user`).",
    "- Avoid verbs in the URL (e.g., `/create-user` -> POST `/users`).",
    "",
    "### Non-RESTful or Edge-Case Endpoints Identified:"
]

issues = []

for path, methods in paths.items():
    segments = [s for s in path.split('/') if s and not s.startswith('{')]
    
    # Check for verbs in paths
    verbs = ['get', 'create', 'update', 'delete', 'set', 'add', 'remove', 'me', 'login', 'logout', 'register', 'dashboard', 'recent-activity']
    has_verb = any(v in segments for v in verbs)
    
    for method, details in methods.items():
        if has_verb and not path.startswith('/auth') and not path.startswith('/dashboard') and not path.startswith('/health'):
             issues.append(f"- **{method.upper()} {path}**: Contains non-resource words (verbs/actions) instead of standard REST nouns.")
        
        if method == 'get' and ('create' in path or 'update' in path or 'delete' in path):
            issues.append(f"- **{method.upper()} {path}**: GET should only retrieve data, but URL implies modification.")
            
        if method == 'post' and ('get' in path or 'fetch' in path):
            issues.append(f"- **{method.upper()} {path}**: POST should create, but URL implies retrieval.")

if not issues:
    markdown_lines.append("- ✅ All identified endpoints appear to follow standard REST conventions (excluding typical auth/dashboard edge cases).")
else:
    markdown_lines.extend(issues)

markdown_lines.extend([
    "",
    "## 3. Critical Testing Plan",
    "To thoroughly test the API, I will develop an automated test script that will:",
    "1. **Authentication Flow**: Test register, login, and token generation.",
    "2. **Authorization**: Test protected endpoints with and without JWT tokens.",
    "3. **Data Validation**: Send invalid payloads (missing fields, wrong types) to POST/PUT endpoints and verify `422 Unprocessable Entity` responses.",
    "4. **Business Logic**: Create resources and fetch them back.",
    "5. **Error Handling**: Hit invalid paths or non-existent IDs to ensure `404 Not Found` is returned properly."
])

with open("C:\\Users\\Dell\\.gemini\\antigravity\\brain\\04d30533-fb29-4747-9edb-d2f671220639\\api_analysis_report.md", "w", encoding="utf-8") as f:
    f.write("\n".join(markdown_lines))

print("Analysis complete. Wrote api_analysis_report.md")

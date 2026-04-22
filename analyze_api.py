import urllib.request
import json

URL = "http://127.0.0.1:8000/openapi.json"

try:
    with urllib.request.urlopen(URL) as response:
        schema = json.loads(response.read().decode())
    
    paths = schema.get("paths", {})
    print(f"Total paths found: {len(paths)}")
    for path, methods in paths.items():
        for method, details in methods.items():
            print(f"{method.upper():<6} {path}")
            
    with open("schema.json", "w") as f:
        json.dump(schema, f, indent=2)
except Exception as e:
    print(f"Error fetching schema: {e}")

import json
import urllib.request

url = "http://rule-engine-service:8002/api/v1/rules"
payload = {
    "rule_name": "Diagnostic Test Rule",
    "description": "Rule created by diagnostic script",
    "scope": "selected_devices",
    "property": "temperature",
    "condition": ">",
    "threshold": 90.0,
    "notification_channels": ["email"],
    "cooldown_minutes": 15,
    "device_ids": ["D1"]
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'))
req.add_header('Content-Type', 'application/json')

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.getcode()}")
        print(f"Response: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Error Detail: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")

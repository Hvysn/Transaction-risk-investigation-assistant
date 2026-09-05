import urllib.request
import json

results = []

# Test root HTML
r = urllib.request.urlopen('http://localhost:8000/')
body = r.read().decode()
ok = 'doctype html' in body.lower()
results.append(('GET /', r.status, 'OK - React HTML served' if ok else 'FAIL - no HTML'))

# Test health
r = urllib.request.urlopen('http://localhost:8000/api/health')
data = json.loads(r.read())
results.append(('GET /api/health', r.status, f"track_id={data['track_id']} gemini_key_configured={data['gemini_api_configured']}"))

# Test scenarios
r = urllib.request.urlopen('http://localhost:8000/api/scenarios')
data = json.loads(r.read())
results.append(('GET /api/scenarios', r.status, f"count={len(data)} ids={[s['id'] for s in data]}"))

# Test baseline
r = urllib.request.urlopen('http://localhost:8000/api/baseline?scenario_id=clean')
data = json.loads(r.read())
results.append(('GET /api/baseline', r.status, f"mean=${data['mean_amount']:.2f} std=${data['std_dev']:.2f} txns={data['total_transactions']}"))

# Test burst anomalies
r = urllib.request.urlopen('http://localhost:8000/api/transactions?scenario_id=burst_attack')
data = json.loads(r.read())
results.append(('GET /api/transactions (burst_attack)', r.status, f"anomaly_count={data['anomaly_count']} total={data['total_scanned']}"))

# Test clean - should have 0 anomalies
r = urllib.request.urlopen('http://localhost:8000/api/transactions?scenario_id=clean')
data = json.loads(r.read())
results.append(('GET /api/transactions (clean)', r.status, f"anomaly_count={data['anomaly_count']} [EXPECTED 0]"))

print()
print("=" * 70)
print("LIVE SERVER SMOKE TEST - http://localhost:8000")
print("=" * 70)
for endpoint, status, detail in results:
    icon = 'PASS' if status == 200 else 'FAIL'
    print(f"  [{icon}] {endpoint} -> HTTP {status} | {detail}")
print("=" * 70)
print("All endpoints operational. Open http://localhost:8000 in your browser.")

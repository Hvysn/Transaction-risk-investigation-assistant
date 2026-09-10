import unittest
import os
import sys
from fastapi.testclient import TestClient

sys.stdout.reconfigure(encoding='utf-8')

import app as app_module
from app import app, init_db, seed_all_scenarios

class TestFastApiApp(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_all_scenarios()
        cls.client = TestClient(app)

    def test_01_root_serves_html(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers["content-type"])
        self.assertIn("Fraud Desk", response.text)
        print("\n[HTTP PASS] Root '/' successfully serves the compiled React dashboard HTML.")

    def test_02_health_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["track_id"], "PS06")
        print(f"[HTTP PASS] /api/health returned track_id: {data['track_id']}")

    def test_03_scenarios_endpoint(self):
        response = self.client.get("/api/scenarios")
        self.assertEqual(response.status_code, 200)
        scenarios = response.json()
        self.assertEqual(len(scenarios), 3)
        ids = [s["id"] for s in scenarios]
        self.assertIn("clean", ids)
        self.assertIn("burst_attack", ids)
        self.assertIn("odd_hours_whale", ids)
        print(f"[HTTP PASS] /api/scenarios listed 3 test scenarios: {ids}")

    def test_04_baseline_endpoint(self):
        response = self.client.get("/api/baseline?scenario_id=clean")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["mean_amount"], 0)
        self.assertGreater(data["total_transactions"], 100)
        print(f"[HTTP PASS] /api/baseline returned mean: ₹{data['mean_amount']:.2f}")

    def test_05_transactions_endpoint(self):
        response = self.client.get("/api/transactions?scenario_id=burst_attack")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["anomaly_count"], 7)
        print(f"[HTTP PASS] /api/transactions returned 7 anomalies for burst_attack.")

    def test_06_investigate_clean(self):
        response = self.client.post("/api/investigate?scenario_id=clean")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["anomaly_count"], 0)
        report = data["investigation_report"]
        self.assertEqual(report["risk_score"], 0)
        self.assertEqual(report["rag_status"], "GREEN")
        self.assertIn("Routine account activity verified", report["executive_summary"])
        print("[HTTP PASS] /api/investigate (clean) returned RAG GREEN & blunt 'no action needed' response.")

    def test_07_investigate_burst(self):
        response = self.client.post("/api/investigate?scenario_id=burst_attack")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["anomaly_count"], 7)
        report = data["investigation_report"]
        self.assertEqual(report["rag_status"], "RED")
        self.assertIn("triage_summary", report)
        self.assertEqual(report["triage_summary"]["escalation_routing"], "Assign to Level 2 Fraud Desk Analyst")
        print("[HTTP PASS] /api/investigate (burst_attack) returned RAG RED & Triage Escalation Routing.")

    def test_08_api_access_control_middleware(self):
        """Test optional X-API-KEY access control middleware when FRAUD_DESK_API_KEY is active."""
        # Enable auth token temporarily
        app_module.FRAUD_DESK_API_KEY = "test_secret_key_123"
        try:
            # 1. Request without X-API-KEY header -> 401 Unauthorized
            res_unauth = self.client.get("/api/scenarios")
            self.assertEqual(res_unauth.status_code, 401)
            self.assertEqual(res_unauth.json()["error"], "Unauthorized Access")

            # 2. Health check remains public -> 200 OK
            res_health = self.client.get("/api/health")
            self.assertEqual(res_health.status_code, 200)

            # 3. Request with valid X-API-KEY header -> 200 OK
            res_auth = self.client.get("/api/scenarios", headers={"X-API-KEY": "test_secret_key_123"})
            self.assertEqual(res_auth.status_code, 200)
            print("[HTTP PASS] API Access Control Middleware verified: 401 when unauthenticated, 200 with X-API-KEY header.")
        finally:
            # Revert to default open state
            app_module.FRAUD_DESK_API_KEY = ""

if __name__ == "__main__":
    unittest.main()

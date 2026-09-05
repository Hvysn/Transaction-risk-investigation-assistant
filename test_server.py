import unittest
from fastapi.testclient import TestClient
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
        print(f"[HTTP PASS] /api/baseline returned mean: ${data['mean_amount']:.2f}")

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
        self.assertIn("Routine account activity verified", report["executive_summary"])
        print("[HTTP PASS] /api/investigate for clean scenario returned blunt 'no action needed' message.")

    def test_07_investigate_whale(self):
        response = self.client.post("/api/investigate?scenario_id=odd_hours_whale")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["anomaly_count"], 1)
        report = data["investigation_report"]
        self.assertIn("TXN-WHALE-99", report["cited_transaction_ids"])
        self.assertGreaterEqual(report["risk_score"], 80)
        self.assertIn("03:15", report["executive_summary"] + report["verdict"] + "".join(report["investigation_steps"]))
        print("[HTTP PASS] /api/investigate for odd_hours_whale cited TXN-WHALE-99 and off-hours details.")

if __name__ == "__main__":
    unittest.main()

import unittest
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

from app import (
    init_db,
    seed_all_scenarios,
    calculate_sql_baseline,
    run_deterministic_rule_engine,
    query_gemini_reasoning
)

class TestFraudDeskEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_all_scenarios()

    def test_01_sql_baseline_clean(self):
        baseline = calculate_sql_baseline("clean")
        self.assertGreater(baseline["total_transactions"], 100)
        self.assertGreater(baseline["mean_amount"], 0)
        self.assertGreater(baseline["std_dev"], 0)
        self.assertGreaterEqual(len(baseline["hourly_distribution"]), 5)
        print(f"\n[TEST PASS] Clean Baseline Mean: ₹{baseline['mean_amount']:,.2f}, StdDev: ₹{baseline['std_dev']:,.2f}")

    def test_02_deterministic_engine_clean_scenario(self):
        result = run_deterministic_rule_engine("clean")
        self.assertEqual(result["anomaly_count"], 0)
        self.assertEqual(len(result["flagged_transactions"]), 0)
        print(f"[TEST PASS] Scenario 'clean' produced exactly 0 deterministic flags.")

    def test_03_deterministic_engine_burst_scenario(self):
        result = run_deterministic_rule_engine("burst_attack")
        self.assertEqual(result["anomaly_count"], 7)
        for txn in result["flagged_transactions"]:
            self.assertEqual(txn["payee"], "NexusPay Global Wallet / VPA")
            rule_names = [f["rule"] for f in txn["flags"]]
            self.assertTrue("RULE_VELOCITY_BURST" in rule_names or "RULE_NEW_HIGH_VALUE_PAYEE" in rule_names)
        print(f"[TEST PASS] Scenario 'burst_attack' correctly identified 7 velocity burst transactions.")

    def test_04_deterministic_engine_odd_hours_whale(self):
        result = run_deterministic_rule_engine("odd_hours_whale")
        self.assertEqual(result["anomaly_count"], 1)
        whale_tx = result["flagged_transactions"][0]
        self.assertEqual(whale_tx["transaction_id"], "TXN-WHALE-99")
        self.assertEqual(whale_tx["amount"], 850000.00)
        self.assertEqual(whale_tx["time"], "03:15:00")
        rule_names = [f["rule"] for f in whale_tx["flags"]]
        self.assertIn("RULE_ODD_HOURS_ACTIVITY", rule_names)
        self.assertIn("RULE_HIGH_AMOUNT_OUTLIER", rule_names)
        print(f"[TEST PASS] Scenario 'odd_hours_whale' correctly identified TXN-WHALE-99 at 03:15 AM for ₹8,50,000.")

    def test_05_gemini_reasoning_prompt_constraints(self):
        # Test clean scenario returns GREEN status & blunt message
        clean_report = query_gemini_reasoning(
            baseline_info=calculate_sql_baseline("clean"),
            flagged_records=[]
        )
        self.assertEqual(clean_report["rag_status"], "GREEN")
        self.assertEqual(clean_report["risk_score"], 0)
        self.assertEqual(clean_report["risk_level"], "LOW")
        self.assertIn("Routine account activity verified", clean_report["executive_summary"])

        # Test whale scenario report contains RED status, citations & triage summary
        whale_result = run_deterministic_rule_engine("odd_hours_whale")
        whale_report = query_gemini_reasoning(
            baseline_info=whale_result["baseline"],
            flagged_records=whale_result["flagged_transactions"]
        )
        self.assertEqual(whale_report["rag_status"], "RED")
        self.assertIn("TXN-WHALE-99", whale_report["cited_transaction_ids"])
        self.assertGreaterEqual(whale_report["risk_score"], 80)
        self.assertIn("triage_summary", whale_report)
        self.assertEqual(whale_report["triage_summary"]["escalation_routing"], "Assign to Level 2 Fraud Desk Analyst")
        print(f"[TEST PASS] AI Investigation Report generated with RAG STATUS: RED, citations, and Triage Summary.")

if __name__ == "__main__":
    unittest.main()

import unittest
import os
import sys
import json
from datetime import datetime, timedelta

sys.stdout.reconfigure(encoding='utf-8')

from app import (
    init_db,
    seed_all_scenarios,
    calculate_sql_baseline,
    run_deterministic_rule_engine,
    get_db_connection
)

class TestDeterministicFilteringLogic(unittest.TestCase):
    """
    Comprehensive Unit Test Suite for Deterministic Anomaly Filtering Rules (TRACK_ID=PS06).
    Tests Rules 1-4, boundary conditions, payee exemptions, and multi-rule triggers.
    """

    @classmethod
    def setUpClass(cls):
        init_db()
        seed_all_scenarios()
        cls.clean_baseline = calculate_sql_baseline("clean")

    def test_01_rule_1_high_amount_outlier(self):
        """Rule 1: Amount > max(3x mean, mean + 2.5x std). Excludes routine Rent."""
        mean_val = self.clean_baseline["mean_amount"]
        std_val = self.clean_baseline["std_dev"]
        threshold = max(mean_val * 3.0, mean_val + 2.5 * std_val)

        # 1a. Test normal non-outlier transaction (e.g. ₹2,500)
        result_clean = run_deterministic_rule_engine("clean")
        high_amount_flags = [
            t for t in result_clean["all_transactions"]
            if any(f["rule"] == "RULE_HIGH_AMOUNT_OUTLIER" for f in t["flags"])
        ]
        self.assertEqual(len(high_amount_flags), 0, "Clean scenario should have 0 high-amount outlier flags.")

        # 1b. Test whale transaction exceeds threshold
        result_whale = run_deterministic_rule_engine("odd_hours_whale")
        whale_tx = [t for t in result_whale["flagged_transactions"] if t["transaction_id"] == "TXN-WHALE-99"][0]
        self.assertGreater(whale_tx["amount"], threshold)
        whale_rules = [f["rule"] for f in whale_tx["flags"]]
        self.assertIn("RULE_HIGH_AMOUNT_OUTLIER", whale_rules)
        print(f"  [PASS] Rule 1 High Amount Outlier: Threshold ₹{threshold:,.2f} triggered by TXN-WHALE-99 (₹{whale_tx['amount']:,.2f})")

    def test_02_rule_1_rent_exemption(self):
        """Rule 1 Exception: Rent payments to 'Metropolitan Property Mgmt' (₹28,500) must NOT trigger Rule 1."""
        result_clean = run_deterministic_rule_engine("clean")
        rent_txns = [t for t in result_clean["all_transactions"] if t["payee"] == "Metropolitan Property Mgmt"]
        self.assertGreater(len(rent_txns), 0, "Rent transactions must exist in baseline.")
        for r_tx in rent_txns:
            rule_names = [f["rule"] for f in r_tx["flags"]]
            self.assertNotIn("RULE_HIGH_AMOUNT_OUTLIER", rule_names, "Rent payee must be exempt from Rule 1.")
        print(f"  [PASS] Rule 1 Rent Exemption: Verified {len(rent_txns)} routine rent payments exempt from outlier flags.")

    def test_03_rule_2_odd_hours_window(self):
        """Rule 2: Transaction executed between 01:00 AM and 05:30 AM (Hour 1..5)."""
        result_whale = run_deterministic_rule_engine("odd_hours_whale")
        odd_hours_txns = [
            t for t in result_whale["all_transactions"]
            if any(f["rule"] == "RULE_ODD_HOURS_ACTIVITY" for f in t["flags"])
        ]
        self.assertEqual(len(odd_hours_txns), 1, "Only TXN-WHALE-99 should trigger odd hours activity.")
        self.assertEqual(odd_hours_txns[0]["transaction_id"], "TXN-WHALE-99")
        self.assertEqual(odd_hours_txns[0]["time"], "03:15:00")
        print(f"  [PASS] Rule 2 Odd Hours Window: Correctly flagged 03:15 AM transaction TXN-WHALE-99.")

    def test_04_rule_3_velocity_burst(self):
        """Rule 3: >= 3 transactions within a 30-minute rolling window totaling > ₹10,000."""
        result_burst = run_deterministic_rule_engine("burst_attack")
        burst_velocity_flagged = [
            t for t in result_burst["flagged_transactions"]
            if any(f["rule"] == "RULE_VELOCITY_BURST" for f in t["flags"])
        ]
        # TXN-BURST-03 to TXN-BURST-07 have >= 3 txns in their 30-minute window (5 transactions)
        self.assertEqual(len(burst_velocity_flagged), 5, "TXN-BURST-03 through 07 must trigger velocity burst rule.")

        for tx in burst_velocity_flagged:
            self.assertEqual(tx["payee"], "NexusPay Global Wallet / VPA")
            self.assertEqual(tx["channel"], "UPI / VPA")

        print(f"  [PASS] Rule 3 Velocity Burst: Flagged {len(burst_velocity_flagged)} rapid UPI transfers exceeding rolling 30m window limit.")

    def test_05_rule_4_new_high_value_payee(self):
        """Rule 4: Payee not in clean baseline and amount >= ₹15,000."""
        result_burst = run_deterministic_rule_engine("burst_attack")
        new_payee_flagged = [
            t for t in result_burst["flagged_transactions"]
            if any(f["rule"] == "RULE_NEW_HIGH_VALUE_PAYEE" for f in t["flags"])
        ]
        self.assertEqual(len(new_payee_flagged), 7, "All 7 burst transfers (₹45,000 - ₹72,000) to new payee must trigger Rule 4.")
        print(f"  [PASS] Rule 4 New High-Value Payee: Verified 7 transfers to new payee 'NexusPay Global Wallet / VPA'.")

    def test_06_multi_rule_cooccurrence(self):
        """Verifies that severe transactions breaking multiple rules carry multiple flag descriptors."""
        result_whale = run_deterministic_rule_engine("odd_hours_whale")
        whale_tx = [t for t in result_whale["flagged_transactions"] if t["transaction_id"] == "TXN-WHALE-99"][0]
        flag_rules = [f["rule"] for f in whale_tx["flags"]]

        self.assertIn("RULE_HIGH_AMOUNT_OUTLIER", flag_rules)
        self.assertIn("RULE_ODD_HOURS_ACTIVITY", flag_rules)
        self.assertIn("RULE_NEW_HIGH_VALUE_PAYEE", flag_rules)
        self.assertEqual(len(flag_rules), 3, "TXN-WHALE-99 must trigger 3 rules (High Amount + Odd Hours + New Payee).")
        print(f"  [PASS] Multi-Rule Co-occurrence: TXN-WHALE-99 triggered 3 flags simultaneously: {flag_rules}")

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("  RUNNING DETERMINISTIC FILTERING LOGIC SUITE")
    print("=" * 70)
    unittest.main()

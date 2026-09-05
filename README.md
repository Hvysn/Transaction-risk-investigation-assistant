TRACK_ID=PS06
# Transaction Risk Investigation Assistant (Fraud Desk)

An analytical, software-based risk investigation assistant designed for a bank's fraud desk. It combines deterministic SQL aggregations, rule-based anomaly detection, and Google Gemini LLM reasoning to evaluate 6 months of customer transaction history.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10+
- (Optional for development) Node.js 18+ (The production React UI is already pre-compiled into `dist/`)

### 2. Set Up Environment & Install Dependencies
```bash
# Set your Gemini API Key
# Windows PowerShell:
$env:GEMINI_API_KEY="your_api_key_here"

# Linux / macOS:
export GEMINI_API_KEY="your_api_key_here"

# Install Python requirements (under 2 minutes)
pip install -r requirements.txt
```

### 3. Launch the Server
```bash
python app.py
```
The application will boot in under 5 seconds and serve the complete analytical dashboard and API at:
👉 **`http://localhost:8000`**

---

## 🏛️ System Architecture

1. **SQLite Database Layer (`transactions.db`)**:
   - Ingests 6 months of customer transaction data (150+ transactions).
   - Schema: `transaction_id`, `date`, `time`, `datetime_iso`, `description`, `payee`, `amount`, `channel`, `category`, `scenario_id`.
   - Preloaded with 3 switchable testing scenarios:
     - **Clean Baseline**: Routine groceries, salary, utilities during normal hours (07:00 - 22:30).
     - **Burst Payment Attack**: 7 rapid consecutive transfers within 20 minutes to a new unverified wallet (`NexusPay Global Wallet`).
     - **Odd-Hours Whale Transfer**: $18,750 wire transfer executed at `03:15 AM` to `Offshore Holdings Ltd`.

2. **Deterministic Anomaly Engine (SQL & Python)**:
   - Evaluates SQL aggregations for customer baselines (mean spend, standard deviation, active hour distributions, channel distributions, payee frequency).
   - Flags anomalies deterministically:
     - Transactions exceeding 3x baseline spending or Z-score threshold.
     - Odd-hours transactions (between 01:00 AM and 05:30 AM).
     - Rapid payment velocity bursts (>=3 transactions in 30 mins).
     - First-time payees with high volume.

3. **Gemini LLM Reasoning Layer (`gemini-3.5-flash-lite`)**:
   - Only receives deterministically flagged records and baseline context.
   - Explains statistical deviations from normal customer behavior.
   - Strictly cites exact transaction IDs.
   - Outlines prioritized, actionable next steps for the fraud investigator.
   - **Strict Constraint**: Forbids declaring that fraud has definitively occurred (preserves objective risk assessment).
   - Bluntly returns "No action needed" for routine history.

4. **React Fraud Desk UI**:
   - Real-time analytical dashboard with visual metrics, anomaly filters, baseline hourly charts, and interactive AI investigation modal.
   - Pre-compiled into `dist/` and served directly by FastAPI.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status & API key verification |
| `GET` | `/api/scenarios` | List available test scenarios |
| `POST` | `/api/scenarios/{id}/load` | Switch active customer scenario and reload DB |
| `GET` | `/api/baseline` | Retrieve SQL baseline statistics and active hour metrics |
| `GET` | `/api/transactions` | Fetch 6-month transaction ledger with deterministic flags |
| `POST` | `/api/investigate` | Run deterministic rules + Gemini LLM risk analysis |

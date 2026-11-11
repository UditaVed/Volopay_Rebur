# ReBur: AI Expense Claims & Policy Approval Engine

> **Volopay Product Tech Assignment MVP**  
> Claude is the brain — ReBur is the memory, compliance rulebook, and front desk.

---

## 💡 The Problem & Concept

AI agents like Claude can read receipts and extract JSON, but:
1. **They can't persist state** across sessions or share it among team members.
2. **They can't deterministically enforce corporate policies** without hallucination or inconsistency.
3. **They can't provide manager approval workflows** with financial auditing and accountability.

**ReBur** bridges this gap:
- **Employees / AI Agents** submit expenses (via Claude Desktop / MCP or the Web UI).
- **The ReBur Policy Engine** intercepts every claim:
  - ⚠️ Auto-flags amounts exceeding the auto-approval threshold (> ₹5,000 / $100).
  - ⚠️ Enforces zero-tolerance restricted categories (`Alcohol`, `Entertainment`, etc.).
  - ⚠️ Flags vague vendor names (`Cash`, `Misc`) requiring itemized receipts.
  - ⚠️ Detects duplicate claims submitted by the same employee.
- **Managers** review, approve, or reject claims from the Next.js dashboard with 1-click approvals.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────┐
                               │     Claude Desktop / Agent     │
                               │   "File my client dinner bill" │
                               └───────────────┬────────────────┘
                                               │ FastMCP Protocol (SSE / Tools)
                                               ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend (Port :8000)                           │
│  ┌─────────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │ FastMCP Tool Server     │  │ Corporate Policy & Compliance Engine       │  │
│  │ • submit_expense()      │  │ • Ceiling Check (₹5,000 / $100 limit)      │  │
│  │ • list_pending_claims() │  │ • Prohibited Categories (Alcohol/Drinks)   │  │
│  │ • get_corporate_policy()│  │ • Duplicate Claim Detection                │  │
│  └─────────────────────────┘  └─────────────────────┬──────────────────────┘  │
│                                                     │                         │
│  ┌────────────────────────────────────────────────┐ │                         │
│  │ RESTful API Layer                              │ │                         │
│  │ /api/expenses, /api/stats, /api/ai/parse-receipt◄┘                         │
│  └────────────────────────────┬───────────────────┘                           │
└───────────────────────────────┼───────────────────────────────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
┌───────────────────────────────┐  ┌────────────────────────────────────────────┐
│ Database (Dual-Engine)        │  │ Next.js 14+ Frontend (Port :3000)          │
│ • Local SQLite (Zero-config)  │  │ • Real-time Executive KPI Metric Tiles     │
│ • Supabase / Postgres Adapter │  │ • Interactive Ledger & Policy Badges       │
│   (Configurable via .env)     │  │ • 1-Click Manager Approve / Reject         │
│                               │  │ • Built-in Claude MCP Agent Simulator      │
└───────────────────────────────┘  └────────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Running Locally)

### Option 1: 1-Click Launch Script
```bash
./start.sh
```
This automatically initializes the backend Python virtual environment, mounts the MCP server, and boots up both the Next.js dashboard and FastAPI backend.

### Option 2: Running Components Separately

#### 1. Backend (FastAPI & MCP Server)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=.
python main.py
```
- **Backend URL:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **Interactive Swagger Docs:** http://localhost:8000/docs
- **MCP SSE Endpoint:** http://localhost:8000/mcp

#### 2. Frontend (Next.js & Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Dashboard:** http://localhost:3000

---

## 🤖 Connecting Claude to the MCP Server

You can connect **Claude Desktop** or any MCP-compatible agent directly to ReBur by adding this connector to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "volopay-rebur": {
      "command": "python",
      "args": ["-m", "mcp.server.fastmcp", "run", "backend/app/mcp_server.py"],
      "env": {
        "PYTHONPATH": "/absolute/path/to/ReBur/backend"
      }
    }
  }
}
```

Or for remote deployment (e.g. Render / Replit / Railway):
- Connect Claude using the remote HTTP stream URL: `https://your-domain.com/mcp`

### Available MCP Tools for Claude:
1. `submit_expense(vendor, amount, currency, category, date, employee_name, notes)`
   - Submits expense and returns deterministic policy validation feedback.
2. `list_pending_expenses()`
   - Returns queue of expenses requiring review.
3. `get_corporate_policy()`
   - Returns live spending limits and restricted category guidelines.

---

## ⚙️ Environment Configuration (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | Port for the FastAPI server |
| `DATABASE_URL` | `sqlite:///./expenses.db` | Local SQLite path or PostgreSQL connection string |
| `DEFAULT_WORKSPACE_ID` | `ws_demo_123` | Active enterprise workspace partition |
| `MAX_AUTO_APPROVAL_AMOUNT_INR` | `5000.0` | Policy threshold ceiling in INR |
| `MAX_AUTO_APPROVAL_AMOUNT_USD` | `100.0` | Policy threshold ceiling in USD |
| `SUPABASE_URL` | *(optional)* | Supabase project URL for cloud sync |
| `SUPABASE_SERVICE_KEY` | *(optional)* | Supabase Service Role Secret Key |

---

## 🧪 Running Automated Tests

A comprehensive Pytest suite is included covering policy engine rules, duplicate detection, CRUD endpoints, and OCR receipt extraction:

```bash
cd backend
source venv/bin/activate
export PYTHONPATH=.
pytest tests/
```
All 9 unit and integration tests pass with 100% assertion verification.


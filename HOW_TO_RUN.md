# How to Run ReBur (Local & Cloud)

> **Quickstart Guide for Volopay Product Tech Assignment**  
> Follow this guide to run the frontend, backend, test suites, and Claude Desktop MCP bridge on your local machine or in Docker.

---

## ⚡ Method 1: One-Command Quickstart (Recommended)

From the project root:

```bash
chmod +x start.sh
./start.sh
```

This single command will:
1. Initialize the Python virtual environment and install backend dependencies.
2. Launch the **FastAPI & FastMCP Backend** on **`http://localhost:8000`**.
3. Launch the **Next.js 16 Frontend** on **`http://localhost:3000`**.
4. Handle clean termination of both servers when you press `Ctrl + C`.

---

## 🛠️ Method 2: Manual Step-by-Step Setup

If you prefer running the backend and frontend in separate terminal windows:

### Terminal 1: Backend (FastAPI + FastMCP + SQLite/Supabase)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies (pinned for FastMCP compatibility)
pip install -r requirements.txt

# Start the backend server
PYTHONPATH=. python main.py
```

* Backend runs on: **`http://localhost:8000`**
* Interactive Swagger Docs: **`http://localhost:8000/docs`**
* API Health Check: **`http://localhost:8000/health`**
* FastMCP SSE Endpoint: **`http://localhost:8000/mcp`**

---

### Terminal 2: Frontend (Next.js 16 + Tailwind CSS)

```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

* Web Dashboard opens at: **`http://localhost:3000`**

---

## 🔑 Test Logins & Roles

ReBur enforces strict **Segregation of Duties (SOD)**:

| Role | Email | Password | Name | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Employee** | `user@rebur.io` | `password123` | Priya Sharma | Can submit claims, run receipt OCR simulator, pre-check guidelines. Cannot approve claims or export CSV. |
| **Manager** | `manager@rebur.io` | `password123` | Devansh Gupta | Approver mode: 1-click Approve/Reject, full audit trail, and Export CSV. Cannot self-file expenses. |

> **Quick Switcher:** Click the user profile badge in the top right of the navbar at `http://localhost:3000` to switch between accounts with 1 click.

---

## 🧪 Method 3: Running the Automated Test Suites

### 1. Pytest API & Policy Engine Suite (11 Tests)
Validates threshold evaluation, duplicate detection, receipt regex parsing, and dual persistence:

```bash
PYTHONPATH=backend ./backend/venv/bin/pytest backend/tests/test_api.py -v
```

### 2. Claude MCP Protocol Compatibility Test
Tests the stdio transport, JSON-RPC 2.0 handshake, tool discovery, and execution of tool calls:

```bash
PYTHONPATH=backend ./backend/venv/bin/python backend/test_mcp_client.py
```

---

## 🤖 Method 4: Connecting Claude Desktop via MCP

To test live conversational interaction with Claude Desktop:

1. Open your Claude Desktop configuration file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the `rebur` server configuration:

```json
{
  "mcpServers": {
    "rebur": {
      "command": "/Users/akshay/project/ReBur/backend/venv/bin/python",
      "args": ["/Users/akshay/project/ReBur/backend/mcp_runner.py"],
      "env": {
        "PYTHONPATH": "/Users/akshay/project/ReBur/backend"
      }
    }
  }
}
```

3. Restart Claude Desktop. You will see 6 active tools under the hammer icon:
   * `check_expense_guidelines`: Pre-checks compliance before filing.
   * `submit_expense`: Files expense claims directly into the database.
   * `list_pending_expenses`: Lists pending review queue.
   * `analyze_pending_reimbursements`: Executive spend risk and red flag breakdown.
   * `review_pending_expense`: Approves or rejects claims with audit trail.
   * `get_corporate_policy`: Inspects active spending rulebook.

---

## 🐳 Method 5: Running with Docker Compose

If you have Docker installed:

```bash
docker compose up --build
```

* Frontend: `http://localhost:3000`
* Backend: `http://localhost:8000`

---

## ☁️ Supabase Cloud Configuration (Optional)

ReBur has **dual persistence** enabled. By default, it operates on local SQLite (`backend/expenses.db`) with zero setup. 

To enable live Supabase persistence:
1. Ensure your `.env` contains:
   ```env
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_SERVICE_KEY=<your-secret-or-publishable-key>
   ```
2. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
3. Paste the contents of [`backend/schema.sql`](backend/schema.sql) and click **Run**.
4. The backend will automatically mirror all claim submissions and approval state changes to Supabase!

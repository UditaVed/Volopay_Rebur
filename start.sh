#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Starting ReBur: AI Expense & Policy Approval System"
echo "=========================================================="

# 1. Start FastAPI Backend in background
echo "[1/2] Starting FastAPI & MCP Backend on http://localhost:8000..."
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
fi
export PYTHONPATH="$ROOT_DIR/backend"
./venv/bin/python main.py &
BACKEND_PID=$!

# Trap signals to cleanly stop both
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Start Next.js Frontend
echo "[2/2] Starting Next.js Frontend on http://localhost:3000..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "=========================================================="
echo " Systems Operational:"
echo " • Web Dashboard: http://localhost:3000"
echo " • API Health:    http://localhost:8000/health"
echo " • OpenAPI Docs:  http://localhost:8000/docs"
echo " • MCP Endpoint:  http://localhost:8000/mcp"
echo "=========================================================="

wait


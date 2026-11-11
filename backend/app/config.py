import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR}/expenses.db")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", os.environ.get("SUPABASE_ANON_KEY", ""))
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
DEFAULT_WORKSPACE_ID = os.environ.get("DEFAULT_WORKSPACE_ID", "ws_demo_123")
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")

# Auto-approval / Policy limits
MAX_AUTO_APPROVAL_AMOUNT_INR = float(os.environ.get("MAX_AUTO_APPROVAL_AMOUNT_INR", "5000.0"))
MAX_AUTO_APPROVAL_AMOUNT_USD = float(os.environ.get("MAX_AUTO_APPROVAL_AMOUNT_USD", "100.0"))
RESTRICTED_CATEGORIES = [
    "alcohol",
    "entertainment",
    "gambling",
    "personal",
    "nightlife",
    "fine-dining"
]

# CORS: comma-separated list of allowed origins; defaults to wildcard for local dev
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

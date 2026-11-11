import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY
from .models import Base

logger = logging.getLogger("backend.database")

# SQLite connection args for multithreaded FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    logger.info("Initialized database tables successfully.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Optional Supabase client initialization if credentials are provided
supabase_client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    if not SUPABASE_URL.startswith("http://") and not SUPABASE_URL.startswith("https://"):
        logger.warning(
            f"Notice: SUPABASE_URL ('{SUPABASE_URL[:18]}...') does not start with http(s)://. "
            "It appears to be the publishable API key rather than the Project URL (e.g. 'https://<ref>.supabase.co'). "
            "Using local SQLite database until a full project URL is set in .env."
        )
    else:
        try:
            from supabase import create_client
            clean_supabase_url = SUPABASE_URL.split("/rest/v1")[0].rstrip("/")
            supabase_client = create_client(clean_supabase_url, SUPABASE_SERVICE_KEY)
            logger.info(f"Supabase client initialized successfully connecting to {clean_supabase_url}")
        except Exception as e:
            logger.warning(f"Could not initialize Supabase client: {e}")


import re
import logging
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, timezone

import io
import csv
import json
from fastapi.responses import StreamingResponse
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func

from .config import (
    DEFAULT_WORKSPACE_ID,
    MAX_AUTO_APPROVAL_AMOUNT_INR,
    MAX_AUTO_APPROVAL_AMOUNT_USD,
    RESTRICTED_CATEGORIES,
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    ALLOWED_ORIGINS
)
from .database import engine, get_db, init_db, supabase_client
from .models import Expense
from .policy_engine import evaluate_expense_policy
from .schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseStats,
    PolicyRuleResponse,
    ReceiptParseRequest,
    ReceiptParseResponse,
    LoginRequest,
    LoginResponse,
    UserResponse
)
from .mcp_server import mcp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed initial demo data if empty
    init_db()
    db = next(get_db())
    try:
        count = db.query(Expense).count()
        if count == 0:
            seed_initial_demo_expenses(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="ReBur AI Expense & Policy Approval System",
    description="Backend engine and MCP Server for AI-driven expense claims, corporate policy enforcement, and manager approvals.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount MCP ASGI App for Claude & remote agents
try:
    try:
        from mcp.server.transport_security import TransportSecuritySettings
        sec = TransportSecuritySettings(
            enable_dns_rebinding_protection=False,
            allowed_hosts=["*"],
            allowed_origins=["*"]
        )
        mcp_app = mcp.sse_app(transport_security=sec, host="0.0.0.0")
    except Exception:
        try:
            mcp_app = mcp.sse_app(host="0.0.0.0")
        except Exception:
            mcp_app = mcp.sse_app()
    app.mount("/mcp", mcp_app)
    logger.info("MCP SSE Server mounted at /mcp")
except Exception as e:
    logger.warning(f"Could not mount MCP app: {e}")


def seed_initial_demo_expenses(db: Session):
    """Seed initial realistic data representing common enterprise spend scenarios."""
    demo_claims = [
        {
            "vendor": "Uber for Business",
            "amount": 850.0,
            "currency": "INR",
            "category": "Travel",
            "date": "2026-11-08",
            "employee_name": "Priya Sharma",
            "notes": "Client on-site visit in Gurgaon",
            "status": "approved",
            "is_flagged": False,
            "flag_reason": None
        },
        {
            "vendor": "ITC Maurya - Bukhara",
            "amount": 14200.0,
            "currency": "INR",
            "category": "Meals & Entertainment",
            "date": "2026-11-09",
            "employee_name": "Rohan Mehta",
            "notes": "Quarterly enterprise partner dinner",
            "status": "pending",
            "is_flagged": True,
            "flag_reason": "Amount (₹14,200.00) exceeds standard auto-approval limit of ₹5,000. Requires Senior Manager approval."
        },
        {
            "vendor": "Social Pub & Brewery",
            "amount": 3400.0,
            "currency": "INR",
            "category": "Alcohol",
            "date": "2026-11-09",
            "employee_name": "Devansh Gupta",
            "notes": "Team Friday happy hour drinks",
            "status": "pending",
            "is_flagged": True,
            "flag_reason": "Restricted policy violation: Expenses filed under 'Alcohol' violate corporate compliance guidelines without prior executive exception."
        },
        {
            "vendor": "Amazon Web Services",
            "amount": 4200.0,
            "currency": "INR",
            "category": "Software & Cloud",
            "date": "2026-11-07",
            "employee_name": "Ananya Joshi",
            "notes": "Dev environment GPU test cluster",
            "status": "approved",
            "is_flagged": False,
            "flag_reason": None
        },
        {
            "vendor": "Indigo Airlines",
            "amount": 6250.0,
            "currency": "INR",
            "category": "Travel",
            "date": "2026-11-06",
            "employee_name": "Vikram Malhotra",
            "notes": "Flight ticket BLR -> DEL for client pitch",
            "status": "pending",
            "is_flagged": True,
            "flag_reason": "Amount (₹6,250.00) exceeds standard auto-approval limit of ₹5,000. Requires Senior Manager approval."
        },
        {
            "vendor": "Blue Tokai Coffee Roasters",
            "amount": 620.0,
            "currency": "INR",
            "category": "Meals",
            "date": "2026-11-10",
            "employee_name": "Priya Sharma",
            "notes": "Coffee meeting with product design candidate",
            "status": "pending",
            "is_flagged": False,
            "flag_reason": None
        }
    ]

    for item in demo_claims:
        exp = Expense(
            workspace_id=DEFAULT_WORKSPACE_ID,
            **item
        )
        db.add(exp)
    db.commit()
    logger.info("Demo expenses seeded successfully.")


# ----------------------------------------------------
# Authentication & Test Logins (User vs Manager)
# ----------------------------------------------------

PRESET_USERS = {
    "user@rebur.io": {
        "id": "usr_emp_01",
        "email": "user@rebur.io",
        "password": "password123",
        "name": "Priya Sharma",
        "role": "employee",
        "avatar": "PS",
        "title": "Senior Product Engineer"
    },
    "manager@rebur.io": {
        "id": "usr_mgr_01",
        "email": "manager@rebur.io",
        "password": "password123",
        "name": "Devansh Gupta",
        "role": "manager",
        "avatar": "DG",
        "title": "VP of Finance & Operations"
    }
}

@app.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    user_record = PRESET_USERS.get(email)
    if not user_record or payload.password != user_record["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Use 'user@rebur.io' or 'manager@rebur.io' with password 'password123'."
        )
    return LoginResponse(
        token=f"demo_token_{user_record['id']}",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record["name"],
            role=user_record["role"],
            avatar=user_record["avatar"],
            title=user_record["title"]
        )
    )

@app.get("/api/auth/users", response_model=List[UserResponse], tags=["Authentication"])
def get_test_accounts():
    """Returns available pre-configured test logins for User (Employee) and Manager."""
    return [
        UserResponse(
            id=u["id"],
            email=u["email"],
            name=u["name"],
            role=u["role"],
            avatar=u["avatar"],
            title=u["title"]
        )
        for u in PRESET_USERS.values()
    ]


# ----------------------------------------------------
# REST API Endpoints
# ----------------------------------------------------

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "alive",
        "service": "ReBur AI Expense & Policy System",
        "mcp_enabled": True,
        "supabase_connected": supabase_client is not None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/expenses", response_model=List[ExpenseResponse], tags=["Expenses"])
def get_expenses(
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    status: Optional[str] = Query(None, description="Filter: 'pending', 'approved', 'rejected'"),
    is_flagged: Optional[bool] = Query(None, description="Filter flagged/clean claims"),
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search vendor, employee, or notes"),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.workspace_id == workspace_id)

    if status and status.lower() != "all":
        query = query.filter(Expense.status == status.lower())

    if is_flagged is not None:
        query = query.filter(Expense.is_flagged == is_flagged)

    if category and category.lower() != "all":
        query = query.filter(Expense.category.ilike(f"%{category}%"))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Expense.vendor.ilike(search_filter),
                Expense.employee_name.ilike(search_filter),
                Expense.notes.ilike(search_filter)
            )
        )

    return query.order_by(desc(Expense.created_at)).all()


@app.post("/api/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    ws_id = payload.workspace_id or DEFAULT_WORKSPACE_ID

    # Evaluate against corporate policy rules
    is_flagged, flag_reasons = evaluate_expense_policy(
        vendor=payload.vendor,
        amount=payload.amount,
        currency=payload.currency,
        category=payload.category,
        employee_name=payload.employee_name,
        db=db,
        workspace_id=ws_id
    )
    flag_reason_str = " | ".join(flag_reasons) if flag_reasons else None

    # Default date if not provided
    expense_date = payload.date or datetime.now().strftime("%Y-%m-%d")

    expense = Expense(
        workspace_id=ws_id,
        vendor=payload.vendor.strip(),
        amount=payload.amount,
        currency=payload.currency.strip().upper(),
        category=payload.category.strip(),
        date=expense_date,
        employee_name=payload.employee_name.strip(),
        notes=payload.notes,
        status="pending",
        is_flagged=is_flagged,
        flag_reason=flag_reason_str,
        receipt_url=payload.receipt_url
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Optional Sync to Supabase
    if supabase_client is not None:
        try:
            supabase_client.table("expenses").insert({
                "workspace_id": expense.workspace_id,
                "vendor": expense.vendor,
                "amount": expense.amount,
                "currency": expense.currency,
                "category": expense.category,
                "date": expense.date,
                "employee_name": expense.employee_name,
                "notes": expense.notes,
                "status": expense.status,
                "is_flagged": expense.is_flagged,
                "flag_reason": expense.flag_reason or ""
            }).execute()
        except Exception as e:
            logger.warning(f"Supabase sync failed: {e}")

    return expense


@app.get("/api/expenses/export/csv", tags=["Expenses"])
def export_expenses_csv(
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Export expense claims to standard accounting CSV for ERP/payroll reconciliation."""
    query = db.query(Expense).filter(Expense.workspace_id == workspace_id)
    if status and status.lower() != "all":
        query = query.filter(Expense.status == status.lower())
    records = query.order_by(desc(Expense.created_at)).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Claim ID",
        "Date",
        "Employee Name",
        "Vendor",
        "Category",
        "Currency",
        "Amount",
        "Approval Status",
        "Policy Flagged",
        "Policy Violation Reason",
        "Justification Notes",
        "Created At"
    ])

    for r in records:
        writer.writerow([
            r.id,
            r.date or "",
            r.employee_name,
            r.vendor,
            r.category,
            r.currency,
            f"{r.amount:.2f}",
            r.status,
            "YES" if r.is_flagged else "NO",
            r.flag_reason or "N/A",
            r.notes or "",
            r.created_at.isoformat() if r.created_at else ""
        ])

    output.seek(0)
    filename = f"rebur_expenses_{workspace_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/expenses/{expense_id}", response_model=ExpenseResponse, tags=["Expenses"])
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
    return exp


@app.put("/api/expenses/{expense_id}", response_model=ExpenseResponse, tags=["Expenses"])
def update_expense(expense_id: int, payload: ExpenseUpdate, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense claim not found.")

    update_data = payload.model_dump(exclude_unset=True)

    # Handle status change validation
    if "status" in update_data and update_data["status"]:
        valid_statuses = ["pending", "approved", "rejected"]
        if update_data["status"].lower() not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
        exp.status = update_data["status"].lower()

    if "notes" in update_data:
        exp.notes = update_data["notes"]
    if "vendor" in update_data and update_data["vendor"]:
        exp.vendor = update_data["vendor"]
    if "amount" in update_data and update_data["amount"] is not None:
        exp.amount = update_data["amount"]
    if "category" in update_data and update_data["category"]:
        exp.category = update_data["category"]
    if "date" in update_data and update_data["date"]:
        exp.date = update_data["date"]
    if "is_flagged" in update_data and update_data["is_flagged"] is not None:
        exp.is_flagged = update_data["is_flagged"]
    if "flag_reason" in update_data:
        exp.flag_reason = update_data["flag_reason"]

    db.commit()
    db.refresh(exp)

    # Sync update to Supabase if configured
    if supabase_client is not None:
        try:
            supabase_client.table("expenses").update({
                "status": exp.status,
                "notes": exp.notes,
                "is_flagged": exp.is_flagged,
                "flag_reason": exp.flag_reason
            }).eq("id", exp.id).execute()
        except Exception:
            pass

    return exp


@app.delete("/api/expenses/{expense_id}", tags=["Expenses"])
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expense claim not found.")
    db.delete(exp)
    db.commit()
    return {"message": f"Expense #{expense_id} deleted successfully."}


@app.get("/api/stats", response_model=ExpenseStats, tags=["Analytics"])
def get_expense_stats(workspace_id: str = DEFAULT_WORKSPACE_ID, db: Session = Depends(get_db)):
    base_query = db.query(Expense).filter(Expense.workspace_id == workspace_id)
    
    total_claims = base_query.count()
    pending_count = base_query.filter(Expense.status == "pending").count()
    approved_count = base_query.filter(Expense.status == "approved").count()
    rejected_count = base_query.filter(Expense.status == "rejected").count()
    flagged_count = base_query.filter(Expense.is_flagged == True).count()

    # Sum spend amounts
    total_spend = db.query(func.sum(Expense.amount)).filter(Expense.workspace_id == workspace_id).scalar() or 0.0
    approved_spend = db.query(func.sum(Expense.amount)).filter(
        Expense.workspace_id == workspace_id,
        Expense.status == "approved"
    ).scalar() or 0.0
    pending_spend = db.query(func.sum(Expense.amount)).filter(
        Expense.workspace_id == workspace_id,
        Expense.status == "pending"
    ).scalar() or 0.0

    return ExpenseStats(
        total_claims=total_claims,
        pending_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        flagged_count=flagged_count,
        total_spend_inr=float(total_spend),
        approved_spend_inr=float(approved_spend),
        pending_spend_inr=float(pending_spend)
    )


@app.get("/api/policies", response_model=List[PolicyRuleResponse], tags=["Compliance"])
def get_policies():
    return [
        PolicyRuleResponse(
            rule_name="Standard Auto-Approval Ceiling",
            description=f"Claims up to ₹{MAX_AUTO_APPROVAL_AMOUNT_INR:,.0f} ($100 USD) qualify for standard auto-approval queue. Amounts above this require Senior Manager review.",
            threshold=f"₹{MAX_AUTO_APPROVAL_AMOUNT_INR:,.0f}",
            action="Auto-flag for Manager Escalation"
        ),
        PolicyRuleResponse(
            rule_name="Prohibited Categories Check",
            description=f"Corporate cards and expense reimbursements prohibit: {', '.join(RESTRICTED_CATEGORIES)}.",
            threshold="Zero Tolerance",
            action="Auto-flag Compliance Warning"
        ),
        PolicyRuleResponse(
            rule_name="Duplicate Invoice / Claim Prevention",
            description="Submissions with identical employee, vendor name, and exact amount within recent claims are flagged to prevent duplicate payouts.",
            threshold="Exact Match",
            action="Auto-flag Potential Duplicate"
        ),
        PolicyRuleResponse(
            rule_name="Itemized Vendor Verification",
            description="Receipts or claims marked as 'Cash', 'Misc', or with vendor names under 2 characters require manager audit.",
            threshold="Audit Requirement",
            action="Auto-flag Audit Required"
        )
    ]


@app.post("/api/ai/parse-receipt", response_model=ReceiptParseResponse, tags=["AI Assistant"])
def parse_receipt_ai(payload: ReceiptParseRequest, db: Session = Depends(get_db)):
    """
    Simulates receipt extraction (what Claude/LLM extracts from receipt images or prompt descriptions).
    Extracts vendor, amount, currency, category, date, and performs immediate policy checks.
    """
    text = payload.receipt_text.strip()
    
    # 1. Currency & Amount extraction
    amount = 550.0
    currency = "INR"
    if "₹" in text or "INR" in text or "Rs" in text or "rs" in text:
        currency = "INR"
    elif "$" in text or "USD" in text:
        currency = "USD"
    elif "€" in text or "EUR" in text:
        currency = "EUR"

    # Prioritize explicit "Total" or "Grand Total"
    total_match = re.search(r"(?:grand\s+total|total|amount\s+due|net\s+amount)[:\s]*(?:₹|\$|EUR|INR|Rs\.?)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)", text, re.IGNORECASE)
    if total_match:
        try:
            amount = float(total_match.group(1).replace(",", ""))
        except ValueError:
            amount = 550.0
    else:
        amount_match = re.search(r"(?:₹|\$|EUR|INR|Rs\.?)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)", text, re.IGNORECASE)
        if amount_match:
            try:
                amount = float(amount_match.group(1).replace(",", ""))
            except ValueError:
                amount = 550.0
        else:
            # Fallback search for any stand-alone float/integer
            number_match = re.search(r"\b([0-9]{2,6}(?:\.[0-9]{1,2})?)\b", text)
            if number_match:
                try:
                    amount = float(number_match.group(1))
                except ValueError:
                    amount = 550.0

    # 2. Vendor detection
    vendor = "Generic Merchant"
    known_vendors = [
        ("uber", "Uber"),
        ("ola", "Ola Cabs"),
        ("starbucks", "Starbucks Coffee"),
        ("blue tokai", "Blue Tokai Coffee"),
        ("itc", "ITC Hotels"),
        ("taj", "Taj Hotels"),
        ("marriott", "JW Marriott"),
        ("aws", "Amazon Web Services"),
        ("google", "Google Cloud Platform"),
        ("github", "GitHub Enterprise"),
        ("slack", "Slack Technologies"),
        ("social", "Social Pub & Cafe"),
        ("beer cafe", "The Beer Cafe"),
        ("indigo", "Indigo Airlines"),
        ("air india", "Air India"),
        ("swiggy", "Swiggy"),
        ("zomato", "Zomato"),
        ("blinkit", "Blinkit Office Supplies")
    ]
    for key, name in known_vendors:
        if key in text.lower():
            vendor = name
            break
    if vendor == "Generic Merchant":
        # First non-empty line
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if lines:
            vendor = lines[0][:40]

    # 3. Category detection
    category = "Meals"
    cat_lower = text.lower()
    if any(k in cat_lower for k in ["beer", "alcohol", "wine", "cocktail", "bar", "brewery", "liquor"]):
        category = "Alcohol"
    elif any(k in cat_lower for k in ["flight", "airline", "cab", "uber", "ola", "train", "taxi", "hotel", "lodging"]):
        category = "Travel"
    elif any(k in cat_lower for k in ["aws", "cloud", "software", "saas", "subscription", "github", "zoom"]):
        category = "Software & Cloud"
    elif any(k in cat_lower for k in ["movie", "cinema", "bowling", "club", "game"]):
        category = "Entertainment"
    elif any(k in cat_lower for k in ["stationery", "print", "supplies", "laptop", "monitor"]):
        category = "Office Supplies"

    # 4. Date extraction
    date_match = re.search(r"\b(20[2-3][0-9][-/.][0-1]?[0-9][-/.][0-3]?[0-9])\b", text)
    extracted_date = date_match.group(1).replace("/", "-").replace(".", "-") if date_match else datetime.now().strftime("%Y-%m-%d")

    # 5. Evaluate policy
    is_flagged, flag_reasons = evaluate_expense_policy(
        vendor=vendor,
        amount=amount,
        currency=currency,
        category=category,
        employee_name=payload.employee_name or "Employee",
        db=db,
        workspace_id=payload.workspace_id or DEFAULT_WORKSPACE_ID
    )

    return ReceiptParseResponse(
        vendor=vendor,
        amount=amount,
        currency=currency,
        category=category,
        date=extracted_date,
        notes=f"AI-extracted claim from text: {text[:80]}...",
        is_flagged=is_flagged,
        flag_reasons=flag_reasons
    )


@app.post("/api/seed", tags=["System"])
def seed_database(db: Session = Depends(get_db)):
    """Re-seed demo data if required."""
    seed_initial_demo_expenses(db)
    return {"message": "Demo expenses seeded successfully."}

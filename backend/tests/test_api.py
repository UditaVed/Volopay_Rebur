import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.policy_engine import evaluate_expense_policy

@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alive"
    assert "service" in data

def test_policy_engine_under_threshold():
    is_flagged, reasons = evaluate_expense_policy(
        vendor="Starbucks",
        amount=350.0,
        currency="INR",
        category="Meals",
        employee_name="Alice"
    )
    assert is_flagged is False
    assert len(reasons) == 0

def test_policy_engine_over_threshold():
    is_flagged, reasons = evaluate_expense_policy(
        vendor="Luxury Hotel",
        amount=9500.0,
        currency="INR",
        category="Lodging",
        employee_name="Bob"
    )
    assert is_flagged is True
    assert any("exceeds standard auto-approval limit" in r for r in reasons)

def test_policy_engine_restricted_category():
    is_flagged, reasons = evaluate_expense_policy(
        vendor="Club Lounge",
        amount=1200.0,
        currency="INR",
        category="Alcohol",
        employee_name="Charlie"
    )
    assert is_flagged is True
    assert any("Restricted policy violation" in r for r in reasons)

def test_create_expense_endpoint(client):
    unique_emp = f"Runner_{uuid.uuid4().hex[:6]}"
    payload = {
        "vendor": "Clean Ride Service",
        "amount": 420.0,
        "currency": "INR",
        "category": "Travel",
        "date": "2026-11-10",
        "employee_name": unique_emp,
        "notes": "Testing create flow",
        "workspace_id": "ws_demo_123"
    }
    response = client.post("/api/expenses", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["vendor"] == "Clean Ride Service"
    assert data["amount"] == 420.0
    assert data["is_flagged"] is False
    assert data["status"] == "pending"

def test_duplicate_detection(client):
    unique_emp = f"DupCheck_{uuid.uuid4().hex[:6]}"
    payload = {
        "vendor": "Identical Vendor",
        "amount": 777.0,
        "currency": "INR",
        "category": "Supplies",
        "date": "2026-11-10",
        "employee_name": unique_emp,
        "notes": "First submission",
        "workspace_id": "ws_demo_123"
    }
    res1 = client.post("/api/expenses", json=payload)
    assert res1.status_code == 201
    assert res1.json()["is_flagged"] is False

    # Second identical submission should trigger duplicate detection
    res2 = client.post("/api/expenses", json=payload)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["is_flagged"] is True
    assert "duplicate" in data2["flag_reason"].lower()

def test_update_expense_status(client):
    unique_emp = f"Approver_{uuid.uuid4().hex[:6]}"
    payload = {
        "vendor": "Conference Pass",
        "amount": 15000.0,
        "currency": "INR",
        "category": "Education",
        "date": "2026-11-10",
        "employee_name": unique_emp,
        "notes": "Tech summit pass",
        "workspace_id": "ws_demo_123"
    }
    res = client.post("/api/expenses", json=payload)
    assert res.status_code == 201
    created_id = res.json()["id"]

    # Approve it
    update_res = client.put(f"/api/expenses/{created_id}", json={"status": "approved", "notes": "Approved by CTO"})
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "approved"
    assert update_res.json()["notes"] == "Approved by CTO"

def test_stats_endpoint(client):
    res = client.get("/api/stats")
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_claims"] > 0
    assert "approved_spend_inr" in stats

def test_export_csv(client):
    res = client.get("/api/expenses/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Claim ID,Date,Employee Name" in res.text

def test_auth_logins(client):
    # Test User (Employee) login
    res_user = client.post("/api/auth/login", json={"email": "user@rebur.io", "password": "password123"})
    assert res_user.status_code == 200
    assert res_user.json()["user"]["role"] == "employee"
    assert res_user.json()["user"]["name"] == "Priya Sharma"

    # Test Manager login
    res_mgr = client.post("/api/auth/login", json={"email": "manager@rebur.io", "password": "password123"})
    assert res_mgr.status_code == 200
    assert res_mgr.json()["user"]["role"] == "manager"
    assert res_mgr.json()["user"]["name"] == "Devansh Gupta"

    # Test Invalid password
    res_invalid = client.post("/api/auth/login", json={"email": "user@rebur.io", "password": "wrong"})
    assert res_invalid.status_code == 401

def test_ai_parse_receipt_endpoint(client):
    receipt_text = """
    BLUE TOKAI COFFEE ROASTERS
    Date: 2026-11-10
    Cappuccino x 2: ₹560.00
    Croissant x 1: ₹240.00
    Total: ₹800.00
    Payment: UPI
    """
    res = client.post("/api/ai/parse-receipt", json={"receipt_text": receipt_text, "employee_name": "Dev"})
    assert res.status_code == 200
    data = res.json()
    assert "Blue Tokai" in data["vendor"]
    assert data["amount"] == 800.0
    assert data["currency"] == "INR"
    assert data["is_flagged"] is False

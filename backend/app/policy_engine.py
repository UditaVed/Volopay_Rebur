from typing import List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from .config import MAX_AUTO_APPROVAL_AMOUNT_INR, MAX_AUTO_APPROVAL_AMOUNT_USD, RESTRICTED_CATEGORIES
from .models import Expense

def evaluate_expense_policy(
    vendor: str,
    amount: float,
    currency: str,
    category: str,
    employee_name: str,
    db: Optional[Session] = None,
    workspace_id: Optional[str] = None
) -> Tuple[bool, List[str]]:
    """
    Evaluates corporate expense policies against a submitted claim.
    Returns: (is_flagged: bool, flag_reasons: List[str])
    """
    flag_reasons: List[str] = []
    curr = (currency or "INR").upper().strip()
    cat_lower = (category or "").lower().strip()
    vendor_clean = (vendor or "").strip()

    # Rule 1: Threshold limit check
    if curr in ["INR", "₹"]:
        if amount > MAX_AUTO_APPROVAL_AMOUNT_INR:
            flag_reasons.append(
                f"Amount (₹{amount:,.2f}) exceeds standard auto-approval limit of ₹{MAX_AUTO_APPROVAL_AMOUNT_INR:,.0f}. Requires Senior Manager approval."
            )
    else:
        # USD or other currencies
        if amount > MAX_AUTO_APPROVAL_AMOUNT_USD:
            flag_reasons.append(
                f"Amount ({curr} {amount:,.2f}) exceeds auto-approval limit of {curr} {MAX_AUTO_APPROVAL_AMOUNT_USD:,.0f}."
            )

    # Rule 2: Restricted category check
    for restricted in RESTRICTED_CATEGORIES:
        if restricted in cat_lower:
            flag_reasons.append(
                f"Restricted policy violation: Expenses filed under '{category}' violate corporate compliance guidelines without prior executive exception."
            )
            break

    # Rule 3: Missing / Ambiguous Vendor check
    if len(vendor_clean) < 2 or vendor_clean.lower() in ["cash", "unknown", "misc", "self", "n/a", "none"]:
        flag_reasons.append(
            "Vague or invalid vendor description provided. Requires verified itemized invoice/receipt."
        )

    # Rule 4: Duplicate Claim Detection (if database session provided)
    if db is not None and vendor_clean and employee_name:
        existing_duplicate = db.query(Expense).filter(
            Expense.workspace_id == (workspace_id or "ws_demo_123"),
            Expense.employee_name.ilike(employee_name.strip()),
            Expense.vendor.ilike(vendor_clean),
            Expense.amount == amount,
            Expense.status != "rejected"
        ).first()

        if existing_duplicate:
            flag_reasons.append(
                f"Potential duplicate claim detected: Matching expense of {curr} {amount} for '{vendor_clean}' previously logged on {existing_duplicate.date or 'earlier'}."
            )

    is_flagged = len(flag_reasons) > 0
    return is_flagged, flag_reasons


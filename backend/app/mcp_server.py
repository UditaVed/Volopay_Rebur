try:
    from mcp.server.mcpserver import MCPServer as FastMCP
except ImportError:
    try:
        from mcp.server.fastmcp import FastMCP
    except ImportError:
        from mcp.server import Server as FastMCP

from .database import SessionLocal, supabase_client
from .models import Expense
from .policy_engine import evaluate_expense_policy
from .config import DEFAULT_WORKSPACE_ID, MAX_AUTO_APPROVAL_AMOUNT_INR, RESTRICTED_CATEGORIES

mcp = FastMCP("VolopayExpenseManager")

@mcp.tool()
def submit_expense(
    vendor: str,
    amount: float,
    currency: str = "INR",
    category: str = "Meals",
    date: str = "",
    employee_name: str = "Employee",
    notes: str = ""
) -> str:
    """Submit an extracted expense claim to the Volopay backend with automatic policy validation."""
    db = SessionLocal()
    try:
        # Evaluate policy
        is_flagged, flag_reasons = evaluate_expense_policy(
            vendor=vendor,
            amount=amount,
            currency=currency,
            category=category,
            employee_name=employee_name,
            db=db,
            workspace_id=DEFAULT_WORKSPACE_ID
        )

        flag_reason_str = " | ".join(flag_reasons) if flag_reasons else None

        # Persist locally
        new_expense = Expense(
            workspace_id=DEFAULT_WORKSPACE_ID,
            vendor=vendor,
            amount=amount,
            currency=currency,
            category=category,
            date=date,
            employee_name=employee_name,
            notes=notes,
            status="pending",
            is_flagged=is_flagged,
            flag_reason=flag_reason_str
        )
        db.add(new_expense)
        db.commit()
        db.refresh(new_expense)

        # Also push to Supabase if client is active
        if supabase_client is not None:
            try:
                data = {
                    "workspace_id": DEFAULT_WORKSPACE_ID,
                    "vendor": vendor,
                    "amount": amount,
                    "currency": currency,
                    "category": category,
                    "date": date,
                    "employee_name": employee_name,
                    "notes": notes,
                    "status": "pending",
                    "is_flagged": is_flagged,
                    "flag_reason": flag_reason_str or ""
                }
                supabase_client.table("expenses").insert(data).execute()
            except Exception as e:
                # Log but do not fail local save
                pass

        flag_msg = f" [FLAGGED FOR POLICY VIOLATION: {flag_reason_str}]" if is_flagged else " [Policy check passed: Clean]"
        return f"Claim #{new_expense.id} logged for {employee_name}: {vendor} ({currency} {amount:,.2f}). Status: Pending Approval.{flag_msg}"
    finally:
        db.close()

@mcp.tool()
def list_pending_expenses() -> str:
    """Retrieve all pending expense claims waiting for manager review."""
    db = SessionLocal()
    try:
        items = db.query(Expense).filter(Expense.status == "pending").order_by(Expense.created_at.desc()).limit(15).all()
        if not items:
            return "No pending expense claims found."
        
        lines = []
        for e in items:
            flag_str = f"⚠️ [FLAGGED: {e.flag_reason}]" if e.is_flagged else "✅ Clean"
            lines.append(f"• ID #{e.id} | {e.employee_name} | {e.vendor} | {e.currency} {e.amount:,.2f} | {e.category} | {flag_str}")
        return "\n".join(lines)
    finally:
        db.close()

@mcp.tool()
def get_corporate_policy() -> str:
    """Get the active corporate spend and compliance policy rules."""
    rules = [
        f"1. Single Transaction Limit: Amounts > ₹{MAX_AUTO_APPROVAL_AMOUNT_INR:,.0f} cannot be auto-approved and will be flagged for Senior Management review.",
        f"2. Prohibited Categories: Strictly prohibited from business expense accounts: {', '.join(RESTRICTED_CATEGORIES)}.",
        "3. Receipt / Vendor Audit: Generic vendor names ('Cash', 'Misc') are automatically flagged and require verified itemized receipts.",
        "4. Duplicate Detection: Claims matching previously submitted amounts and vendors for the same employee are flagged."
    ]
    return "Volopay Corporate Expense Policy:\n" + "\n".join(rules)

@mcp.tool()
def check_expense_guidelines(
    amount: float,
    category: str = "Meals",
    vendor: str = "",
    currency: str = "INR",
    employee_name: str = "Employee"
) -> str:
    """Pre-check if an intended expense passes corporate policy rules before submitting."""
    db = SessionLocal()
    try:
        is_flagged, flag_reasons = evaluate_expense_policy(
            vendor=vendor,
            amount=amount,
            currency=currency,
            category=category,
            employee_name=employee_name,
            db=db,
            workspace_id=DEFAULT_WORKSPACE_ID
        )
        if not is_flagged:
            return f"✅ Policy Check Passed: An expense of {currency} {amount:,.2f} for '{vendor or 'General'}' under '{category}' is fully compliant with standard guidelines and will be submitted directly for review."
        
        warning_lines = [f"• {r}" for r in flag_reasons]
        return f"⚠️ Policy Flags Detected for {currency} {amount:,.2f} ({category}):\n" + "\n".join(warning_lines) + "\n\nAdvice: You can still submit this reimbursement, but it will be flagged for Senior Manager sign-off and requires an itemized receipt/justification."
    finally:
        db.close()

@mcp.tool()
def analyze_pending_reimbursements() -> str:
    """Manager tool: Analyze pending claims and highlight high-risk policy violations, duplicate spends, and totals."""
    db = SessionLocal()
    try:
        items = db.query(Expense).filter(Expense.status == "pending").all()
        if not items:
            return "No pending expenses to review. All claims are up to date."
        
        total_pending = sum(e.amount for e in items)
        flagged_items = [e for e in items if e.is_flagged]
        clean_items = [e for e in items if not e.is_flagged]

        output = [
            f"📊 Executive Reimbursement Spend Analysis:",
            f"• Total Pending Claims: {len(items)} (₹{total_pending:,.2f})",
            f"• Compliant / Auto-Eligible: {len(clean_items)}",
            f"• High-Risk Policy Flags: {len(flagged_items)} require manager sign-off\n",
            "🚨 Flagged Claims Requiring Manager Review:"
        ]

        if flagged_items:
            for e in flagged_items:
                output.append(f"  - Claim #{e.id} by {e.employee_name}: {e.vendor} (₹{e.amount:,.2f}, {e.category})")
                output.append(f"    Reason: {e.flag_reason}")
        else:
            output.append("  (No flagged claims currently pending)")

        output.append("\n✅ Recommended Action:")
        output.append(f"You can approve the {len(clean_items)} compliant claims, and review receipts for the {len(flagged_items)} flagged claims before approval.")
        return "\n".join(output)
    finally:
        db.close()

@mcp.tool()
def review_pending_expense(
    expense_id: int,
    action: str,
    approver_name: str = "Devansh Gupta (Manager)",
    review_notes: str = ""
) -> str:
    """Manager tool: Approve or reject an expense claim with audit trail logging."""
    act = action.lower().strip()
    if act not in ["approve", "approved", "reject", "rejected"]:
        return "Invalid action. Must be 'approve' or 'reject'."
    
    new_status = "approved" if act in ["approve", "approved"] else "rejected"
    db = SessionLocal()
    try:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            return f"Error: Expense claim #{expense_id} not found."
        
        expense.status = new_status
        import json
        from datetime import datetime
        trail = []
        if expense.audit_trail:
            try:
                trail = json.loads(expense.audit_trail)
            except Exception:
                trail = []
        
        trail.append({
            "action": new_status,
            "actor": approver_name,
            "note": review_notes or "Processed via Claude MCP tool",
            "timestamp": datetime.utcnow().isoformat()
        })
        expense.audit_trail = json.dumps(trail)
        db.commit()

        # Sync to Supabase
        if supabase_client is not None:
            try:
                supabase_client.table("expenses").update({
                    "status": new_status,
                    "audit_trail": json.dumps(trail)
                }).eq("id", expense_id).execute()
            except Exception:
                pass

        return f"Successfully {new_status.upper()} claim #{expense_id} ({expense.vendor}, {expense.currency} {expense.amount:,.2f}) by {expense.employee_name}."
    finally:
        db.close()


from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class ExpenseBase(BaseModel):
    vendor: str = Field(..., description="Name of the merchant/vendor")
    amount: float = Field(..., gt=0, description="Monetary expense amount")
    currency: str = Field(default="INR", description="Currency ISO code or symbol")
    category: str = Field(default="Meals", description="Expense classification category")
    date: Optional[str] = Field(default=None, description="Transaction date (YYYY-MM-DD)")
    employee_name: str = Field(..., description="Full name or employee ID of submitter")
    notes: Optional[str] = Field(default=None, description="Business justification or notes")
    workspace_id: Optional[str] = Field(default="ws_demo_123", description="Workspace/team identifier")
    receipt_url: Optional[str] = Field(default=None, description="Optional image/PDF link of the receipt")

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    status: Optional[str] = Field(default=None, description="'pending', 'approved', or 'rejected'")
    notes: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[str] = None
    is_flagged: Optional[bool] = None
    flag_reason: Optional[str] = None

class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    workspace_id: str
    vendor: str
    amount: float
    currency: str
    category: str
    date: Optional[str] = None
    employee_name: str
    notes: Optional[str] = None
    status: str
    is_flagged: bool
    flag_reason: Optional[str] = None
    receipt_url: Optional[str] = None
    audit_trail: Optional[str] = "[]"

class ExpenseStats(BaseModel):
    total_claims: int
    pending_count: int
    approved_count: int
    rejected_count: int
    flagged_count: int
    total_spend_inr: float
    approved_spend_inr: float
    pending_spend_inr: float

class PolicyRuleResponse(BaseModel):
    rule_name: str
    description: str
    threshold: Optional[str] = None
    action: str

class ReceiptParseRequest(BaseModel):
    receipt_text: str = Field(..., description="OCR or raw text extracted from a receipt")
    employee_name: Optional[str] = Field(default="Employee", description="Submitter name")
    workspace_id: Optional[str] = Field(default="ws_demo_123")

class ReceiptParseResponse(BaseModel):
    vendor: str
    amount: float
    currency: str
    category: str
    date: str
    notes: str
    is_flagged: bool
    flag_reasons: List[str]

class LoginRequest(BaseModel):
    email: str = Field(..., description="User email (user@rebur.io or manager@rebur.io)")
    password: str = Field(..., description="Password (password123)")

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str  # "employee" or "manager"
    avatar: str
    title: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

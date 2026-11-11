from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    workspace_id = Column(String(100), default="ws_demo_123", index=True, nullable=False)
    vendor = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    category = Column(String(100), default="General", nullable=False)
    date = Column(String(50), nullable=True)
    employee_name = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, approved, rejected
    is_flagged = Column(Boolean, default=False, nullable=False)
    flag_reason = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    audit_trail = Column(Text, default="[]", nullable=True)  # JSON-serialized audit events

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "workspace_id": self.workspace_id,
            "vendor": self.vendor,
            "amount": self.amount,
            "currency": self.currency,
            "category": self.category,
            "date": self.date,
            "employee_name": self.employee_name,
            "notes": self.notes,
            "status": self.status,
            "is_flagged": self.is_flagged,
            "flag_reason": self.flag_reason,
            "receipt_url": self.receipt_url,
            "audit_trail": self.audit_trail,
        }


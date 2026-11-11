export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: number;
  created_at?: string;
  workspace_id: string;
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  date?: string;
  employee_name: string;
  notes?: string;
  status: ExpenseStatus;
  is_flagged: boolean;
  flag_reason?: string | null;
  receipt_url?: string | null;
  audit_trail?: string | null;
}

export interface ExpenseStats {
  total_claims: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  flagged_count: number;
  total_spend_inr: number;
  approved_spend_inr: number;
  pending_spend_inr: number;
}

export interface PolicyRule {
  rule_name: string;
  description: string;
  threshold?: string;
  action: string;
}

export interface CreateExpensePayload {
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  date?: string;
  employee_name: string;
  notes?: string;
  workspace_id?: string;
  receipt_url?: string;
}

export interface ReceiptParseResponse {
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  notes: string;
  is_flagged: boolean;
  flag_reasons: string[];
}

export type UserRole = 'employee' | 'manager';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  title: string;
}


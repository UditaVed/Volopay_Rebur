import { Expense, ExpenseStats, PolicyRule, CreateExpensePayload, ReceiptParseResponse, AuthUser } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'offline', service: 'ReBur Backend' };
  }
}

export async function fetchExpenses(params?: {
  status?: string;
  category?: string;
  is_flagged?: boolean;
  search?: string;
  workspace_id?: string;
}): Promise<Expense[]> {
  const query = new URLSearchParams();
  if (params?.workspace_id) query.set('workspace_id', params.workspace_id);
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.category && params.category !== 'all') query.set('category', params.category);
  if (params?.is_flagged !== undefined) query.set('is_flagged', String(params.is_flagged));
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE_URL}/api/expenses?${query.toString()}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to load expenses (${res.status})`);
  return await res.json();
}

export async function fetchStats(workspaceId: string = 'ws_demo_123'): Promise<ExpenseStats> {
  const res = await fetch(`${API_BASE_URL}/api/stats?workspace_id=${workspaceId}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to load statistics`);
  return await res.json();
}

export async function fetchPolicies(): Promise<PolicyRule[]> {
  const res = await fetch(`${API_BASE_URL}/api/policies`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load policy rules`);
  return await res.json();
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const res = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create expense' }));
    throw new Error(err.detail || 'Failed to submit expense claim');
  }
  return await res.json();
}

export async function updateExpense(
  id: number,
  payload: { status?: string; notes?: string; is_flagged?: boolean }
): Promise<Expense> {
  const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Failed to update expense #${id}`);
  return await res.json();
}

export async function deleteExpense(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete expense #${id}`);
  return await res.json();
}

export async function parseReceiptAI(receiptText: string, employeeName: string = 'Demo User'): Promise<ReceiptParseResponse> {
  const res = await fetch(`${API_BASE_URL}/api/ai/parse-receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receipt_text: receiptText, employee_name: employeeName })
  });
  if (!res.ok) throw new Error(`Failed to analyze receipt`);
  return await res.json();
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Invalid email or password');
  }
  return await res.json();
}

export async function fetchTestAccounts(): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE_URL}/api/auth/users`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load test accounts');
  return await res.json();
}


'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Expense, ExpenseStats, PolicyRule, CreateExpensePayload, AuthUser } from '@/types';
import {
  fetchHealth,
  fetchExpenses,
  fetchStats,
  fetchPolicies,
  createExpense,
  updateExpense,
  deleteExpense
} from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { MetricsCards } from '@/components/MetricsCards';
import { ExpenseTable } from '@/components/ExpenseTable';
import { SubmitExpenseModal } from '@/components/SubmitExpenseModal';
import { AiSimulatorModal } from '@/components/AiSimulatorModal';
import { PolicyRulesModal } from '@/components/PolicyRulesModal';
import { ExpenseDetailsModal } from '@/components/ExpenseDetailsModal';
import { LoginModal } from '@/components/LoginModal';
import { Download, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [workspaceId, setWorkspaceId] = useState('ws_demo_123');
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: 'usr_mgr_01',
    email: 'manager@rebur.io',
    name: 'Devansh Gupta',
    role: 'manager',
    avatar: 'DG',
    title: 'VP of Finance & Operations'
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const handleSwitchUser = (targetRole: 'employee' | 'manager') => {
    if (targetRole === 'employee') {
      setCurrentUser({
        id: 'usr_emp_01',
        email: 'user@rebur.io',
        name: 'Priya Sharma',
        role: 'employee',
        avatar: 'PS',
        title: 'Senior Product Engineer'
      });
    } else {
      setCurrentUser({
        id: 'usr_mgr_01',
        email: 'manager@rebur.io',
        name: 'Devansh Gupta',
        role: 'manager',
        avatar: 'DG',
        title: 'VP of Finance & Operations'
      });
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [healthRes, expensesRes, statsRes, policiesRes] = await Promise.allSettled([
        fetchHealth(),
        fetchExpenses({
          workspace_id: workspaceId,
          status: statusFilter === 'flagged' ? 'all' : statusFilter,
          category: categoryFilter,
          search: searchQuery,
          is_flagged: statusFilter === 'flagged' ? true : undefined
        }),
        fetchStats(workspaceId),
        fetchPolicies()
      ]);

      if (healthRes.status === 'fulfilled') {
        setIsOnline(healthRes.value.status === 'alive');
      } else {
        setIsOnline(false);
      }

      if (expensesRes.status === 'fulfilled') {
        setExpenses(expensesRes.value);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (policiesRes.status === 'fulfilled') {
        setPolicies(policiesRes.value);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [workspaceId, statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleApprove = async (id: number) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'approved' } : e))
    );
    try {
      await updateExpense(id, { status: 'approved' });
      const newStats = await fetchStats(workspaceId);
      setStats(newStats);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleReject = async (id: number) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e))
    );
    try {
      await updateExpense(id, { status: 'rejected' });
      const newStats = await fetchStats(workspaceId);
      setStats(newStats);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleDelete = async (id: number) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteExpense(id);
      const newStats = await fetchStats(workspaceId);
      setStats(newStats);
    } catch (err) {
      console.error(err);
      loadData();
    }
  };

  const handleSubmitClaim = async (payload: CreateExpensePayload) => {
    const created = await createExpense(payload);
    setExpenses((prev) => [created, ...prev]);
    const newStats = await fetchStats(workspaceId);
    setStats(newStats);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        isOnline={isOnline}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenPolicies={() => setIsPoliciesOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        workspaceId={workspaceId}
        setWorkspaceId={setWorkspaceId}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* Clean Page Title Header without redundant duplicate action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Expenses &amp; Approvals
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review employee submissions, verify policy audit flags, and process reimbursements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'manager' ? (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/expenses/export/csv?status=${statusFilter}`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </a>
            ) : (
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>File New Claim</span>
              </button>
            )}
          </div>
        </div>

        {/* Aggregate KPI Metric Cards */}
        <MetricsCards
          stats={stats}
          onFilterStatus={(status) => setStatusFilter(status)}
        />

        {/* Expenses Interactive Ledger */}
        <div className="mt-4">
          <ExpenseTable
            expenses={expenses}
            currentUser={currentUser}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            onSelectExpense={(exp) => setSelectedExpense(exp)}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-900">ReBur</span>
            <span>&bull;</span>
            <span>Volopay Product Tech MVP</span>
          </div>
          <div className="text-slate-400">
            FastAPI, Model Context Protocol (MCP) &amp; Next.js
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SubmitExpenseModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmitClaim}
        workspaceId={workspaceId}
        currentUser={currentUser}
      />

      <AiSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSubmitClaim={handleSubmitClaim}
        workspaceId={workspaceId}
      />

      <PolicyRulesModal
        isOpen={isPoliciesOpen}
        onClose={() => setIsPoliciesOpen(false)}
        policies={policies}
      />

      <ExpenseDetailsModal
        expense={selectedExpense}
        currentUser={currentUser}
        onClose={() => setSelectedExpense(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(u) => setCurrentUser(u)}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Expense, AuthUser } from '@/types';
import {
  Search,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Receipt,
  Eye,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  currentUser?: AuthUser;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSelectExpense: (expense: Expense) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  currentUser,
  onApprove,
  onReject,
  onDelete,
  onSelectExpense,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  isLoading
}) => {
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Reset to first page when any filter or query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchQuery]);

  const handleAction = async (id: number, action: 'approve' | 'reject' | 'delete') => {
    setActionInProgress(id);
    try {
      if (action === 'approve') await onApprove(id);
      else if (action === 'reject') await onReject(id);
      else if (action === 'delete') await onDelete(id);
    } finally {
      setActionInProgress(null);
    }
  };

  const categories = [
    'all',
    'Meals',
    'Travel',
    'Software & Cloud',
    'Office Supplies',
    'Alcohol',
    'Entertainment',
    'General'
  ];

  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const flaggedCount = expenses.filter(e => e.is_flagged).length;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(expenses.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedExpenses = expenses.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Filter & Search Bar */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
          {[
            { id: 'all', label: 'All Claims', count: 0 },
            { id: 'pending', label: 'Pending', count: statusFilter === 'all' ? pendingCount : 0 },
            { id: 'flagged', label: 'Policy Flags', count: statusFilter === 'all' ? flaggedCount : 0 },
            { id: 'approved', label: 'Approved', count: 0 },
            { id: 'rejected', label: 'Rejected', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab.id === 'flagged' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-md placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-slate-900 transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table - Streamlined 6 columns to prevent overflowing */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-3.5 w-24">Claim</th>
              <th className="py-2.5 px-3.5">Employee</th>
              <th className="py-2.5 px-3.5">Merchant, Notes &amp; Category</th>
              <th className="py-2.5 px-3.5 text-right">Amount</th>
              <th className="py-2.5 px-3.5">Status &amp; Policy</th>
              <th className="py-2.5 px-3.5 text-right w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin text-slate-400" />
                    <span>Loading expense records...</span>
                  </div>
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-700 text-sm">No expenses found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No records match the current filter criteria.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedExpenses.map((expense) => {
                const isBusy = actionInProgress === expense.id;
                return (
                  <tr
                    key={expense.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectExpense(expense)}
                  >
                    {/* ID & Date */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-mono text-slate-900 font-medium">
                        #{expense.id}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {expense.date || 'Recent'}
                      </div>
                    </td>

                    {/* Employee */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {expense.employee_name}
                      </div>
                    </td>

                    {/* Merchant, Notes & Category on Same Row */}
                    <td className="py-2.5 px-3.5 max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">
                          {expense.vendor}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
                          {expense.category}
                        </span>
                      </div>
                      {expense.notes && (
                        <div className="text-[11px] text-slate-500 truncate mt-0.5" title={expense.notes}>
                          {expense.notes}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-sm tabular-nums">
                        {expense.currency === 'INR' || expense.currency === '₹' ? '₹' : expense.currency + ' '}
                        {expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Merged Status & Policy */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {expense.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Approved
                        </span>
                      )}
                      {expense.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Rejected
                        </span>
                      )}
                      {expense.status === 'pending' && (
                        expense.is_flagged ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 w-fit"
                              title={expense.flag_reason || 'Policy violation flagged for review'}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span className="truncate max-w-[130px]">
                                {expense.flag_reason?.includes('₹5,000') 
                                  ? 'Exceeds ₹5k'
                                  : expense.flag_reason?.includes('Alcohol')
                                  ? 'Restricted'
                                  : expense.flag_reason?.includes('duplicate')
                                  ? 'Duplicate'
                                  : 'Policy Flag'}
                              </span>
                            </span>
                            <span className="text-[10px] text-amber-700 pl-0.5">Pending Sign-off</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        )
                      )}
                    </td>

                    {/* Actions - Always visible, clean spacing */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {currentUser?.role === 'manager' ? (
                          expense.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleAction(expense.id, 'approve')}
                                disabled={isBusy}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded transition-colors shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(expense.id, 'reject')}
                                disabled={isBusy}
                                className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 rounded transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 mr-1 font-medium">Audited</span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400 mr-1 italic">
                            {expense.status === 'pending' ? 'Needs Manager' : 'Processed'}
                          </span>
                        )}

                        <button
                          onClick={() => onSelectExpense(expense)}
                          title="View Details"
                          className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Exactly 10 entries per page */}
      {expenses.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(startIndex + pageSize, expenses.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{expenses.length}</span> claims
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 py-1 text-xs text-slate-600 font-medium">
              Page {validPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

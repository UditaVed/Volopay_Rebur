'use client';

import React, { useState } from 'react';
import { Expense, AuthUser } from '@/types';
import { X, Check, AlertCircle, ShieldCheck, User, Calendar, Tag, FileText } from 'lucide-react';

interface ExpenseDetailsModalProps {
  expense: Expense | null;
  currentUser?: AuthUser;
  onClose: () => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  expense,
  currentUser,
  onClose,
  onApprove,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!expense) return null;

  const handleAction = async (action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      if (action === 'approve') await onApprove(expense.id);
      else await onReject(expense.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="font-semibold text-slate-900 text-base">
              Claim #{expense.id}
            </h2>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                expense.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : expense.status === 'rejected'
                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {expense.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {/* Amount Card */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Claim Amount</span>
              <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                {expense.currency === 'INR' || expense.currency === '₹' ? '₹' : expense.currency + ' '}
                {expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700">
              {expense.category}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 font-medium block mb-1">Submitter</span>
              <span className="font-medium text-slate-900 text-sm">{expense.employee_name}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-400 font-medium block mb-1">Date</span>
              <span className="font-medium text-slate-900 text-sm">{expense.date || 'N/A'}</span>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200 col-span-2">
              <span className="text-slate-400 font-medium block mb-1">Vendor / Merchant</span>
              <span className="font-semibold text-slate-900 text-sm">{expense.vendor}</span>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium block mb-1">Purpose / Notes</span>
              <p className="text-slate-700 leading-relaxed text-xs">{expense.notes}</p>
            </div>
          )}

          {/* Policy Compliance Audit */}
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              expense.is_flagged
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {expense.is_flagged ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block">
                {expense.is_flagged ? 'Policy Flag Audit' : 'Policy Audit Passed'}
              </span>
              <p className="mt-0.5 text-xs text-slate-600">
                {expense.is_flagged
                  ? expense.flag_reason || 'Flagged for manager review.'
                  : 'Claim satisfies all corporate policy guidelines and spending thresholds.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium text-xs transition-colors"
          >
            Close
          </button>

          {expense.status === 'pending' ? (
            currentUser?.role === 'manager' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 font-medium text-xs rounded-md transition-colors"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors"
                >
                  Approve Claim
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Awaiting manager authorization
              </span>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

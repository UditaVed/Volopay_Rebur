'use client';

import React from 'react';
import { ExpenseStats } from '@/types';
import { Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface MetricsCardsProps {
  stats: ExpenseStats | null;
  onFilterStatus?: (status: string) => void;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ stats, onFilterStatus }) => {
  const pending = stats?.pending_count ?? 0;
  const flagged = stats?.flagged_count ?? 0;
  const approved = stats?.approved_count ?? 0;
  const approvedSpend = stats?.approved_spend_inr ?? 0;
  const totalSpend = stats?.total_spend_inr ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. Pending Approvals */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('pending')}
        className="cursor-pointer bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Awaiting Review</span>
          <Clock className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{pending}</span>
          <span className="text-[11px] text-amber-700 bg-amber-50 font-medium px-2 py-0.5 rounded border border-amber-200/60">
            Action Required
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Claims waiting for manager sign-off</p>
      </div>

      {/* 2. Policy Flags */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('flagged')}
        className="cursor-pointer bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Policy Flags</span>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{flagged}</span>
          <span className="text-[11px] text-rose-700 bg-rose-50 font-medium px-2 py-0.5 rounded border border-rose-200/60">
            Escalated
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Limit exceeded or prohibited category</p>
      </div>

      {/* 3. Approved Reimbursements */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('approved')}
        className="cursor-pointer bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors"
      >
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Approved Reimbursements</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            ₹{approvedSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded border border-emerald-200/60">
            {approved} Approved
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Authorized for accounting payout</p>
      </div>

      {/* 4. Total Pipeline Volume */}
      <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Total Pipeline Volume</span>
          <TrendingUp className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            ₹{totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            ({stats?.total_claims ?? 0} claims)
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Total volume across current workspace</p>
      </div>
    </div>
  );
};

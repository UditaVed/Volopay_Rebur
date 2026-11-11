'use client';

import React from 'react';
import { PolicyRule } from '@/types';
import { X, Scale } from 'lucide-react';

interface PolicyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: PolicyRule[];
}

export const PolicyRulesModal: React.FC<PolicyRulesModalProps> = ({
  isOpen,
  onClose,
  policies
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 text-base">
                Corporate Expense Policy
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enforced deterministically by the backend policy engine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs">
          {policies.map((policy, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200 bg-white"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900 text-xs">
                  {idx + 1}. {policy.rule_name}
                </span>
                {policy.threshold && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                    {policy.threshold}
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {policy.description}
              </p>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Action: <span className="text-slate-800">{policy.action}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

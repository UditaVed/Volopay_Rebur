'use client';

import React, { useState, useEffect } from 'react';
import { CreateExpensePayload, AuthUser } from '@/types';
import { X, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface SubmitExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateExpensePayload) => Promise<void>;
  workspaceId: string;
  currentUser?: AuthUser;
}

export const SubmitExpenseModal: React.FC<SubmitExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workspaceId,
  currentUser
}) => {
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [category, setCategory] = useState('Meals');
  const [date, setDate] = useState('');
  const [employeeName, setEmployeeName] = useState('Priya Sharma');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().split('T')[0]);
  }, []);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const isOverLimit = (currency === 'INR' || currency === '₹') && numAmount > 5000;
  const isRestrictedCat = ['alcohol', 'entertainment'].includes(category.toLowerCase());
  const willFlag = isOverLimit || isRestrictedCat;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'manager') {
      setErrorMsg('Policy Violation: Managers cannot file expenses in Approver Mode (Segregation of Duties). Please switch to an Employee account.');
      return;
    }

    if (!vendor.trim()) {
      setErrorMsg('Vendor name is required.');
      return;
    }
    if (numAmount <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }
    if (!employeeName.trim()) {
      setErrorMsg('Employee name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        vendor: vendor.trim(),
        amount: numAmount,
        currency,
        category,
        date,
        employee_name: employeeName.trim(),
        notes: notes.trim(),
        workspace_id: workspaceId
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit expense claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">New Expense Claim</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit claim for manager review and compliance auditing.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {currentUser?.role === 'manager' && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Segregation of Duties Policy:</span> You are currently logged in as a <strong>Manager / Approver</strong>. Managers cannot self-file or approve their own expenses. Please switch to an Employee account to submit claims.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Submitter Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Employee Name / ID
            </label>
            <input
              type="text"
              required
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Vendor / Merchant
            </label>
            <input
              type="text"
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Uber, AWS, Blue Tokai"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          {/* Amount & Currency Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 font-medium tabular-nums focus:outline-hidden focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
              >
                <option value="Meals">Meals</option>
                <option value="Travel">Travel</option>
                <option value="Software & Cloud">Software & Cloud</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Alcohol">Alcohol (Restricted)</option>
                <option value="Entertainment">Entertainment (Restricted)</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Transaction Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Business Purpose / Justification
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client dinner with partner engineering team"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          {/* Policy Preview Card */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
              willFlag
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {willFlag ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold">
                {willFlag ? 'Policy Notice:' : 'Standard Policy:'}
              </span>{' '}
              {isOverLimit && 'Claim exceeds ₹5,000 threshold and will be flagged for Senior Manager escalation. '}
              {isRestrictedCat && 'Category is marked as restricted by corporate spend policy. '}
              {!willFlag && 'Claim meets standard threshold and qualifies for regular approval flow.'}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-200 text-slate-700 font-medium rounded-md hover:bg-slate-50 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentUser?.role === 'manager'}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md shadow-2xs text-xs transition-colors"
            >
              {isSubmitting ? 'Submitting...' : currentUser?.role === 'manager' ? 'Submission Locked for Managers' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

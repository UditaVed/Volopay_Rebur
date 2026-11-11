'use client';

import React, { useState } from 'react';
import { parseReceiptAI } from '@/lib/api';
import { CreateExpensePayload, ReceiptParseResponse } from '@/types';
import { X, Sparkles, AlertCircle, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AiSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitClaim: (payload: CreateExpensePayload) => Promise<void>;
  workspaceId: string;
}

const PRESET_RECEIPTS = [
  {
    title: 'Uber Travel (₹940)',
    tag: 'Compliant',
    text: `UBER INDIA TECHNOLOGY PVT LTD
Date: 2026-11-10
Trip: Indiranagar to Kempegowda Intl Airport
Base Fare: ₹850.00
Tolls: ₹90.00
Total Amount: ₹940.00
Payment Method: Corporate Amex`
  },
  {
    title: 'Client Banquet (₹14,800)',
    tag: 'Flagged (>₹5k)',
    text: `TAJ PALACE NEW DELHI - ORIENTAL OCTOPUS
Date: 2026-11-09
Table 14 - Covers 4
Private Dining & Business Banquet: ₹12,500.00
GST & Service: ₹2,300.00
Grand Total: ₹14,800.00
Notes: Q3 Enterprise Customer Dinner`
  },
  {
    title: 'Social Pub (₹3,800)',
    tag: 'Flagged (Alcohol)',
    text: `THE BEER CAFE & TAPROOM
Date: 2026-11-08
Craft Beer Pitchers x 3: ₹2,400.00
Cocktails x 2: ₹1,400.00
Net Total: ₹3,800.00
Employee: Team Social Drinks`
  },
  {
    title: 'AWS Cloud (₹3,600)',
    tag: 'Compliant',
    text: `AMAZON WEB SERVICES INDIA
Invoice Date: 2026-11-07
Service: EC2 & RDS Multi-AZ Instance
Subtotal: ₹3,050.85
IGST 18%: ₹549.15
Total Due: ₹3,600.00`
  }
];

export const AiSimulatorModal: React.FC<AiSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSubmitClaim,
  workspaceId
}) => {
  const [receiptText, setReceiptText] = useState(PRESET_RECEIPTS[0].text);
  const [employeeName, setEmployeeName] = useState('Ananya Joshi');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ReceiptParseResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExtract = async () => {
    setIsExtracting(true);
    setExtractionResult(null);
    setSubmitSuccess(false);
    try {
      const result = await parseReceiptAI(receiptText, employeeName);
      setExtractionResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCommitClaim = async () => {
    if (!extractionResult) return;
    setIsSubmitting(true);
    try {
      await onSubmitClaim({
        vendor: extractionResult.vendor,
        amount: extractionResult.amount,
        currency: extractionResult.currency,
        category: extractionResult.category,
        date: extractionResult.date,
        employee_name: employeeName,
        notes: extractionResult.notes,
        workspace_id: workspaceId
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-900 text-base">
                Claude MCP Agent Simulator
              </h2>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                mcp::submit_expense
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate how Claude Desktop extracts receipts and interacts with the ReBur policy engine.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Select Sample Receipt:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_RECEIPTS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReceiptText(preset.text);
                    setExtractionResult(null);
                    setSubmitSuccess(false);
                  }}
                  className="p-2.5 text-left rounded-md border border-slate-200 hover:border-slate-400 bg-white transition-colors"
                >
                  <div className="font-medium text-slate-900 text-xs truncate">
                    {preset.title}
                  </div>
                  <span
                    className={`inline-block mt-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                      preset.tag.includes('Flagged')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    }`}
                  >
                    {preset.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submitter & Workspace */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Submitter Employee
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Workspace Partition
              </label>
              <input
                type="text"
                disabled
                value={workspaceId}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 bg-slate-50 rounded-md text-slate-500 font-mono"
              />
            </div>
          </div>

          {/* OCR text */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Receipt OCR / Dropped Text
            </label>
            <textarea
              rows={4}
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              className="w-full font-mono text-xs p-3 border border-slate-300 rounded-md bg-slate-50 text-slate-800 focus:outline-hidden focus:border-slate-900"
            />
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md shadow-2xs text-xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isExtracting ? 'Analyzing...' : 'Run Extraction & Policy Check'}</span>
            </button>
          </div>

          {/* Output Panel */}
          {extractionResult && (
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-900 text-xs">
                  Structured Payload Extracted by Agent
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  FastMCP Protocol
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Vendor</span>
                  <span className="font-semibold text-slate-900 text-xs">{extractionResult.vendor}</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Amount</span>
                  <span className="font-semibold text-slate-900 text-xs tabular-nums">
                    {extractionResult.currency} {extractionResult.amount.toLocaleString()}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Category</span>
                  <span className="font-medium text-slate-800 text-xs">{extractionResult.category}</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Date</span>
                  <span className="font-mono text-slate-700 text-xs">{extractionResult.date}</span>
                </div>
              </div>

              {/* Policy result */}
              <div
                className={`p-3 rounded border text-xs flex items-start gap-2 ${
                  extractionResult.is_flagged
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {extractionResult.is_flagged ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold block">
                    {extractionResult.is_flagged ? 'Policy Flag Intercepted:' : 'Policy Verified:'}
                  </span>
                  {extractionResult.is_flagged ? (
                    <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                      {extractionResult.flag_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs mt-0.5">
                      Claim passes spending thresholds and complies with expense policies.
                    </p>
                  )}
                </div>
              </div>

              {/* Commit claim button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ready to commit to ReBur database
                </span>
                <button
                  onClick={handleCommitClaim}
                  disabled={isSubmitting || submitSuccess}
                  className={`px-3.5 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
                    submitSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {submitSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Claim Logged Successfully
                    </>
                  ) : (
                    <>
                      <span>{isSubmitting ? 'Logging...' : 'File Claim via MCP Tool'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/types';
import { loginUser } from '@/lib/api';
import { X, User, Shield, CheckCircle, ArrowRight, Lock } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await loginUser(email, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await loginUser(roleEmail, 'password123');
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">
              Sign In to ReBur
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a test account or enter your credentials
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
        <div className="p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Quick 1-Click Role Switchers for Testing */}
          <div>
            <span className="block font-medium text-slate-700 mb-2">
              Instant 1-Click Test Logins:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Employee Login */}
              <button
                type="button"
                onClick={() => handleQuickLogin('user@rebur.io')}
                disabled={isLoading}
                className="p-3 text-left rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    PS
                  </div>
                  <span className="font-semibold text-slate-900 text-xs">Employee</span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">Priya Sharma</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Submit &amp; track claims</div>
              </button>

              {/* Manager Login */}
              <button
                type="button"
                onClick={() => handleQuickLogin('manager@rebur.io')}
                disabled={isLoading}
                className="p-3 text-left rounded-lg border border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    DG
                  </div>
                  <span className="font-semibold text-indigo-950 text-xs">Manager</span>
                </div>
                <div className="text-[11px] text-indigo-900 font-medium">Devansh Gupta</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Approve, reject &amp; audit</div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-slate-400 text-[11px]">or enter credentials</span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@rebur.io or manager@rebur.io"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md text-slate-900 focus:outline-hidden focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-xs transition-colors shadow-2xs"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


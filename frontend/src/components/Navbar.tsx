'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/types';
import { RefreshCw, BookOpen, Sparkles, Plus, ChevronDown, User, Shield, Check, LogOut } from 'lucide-react';

interface NavbarProps {
  isOnline: boolean;
  currentUser: AuthUser;
  onSwitchUser: (targetRole: 'employee' | 'manager') => void;
  onOpenLogin: () => void;
  onOpenSubmit: () => void;
  onOpenSimulator: () => void;
  onOpenPolicies: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  workspaceId: string;
  setWorkspaceId: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isOnline,
  currentUser,
  onSwitchUser,
  onOpenLogin,
  onOpenSubmit,
  onOpenSimulator,
  onOpenPolicies,
  onRefresh,
  isRefreshing,
  workspaceId,
  setWorkspaceId
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand & Workspace */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
                RB
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm sm:text-base tracking-tight">ReBur</span>
                <span className="text-xs text-slate-300 hidden sm:inline">/</span>
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">Spend Ops</span>
              </div>
            </div>

            {/* Workspace Selector */}
            <div className="relative hidden md:block">
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="appearance-none text-xs font-medium bg-slate-50 border border-slate-200 rounded-md pl-2.5 pr-7 py-1.5 text-slate-700 hover:bg-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                <option value="ws_demo_123">ws_demo_123 (Main)</option>
                <option value="ws_engineering">Engineering Team</option>
                <option value="ws_marketing">Marketing Team</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isOnline ? 'Online' : 'Connecting...'}</span>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh ledger"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
            </button>

            {/* Policy Handbook */}
            <button
              onClick={onOpenPolicies}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Policies</span>
            </button>

            {/* AI Agent / MCP Assistant */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Claude</span> MCP Test
            </button>

            {/* Role-Based Action: Employees submit claims; Managers only audit/approve (Separation of Duties) */}
            {currentUser?.role === 'employee' ? (
              <button
                onClick={onOpenSubmit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Expense</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/70 rounded-md">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Approver Mode</span>
              </div>
            )}

            {/* User Profile / Role Switcher */}
            <div className="relative pl-1.5 sm:pl-2 border-l border-slate-200">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-md hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
                  currentUser?.role === 'manager' ? 'bg-indigo-600' : 'bg-slate-700'
                }`}>
                  {currentUser?.avatar || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {currentUser?.name || 'Account'}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${currentUser?.role === 'manager' ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                    <span className="capitalize">{currentUser?.role || 'Guest'}</span>
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-40 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-semibold text-slate-900">{currentUser?.name || 'Account'}</div>
                    <div className="text-slate-400 text-[11px]">{currentUser?.email || ''}</div>
                    <div className="mt-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        currentUser?.role === 'manager'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        Role: {currentUser?.role || 'User'}
                      </span>
                    </div>
                  </div>

                  <div className="px-2 py-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Switch Role (Testing)
                    </div>
                    <button
                      onClick={() => {
                        onSwitchUser('employee');
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-50 ${
                        currentUser?.role === 'employee' ? 'font-semibold text-slate-900 bg-slate-50' : 'text-slate-700'
                      }`}
                    >
                      <span>👤 Employee (Priya Sharma)</span>
                      {currentUser?.role === 'employee' && <Check className="w-3.5 h-3.5 text-slate-900" />}
                    </button>
                    <button
                      onClick={() => {
                        onSwitchUser('manager');
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-slate-50 ${
                        currentUser?.role === 'manager' ? 'font-semibold text-slate-900 bg-slate-50' : 'text-slate-700'
                      }`}
                    >
                      <span>👑 Manager (Devansh Gupta)</span>
                      {currentUser?.role === 'manager' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 px-2 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-2 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded flex items-center gap-1.5"
                    >
                      <LogOut className="w-3 h-3 text-slate-400" />
                      <span>Sign In with Credentials...</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

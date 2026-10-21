import React from 'react';
import {
  Building2,
  User,
  ShieldCheck,
  UserCheck,
  Eye,
  RotateCcw,
  Trash2,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { storage } from '../../services/storage.ts';
import { UserProfile, UserRole } from '../../types/index.ts';

interface HeaderProps {
  currentUser: UserProfile;
  users: UserProfile[];
  onToggleSidebar: () => void;
  onOpenHelp: () => void;
  onOpenClearModal: () => void;
  onRestoreDemo: () => void;
}

export function Header({
  currentUser,
  users,
  onToggleSidebar,
  onOpenHelp,
  onOpenClearModal,
  onRestoreDemo,
}: HeaderProps) {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
            Super Admin (Head HR)
          </span>
        );
      case 'admin_personnel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            Admin Personnel
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            Viewer (Read-Only)
          </span>
        );
    }
  };

  const handleSwitchUser = (userId: string) => {
    const selected = users.find((u) => u.id === userId);
    if (selected) {
      storage.setCurrentUser(selected);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Project Branding */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  HRADMOPTS
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                  EPCC Infra Project Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block mt-0.5">
                HR &amp; Administration Operations Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right: Role Switcher / Demo Controls / User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Demo Data Reset / Restore */}
          <div className="hidden xl:flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <button
              type="button"
              onClick={onOpenClearModal}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded border border-slate-200 flex items-center gap-1 transition"
              title="Clear all demo operational data"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              Clear Demo Data
            </button>
            <button
              type="button"
              onClick={onRestoreDemo}
              className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded border border-blue-200 flex items-center gap-1 transition"
              title="Restore standard EPCC project demo datasets"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              Restore Demo
            </button>
          </div>

          {/* Help button */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-1.5 sm:px-2.5 sm:py-1 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 flex items-center gap-1 transition"
            title="User Guides & Firebase Setup"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Guide &amp; Firebase</span>
          </button>

          {/* Quick Role Switcher for Testing */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <User className="w-3.5 h-3.5 text-slate-500 ml-1 hidden sm:inline" />
            <span className="hidden md:inline text-slate-600 font-medium">Logged in as:</span>
            <select
              value={currentUser.id}
              onChange={(e) => handleSwitchUser(e.target.value)}
              className="bg-white border border-slate-300 font-semibold text-slate-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              title="Switch user account to test Super Admin, Admin Personnel, or Viewer roles"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Role badge */}
          <div className="hidden lg:block">{getRoleBadge(currentUser.role)}</div>
        </div>
      </div>
    </header>
  );
}

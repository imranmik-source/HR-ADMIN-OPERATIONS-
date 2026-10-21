import React from 'react';
import {
  LayoutDashboard,
  Users2,
  FileCheck2,
  Hotel,
  Home,
  Droplets,
  Sparkles,
  UtensilsCrossed,
  ScrollText,
  Zap,
  HeartPulse,
  Truck,
  UserCog,
  History,
  HelpCircle,
  X,
} from 'lucide-react';
import { UserProfile, WorkspaceId } from '../../types/index.ts';

export type NavItemKey =
  | 'dashboard'
  | WorkspaceId
  | 'user_management'
  | 'audit_log'
  | 'help_guide';

interface SidebarProps {
  currentView: NavItemKey;
  onSelectView: (view: NavItemKey) => void;
  currentUser: UserProfile;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  currentView,
  onSelectView,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  // Check workspace assignment:
  // Super Admin has full access, otherwise user must have workspace in assignedWorkspaces
  const canAccessWorkspace = (wsId: WorkspaceId) => {
    if (currentUser.role === 'super_admin') return true;
    return currentUser.assignedWorkspaces.includes(wsId);
  };

  const menuSections = [
    {
      title: 'Overview',
      items: [
        {
          key: 'dashboard' as NavItemKey,
          label: 'Operations Dashboard',
          icon: LayoutDashboard,
          visible: true,
        },
      ],
    },
    {
      title: 'Operations Workspaces',
      items: [
        {
          key: 'workspace_a' as NavItemKey,
          label: 'WS-A Master Data (Staff & Vendors)',
          icon: Users2,
          visible: canAccessWorkspace('workspace_a'),
        },
        {
          key: 'workspace_b' as NavItemKey,
          label: 'WS-B Invoice Verification',
          icon: FileCheck2,
          visible: canAccessWorkspace('workspace_b'),
        },
        {
          key: 'workspace_c' as NavItemKey,
          label: 'WS-C Staff Accommodation',
          icon: Hotel,
          visible: canAccessWorkspace('workspace_c'),
        },
        {
          key: 'workspace_d' as NavItemKey,
          label: 'WS-D Workmen Colony',
          icon: Home,
          visible: canAccessWorkspace('workspace_d'),
        },
        {
          key: 'workspace_e' as NavItemKey,
          label: 'WS-E Water Consumption',
          icon: Droplets,
          visible: canAccessWorkspace('workspace_e'),
        },
        {
          key: 'workspace_f' as NavItemKey,
          label: 'WS-F Sanitation',
          icon: Sparkles,
          visible: canAccessWorkspace('workspace_f'),
        },
        {
          key: 'workspace_g' as NavItemKey,
          label: 'WS-G Workmen Canteen',
          icon: UtensilsCrossed,
          visible: canAccessWorkspace('workspace_g'),
        },
        {
          key: 'workspace_h' as NavItemKey,
          label: 'WS-H Rent Agreements',
          icon: ScrollText,
          visible: canAccessWorkspace('workspace_h'),
        },
        {
          key: 'workspace_i' as NavItemKey,
          label: 'WS-I Electricity Consumption',
          icon: Zap,
          visible: canAccessWorkspace('workspace_i'),
        },
        {
          key: 'workspace_j' as NavItemKey,
          label: 'WS-J Medical Facility',
          icon: HeartPulse,
          visible: canAccessWorkspace('workspace_j'),
        },
        {
          key: 'workspace_l' as NavItemKey,
          label: 'WS-L Service Vendor Master',
          icon: Truck,
          visible: canAccessWorkspace('workspace_l'),
        },
      ],
    },
    {
      title: 'Governance & Administration',
      items: [
        {
          key: 'user_management' as NavItemKey,
          label: 'User Management',
          icon: UserCog,
          visible: currentUser.role === 'super_admin',
        },
        {
          key: 'audit_log' as NavItemKey,
          label: 'Audit Trail & Log',
          icon: History,
          visible: currentUser.role === 'super_admin',
        },
        {
          key: 'help_guide' as NavItemKey,
          label: 'Help & Operations Manual',
          icon: HelpCircle,
          visible: true,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
              Operations Portal
            </span>
            <p className="text-sm font-semibold text-white">Navigation Menu</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          onSelectView(item.key);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-white font-semibold truncate leading-snug">
                {currentUser.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

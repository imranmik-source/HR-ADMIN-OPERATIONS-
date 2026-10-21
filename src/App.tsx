/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header.tsx';
import { Sidebar, NavItemKey } from './components/layout/Sidebar.tsx';
import { Dashboard } from './components/dashboard/Dashboard.tsx';
import { WorkspaceA } from './components/workspaces/WorkspaceA.tsx';
import { WorkspaceB } from './components/workspaces/WorkspaceB.tsx';
import { WorkspaceC } from './components/workspaces/WorkspaceC.tsx';
import { WorkspaceD } from './components/workspaces/WorkspaceD.tsx';
import { WorkspaceE } from './components/workspaces/WorkspaceE.tsx';
import { WorkspaceF } from './components/workspaces/WorkspaceF.tsx';
import { WorkspaceG } from './components/workspaces/WorkspaceG.tsx';
import { WorkspaceH } from './components/workspaces/WorkspaceH.tsx';
import { WorkspaceI } from './components/workspaces/WorkspaceI.tsx';
import { WorkspaceJ } from './components/workspaces/WorkspaceJ.tsx';
import { WorkspaceL } from './components/workspaces/WorkspaceL.tsx';
import { UserManagement } from './components/admin/UserManagement.tsx';
import { AuditLogView } from './components/admin/AuditLogView.tsx';
import { HelpGuide } from './components/help/HelpGuide.tsx';
import { Modal } from './components/common/Modal.tsx';
import { storage } from './services/storage.ts';
import { UserProfile, WorkspaceId } from './types/index.ts';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.currentUser);
  const [users, setUsers] = useState<UserProfile[]>(storage.users);
  const [currentView, setCurrentView] = useState<NavItemKey>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to live storage updates
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.currentUser);
      setUsers([...storage.users]);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearDemoData = () => {
    storage.clearDemoData();
    setIsClearModalOpen(false);
    showToast('Demo data cleared successfully.');
  };

  const handleRestoreDemoData = () => {
    storage.restoreDemoData();
    showToast('Standard EPCC project demo datasets restored.');
  };

  // Guard view permission: if current view is a workspace and user lacks permission, redirect to dashboard
  useEffect(() => {
    if (
      currentView !== 'dashboard' &&
      currentView !== 'help_guide' &&
      currentView !== 'user_management' &&
      currentView !== 'audit_log'
    ) {
      const wsId = currentView as WorkspaceId;
      if (
        currentUser.role !== 'super_admin' &&
        !currentUser.assignedWorkspaces.includes(wsId)
      ) {
        setCurrentView('dashboard');
      }
    } else if (
      (currentView === 'user_management' || currentView === 'audit_log') &&
      currentUser.role !== 'super_admin'
    ) {
      setCurrentView('dashboard');
    }
  }, [currentUser, currentView]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        onOpenHelp={() => setCurrentView('help_guide')}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        onRestoreDemo={handleRestoreDemoData}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          currentUser={currentUser}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <Dashboard currentUser={currentUser} onNavigate={setCurrentView} />
          )}
          {currentView === 'workspace_a' && <WorkspaceA currentUser={currentUser} />}
          {currentView === 'workspace_b' && <WorkspaceB currentUser={currentUser} />}
          {currentView === 'workspace_c' && <WorkspaceC currentUser={currentUser} />}
          {currentView === 'workspace_d' && <WorkspaceD currentUser={currentUser} />}
          {currentView === 'workspace_e' && <WorkspaceE currentUser={currentUser} />}
          {currentView === 'workspace_f' && <WorkspaceF currentUser={currentUser} />}
          {currentView === 'workspace_g' && <WorkspaceG currentUser={currentUser} />}
          {currentView === 'workspace_h' && <WorkspaceH currentUser={currentUser} />}
          {currentView === 'workspace_i' && <WorkspaceI currentUser={currentUser} />}
          {currentView === 'workspace_j' && <WorkspaceJ currentUser={currentUser} />}
          {currentView === 'workspace_l' && <WorkspaceL currentUser={currentUser} />}
          {currentView === 'user_management' && <UserManagement currentUser={currentUser} />}
          {currentView === 'audit_log' && <AuditLogView currentUser={currentUser} />}
          {currentView === 'help_guide' && <HelpGuide />}
        </main>
      </div>

      {/* Clear Demo Data Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear All Demo Data"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p>
              This will wipe all operational sample records (Staff, Vendors, Invoices, Allotments,
              Utilities, Canteen, and Agreements) so you can start with a clean slate. You can restore
              it at any time using <strong>Restore Demo</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClearDemoData}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
            >
              Yes, Clear All Data
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

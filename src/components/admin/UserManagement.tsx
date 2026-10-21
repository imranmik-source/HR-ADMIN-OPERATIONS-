import React, { useState } from 'react';
import { UserCog, ShieldCheck, UserCheck, Eye, Plus, CheckSquare, Square, Trash2, Edit2 } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { UserProfile, UserRole, WorkspaceId } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { ALL_WORKSPACES, ALL_WORKSPACE_IDS } from '../../services/demoData.ts';
import { formatDDMMMYYYY } from '../../utils/calculations.ts';

interface UserManagementProps {
  currentUser: UserProfile;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>(storage.users);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    assignedWorkspaces: WorkspaceId[];
  }>({
    name: '',
    email: '',
    role: 'admin_personnel',
    assignedWorkspaces: [
      'workspace_a',
      'workspace_b',
      'workspace_c',
      'workspace_d',
      'workspace_e',
      'workspace_f',
      'workspace_g',
      'workspace_l',
    ],
  });

  const [formError, setFormError] = useState('');

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'admin_personnel',
      assignedWorkspaces: [
        'workspace_a',
        'workspace_b',
        'workspace_c',
        'workspace_d',
        'workspace_e',
        'workspace_f',
        'workspace_g',
        'workspace_l',
      ],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      assignedWorkspaces: [...user.assignedWorkspaces],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    if (editingUser) {
      storage.updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        assignedWorkspaces:
          formData.role === 'super_admin' ? [...ALL_WORKSPACE_IDS] : formData.assignedWorkspaces,
      });
      setUsers([...storage.users]);
    } else {
      const duplicate = users.some((u) => u.email.toLowerCase() === formData.email.toLowerCase());
      if (duplicate) {
        setFormError('A user with this email address already exists');
        return;
      }

      storage.addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        assignedWorkspaces:
          formData.role === 'super_admin' ? [...ALL_WORKSPACE_IDS] : formData.assignedWorkspaces,
      });
      setUsers([...storage.users]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (user: UserProfile) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own active user profile.');
      return;
    }
    if (confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) {
      storage.deleteUser(user.id);
      setUsers([...storage.users]);
    }
  };

  const toggleWorkspace = (wsId: WorkspaceId) => {
    setFormData((prev) => {
      const exists = prev.assignedWorkspaces.includes(wsId);
      const next = exists
        ? prev.assignedWorkspaces.filter((id) => id !== wsId)
        : [...prev.assignedWorkspaces, wsId];
      return { ...prev, assignedWorkspaces: next };
    });
  };

  const columns: ColumnDef<UserProfile>[] = [
    {
      key: 'name',
      header: 'User Name',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900">{item.name}</span>
          <span className="block text-xs text-slate-500">{item.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'System Role',
      sortable: true,
      filterable: true,
      filterOptions: ['super_admin', 'admin_personnel', 'viewer'],
      render: (item) => {
        if (item.role === 'super_admin') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              Super Admin (Head HR)
            </span>
          );
        }
        if (item.role === 'admin_personnel') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Admin Personnel
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            Viewer (Read-Only)
          </span>
        );
      },
    },
    {
      key: 'assignedWorkspaces',
      header: 'Assigned Workspaces',
      render: (item) => {
        if (item.role === 'super_admin') {
          return (
            <span className="font-semibold text-xs text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              All 11 Workspaces (Unrestricted)
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-md">
            {item.assignedWorkspaces.map((wsId) => {
              const ws = ALL_WORKSPACES.find((w) => w.id === wsId);
              return (
                <span
                  key={wsId}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {ws?.code || wsId}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created On',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              User Management &amp; Access Control (RBAC)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              Super Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create user accounts, define role privileges, and selectively tick workspace permissions
            to enforce strict operational boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      <DataTable<UserProfile>
        title="Registered System Users"
        subtitle="Role Hierarchy: Super Admin (Head HR) &gt; Admin Personnel &gt; Viewer"
        data={users}
        columns={columns}
        canAdd={false}
        canEdit={true}
        canDelete={true}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        exportFileName="EPCC_Users_Register"
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User & Permissions' : 'Create New User Account'}
        subtitle="Selectively tick workspaces that will appear on this user's dashboard and menu"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Chandra"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. ramesh@epcc-infra.in"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">System Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold text-slate-800"
            >
              <option value="super_admin">1. Super Admin (Head HR - Full Access, Invoices Approval & User Management)</option>
              <option value="admin_personnel">2. Admin Personnel (Can Add/Edit & Submit in assigned workspaces)</option>
              <option value="viewer">3. Viewer (Read-only access to assigned workspaces)</option>
            </select>
          </div>

          {/* Workspace Permission Checklist */}
          {formData.role !== 'super_admin' ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Assigned Workspaces Checklist
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tick the operational modules this user can see and access
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, assignedWorkspaces: [...ALL_WORKSPACE_IDS] })
                    }
                    className="text-[11px] text-blue-700 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignedWorkspaces: [] })}
                    className="text-[11px] text-red-600 hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ALL_WORKSPACES.map((ws) => {
                  const isChecked = formData.assignedWorkspaces.includes(ws.id);
                  return (
                    <label
                      key={ws.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleWorkspace(ws.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>{ws.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                Super Admin has automatic full access to all 11 operational modules.
              </p>
            </div>
          )}

          {formError && <p className="text-xs font-bold text-red-600">{formError}</p>}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              {editingUser ? 'Update User Privileges' : 'Create User Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

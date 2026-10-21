import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { SanitationRecord, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatDDMMMYYYY } from '../../utils/calculations.ts';

interface WorkspaceFProps {
  currentUser: UserProfile;
}

export function WorkspaceF({ currentUser }: WorkspaceFProps) {
  const [records, setRecords] = useState<SanitationRecord[]>(storage.sanitationRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<{
    date: string;
    location: string;
    activity: SanitationRecord['activity'];
    agencyName: string;
    workersDeployed: number;
    status: 'Done' | 'Pending';
    supervisorName: string;
    remarks: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    location: 'Workmen Colony Sector 1',
    activity: 'Cleaning',
    agencyName: storage.vendors.find((v) => v.providedServices.toLowerCase().includes('sanitation'))?.vendorName || storage.vendors[0]?.vendorName || '',
    workersDeployed: 6,
    status: 'Done',
    supervisorName: 'Kishore Jadav',
    remarks: '',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';
  const vendors = storage.vendors;

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      location: 'Workmen Colony Sector 1',
      activity: 'Cleaning',
      agencyName: vendors.find((v) => v.providedServices.toLowerCase().includes('sanitation'))?.vendorName || vendors[0]?.vendorName || '',
      workersDeployed: 6,
      status: 'Done',
      supervisorName: 'Kishore Jadav',
      remarks: 'Daily morning floor scrubbing and disinfectant spraying completed.',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: SanitationRecord = {
      id: `san-${Date.now()}`,
      date: formData.date,
      location: formData.location.trim(),
      activity: formData.activity,
      agencyName: formData.agencyName,
      workersDeployed: Number(formData.workersDeployed),
      status: formData.status,
      supervisorName: formData.supervisorName.trim(),
      remarks: formData.remarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    storage.saveSanitationRecords(updated);
    storage.logAudit({
      action: 'CREATE',
      workspace: 'Workspace F – Sanitation',
      entityType: 'SanitationRecord',
      entityId: newRecord.id,
      details: `Logged sanitation task (${newRecord.activity}) at ${newRecord.location}`,
    });

    setIsModalOpen(false);
  };

  const handleToggleStatus = (record: SanitationRecord) => {
    if (!canEdit) return;
    const nextStatus: 'Done' | 'Pending' = record.status === 'Done' ? 'Pending' : 'Done';
    const updated = records.map((r) =>
      r.id === record.id ? { ...r, status: nextStatus } : r
    );
    setRecords(updated);
    storage.saveSanitationRecords(updated);
  };

  const columns: ColumnDef<SanitationRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.date),
    },
    {
      key: 'location',
      header: 'Location / Area',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-900">{item.location}</span>,
    },
    {
      key: 'activity',
      header: 'Activity',
      sortable: true,
      filterable: true,
      filterOptions: ['Cleaning', 'Pest Control', 'Garbage Lifting', 'Septic Tank Cleaning', 'Other'],
      render: (item) => (
        <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          {item.activity}
        </span>
      ),
    },
    {
      key: 'agencyName',
      header: 'Sanitation Agency',
      sortable: true,
      render: (item) => <span className="text-slate-800 text-xs font-medium">{item.agencyName}</span>,
    },
    {
      key: 'workersDeployed',
      header: 'Workers Deployed',
      align: 'center',
      render: (item) => <span className="font-bold text-slate-900">{item.workersDeployed}</span>,
    },
    {
      key: 'supervisorName',
      header: 'Supervisor',
      render: (item) => <span className="text-xs text-slate-700">{item.supervisorName}</span>,
    },
    {
      key: 'status',
      header: 'Daily Status',
      sortable: true,
      filterable: true,
      filterOptions: ['Done', 'Pending'],
      render: (item) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(item)}
          disabled={!canEdit}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition ${
            item.status === 'Done'
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
          title="Click to toggle status"
        >
          {item.status === 'Done' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          )}
          {item.status}
        </button>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (item) => <span className="text-xs text-slate-500">{item.remarks || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace F – Sanitation &amp; Hygiene Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daily housekeeping, pest fogging schedules, septic waste disposal and statutory
            sanitary compliance.
          </p>
        </div>
      </div>

      <DataTable<SanitationRecord>
        title="Daily Sanitation Checklist &amp; Activity Log"
        subtitle="Click any status pill to toggle between Done and Pending"
        data={records}
        columns={columns}
        canAdd={canEdit}
        canEdit={false}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onDelete={(item) => {
          const updated = records.filter((r) => r.id !== item.id);
          setRecords(updated);
          storage.saveSanitationRecords(updated);
        }}
        exportFileName="EPCC_Sanitation_Register"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Sanitation Activity"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Activity Type</label>
              <select
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Cleaning">Cleaning &amp; Washing</option>
                <option value="Pest Control">Pest Control &amp; Fogging</option>
                <option value="Garbage Lifting">Garbage Lifting</option>
                <option value="Septic Tank Cleaning">Septic Tank Cleaning</option>
                <option value="Other">Other Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Location / Site</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Workmen Colony Block B"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Agency (Vendor)</label>
              <select
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.vendorName}>
                    {v.vendorName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Workers Deployed</label>
              <input
                type="number"
                min={1}
                value={formData.workersDeployed}
                onChange={(e) => setFormData({ ...formData, workersDeployed: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Supervisor Name</label>
              <input
                type="text"
                required
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Done">Done (Completed)</option>
                <option value="Pending">Pending (In Progress)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Remarks</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

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
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
            >
              Save Sanitation Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

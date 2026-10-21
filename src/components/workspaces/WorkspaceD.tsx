import React, { useState } from 'react';
import { Home, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { WorkmenColony, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatDDMMMYYYY } from '../../utils/calculations.ts';

interface WorkspaceDProps {
  currentUser: UserProfile;
}

export function WorkspaceD({ currentUser }: WorkspaceDProps) {
  const [colonies, setColonies] = useState<WorkmenColony[]>(storage.workmenColonies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColony, setEditingColony] = useState<WorkmenColony | null>(null);

  const [formData, setFormData] = useState<{
    colonyName: string;
    location: string;
    totalBlocksRooms: number;
    capacity: number;
    currentOccupancy: number;
    contractorName: string;
    facilities: {
      electricity: boolean;
      water: boolean;
      toilets: boolean;
      lighting: boolean;
      fireSafety: boolean;
      remarks: string;
    };
    inspectionDate: string;
    inspectionFindings: string;
    actionRequired: string;
    actionClosureDate: string;
  }>({
    colonyName: '',
    location: '',
    totalBlocksRooms: 50,
    capacity: 500,
    currentOccupancy: 380,
    contractorName: storage.vendors[0]?.vendorName || '',
    facilities: {
      electricity: true,
      water: true,
      toilets: true,
      lighting: true,
      fireSafety: true,
      remarks: '',
    },
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionFindings: 'Satisfactory',
    actionRequired: 'Routine housekeeping',
    actionClosureDate: '',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';
  const vendors = storage.vendors;

  const handleOpenAdd = () => {
    setEditingColony(null);
    setFormData({
      colonyName: '',
      location: '',
      totalBlocksRooms: 50,
      capacity: 500,
      currentOccupancy: 380,
      contractorName: vendors[0]?.vendorName || '',
      facilities: {
        electricity: true,
        water: true,
        toilets: true,
        lighting: true,
        fireSafety: true,
        remarks: '',
      },
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionFindings: 'Routine hygiene and safety checks conducted.',
      actionRequired: 'Preventive pest fogging',
      actionClosureDate: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: WorkmenColony) => {
    setEditingColony(c);
    setFormData({
      colonyName: c.colonyName,
      location: c.location,
      totalBlocksRooms: c.totalBlocksRooms,
      capacity: c.capacity,
      currentOccupancy: c.currentOccupancy,
      contractorName: c.contractorName,
      facilities: {
        electricity: c.facilities.electricity,
        water: c.facilities.water,
        toilets: c.facilities.toilets,
        lighting: c.facilities.lighting,
        fireSafety: c.facilities.fireSafety,
        remarks: c.facilities.remarks || '',
      },
      inspectionDate: c.inspectionDate,
      inspectionFindings: c.inspectionFindings,
      actionRequired: c.actionRequired,
      actionClosureDate: c.actionClosureDate || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.colonyName.trim()) return;

    if (editingColony) {
      const updated = colonies.map((c) =>
        c.id === editingColony.id
          ? {
              ...c,
              colonyName: formData.colonyName.trim(),
              location: formData.location.trim(),
              totalBlocksRooms: Number(formData.totalBlocksRooms),
              capacity: Number(formData.capacity),
              currentOccupancy: Number(formData.currentOccupancy),
              contractorName: formData.contractorName,
              facilities: formData.facilities,
              inspectionDate: formData.inspectionDate,
              inspectionFindings: formData.inspectionFindings,
              actionRequired: formData.actionRequired,
              actionClosureDate: formData.actionClosureDate.trim() || undefined,
            }
          : c
      );
      setColonies(updated);
      storage.saveWorkmenColonies(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace D – Workmen Colony',
        entityType: 'WorkmenColony',
        entityId: editingColony.id,
        details: `Updated workmen colony ${formData.colonyName}`,
      });
    } else {
      const newColony: WorkmenColony = {
        id: `wc-${Date.now()}`,
        colonyName: formData.colonyName.trim(),
        location: formData.location.trim(),
        totalBlocksRooms: Number(formData.totalBlocksRooms),
        capacity: Number(formData.capacity),
        currentOccupancy: Number(formData.currentOccupancy),
        contractorName: formData.contractorName,
        facilities: formData.facilities,
        inspectionDate: formData.inspectionDate,
        inspectionFindings: formData.inspectionFindings,
        actionRequired: formData.actionRequired,
        actionClosureDate: formData.actionClosureDate.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [...colonies, newColony];
      setColonies(updated);
      storage.saveWorkmenColonies(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace D – Workmen Colony',
        entityType: 'WorkmenColony',
        entityId: newColony.id,
        details: `Added new workmen colony ${newColony.colonyName} (Capacity: ${newColony.capacity})`,
      });
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<WorkmenColony>[] = [
    {
      key: 'colonyName',
      header: 'Colony Name',
      sortable: true,
      sampleTemplateValue: 'Sardar Patel Labour Township',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-900">{item.colonyName}</p>
          <p className="text-xs text-slate-500">{item.location}</p>
        </div>
      ),
    },
    {
      key: 'contractorName',
      header: 'Contractor / Agency',
      sortable: true,
      filterable: true,
      sampleTemplateValue: 'ShivShakti Infra',
      render: (item) => <span className="font-semibold text-slate-800">{item.contractorName}</span>,
    },
    {
      key: 'capacity',
      header: 'Capacity & Occupancy',
      sortable: true,
      align: 'center',
      render: (item) => {
        const pct = item.capacity > 0 ? Math.round((item.currentOccupancy / item.capacity) * 100) : 0;
        return (
          <div>
            <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800">
              <span>{item.currentOccupancy}</span>
              <span className="text-slate-400">/</span>
              <span>{item.capacity}</span>
              <span className="text-xs text-purple-700">({pct}%)</span>
            </div>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto mt-1">
              <div
                className={`h-full rounded-full ${
                  pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'facilities',
      header: 'Welfare Facilities',
      render: (item) => (
        <div className="flex items-center gap-1 text-[11px]">
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              item.facilities.water ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'
            }`}
          >
            Water {item.facilities.water ? '✓' : '✗'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              item.facilities.electricity ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
            }`}
          >
            Power {item.facilities.electricity ? '✓' : '✗'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold ${
              item.facilities.toilets ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
            }`}
          >
            Toilets {item.facilities.toilets ? '✓' : '✗'}
          </span>
        </div>
      ),
    },
    {
      key: 'inspectionDate',
      header: 'Last Inspection',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.inspectionDate),
    },
    {
      key: 'inspectionFindings',
      header: 'Inspection Findings & Action',
      render: (item) => (
        <div className="text-xs max-w-xs">
          <p className="font-medium text-slate-800">{item.inspectionFindings}</p>
          <p className="text-amber-700 mt-0.5 text-[11px]">Action: {item.actionRequired}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace D – Workmen Colony &amp; Camp Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Site labour accommodation monitoring, occupancy rates, statutory welfare amenities,
            and safety inspection compliance.
          </p>
        </div>
      </div>

      <DataTable<WorkmenColony>
        title="Workmen Camps Register"
        subtitle="Automatic calculation of occupancy % and sanitation readiness"
        data={colonies}
        columns={columns}
        canAdd={canEdit}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={(item) => {
          const updated = colonies.filter((c) => c.id !== item.id);
          setColonies(updated);
          storage.saveWorkmenColonies(updated);
        }}
        exportFileName="EPCC_Workmen_Colonies"
      />

      {/* Colony Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingColony ? 'Edit Workmen Colony' : 'Add Workmen Colony'}
        subtitle="Record capacity, amenities compliance, and site inspection status"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Colony Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.colonyName}
                onChange={(e) => setFormData({ ...formData, colonyName: e.target.value })}
                placeholder="e.g. Labour Township Sector 3"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="South Gate Perimeter, Dahej"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Contractor / Vendor (Master)
              </label>
              <select
                value={formData.contractorName}
                onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.vendorName}>
                    {v.vendorName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Capacity (Persons)</label>
              <input
                type="number"
                min={1}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Current Occupancy</label>
              <input
                type="number"
                min={0}
                value={formData.currentOccupancy}
                onChange={(e) => setFormData({ ...formData, currentOccupancy: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold text-blue-700"
              />
            </div>
          </div>

          {/* Welfare facilities checklist */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-800 uppercase">Mandatory Welfare Facilities</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { key: 'electricity', label: 'Electricity / Power' },
                { key: 'water', label: 'Drinking Water' },
                { key: 'toilets', label: 'Sanitation Toilets' },
                { key: 'lighting', label: 'Perimeter Lighting' },
                { key: 'fireSafety', label: 'Fire Safety Extinguishers' },
              ].map((f) => (
                <label key={f.key} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={(formData.facilities as any)[f.key]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        facilities: {
                          ...formData.facilities,
                          [f.key]: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Inspection Date</label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Action Closure Date</label>
              <input
                type="date"
                value={formData.actionClosureDate}
                onChange={(e) => setFormData({ ...formData, actionClosureDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Inspection Findings</label>
            <textarea
              rows={2}
              value={formData.inspectionFindings}
              onChange={(e) => setFormData({ ...formData, inspectionFindings: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Action Required</label>
            <input
              type="text"
              value={formData.actionRequired}
              onChange={(e) => setFormData({ ...formData, actionRequired: e.target.value })}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Save Colony Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

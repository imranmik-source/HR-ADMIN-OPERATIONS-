import React, { useState } from 'react';
import { HeartPulse, Ambulance, CheckCircle2, Phone, Shield } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { MedicalRecord, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatDDMMMYYYY } from '../../utils/calculations.ts';

interface WorkspaceJProps {
  currentUser: UserProfile;
}

export function WorkspaceJ({ currentUser }: WorkspaceJProps) {
  const [records, setRecords] = useState<MedicalRecord[]>(storage.medicalRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  const [formData, setFormData] = useState<{
    agencyName: string;
    workStartDate: string;
    workEndDate: string;
    doctorName: string;
    paramedicName: string;
    ambulanceType: 'ALS' | 'BLS';
    driverName: string;
    vehicleNo: string;
    contactNumbers: string;
  }>({
    agencyName: storage.vendors.find((v) => v.providedServices.toLowerCase().includes('medical'))?.vendorName || 'LifeShield Emergency Medical Corp',
    workStartDate: '2024-01-01',
    workEndDate: '2027-01-01',
    doctorName: 'Dr. Arvind Joshi, MBBS, AFIH',
    paramedicName: 'Ravi Rathod (Nurse / EMT-A)',
    ambulanceType: 'ALS',
    driverName: 'Sanjay Solanki',
    vehicleNo: 'GJ-16-AZ-9911',
    contactNumbers: '+91 9898012345 / 02642-245678',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';

  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      agencyName: 'LifeShield Emergency Medical Corp',
      workStartDate: new Date().toISOString().split('T')[0],
      workEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      doctorName: '',
      paramedicName: '',
      ambulanceType: 'ALS',
      driverName: '',
      vehicleNo: '',
      contactNumbers: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    const autoStatus = formData.workEndDate >= todayStr ? 'Active' : 'Closed';

    if (editingRecord) {
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              agencyName: formData.agencyName.trim(),
              workStartDate: formData.workStartDate,
              workEndDate: formData.workEndDate,
              doctorName: formData.doctorName.trim(),
              paramedicName: formData.paramedicName.trim(),
              ambulanceType: formData.ambulanceType,
              driverName: formData.driverName.trim(),
              vehicleNo: formData.vehicleNo.trim(),
              contactNumbers: formData.contactNumbers.trim(),
              status: autoStatus as any,
            }
          : r
      );
      setRecords(updated);
      storage.saveMedicalRecords(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace J – Medical Facility',
        entityType: 'MedicalRecord',
        entityId: editingRecord.id,
        details: `Updated medical facility duty roster: ${formData.doctorName}`,
      });
    } else {
      const newRec: MedicalRecord = {
        id: `med-${Date.now()}`,
        agencyName: formData.agencyName.trim(),
        workStartDate: formData.workStartDate,
        workEndDate: formData.workEndDate,
        doctorName: formData.doctorName.trim(),
        paramedicName: formData.paramedicName.trim(),
        ambulanceType: formData.ambulanceType,
        driverName: formData.driverName.trim(),
        vehicleNo: formData.vehicleNo.trim(),
        contactNumbers: formData.contactNumbers.trim(),
        status: autoStatus as any,
        createdAt: new Date().toISOString(),
      };
      const updated = [newRec, ...records];
      setRecords(updated);
      storage.saveMedicalRecords(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace J – Medical Facility',
        entityType: 'MedicalRecord',
        entityId: newRec.id,
        details: `Registered medical unit with Dr. ${newRec.doctorName} (${newRec.ambulanceType} Ambulance)`,
      });
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<MedicalRecord>[] = [
    {
      key: 'agencyName',
      header: 'Medical Agency',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-900">{item.agencyName}</span>,
    },
    {
      key: 'doctorName',
      header: 'Doctor on Duty',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.doctorName}</p>
          <p className="text-[11px] text-slate-500">Paramedic: {item.paramedicName}</p>
        </div>
      ),
    },
    {
      key: 'ambulanceType',
      header: 'Ambulance Type',
      sortable: true,
      filterable: true,
      filterOptions: ['ALS', 'BLS'],
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            item.ambulanceType === 'ALS'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}
        >
          {item.ambulanceType} (Advanced Life Support)
        </span>
      ),
    },
    {
      key: 'vehicleNo',
      header: 'Ambulance Vehicle & Driver',
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-slate-800">{item.vehicleNo}</span>
          <span className="block text-xs text-slate-500">Driver: {item.driverName}</span>
        </div>
      ),
    },
    {
      key: 'contactNumbers',
      header: 'Emergency Hotline',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-rose-700 flex items-center gap-1">
          <Phone className="w-3.5 h-3.5 text-rose-600" />
          {item.contactNumbers}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Agency Status',
      sortable: true,
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            item.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {item.status === 'Active' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace J – 24x7 Emergency Medical Facility &amp; OHC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Site Occupational Health Centre (OHC), ALS/BLS ambulance readiness, duty doctors,
            paramedic staffing, and emergency response protocols.
          </p>
        </div>
      </div>

      <DataTable<MedicalRecord>
        title="Site Medical Agency &amp; Ambulance Duty Register"
        subtitle="Automatic active status calculation based on contractual validity dates"
        data={records}
        columns={columns}
        canAdd={canEdit}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onEdit={(item) => {
          setEditingRecord(item);
          setFormData({
            agencyName: item.agencyName,
            workStartDate: item.workStartDate,
            workEndDate: item.workEndDate,
            doctorName: item.doctorName,
            paramedicName: item.paramedicName,
            ambulanceType: item.ambulanceType,
            driverName: item.driverName,
            vehicleNo: item.vehicleNo,
            contactNumbers: item.contactNumbers,
          });
          setIsModalOpen(true);
        }}
        onDelete={(item) => {
          const updated = records.filter((r) => r.id !== item.id);
          setRecords(updated);
          storage.saveMedicalRecords(updated);
        }}
        exportFileName="EPCC_Medical_Facility"
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Medical Facility Duty' : 'Register Medical Agency & Ambulance'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Agency Name</label>
              <input
                type="text"
                required
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Ambulance Type</label>
              <select
                value={formData.ambulanceType}
                onChange={(e) =>
                  setFormData({ ...formData, ambulanceType: e.target.value as any })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="ALS">ALS (Advanced Life Support - Ventilator Equipped)</option>
                <option value="BLS">BLS (Basic Life Support - Oxygen / Stretcher)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Doctor on Duty</label>
              <input
                type="text"
                required
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="Dr. Full Name, Qualifications"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Paramedic Name</label>
              <input
                type="text"
                required
                value={formData.paramedicName}
                onChange={(e) => setFormData({ ...formData, paramedicName: e.target.value })}
                placeholder="Nurse / EMT Specialist"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Ambulance Vehicle No</label>
              <input
                type="text"
                required
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                placeholder="e.g. GJ-16-AZ-9911"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Driver Name</label>
              <input
                type="text"
                required
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Emergency Contact Numbers <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.contactNumbers}
              onChange={(e) => setFormData({ ...formData, contactNumbers: e.target.value })}
              placeholder="e.g. +91 9898012345 / 02642-245678"
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Contract Start Date</label>
              <input
                type="date"
                required
                value={formData.workStartDate}
                onChange={(e) => setFormData({ ...formData, workStartDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Contract End Date</label>
              <input
                type="date"
                required
                value={formData.workEndDate}
                onChange={(e) => setFormData({ ...formData, workEndDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              Save Medical Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

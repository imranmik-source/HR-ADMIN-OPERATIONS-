import React, { useState, useMemo } from 'react';
import { Zap, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { ElectricityBill, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import {
  formatINR,
  formatDDMMMYYYY,
  calculateElectricityUnits,
  checkElectricitySurge,
} from '../../utils/calculations.ts';

interface WorkspaceIProps {
  currentUser: UserProfile;
}

export function WorkspaceI({ currentUser }: WorkspaceIProps) {
  const [bills, setBills] = useState<ElectricityBill[]>(storage.electricityBills);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<ElectricityBill | null>(null);

  const [formData, setFormData] = useState<{
    project: string;
    ownerName: string;
    guestHouseNo: string;
    billNo: string;
    billDate: string;
    kNo: string;
    presentReading: number;
    pastReading: number;
    billStartDate: string;
    billEndDate: string;
    billAmount: number;
    amountBeforeDueDate: number;
    amountAfterDueDate: number;
    dueDate: string;
    paymentStatus: 'Paid' | 'Unpaid';
    paidDate: string;
  }>({
    project: 'Dahej Petrochemical Package 3',
    ownerName: 'Bhupendra Patel',
    guestHouseNo: 'GH-01 (Ganga Enclave)',
    billNo: '',
    billDate: new Date().toISOString().split('T')[0],
    kNo: '18492019482',
    presentReading: 16500,
    pastReading: 14850,
    billStartDate: '2026-10-01',
    billEndDate: '2026-10-31',
    billAmount: 15200,
    amountBeforeDueDate: 15200,
    amountAfterDueDate: 15650,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    paymentStatus: 'Unpaid',
    paidDate: '',
  });

  const [validationError, setValidationError] = useState('');

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';

  // Monthly consumption summary
  const totalUnits = useMemo(() => bills.reduce((s, b) => s + b.unitConsumed, 0), [bills]);
  const totalAmount = useMemo(() => bills.reduce((s, b) => s + b.billAmount, 0), [bills]);

  const handleOpenAdd = () => {
    setEditingBill(null);
    setFormData({
      project: 'Dahej Petrochemical Package 3',
      ownerName: 'Bhupendra Patel',
      guestHouseNo: 'GH-01 (Ganga Enclave)',
      billNo: `DGVCL-${Math.floor(100000 + Math.random() * 900000)}`,
      billDate: new Date().toISOString().split('T')[0],
      kNo: '18492019482',
      presentReading: 16500,
      pastReading: 14850,
      billStartDate: '2026-10-01',
      billEndDate: '2026-10-31',
      billAmount: 15200,
      amountBeforeDueDate: 15200,
      amountAfterDueDate: 15650,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      paymentStatus: 'Unpaid',
      paidDate: '',
    });
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const unitResult = calculateElectricityUnits(formData.presentReading, formData.pastReading);
    if (!unitResult.isValid) {
      setValidationError(unitResult.error || 'Invalid readings');
      return;
    }

    // Check previous bill for surge check
    const previousBill = bills.find((b) => b.kNo === formData.kNo && (!editingBill || b.id !== editingBill.id));
    const isSurge = checkElectricitySurge(unitResult.units, previousBill?.unitConsumed);

    if (editingBill) {
      const updated = bills.map((b) =>
        b.id === editingBill.id
          ? {
              ...b,
              project: formData.project.trim(),
              ownerName: formData.ownerName.trim(),
              guestHouseNo: formData.guestHouseNo.trim(),
              billNo: formData.billNo.trim(),
              billDate: formData.billDate,
              kNo: formData.kNo.trim(),
              presentReading: Number(formData.presentReading),
              pastReading: Number(formData.pastReading),
              unitConsumed: unitResult.units,
              billStartDate: formData.billStartDate,
              billEndDate: formData.billEndDate,
              billAmount: Number(formData.billAmount),
              amountBeforeDueDate: Number(formData.amountBeforeDueDate),
              amountAfterDueDate: Number(formData.amountAfterDueDate),
              dueDate: formData.dueDate,
              paymentStatus: formData.paymentStatus,
              paidDate: formData.paidDate || undefined,
              surgeAlert: isSurge,
            }
          : b
      );
      setBills(updated);
      storage.saveElectricityBills(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace I – Electricity Consumption',
        entityType: 'ElectricityBill',
        entityId: editingBill.id,
        details: `Updated electricity bill ${formData.billNo} (${unitResult.units} units)`,
      });
    } else {
      const nextSl = bills.length > 0 ? Math.max(...bills.map((b) => b.slNo)) + 1 : 1;
      const newBill: ElectricityBill = {
        id: `elec-${Date.now()}`,
        slNo: nextSl,
        project: formData.project.trim(),
        ownerName: formData.ownerName.trim(),
        guestHouseNo: formData.guestHouseNo.trim(),
        billNo: formData.billNo.trim(),
        billDate: formData.billDate,
        kNo: formData.kNo.trim(),
        presentReading: Number(formData.presentReading),
        pastReading: Number(formData.pastReading),
        unitConsumed: unitResult.units,
        billStartDate: formData.billStartDate,
        billEndDate: formData.billEndDate,
        billAmount: Number(formData.billAmount),
        amountBeforeDueDate: Number(formData.amountBeforeDueDate),
        amountAfterDueDate: Number(formData.amountAfterDueDate),
        dueDate: formData.dueDate,
        paymentStatus: formData.paymentStatus,
        paidDate: formData.paidDate || undefined,
        surgeAlert: isSurge,
        createdAt: new Date().toISOString(),
      };
      const updated = [newBill, ...bills];
      setBills(updated);
      storage.saveElectricityBills(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace I – Electricity Consumption',
        entityType: 'ElectricityBill',
        entityId: newBill.id,
        details: `Recorded electricity bill ${newBill.billNo} for K.No ${newBill.kNo} (${newBill.unitConsumed} units, ${formatINR(newBill.billAmount)})`,
      });
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<ElectricityBill>[] = [
    {
      key: 'slNo',
      header: 'Sl. No',
      sortable: true,
      align: 'center',
      render: (item) => <span className="font-mono font-bold text-slate-700">#{item.slNo}</span>,
    },
    {
      key: 'billNo',
      header: 'Bill No & K. No',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900 font-mono">{item.billNo}</span>
          <span className="block text-[11px] text-slate-500 font-mono">K-No: {item.kNo}</span>
        </div>
      ),
    },
    {
      key: 'guestHouseNo',
      header: 'Guest House / Site',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.guestHouseNo}</p>
          <p className="text-xs text-slate-400">{item.ownerName}</p>
        </div>
      ),
    },
    {
      key: 'readings',
      header: 'Present / Past Reading',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">
          {item.presentReading} / {item.pastReading}
        </span>
      ),
    },
    {
      key: 'unitConsumed',
      header: 'Units (kWh Auto)',
      sortable: true,
      align: 'right',
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {item.unitConsumed.toLocaleString('en-IN')}
          </span>
          {item.surgeAlert && (
            <span
              className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-300 inline-flex items-center gap-0.5"
              title="Consumption surged >= 30% above previous bill"
            >
              <AlertTriangle className="w-2.5 h-2.5" /> +30% Surge
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'billAmount',
      header: 'Bill Amount (₹)',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-yellow-700">{formatINR(item.billAmount)}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.dueDate),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: ['Paid', 'Unpaid'],
      render: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            item.paymentStatus === 'Paid'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-rose-100 text-rose-800 border-rose-300'
          }`}
        >
          {item.paymentStatus}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace I – Electricity Consumption &amp; Meter Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking DISCOM energy bills, consumer K-numbers, automated unit calculation, and
            anomaly alerts for &gt;= 30% consumption surges.
          </p>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Units Consumed</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {totalUnits.toLocaleString('en-IN')} kWh
            </p>
            <p className="text-xs text-slate-500 mt-1">Across all site meters and guest bungalows</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Electricity Bill Value</p>
            <p className="text-3xl font-black text-yellow-700 mt-1 font-mono">
              {formatINR(totalAmount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Reconciled with DISCOM tariff slabs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            ₹
          </div>
        </div>
      </div>

      <DataTable<ElectricityBill>
        title="Electricity Meter Bills Register"
        subtitle="Automatic calculation of units (Present - Past). Blocks entry if Present < Past reading."
        data={bills}
        columns={columns}
        canAdd={canEdit}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onEdit={(item) => {
          setEditingBill(item);
          setFormData({
            project: item.project,
            ownerName: item.ownerName,
            guestHouseNo: item.guestHouseNo,
            billNo: item.billNo,
            billDate: item.billDate,
            kNo: item.kNo,
            presentReading: item.presentReading,
            pastReading: item.pastReading,
            billStartDate: item.billStartDate,
            billEndDate: item.billEndDate,
            billAmount: item.billAmount,
            amountBeforeDueDate: item.amountBeforeDueDate,
            amountAfterDueDate: item.amountAfterDueDate,
            dueDate: item.dueDate,
            paymentStatus: item.paymentStatus,
            paidDate: item.paidDate || '',
          });
          setValidationError('');
          setIsModalOpen(true);
        }}
        onDelete={(item) => {
          const updated = bills.filter((b) => b.id !== item.id);
          setBills(updated);
          storage.saveElectricityBills(updated);
        }}
        exportFileName="EPCC_Electricity_Bills"
      />

      {/* Bill Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBill ? 'Edit Electricity Bill' : 'Record Electricity Bill'}
        subtitle="Automated units calculation and 30% consumption spike detection"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Bill Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.billNo}
                onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                K. No (Consumer No) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.kNo}
                onChange={(e) => setFormData({ ...formData, kNo: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Bill Date</label>
              <input
                type="date"
                required
                value={formData.billDate}
                onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Guest House / Site Meter</label>
              <input
                type="text"
                required
                value={formData.guestHouseNo}
                onChange={(e) => setFormData({ ...formData, guestHouseNo: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Owner Name</label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Meter Readings with validation */}
          <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl space-y-3">
            <p className="text-xs font-bold text-yellow-900 uppercase">
              Meter Readings (Units Consumed = Present − Past)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Past Reading <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.pastReading}
                  onChange={(e) =>
                    setFormData({ ...formData, pastReading: Number(e.target.value) })
                  }
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Present Reading <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.presentReading}
                  onChange={(e) =>
                    setFormData({ ...formData, presentReading: Number(e.target.value) })
                  }
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Units Consumed (Auto)
                </label>
                <div className="mt-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900">
                  {Math.max(0, formData.presentReading - formData.pastReading)} kWh
                </div>
              </div>
            </div>

            {formData.presentReading < formData.pastReading && (
              <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Error: Present reading cannot be less than past reading!
              </p>
            )}
            {validationError && (
              <p className="text-xs font-bold text-red-600">{validationError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Bill Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                required
                value={formData.billAmount}
                onChange={(e) => setFormData({ ...formData, billAmount: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) =>
                  setFormData({ ...formData, paymentStatus: e.target.value as any })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
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
              disabled={formData.presentReading < formData.pastReading}
              className="px-4 py-2 text-xs font-semibold text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
            >
              Save Electricity Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

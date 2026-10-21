import React, { useState, useMemo } from 'react';
import { UtensilsCrossed, CheckCircle2, XCircle } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { CanteenRecord, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatINR, formatDDMMMYYYY } from '../../utils/calculations.ts';

interface WorkspaceGProps {
  currentUser: UserProfile;
}

export function WorkspaceG({ currentUser }: WorkspaceGProps) {
  const [records, setRecords] = useState<CanteenRecord[]>(storage.canteenRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<{
    date: string;
    canteenName: string;
    agencyName: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Tea';
    mealsServed: number;
    ratePerMeal: number;
    hygieneInspectionDone: boolean;
    menuRemarks: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    canteenName: 'Workmen Colony Central Mess',
    agencyName: storage.vendors.find((v) => v.providedServices.toLowerCase().includes('canteen'))?.vendorName || storage.vendors[0]?.vendorName || '',
    mealType: 'Lunch',
    mealsServed: 850,
    ratePerMeal: 65,
    hygieneInspectionDone: true,
    menuRemarks: 'Roti, Mixed Vegetable curry, Dal tadka, Rice, Pickle.',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';
  const vendors = storage.vendors;

  // Monthly summary
  const totalMeals = useMemo(() => records.reduce((s, r) => s + r.mealsServed, 0), [records]);
  const totalCateringCost = useMemo(() => records.reduce((s, r) => s + r.amount, 0), [records]);

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      canteenName: 'Workmen Colony Central Mess',
      agencyName: vendors.find((v) => v.providedServices.toLowerCase().includes('canteen'))?.vendorName || vendors[0]?.vendorName || '',
      mealType: 'Lunch',
      mealsServed: 850,
      ratePerMeal: 65,
      hygieneInspectionDone: true,
      menuRemarks: 'Roti, seasonal vegetables, dal, rice, salad.',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const autoAmount = Number(formData.mealsServed) * Number(formData.ratePerMeal);

    const newRecord: CanteenRecord = {
      id: `cnt-${Date.now()}`,
      date: formData.date,
      canteenName: formData.canteenName.trim(),
      agencyName: formData.agencyName,
      mealType: formData.mealType,
      mealsServed: Number(formData.mealsServed),
      ratePerMeal: Number(formData.ratePerMeal),
      amount: autoAmount,
      hygieneInspectionDone: formData.hygieneInspectionDone,
      menuRemarks: formData.menuRemarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    storage.saveCanteenRecords(updated);
    storage.logAudit({
      action: 'CREATE',
      workspace: 'Workspace G – Workmen Canteen',
      entityType: 'CanteenRecord',
      entityId: newRecord.id,
      details: `Logged ${newRecord.mealsServed} meals (${newRecord.mealType}) for ${newRecord.canteenName} - ${formatINR(newRecord.amount)}`,
    });

    setIsModalOpen(false);
  };

  const columns: ColumnDef<CanteenRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.date),
    },
    {
      key: 'canteenName',
      header: 'Canteen / Dining Hall',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-900">{item.canteenName}</span>,
    },
    {
      key: 'agencyName',
      header: 'Catering Agency',
      sortable: true,
      render: (item) => <span className="text-slate-800 text-xs">{item.agencyName}</span>,
    },
    {
      key: 'mealType',
      header: 'Meal Type',
      sortable: true,
      filterable: true,
      filterOptions: ['Breakfast', 'Lunch', 'Dinner', 'Tea'],
      render: (item) => (
        <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
          {item.mealType}
        </span>
      ),
    },
    {
      key: 'mealsServed',
      header: 'Meals Served',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {item.mealsServed.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'ratePerMeal',
      header: 'Rate (₹)',
      align: 'right',
      render: (item) => <span className="font-mono text-slate-700">{formatINR(item.ratePerMeal)}</span>,
    },
    {
      key: 'amount',
      header: 'Total Cost (₹ Auto)',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-orange-700">{formatINR(item.amount)}</span>
      ),
    },
    {
      key: 'hygieneInspectionDone',
      header: 'Hygiene Inspection',
      align: 'center',
      render: (item) =>
        item.hygieneInspectionDone ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Certified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
            <XCircle className="w-3.5 h-3.5" /> Pending
          </span>
        ),
    },
    {
      key: 'menuRemarks',
      header: 'Menu Remarks',
      render: (item) => <span className="text-xs text-slate-500">{item.menuRemarks || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace G – Workmen &amp; Staff Canteen Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tracking meal token logs, daily nutrition quotas, industrial catering expenditure,
            and Food Safety &amp; Hygiene certifications.
          </p>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Monthly Meals Served</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {totalMeals.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500 mt-1">Across workmen central mess &amp; executive hall</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Catering Expenditure</p>
            <p className="text-3xl font-black text-orange-700 mt-1 font-mono">
              {formatINR(totalCateringCost)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Verified with daily mess coupons and muster roll</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            ₹
          </div>
        </div>
      </div>

      <DataTable<CanteenRecord>
        title="Daily Meal Serving Logs"
        subtitle="Automatic amount calculation: Meals Served × Contractual Meal Rate"
        data={records}
        columns={columns}
        canAdd={canEdit}
        canEdit={false}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onDelete={(item) => {
          const updated = records.filter((r) => r.id !== item.id);
          setRecords(updated);
          storage.saveCanteenRecords(updated);
        }}
        exportFileName="EPCC_Canteen_Register"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Canteen Meal Service"
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
              <label className="block text-xs font-bold text-slate-700 uppercase">Meal Type</label>
              <select
                value={formData.mealType}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Tea">Tea / Snacks</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Canteen Name</label>
              <input
                type="text"
                required
                value={formData.canteenName}
                onChange={(e) => setFormData({ ...formData, canteenName: e.target.value })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Number of Meals Served</label>
              <input
                type="number"
                min={1}
                value={formData.mealsServed}
                onChange={(e) => setFormData({ ...formData, mealsServed: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Rate per Meal (₹)</label>
              <input
                type="number"
                min={1}
                value={formData.ratePerMeal}
                onChange={(e) => setFormData({ ...formData, ratePerMeal: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 uppercase">
              <input
                type="checkbox"
                checked={formData.hygieneInspectionDone}
                onChange={(e) =>
                  setFormData({ ...formData, hygieneInspectionDone: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span>Food Safety &amp; Kitchen Hygiene Inspection Done</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Menu Remarks</label>
            <input
              type="text"
              value={formData.menuRemarks}
              onChange={(e) => setFormData({ ...formData, menuRemarks: e.target.value })}
              placeholder="Items served, vegetable freshness notes..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
            >
              Save Canteen Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

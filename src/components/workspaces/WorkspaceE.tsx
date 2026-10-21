import React, { useState, useMemo } from 'react';
import { Droplets, Calendar, Filter } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { WaterConsumptionRecord, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatINR, formatDDMMMYYYY } from '../../utils/calculations.ts';

interface WorkspaceEProps {
  currentUser: UserProfile;
}

export function WorkspaceE({ currentUser }: WorkspaceEProps) {
  const [records, setRecords] = useState<WaterConsumptionRecord[]>(storage.waterRecords);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WaterConsumptionRecord[] | null>(null);

  const [formData, setFormData] = useState<{
    date: string;
    location: 'Colony' | 'Guest House' | 'Office';
    source: 'Tanker' | 'Borewell' | 'Municipal';
    numberOfTankers: number;
    quantityLitres: number;
    supplierName: string;
    rate: number;
    remarks: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    location: 'Colony',
    source: 'Tanker',
    numberOfTankers: 4,
    quantityLitres: 80000,
    supplierName: storage.vendors.find((v) => v.providedServices.toLowerCase().includes('water'))?.vendorName || storage.vendors[0]?.vendorName || '',
    rate: 2500,
    remarks: '',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';
  const vendors = storage.vendors;

  // Monthly breakdown by location summary
  const summaryByLocation = useMemo(() => {
    const locMap: Record<string, { litres: number; cost: number; tankers: number }> = {
      Colony: { litres: 0, cost: 0, tankers: 0 },
      'Guest House': { litres: 0, cost: 0, tankers: 0 },
      Office: { litres: 0, cost: 0, tankers: 0 },
    };

    records.forEach((r) => {
      if (locMap[r.location]) {
        locMap[r.location].litres += r.quantityLitres;
        locMap[r.location].cost += r.amount;
        locMap[r.location].tankers += r.numberOfTankers;
      }
    });

    return locMap;
  }, [records]);

  const handleOpenAdd = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      location: 'Colony',
      source: 'Tanker',
      numberOfTankers: 4,
      quantityLitres: 80000,
      supplierName: vendors.find((v) => v.providedServices.toLowerCase().includes('water'))?.vendorName || vendors[0]?.vendorName || '',
      rate: 2500,
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const autoAmount =
      formData.source === 'Tanker' && formData.numberOfTankers > 0
        ? formData.numberOfTankers * formData.rate
        : formData.rate;

    const newRecord: WaterConsumptionRecord = {
      id: `wtr-${Date.now()}`,
      date: formData.date,
      location: formData.location,
      source: formData.source,
      numberOfTankers: Number(formData.numberOfTankers),
      quantityLitres: Number(formData.quantityLitres),
      supplierName: formData.supplierName,
      rate: Number(formData.rate),
      amount: autoAmount,
      remarks: formData.remarks.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    storage.saveWaterRecords(updated);
    storage.logAudit({
      action: 'CREATE',
      workspace: 'Workspace E – Water Consumption',
      entityType: 'WaterRecord',
      entityId: newRecord.id,
      details: `Logged ${newRecord.quantityLitres.toLocaleString('en-IN')} L water delivery (${newRecord.location}) - ${formatINR(newRecord.amount)}`,
    });

    setIsModalOpen(false);
  };

  const columns: ColumnDef<WaterConsumptionRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.date),
    },
    {
      key: 'location',
      header: 'Location / Site',
      sortable: true,
      filterable: true,
      filterOptions: ['Colony', 'Guest House', 'Office'],
      render: (item) => (
        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">
          {item.location}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      filterable: true,
      filterOptions: ['Tanker', 'Borewell', 'Municipal'],
      render: (item) => (
        <span className="text-xs font-semibold text-blue-700">{item.source}</span>
      ),
    },
    {
      key: 'numberOfTankers',
      header: 'Tankers (Nos)',
      align: 'center',
      render: (item) => (item.source === 'Tanker' ? item.numberOfTankers : '-'),
    },
    {
      key: 'quantityLitres',
      header: 'Quantity (Litres)',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-slate-900">
          {item.quantityLitres.toLocaleString('en-IN')} L
        </span>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier (Vendor Master)',
      sortable: true,
      render: (item) => <span className="font-medium text-slate-800">{item.supplierName}</span>,
    },
    {
      key: 'amount',
      header: 'Amount (₹ Auto)',
      sortable: true,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-cyan-700">{formatINR(item.amount)}</span>
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
            Workspace E – Water Supply &amp; Consumption Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconciliation of daily water tanker dispatches, piped connections, quantities and
            billing amounts per site location.
          </p>
        </div>
      </div>

      {/* Summary Cards Per Location */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['Colony', 'Guest House', 'Office'] as const).map((loc) => {
          const data = summaryByLocation[loc];
          return (
            <div key={loc} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>{loc} Summary</span>
                <Droplets className="w-4 h-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-1">
                {(data.litres / 1000).toLocaleString('en-IN')} KL
              </p>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">{data.tankers} Tankers</span>
                <span className="font-bold text-cyan-700">{formatINR(data.cost)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <DataTable<WaterConsumptionRecord>
        title="Water Delivery Logs"
        subtitle="Amounts automatically calculated based on tanker rate or piped meter rate"
        data={records}
        columns={columns}
        canAdd={canEdit}
        canEdit={false}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onDelete={(item) => {
          const updated = records.filter((r) => r.id !== item.id);
          setRecords(updated);
          storage.saveWaterRecords(updated);
        }}
        exportFileName="EPCC_Water_Consumption"
      />

      {/* Add Record Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Water Supply Delivery"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Delivery Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Site Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold"
              >
                <option value="Colony">Workmen Colony</option>
                <option value="Guest House">Guest House</option>
                <option value="Office">Site Office</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Water Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              >
                <option value="Tanker">Tanker</option>
                <option value="Borewell">Borewell</option>
                <option value="Municipal">Municipal / GIDC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Tankers Count</label>
              <input
                type="number"
                min={0}
                value={formData.numberOfTankers}
                onChange={(e) => setFormData({ ...formData, numberOfTankers: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Quantity (Litres)</label>
              <input
                type="number"
                min={1}
                value={formData.quantityLitres}
                onChange={(e) => setFormData({ ...formData, quantityLitres: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Supplier (Vendor)</label>
              <select
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
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
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Rate per Tanker / Fixed (₹)
              </label>
              <input
                type="number"
                min={0}
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Remarks / Challan No</label>
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Challan numbers, TDS meter reading, chlorinated check..."
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
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded-lg shadow-sm"
            >
              Log Water Delivery
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

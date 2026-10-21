import React, { useState } from 'react';
import { ScrollText, AlertTriangle, CheckCircle2, Calendar, Eye } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { RentAgreement, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import {
  formatINR,
  formatDDMMMYYYY,
  calculateRentAgreementDetails,
} from '../../utils/calculations.ts';

interface WorkspaceHProps {
  currentUser: UserProfile;
}

export function WorkspaceH({ currentUser }: WorkspaceHProps) {
  const [agreements, setAgreements] = useState<RentAgreement[]>(storage.rentAgreements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<RentAgreement | null>(null);
  const [viewingAgreement, setViewingAgreement] = useState<RentAgreement | null>(null);

  const [formData, setFormData] = useState<{
    projectNo: string;
    ownerName: string;
    floor: string;
    bhkType: string;
    rentStartDate: string;
    leaseTenureMonths: number;
    rentEndDateAgreement: string;
    lockingPeriodMonths: number;
    securityDeposit: number;
    rentAmountYear1: number;
    rentAmountYear2: number;
    rentAmountYear3: number;
    propertyType: string;
    utilityPaymentResponsible: string;
    noticePeriodMonths: number;
    vacateDate: string;
    location: string;
  }>({
    projectNo: 'PRJ-EPCC-2024',
    ownerName: '',
    floor: '1st Floor',
    bhkType: '3 BHK',
    rentStartDate: new Date().toISOString().split('T')[0],
    leaseTenureMonths: 24,
    rentEndDateAgreement: '',
    lockingPeriodMonths: 12,
    securityDeposit: 150000,
    rentAmountYear1: 50000,
    rentAmountYear2: 55000,
    rentAmountYear3: 60000,
    propertyType: 'Residential Flat (Staff)',
    utilityPaymentResponsible: 'Tenant (Project pays electricity/water)',
    noticePeriodMonths: 2,
    vacateDate: '',
    location: 'Bharuch City',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';

  const handleOpenAdd = () => {
    setEditingAgreement(null);
    setFormData({
      projectNo: 'PRJ-EPCC-2024',
      ownerName: '',
      floor: '1st Floor',
      bhkType: '3 BHK Apartment',
      rentStartDate: new Date().toISOString().split('T')[0],
      leaseTenureMonths: 24,
      rentEndDateAgreement: '',
      lockingPeriodMonths: 12,
      securityDeposit: 150000,
      rentAmountYear1: 50000,
      rentAmountYear2: 55000,
      rentAmountYear3: 60000,
      propertyType: 'Residential Flat (Staff)',
      utilityPaymentResponsible: 'Tenant (Project pays utilities)',
      noticePeriodMonths: 2,
      vacateDate: '',
      location: 'Green Valley Enclave, Bharuch',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: RentAgreement) => {
    setEditingAgreement(a);
    setFormData({
      projectNo: a.projectNo,
      ownerName: a.ownerName,
      floor: a.floor,
      bhkType: a.bhkType,
      rentStartDate: a.rentStartDate,
      leaseTenureMonths: a.leaseTenureMonths,
      rentEndDateAgreement: a.rentEndDateAgreement,
      lockingPeriodMonths: a.lockingPeriodMonths,
      securityDeposit: a.securityDeposit,
      rentAmountYear1: a.rentAmountYear1,
      rentAmountYear2: a.rentAmountYear2,
      rentAmountYear3: a.rentAmountYear3,
      propertyType: a.propertyType,
      utilityPaymentResponsible: a.utilityPaymentResponsible,
      noticePeriodMonths: a.noticePeriodMonths,
      vacateDate: a.vacateDate || '',
      location: a.location,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerName.trim()) return;

    const calc = calculateRentAgreementDetails({
      rentStartDate: formData.rentStartDate,
      leaseTenureMonths: Number(formData.leaseTenureMonths),
      lockingPeriodMonths: Number(formData.lockingPeriodMonths),
      noticePeriodMonths: Number(formData.noticePeriodMonths),
      rentAmountYear1: Number(formData.rentAmountYear1),
      rentAmountYear2: Number(formData.rentAmountYear2),
      rentAmountYear3: Number(formData.rentAmountYear3),
    });

    if (editingAgreement) {
      const updated = agreements.map((a) =>
        a.id === editingAgreement.id
          ? {
              ...a,
              projectNo: formData.projectNo.trim(),
              ownerName: formData.ownerName.trim(),
              floor: formData.floor.trim(),
              bhkType: formData.bhkType.trim(),
              rentStartDate: formData.rentStartDate,
              leaseTenureMonths: Number(formData.leaseTenureMonths),
              tenureEndDate: calc.tenureEndDate,
              rentEndDateAgreement: formData.rentEndDateAgreement || calc.tenureEndDate,
              lockingPeriodMonths: Number(formData.lockingPeriodMonths),
              lockingPeriodCompletionDate: calc.lockingPeriodCompletionDate,
              completedTenureMonths: calc.completedTenureMonths,
              securityDeposit: Number(formData.securityDeposit),
              rentAmountYear1: Number(formData.rentAmountYear1),
              rentAmountYear2: Number(formData.rentAmountYear2),
              rentAmountYear3: Number(formData.rentAmountYear3),
              currentYearRent: calc.currentYearRent,
              propertyType: formData.propertyType.trim(),
              utilityPaymentResponsible: formData.utilityPaymentResponsible,
              noticePeriodMonths: Number(formData.noticePeriodMonths),
              noticeToBeServedBeforeDate: calc.noticeToBeServedBeforeDate,
              vacateDate: formData.vacateDate.trim() || undefined,
              location: formData.location.trim(),
            }
          : a
      );
      setAgreements(updated);
      storage.saveRentAgreements(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace H – Rent Agreements',
        entityType: 'RentAgreement',
        entityId: editingAgreement.id,
        details: `Updated rent agreement for ${formData.ownerName}`,
      });
    } else {
      const nextSrNo =
        agreements.length > 0 ? Math.max(...agreements.map((a) => a.srNo)) + 1 : 1;
      const newAg: RentAgreement = {
        id: `ra-${Date.now()}`,
        srNo: nextSrNo,
        projectNo: formData.projectNo.trim(),
        ownerName: formData.ownerName.trim(),
        floor: formData.floor.trim(),
        bhkType: formData.bhkType.trim(),
        rentStartDate: formData.rentStartDate,
        leaseTenureMonths: Number(formData.leaseTenureMonths),
        tenureEndDate: calc.tenureEndDate,
        rentEndDateAgreement: formData.rentEndDateAgreement || calc.tenureEndDate,
        lockingPeriodMonths: Number(formData.lockingPeriodMonths),
        lockingPeriodCompletionDate: calc.lockingPeriodCompletionDate,
        completedTenureMonths: calc.completedTenureMonths,
        securityDeposit: Number(formData.securityDeposit),
        rentAmountYear1: Number(formData.rentAmountYear1),
        rentAmountYear2: Number(formData.rentAmountYear2),
        rentAmountYear3: Number(formData.rentAmountYear3),
        currentYearRent: calc.currentYearRent,
        propertyType: formData.propertyType.trim(),
        utilityPaymentResponsible: formData.utilityPaymentResponsible,
        noticePeriodMonths: Number(formData.noticePeriodMonths),
        noticeToBeServedBeforeDate: calc.noticeToBeServedBeforeDate,
        vacateDate: formData.vacateDate.trim() || undefined,
        location: formData.location.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...agreements, newAg];
      setAgreements(updated);
      storage.saveRentAgreements(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace H – Rent Agreements',
        entityType: 'RentAgreement',
        entityId: newAg.id,
        details: `Created rent agreement Sr.${newAg.srNo} for ${newAg.ownerName} (${newAg.propertyType})`,
      });
    }

    setIsModalOpen(false);
  };

  const columns: ColumnDef<RentAgreement>[] = [
    {
      key: 'srNo',
      header: 'Sr. No',
      sortable: true,
      align: 'center',
      render: (item) => <span className="font-mono font-bold text-slate-700">#{item.srNo}</span>,
    },
    {
      key: 'ownerName',
      header: 'Property & Owner',
      sortable: true,
      render: (item) => (
        <div>
          <button
            type="button"
            onClick={() => setViewingAgreement(item)}
            className="font-bold text-slate-900 hover:text-blue-600 underline text-left"
          >
            {item.ownerName}
          </button>
          <p className="text-xs text-slate-500">
            {item.bhkType} • {item.floor}
          </p>
        </div>
      ),
    },
    {
      key: 'rentStartDate',
      header: 'Start Date',
      sortable: true,
      render: (item) => formatDDMMMYYYY(item.rentStartDate),
    },
    {
      key: 'tenureEndDate',
      header: 'Tenure End (Auto)',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-800">{formatDDMMMYYYY(item.tenureEndDate)}</span>
          <span className="block text-[11px] text-slate-400">{item.leaseTenureMonths} Months</span>
        </div>
      ),
    },
    {
      key: 'completedTenureMonths',
      header: 'Tenure Done',
      align: 'center',
      render: (item) => {
        const calc = calculateRentAgreementDetails({
          rentStartDate: item.rentStartDate,
          leaseTenureMonths: item.leaseTenureMonths,
          lockingPeriodMonths: item.lockingPeriodMonths,
          noticePeriodMonths: item.noticePeriodMonths,
          rentAmountYear1: item.rentAmountYear1,
          rentAmountYear2: item.rentAmountYear2,
          rentAmountYear3: item.rentAmountYear3,
        });
        return (
          <span className="font-bold text-purple-700 font-mono text-xs">
            {calc.completedTenureMonths}m
          </span>
        );
      },
    },
    {
      key: 'currentYearRent',
      header: 'Current Year Rent (₹ Auto)',
      sortable: true,
      align: 'right',
      render: (item) => {
        const calc = calculateRentAgreementDetails({
          rentStartDate: item.rentStartDate,
          leaseTenureMonths: item.leaseTenureMonths,
          lockingPeriodMonths: item.lockingPeriodMonths,
          noticePeriodMonths: item.noticePeriodMonths,
          rentAmountYear1: item.rentAmountYear1,
          rentAmountYear2: item.rentAmountYear2,
          rentAmountYear3: item.rentAmountYear3,
        });
        return (
          <span className="font-mono font-bold text-slate-900">
            {formatINR(calc.currentYearRent)}/mo
          </span>
        );
      },
    },
    {
      key: 'noticeToBeServedBeforeDate',
      header: 'Notice Due (Auto)',
      render: (item) => {
        const calc = calculateRentAgreementDetails({
          rentStartDate: item.rentStartDate,
          leaseTenureMonths: item.leaseTenureMonths,
          lockingPeriodMonths: item.lockingPeriodMonths,
          noticePeriodMonths: item.noticePeriodMonths,
          rentAmountYear1: item.rentAmountYear1,
          rentAmountYear2: item.rentAmountYear2,
          rentAmountYear3: item.rentAmountYear3,
        });
        return (
          <span className="font-mono text-xs text-slate-800">
            {formatDDMMMYYYY(calc.noticeToBeServedBeforeDate)}
          </span>
        );
      },
    },
    {
      key: 'alertStatus',
      header: 'Lease Status & Alerts',
      render: (item) => {
        const calc = calculateRentAgreementDetails({
          rentStartDate: item.rentStartDate,
          leaseTenureMonths: item.leaseTenureMonths,
          lockingPeriodMonths: item.lockingPeriodMonths,
          noticePeriodMonths: item.noticePeriodMonths,
          rentAmountYear1: item.rentAmountYear1,
          rentAmountYear2: item.rentAmountYear2,
          rentAmountYear3: item.rentAmountYear3,
        });

        if (calc.alertStatus === 'red') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              {calc.alertMessage}
            </span>
          );
        }
        if (calc.alertStatus === 'amber') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              {calc.alertMessage}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace H – Lease &amp; Rent Agreements Register
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated locking period monitoring, notice-to-serve dates, tenure milestone tracking,
            and 60-day expiry warning triggers.
          </p>
        </div>
      </div>

      <DataTable<RentAgreement>
        title="Active Residential &amp; Office Leases"
        subtitle="Amber badge: expiring within 60 days • Red badge: notice overdue or lease expired"
        data={agreements}
        columns={columns}
        canAdd={canEdit}
        canEdit={canEdit}
        canDelete={canDelete}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={(item) => {
          const updated = agreements.filter((a) => a.id !== item.id);
          setAgreements(updated);
          storage.saveRentAgreements(updated);
        }}
        customActions={(item) => (
          <button
            type="button"
            onClick={() => setViewingAgreement(item)}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="View Full Agreement Particulars"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        exportFileName="EPCC_Rent_Agreements"
      />

      {/* Add / Edit Agreement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAgreement ? 'Edit Rent Agreement' : 'New Rent Agreement'}
        subtitle="Calculated dates and rent progression are automatically computed"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Project No</label>
              <input
                type="text"
                value={formData.projectNo}
                onChange={(e) => setFormData({ ...formData, projectNo: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Name of Owner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Bhupendra Patel"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">BHK Type</label>
              <input
                type="text"
                value={formData.bhkType}
                onChange={(e) => setFormData({ ...formData, bhkType: e.target.value })}
                placeholder="e.g. 4 BHK Bungalow"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Floor</label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="1st & 2nd Floor"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">Property Type</label>
              <input
                type="text"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                placeholder="Guest House / Office"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Rent Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.rentStartDate}
                onChange={(e) => setFormData({ ...formData, rentStartDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Lease Tenure (Months)
              </label>
              <input
                type="number"
                min={1}
                value={formData.leaseTenureMonths}
                onChange={(e) =>
                  setFormData({ ...formData, leaseTenureMonths: Number(e.target.value) })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Locking Period (Months)
              </label>
              <input
                type="number"
                min={0}
                value={formData.lockingPeriodMonths}
                onChange={(e) =>
                  setFormData({ ...formData, lockingPeriodMonths: Number(e.target.value) })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Notice Period (Months)
              </label>
              <input
                type="number"
                min={1}
                value={formData.noticePeriodMonths}
                onChange={(e) =>
                  setFormData({ ...formData, noticePeriodMonths: Number(e.target.value) })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Security Deposit (₹)
              </label>
              <input
                type="number"
                min={0}
                value={formData.securityDeposit}
                onChange={(e) =>
                  setFormData({ ...formData, securityDeposit: Number(e.target.value) })
                }
                className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Rent 1st Year (₹/mo)
              </label>
              <input
                type="number"
                min={0}
                value={formData.rentAmountYear1}
                onChange={(e) =>
                  setFormData({ ...formData, rentAmountYear1: Number(e.target.value) })
                }
                className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Rent 2nd Year (₹/mo)
              </label>
              <input
                type="number"
                min={0}
                value={formData.rentAmountYear2}
                onChange={(e) =>
                  setFormData({ ...formData, rentAmountYear2: Number(e.target.value) })
                }
                className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Rent 3rd Year (₹/mo)
              </label>
              <input
                type="number"
                min={0}
                value={formData.rentAmountYear3}
                onChange={(e) =>
                  setFormData({ ...formData, rentAmountYear3: Number(e.target.value) })
                }
                className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Utility Payment Responsibility
              </label>
              <input
                type="text"
                value={formData.utilityPaymentResponsible}
                onChange={(e) =>
                  setFormData({ ...formData, utilityPaymentResponsible: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Property Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Save Agreement
            </button>
          </div>
        </form>
      </Modal>

      {/* Agreement View Modal */}
      {viewingAgreement && (
        <Modal
          isOpen={true}
          onClose={() => setViewingAgreement(null)}
          title={`Rent Agreement Particulars – ${viewingAgreement.ownerName}`}
          subtitle={`Sr. No #${viewingAgreement.srNo} • Project: ${viewingAgreement.projectNo}`}
          maxWidth="xl"
        >
          {(() => {
            const calc = calculateRentAgreementDetails({
              rentStartDate: viewingAgreement.rentStartDate,
              leaseTenureMonths: viewingAgreement.leaseTenureMonths,
              lockingPeriodMonths: viewingAgreement.lockingPeriodMonths,
              noticePeriodMonths: viewingAgreement.noticePeriodMonths,
              rentAmountYear1: viewingAgreement.rentAmountYear1,
              rentAmountYear2: viewingAgreement.rentAmountYear2,
              rentAmountYear3: viewingAgreement.rentAmountYear3,
            });

            return (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-slate-500">Rent Start Date</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {formatDDMMMYYYY(viewingAgreement.rentStartDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tenure End Date (Auto)</p>
                    <p className="font-bold text-purple-700 mt-0.5">
                      {formatDDMMMYYYY(calc.tenureEndDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Locking Period</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {viewingAgreement.lockingPeriodMonths} Months ({formatDDMMMYYYY(calc.lockingPeriodCompletionDate)})
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Notice To Serve Before (Auto)</p>
                    <p className="font-bold text-rose-700 mt-0.5">
                      {formatDDMMMYYYY(calc.noticeToBeServedBeforeDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Completed Tenure</p>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {calc.completedTenureMonths} Months
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Current Year Rent</p>
                    <p className="font-bold text-emerald-700 font-mono mt-0.5">
                      {formatINR(calc.currentYearRent)} / Month
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="font-bold text-slate-800 text-sm">Property &amp; Terms</p>
                  <p className="text-slate-700">
                    <strong>Location:</strong> {viewingAgreement.location}
                  </p>
                  <p className="text-slate-700">
                    <strong>Type:</strong> {viewingAgreement.propertyType} ({viewingAgreement.bhkType}, {viewingAgreement.floor})
                  </p>
                  <p className="text-slate-700">
                    <strong>Utilities:</strong> {viewingAgreement.utilityPaymentResponsible}
                  </p>
                  <p className="text-slate-700">
                    <strong>Security Deposit:</strong> {formatINR(viewingAgreement.securityDeposit)}
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setViewingAgreement(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
                  >
                    Close Particulars
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}

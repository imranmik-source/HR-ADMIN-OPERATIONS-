import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  Lock,
  Plus,
  Eye,
  Filter,
} from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { ImportModal } from '../common/ImportModal.tsx';
import { Invoice, InvoiceStatus, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import {
  formatINR,
  formatDDMMMYYYY,
  calculateInvoiceAgeing,
  getAgeingSeverity,
  generateInvoiceSeqNo,
} from '../../utils/calculations.ts';

interface WorkspaceBProps {
  currentUser: UserProfile;
}

export function WorkspaceB({ currentUser }: WorkspaceBProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(storage.invoices);
  const [filterView, setFilterView] = useState<'all' | 'pending' | 'approved' | 'draft'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Rejection modal
  const [rejectionTarget, setRejectionTarget] = useState<Invoice | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [rejectionError, setRejectionError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    invoiceMonth: string;
    invoiceDate: string;
    invoiceNo: string;
    faTokenNo: string;
    faTokenDate: string;
    poNo: string;
    projectName: string;
    vendorId: string;
    sesNo: string;
    sesDate: string;
    amountDue: number;
    remarks: string;
  }>({
    invoiceMonth: '10-2026',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNo: '',
    faTokenNo: '',
    faTokenDate: new Date().toISOString().split('T')[0],
    poNo: 'PO-EPCC-450001',
    projectName: 'Dahej Petrochemical Package 3',
    vendorId: storage.vendors[0]?.id || '',
    sesNo: '',
    sesDate: new Date().toISOString().split('T')[0],
    amountDue: 0,
    remarks: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const vendors = storage.vendors;
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdminPersonnel = currentUser.role === 'admin_personnel';
  const isViewer = currentUser.role === 'viewer';

  // Filtered dataset according to quick tabs
  const filteredInvoices = useMemo(() => {
    switch (filterView) {
      case 'pending':
        return invoices.filter((i) => i.status === 'Submitted');
      case 'approved':
        return invoices.filter((i) => i.status === 'Approved');
      case 'draft':
        return invoices.filter((i) => i.status === 'Draft');
      default:
        return invoices;
    }
  }, [invoices, filterView]);

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceMonth: '10-2026',
      invoiceDate: new Date().toISOString().split('T')[0],
      invoiceNo: '',
      faTokenNo: '',
      faTokenDate: new Date().toISOString().split('T')[0],
      poNo: 'PO-EPCC-450001',
      projectName: 'Dahej Petrochemical Package 3',
      vendorId: vendors[0]?.id || '',
      sesNo: '',
      sesDate: new Date().toISOString().split('T')[0],
      amountDue: 0,
      remarks: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    // If invoice is already submitted or approved, it is locked for admin personnel
    if (inv.status !== 'Draft' && !isSuperAdmin) {
      alert('This invoice has already been submitted and is locked from modification.');
      return;
    }

    setEditingInvoice(inv);
    setFormData({
      invoiceMonth: inv.invoiceMonth,
      invoiceDate: inv.invoiceDate,
      invoiceNo: inv.invoiceNo,
      faTokenNo: inv.faTokenNo,
      faTokenDate: inv.faTokenDate,
      poNo: inv.poNo,
      projectName: inv.projectName,
      vendorId: inv.vendorId,
      sesNo: inv.sesNo,
      sesDate: inv.sesDate,
      amountDue: inv.amountDue,
      remarks: inv.remarks || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent, submitNow = false) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.invoiceNo.trim()) errors.invoiceNo = 'Invoice No is required';
    if (!formData.invoiceDate) errors.invoiceDate = 'Invoice Date is required';
    if (!formData.vendorId) errors.vendorId = 'Please select a vendor';
    if (formData.amountDue <= 0) errors.amountDue = 'Amount must be greater than 0';

    // Duplicate check: Block same Vendor + Invoice No
    const duplicate = invoices.find(
      (i) =>
        i.vendorId === formData.vendorId &&
        i.invoiceNo.trim().toLowerCase() === formData.invoiceNo.trim().toLowerCase() &&
        (!editingInvoice || i.id !== editingInvoice.id)
    );
    if (duplicate) {
      errors.invoiceNo = `Duplicate invoice! This Vendor already has invoice '${formData.invoiceNo}' recorded.`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const selectedVendor = vendors.find((v) => v.id === formData.vendorId);
    const vendorName = selectedVendor?.vendorName || 'Unknown Vendor';
    const vendorType = selectedVendor?.providedServices || 'Contractor Services';

    const ageing = calculateInvoiceAgeing(formData.invoiceDate);

    if (editingInvoice) {
      let nextStatus = editingInvoice.status;
      let nextSeqNo = editingInvoice.seqNo;
      let submittedBy = editingInvoice.submittedBy;
      let submittedAt = editingInvoice.submittedAt;

      if (submitNow && editingInvoice.status === 'Draft') {
        nextStatus = 'Submitted';
        const existingSeqs = invoices.map((i) => i.seqNo || '').filter(Boolean);
        nextSeqNo = generateInvoiceSeqNo(existingSeqs);
        submittedBy = currentUser.name;
        submittedAt = new Date().toISOString();
      }

      const updated = invoices.map((i) =>
        i.id === editingInvoice.id
          ? {
              ...i,
              invoiceMonth: formData.invoiceMonth,
              invoiceDate: formData.invoiceDate,
              invoiceNo: formData.invoiceNo.trim(),
              faTokenNo: formData.faTokenNo.trim(),
              faTokenDate: formData.faTokenDate,
              poNo: formData.poNo.trim(),
              projectName: formData.projectName.trim(),
              vendorId: formData.vendorId,
              vendorName,
              vendorType,
              sesNo: formData.sesNo.trim(),
              sesDate: formData.sesDate,
              amountDue: Number(formData.amountDue),
              ageingDays: ageing,
              status: nextStatus,
              seqNo: nextSeqNo,
              submittedBy,
              submittedAt,
              remarks: formData.remarks.trim() || undefined,
            }
          : i
      );
      setInvoices(updated);
      storage.saveInvoices(updated);
      storage.logAudit({
        action: submitNow ? 'SUBMIT' : 'UPDATE',
        workspace: 'Workspace B – Invoice Verification',
        entityType: 'Invoice',
        entityId: editingInvoice.id,
        details: `${submitNow ? 'Submitted' : 'Updated'} invoice ${formData.invoiceNo} (Seq: ${nextSeqNo || 'N/A'}) for ${vendorName}`,
      });
    } else {
      let nextStatus: InvoiceStatus = submitNow ? 'Submitted' : 'Draft';
      let nextSeqNo: string | undefined = undefined;
      let submittedBy: string | undefined = undefined;
      let submittedAt: string | undefined = undefined;

      if (submitNow) {
        const existingSeqs = invoices.map((i) => i.seqNo || '').filter(Boolean);
        nextSeqNo = generateInvoiceSeqNo(existingSeqs);
        submittedBy = currentUser.name;
        submittedAt = new Date().toISOString();
      }

      const newInv: Invoice = {
        id: `inv-${Date.now()}`,
        seqNo: nextSeqNo,
        invoiceMonth: formData.invoiceMonth,
        invoiceDate: formData.invoiceDate,
        invoiceNo: formData.invoiceNo.trim(),
        faTokenNo: formData.faTokenNo.trim(),
        faTokenDate: formData.faTokenDate,
        poNo: formData.poNo.trim(),
        projectName: formData.projectName.trim(),
        vendorId: formData.vendorId,
        vendorName,
        vendorType,
        sesNo: formData.sesNo.trim(),
        sesDate: formData.sesDate,
        amountDue: Number(formData.amountDue),
        ageingDays: ageing,
        status: nextStatus,
        submittedBy,
        submittedAt,
        remarks: formData.remarks.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [newInv, ...invoices];
      setInvoices(updated);
      storage.saveInvoices(updated);
      storage.logAudit({
        action: submitNow ? 'SUBMIT' : 'CREATE',
        workspace: 'Workspace B – Invoice Verification',
        entityType: 'Invoice',
        entityId: newInv.id,
        details: `${submitNow ? 'Submitted' : 'Drafted'} invoice ${newInv.invoiceNo} (Seq: ${newInv.seqNo || 'Draft'}) for ${vendorName}`,
      });
    }

    setIsModalOpen(false);
  };

  // Submit action directly from row
  const handleSubmitInvoice = (inv: Invoice) => {
    const existingSeqs = invoices.map((i) => i.seqNo || '').filter(Boolean);
    const generatedSeq = generateInvoiceSeqNo(existingSeqs);
    const updated = invoices.map((i) =>
      i.id === inv.id
        ? {
            ...i,
            status: 'Submitted' as InvoiceStatus,
            seqNo: generatedSeq,
            submittedBy: currentUser.name,
            submittedAt: new Date().toISOString(),
          }
        : i
    );
    setInvoices(updated);
    storage.saveInvoices(updated);
    storage.logAudit({
      action: 'SUBMIT',
      workspace: 'Workspace B – Invoice Verification',
      entityType: 'Invoice',
      entityId: inv.id,
      details: `Submitted invoice ${inv.invoiceNo} -> Generated Seq: ${generatedSeq}`,
    });
  };

  // Super Admin Approve
  const handleApproveInvoice = (inv: Invoice) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin (Head HR) can approve invoices.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const finalAgeing = calculateInvoiceAgeing(inv.invoiceDate, todayStr);

    const updated = invoices.map((i) =>
      i.id === inv.id
        ? {
            ...i,
            status: 'Approved' as InvoiceStatus,
            approvedBy: currentUser.name,
            approvedDate: todayStr,
            ageingDays: finalAgeing, // stops counting after approval
          }
        : i
    );
    setInvoices(updated);
    storage.saveInvoices(updated);
    storage.logAudit({
      action: 'APPROVE',
      workspace: 'Workspace B – Invoice Verification',
      entityType: 'Invoice',
      entityId: inv.id,
      details: `Head HR ${currentUser.name} APPROVED invoice ${inv.invoiceNo} (Seq: ${inv.seqNo}) of ${formatINR(inv.amountDue)}`,
    });
  };

  // Super Admin Reject
  const handleConfirmReject = () => {
    if (!rejectionTarget) return;
    if (!rejectionRemarks.trim()) {
      setRejectionError('Remarks are compulsory when rejecting an invoice.');
      return;
    }

    const updated = invoices.map((i) =>
      i.id === rejectionTarget.id
        ? {
            ...i,
            status: 'Rejected' as InvoiceStatus,
            remarks: rejectionRemarks.trim(),
          }
        : i
    );
    setInvoices(updated);
    storage.saveInvoices(updated);
    storage.logAudit({
      action: 'REJECT',
      workspace: 'Workspace B – Invoice Verification',
      entityType: 'Invoice',
      entityId: rejectionTarget.id,
      details: `Head HR ${currentUser.name} REJECTED invoice ${rejectionTarget.invoiceNo}. Reason: ${rejectionRemarks}`,
    });

    setRejectionTarget(null);
    setRejectionRemarks('');
    setRejectionError('');
  };

  // Delete invoice (Super Admin only)
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const updated = invoices.filter((i) => i.id !== deleteTarget.id);
    setInvoices(updated);
    storage.saveInvoices(updated);
    storage.logAudit({
      action: 'DELETE',
      workspace: 'Workspace B – Invoice Verification',
      entityType: 'Invoice',
      entityId: deleteTarget.id,
      details: `Deleted invoice ${deleteTarget.invoiceNo} (${deleteTarget.seqNo || 'Draft'})`,
    });
    setDeleteTarget(null);
  };

  // Import handler
  const handleImportInvoices = (rows: Record<string, any>[]) => {
    const errors: string[] = [];
    const validInvoices: Invoice[] = [];
    const existingPairs = new Set(
      invoices.map((i) => `${i.vendorId}_${i.invoiceNo.toLowerCase().trim()}`)
    );

    rows.forEach((r, idx) => {
      const invNo = String(r['Invoice No'] || r.invoiceNo || '').trim();
      const vendorNameStr = String(r['Vendor Name'] || r.vendorName || '').trim();
      const amount = Number(r['Amount Due incl. GST'] || r.amountDue || 0);
      const invDate = String(r['Invoice Date'] || r.invoiceDate || '').trim();

      if (!invNo) {
        errors.push(`Row ${idx + 1}: Missing Invoice No`);
        return;
      }
      if (!vendorNameStr) {
        errors.push(`Row ${idx + 1}: Missing Vendor Name`);
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${idx + 1}: Invalid Amount '${amount}'`);
        return;
      }

      // Match vendor
      let matchedVendor = vendors.find(
        (v) => v.vendorName.toLowerCase().includes(vendorNameStr.toLowerCase())
      );
      if (!matchedVendor) {
        matchedVendor = vendors[0];
      }

      const pairKey = `${matchedVendor.id}_${invNo.toLowerCase()}`;
      if (existingPairs.has(pairKey)) {
        errors.push(`Row ${idx + 1}: Duplicate invoice '${invNo}' for vendor '${matchedVendor.vendorName}'`);
        return;
      }
      existingPairs.add(pairKey);

      validInvoices.push({
        id: `inv-imp-${Date.now()}-${idx}`,
        invoiceMonth: '10-2026',
        invoiceDate: invDate || new Date().toISOString().split('T')[0],
        invoiceNo: invNo,
        faTokenNo: String(r['F&A Token No'] || 'FAT-AUTO'),
        faTokenDate: new Date().toISOString().split('T')[0],
        poNo: String(r['WO/PO No'] || 'PO-EPCC-450001'),
        projectName: 'Dahej Petrochemical Package 3',
        vendorId: matchedVendor.id,
        vendorName: matchedVendor.vendorName,
        vendorType: matchedVendor.providedServices,
        sesNo: String(r['SES No'] || 'SES-AUTO'),
        sesDate: new Date().toISOString().split('T')[0],
        amountDue: amount,
        ageingDays: calculateInvoiceAgeing(invDate || new Date().toISOString().split('T')[0]),
        status: 'Draft',
        createdAt: new Date().toISOString(),
      });
    });

    if (validInvoices.length > 0) {
      const updated = [...validInvoices, ...invoices];
      setInvoices(updated);
      storage.saveInvoices(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace B – Invoice Verification',
        entityType: 'Invoice Import',
        entityId: `bulk-${validInvoices.length}`,
        details: `Imported ${validInvoices.length} draft invoices from spreadsheet`,
      });
    }

    return { successCount: validInvoices.length, errors };
  };

  // Columns definition
  const columns: ColumnDef<Invoice>[] = [
    {
      key: 'seqNo',
      header: 'Seq. No',
      sortable: true,
      sampleTemplateValue: 'INV-2026-0005',
      render: (item) =>
        item.seqNo ? (
          <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {item.seqNo}
          </span>
        ) : (
          <span className="text-slate-400 italic text-xs">Draft (Unassigned)</span>
        ),
    },
    {
      key: 'invoiceMonth',
      header: 'Month',
      sortable: true,
      sampleTemplateValue: '10-2026',
      render: (item) => <span className="font-mono text-slate-700">{item.invoiceMonth}</span>,
    },
    {
      key: 'invoiceNo',
      header: 'Invoice No',
      sortable: true,
      sampleTemplateValue: 'INV/2026/099',
      render: (item) => (
        <button
          type="button"
          onClick={() => setViewingInvoice(item)}
          className="font-bold text-slate-900 hover:text-blue-600 underline text-left"
        >
          {item.invoiceNo}
        </button>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Invoice Date',
      sortable: true,
      sampleTemplateValue: '2026-10-01',
      render: (item) => formatDDMMMYYYY(item.invoiceDate),
    },
    {
      key: 'vendorName',
      header: 'Vendor Name & Type',
      sortable: true,
      filterable: true,
      sampleTemplateValue: 'Apex Facility Management Pvt Ltd',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900 leading-tight">{item.vendorName}</p>
          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.vendorType}</p>
        </div>
      ),
    },
    {
      key: 'poNo',
      header: 'WO / PO No',
      sampleTemplateValue: 'PO-EPCC-450001289',
      render: (item) => <span className="font-mono text-xs text-slate-600">{item.poNo}</span>,
    },
    {
      key: 'amountDue',
      header: 'Amount Due (₹)',
      sortable: true,
      align: 'right',
      sampleTemplateValue: 250000,
      render: (item) => (
        <span className="font-bold font-mono text-slate-900">{formatINR(item.amountDue)}</span>
      ),
    },
    {
      key: 'ageingDays',
      header: 'Ageing',
      sortable: true,
      align: 'center',
      render: (item) => {
        const days = calculateInvoiceAgeing(item.invoiceDate, item.approvedDate);
        const { color } = getAgeingSeverity(days);
        const colorClasses = {
          green: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          amber: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
          red: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
        }[color];

        return (
          <span
            className={`px-2 py-0.5 rounded-full text-xs border ${colorClasses}`}
            title={item.status === 'Approved' ? 'Ageing frozen upon approval' : 'Days since invoice date'}
          >
            {days}d {item.status === 'Approved' && '✓'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      render: (item) => {
        const badgeClasses = {
          Draft: 'bg-slate-100 text-slate-700 border-slate-300',
          Submitted: 'bg-blue-100 text-blue-800 border-blue-300',
          Approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          Rejected: 'bg-rose-100 text-rose-800 border-rose-300',
        }[item.status];

        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeClasses}`}>
            {item.status}
          </span>
        );
      },
    },
    {
      key: 'approvalInfo',
      header: 'Approval Details',
      render: (item) =>
        item.approvedBy ? (
          <div className="text-[11px] leading-tight text-slate-600">
            <span className="font-semibold text-emerald-700">{item.approvedBy}</span>
            <span className="block text-slate-400">{formatDDMMMYYYY(item.approvedDate)}</span>
          </div>
        ) : item.status === 'Submitted' ? (
          <span className="text-[11px] text-amber-600 font-medium">Pending Head HR</span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Pipeline Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              Workspace B – Invoice Verification &amp; Tracker
            </h1>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">
              Single Verification Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end invoice settlement pipeline: Drafted by Admin Personnel, locked with
            auto-generated sequence number, and verified &amp; approved by Head HR.
          </p>
        </div>

        {/* Quick Filter tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start md:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterView('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterView === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('pending')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterView === 'pending'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pending Verification ({invoices.filter((i) => i.status === 'Submitted').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('approved')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterView === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({invoices.filter((i) => i.status === 'Approved').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterView('draft')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterView === 'draft' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Drafts ({invoices.filter((i) => i.status === 'Draft').length})
          </button>
        </div>
      </div>

      {/* Main Invoices Table */}
      <DataTable<Invoice>
        title="Monthly Invoice Processing Register"
        subtitle="Green: < 15 days • Amber: 15–30 days • Red: > 30 days overdue"
        data={filteredInvoices}
        columns={columns}
        canAdd={!isViewer}
        canEdit={!isViewer}
        canDelete={isSuperAdmin}
        onAdd={handleOpenAdd}
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeleteTarget(item)}
        onImportClick={() => setIsImportOpen(true)}
        exportFileName="EPCC_Invoice_Tracker"
        customActions={(item) => (
          <div className="flex items-center gap-1">
            {/* View Full Modal */}
            <button
              type="button"
              onClick={() => setViewingInvoice(item)}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="View Complete Invoice Record"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Submit button (if Draft) */}
            {item.status === 'Draft' && !isViewer && (
              <button
                type="button"
                onClick={() => handleSubmitInvoice(item)}
                className="px-2 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1 shadow-xs transition"
                title="Submit invoice to Head HR (generates locked Seq. No)"
              >
                <Send className="w-3 h-3" />
                Submit
              </button>
            )}

            {/* Super Admin Approve / Reject actions (if Submitted) */}
            {item.status === 'Submitted' && isSuperAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => handleApproveInvoice(item)}
                  className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1 shadow-xs transition"
                  title="Approve invoice"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectionTarget(item);
                    setRejectionRemarks('');
                    setRejectionError('');
                  }}
                  className="px-2 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded flex items-center gap-1 shadow-xs transition"
                  title="Reject invoice with remarks"
                >
                  <XCircle className="w-3 h-3" />
                  Reject
                </button>
              </>
            )}
          </div>
        )}
      />

      {/* Invoice Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvoice ? 'Edit Invoice' : 'Create New Invoice Entry'}
        subtitle="Save as draft or submit directly for Head HR verification"
        maxWidth="2xl"
      >
        <form onSubmit={(e) => handleSaveInvoice(e, false)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Invoice Month <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceMonth}
                onChange={(e) => setFormData({ ...formData, invoiceMonth: e.target.value })}
                placeholder="MM-YYYY (e.g. 10-2026)"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formErrors.invoiceDate && (
                <p className="text-xs text-red-600 mt-1">{formErrors.invoiceDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                placeholder="Vendor's Bill No"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
              {formErrors.invoiceNo && (
                <p className="text-xs text-red-600 mt-1">{formErrors.invoiceNo}</p>
              )}
            </div>
          </div>

          {/* Vendor Selection (dropdown from Vendor Master) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Vendor Name (Master Data) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName} ({v.vendorCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Vendor Type / Services (Auto-Filled)
              </label>
              <input
                type="text"
                readOnly
                value={
                  vendors.find((v) => v.id === formData.vendorId)?.providedServices ||
                  'Contractor Services'
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 bg-slate-100 rounded-lg text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">WO / PO No</label>
              <input
                type="text"
                value={formData.poNo}
                onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">F&amp;A Token No</label>
              <input
                type="text"
                value={formData.faTokenNo}
                onChange={(e) => setFormData({ ...formData, faTokenNo: e.target.value })}
                placeholder="FAT-XXXX"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">F&amp;A Token Date</label>
              <input
                type="date"
                value={formData.faTokenDate}
                onChange={(e) => setFormData({ ...formData, faTokenDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">SES No</label>
              <input
                type="text"
                value={formData.sesNo}
                onChange={(e) => setFormData({ ...formData, sesNo: e.target.value })}
                placeholder="SES-XXXXXX"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">SES Date</label>
              <input
                type="date"
                value={formData.sesDate}
                onChange={(e) => setFormData({ ...formData, sesDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Amount Due incl. GST (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={formData.amountDue}
                onChange={(e) => setFormData({ ...formData, amountDue: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
              />
              {formErrors.amountDue && (
                <p className="text-xs text-red-600 mt-1">{formErrors.amountDue}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Project Name</label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Challan numbers, service period, muster verification details..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-400 italic flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Submitting generates a permanent sequence number
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSaveInvoice(e, true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Directly
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Invoice Details View Modal */}
      {viewingInvoice && (
        <Modal
          isOpen={true}
          onClose={() => setViewingInvoice(null)}
          title={`Invoice Details: ${viewingInvoice.invoiceNo}`}
          subtitle={`Sequence ID: ${viewingInvoice.seqNo || 'Draft'}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{viewingInvoice.status}</p>
              </div>
              <div>
                <p className="text-slate-500">Amount Due</p>
                <p className="font-bold text-sm text-blue-700 font-mono mt-0.5">
                  {formatINR(viewingInvoice.amountDue)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Ageing</p>
                <p className="font-bold text-sm text-slate-900 mt-0.5">
                  {calculateInvoiceAgeing(viewingInvoice.invoiceDate, viewingInvoice.approvedDate)} days
                </p>
              </div>
              <div>
                <p className="text-slate-500">Invoice Date</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDDMMMYYYY(viewingInvoice.invoiceDate)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Invoice Month</p>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingInvoice.invoiceMonth}</p>
              </div>
              <div>
                <p className="text-slate-500">PO / WO Number</p>
                <p className="font-semibold text-slate-800 mt-0.5 font-mono">{viewingInvoice.poNo}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <p className="font-bold text-slate-800 text-sm">Vendor Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500">Vendor Name</p>
                  <p className="font-semibold text-slate-900">{viewingInvoice.vendorName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Vendor Services</p>
                  <p className="font-semibold text-slate-900">{viewingInvoice.vendorType}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-slate-500">F&amp;A Token</p>
                <p className="font-semibold text-slate-800 font-mono">{viewingInvoice.faTokenNo || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">Token Date</p>
                <p className="font-semibold text-slate-800">
                  {formatDDMMMYYYY(viewingInvoice.faTokenDate)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">SES Number</p>
                <p className="font-semibold text-slate-800 font-mono">{viewingInvoice.sesNo || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">SES Date</p>
                <p className="font-semibold text-slate-800">
                  {formatDDMMMYYYY(viewingInvoice.sesDate)}
                </p>
              </div>
            </div>

            {viewingInvoice.approvedBy && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Approved by {viewingInvoice.approvedBy} on {formatDDMMMYYYY(viewingInvoice.approvedDate)}
                </p>
              </div>
            )}

            {viewingInvoice.remarks && (
              <div className="p-3 bg-slate-100 rounded-xl">
                <p className="text-slate-500 font-bold uppercase text-[10px]">Remarks / Audit Notes</p>
                <p className="text-slate-800 mt-1">{viewingInvoice.remarks}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal (Mandatory Remarks) */}
      <Modal
        isOpen={Boolean(rejectionTarget)}
        onClose={() => setRejectionTarget(null)}
        title="Reject Invoice (Head HR)"
        subtitle={`Invoice No: ${rejectionTarget?.invoiceNo} (${rejectionTarget?.vendorName})`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p>
              You are rejecting this invoice. Rejection remarks are <strong>mandatory</strong> and
              will be permanently logged in the audit trail.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Rejection Reason / Remarks <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              placeholder="e.g. Muster roll discrepancies in third week; SES not matching physical measurement sheet..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
            {rejectionError && <p className="text-xs text-red-600 mt-1">{rejectionError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRejectionTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReject}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Invoice Modal (Super Admin only) */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete Invoice"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs">
            Are you sure you want to delete invoice <strong>{deleteTarget?.invoiceNo}</strong> (Seq:{' '}
            {deleteTarget?.seqNo || 'Draft'}) for <strong>{deleteTarget?.vendorName}</strong>?
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Invoices"
        templateColumns={[
          { key: 'invoiceNo', label: 'Invoice No', sample: 'INV/2026/102' },
          { key: 'invoiceDate', label: 'Invoice Date', sample: '2026-10-05' },
          { key: 'vendorName', label: 'Vendor Name', sample: 'Apex Facility Management Pvt Ltd' },
          { key: 'amountDue', label: 'Amount Due incl. GST', sample: 185000 },
          { key: 'poNo', label: 'WO/PO No', sample: 'PO-EPCC-450001289' },
          { key: 'faTokenNo', label: 'F&A Token No', sample: 'FAT-9011' },
          { key: 'sesNo', label: 'SES No', sample: 'SES-900340' },
        ]}
        onImportConfirm={handleImportInvoices}
      />
    </div>
  );
}

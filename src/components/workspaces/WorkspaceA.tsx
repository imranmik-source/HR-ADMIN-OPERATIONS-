import React, { useState } from 'react';
import { Users, Truck, Check, AlertCircle, Plus } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { Modal } from '../common/Modal.tsx';
import { ImportModal } from '../common/ImportModal.tsx';
import { StaffMember, Vendor, UserProfile, StaffSource } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import {
  formatDDMMMYYYY,
  validateGST,
  validatePhone,
  calculateStaffStatus,
} from '../../utils/calculations.ts';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal'
];

interface WorkspaceAProps {
  currentUser: UserProfile;
  initialTab?: 'staff' | 'vendors';
}

export function WorkspaceA({ currentUser, initialTab = 'staff' }: WorkspaceAProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'vendors'>(initialTab);

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>(storage.staff);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState<{
    employeeId: string;
    name: string;
    source: StaffSource;
    joiningDate: string;
    exitDate: string;
    remarks: string;
  }>({
    employeeId: '',
    name: '',
    source: 'TPL',
    joiningDate: new Date().toISOString().split('T')[0],
    exitDate: '',
    remarks: '',
  });
  const [staffErrors, setStaffErrors] = useState<Record<string, string>>({});
  const [isStaffImportOpen, setIsStaffImportOpen] = useState(false);

  // Vendor state
  const [vendorList, setVendorList] = useState<Vendor[]>(storage.vendors);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorFormData, setVendorFormData] = useState<{
    vendorCode: string;
    vendorName: string;
    providedServices: string;
    address: string;
    state: string;
    email: string;
    contactNo: string;
    gstNo: string;
  }>({
    vendorCode: '',
    vendorName: '',
    providedServices: '',
    address: '',
    state: 'Gujarat',
    email: '',
    contactNo: '',
    gstNo: '',
  });
  const [vendorErrors, setVendorErrors] = useState<Record<string, string>>({});
  const [isVendorImportOpen, setIsVendorImportOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'staff' | 'vendor';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'staff',
    id: '',
    name: '',
  });

  const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'admin_personnel';
  const canDelete = currentUser.role === 'super_admin';

  // -------------------------------------------------------------
  // STAFF HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffFormData({
      employeeId: `EPCC-${1000 + staffList.length + 1}`,
      name: '',
      source: 'TPL',
      joiningDate: new Date().toISOString().split('T')[0],
      exitDate: '',
      remarks: '',
    });
    setStaffErrors({});
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffFormData({
      employeeId: staff.employeeId,
      name: staff.name,
      source: staff.source,
      joiningDate: staff.joiningDate,
      exitDate: staff.exitDate || '',
      remarks: staff.remarks || '',
    });
    setStaffErrors({});
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!staffFormData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!staffFormData.name.trim()) errors.name = 'Employee name is required';
    if (!staffFormData.joiningDate) errors.joiningDate = 'Joining date is required';

    // Unique Employee ID check
    const duplicate = staffList.find(
      (s) =>
        s.employeeId.toLowerCase() === staffFormData.employeeId.trim().toLowerCase() &&
        (!editingStaff || s.id !== editingStaff.id)
    );
    if (duplicate) {
      errors.employeeId = 'Employee ID must be unique';
    }

    if (Object.keys(errors).length > 0) {
      setStaffErrors(errors);
      return;
    }

    const autoStatus = calculateStaffStatus(staffFormData.exitDate);

    if (editingStaff) {
      const updated = staffList.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              employeeId: staffFormData.employeeId.trim(),
              name: staffFormData.name.trim(),
              source: staffFormData.source,
              joiningDate: staffFormData.joiningDate,
              exitDate: staffFormData.exitDate.trim() || undefined,
              status: autoStatus,
              remarks: staffFormData.remarks.trim() || undefined,
            }
          : s
      );
      setStaffList(updated);
      storage.saveStaff(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace A – Master Data',
        entityType: 'Staff',
        entityId: editingStaff.id,
        details: `Updated staff ${staffFormData.name} (${staffFormData.employeeId})`,
      });
    } else {
      const newStaff: StaffMember = {
        id: `stf-${Date.now()}`,
        employeeId: staffFormData.employeeId.trim(),
        name: staffFormData.name.trim(),
        source: staffFormData.source,
        joiningDate: staffFormData.joiningDate,
        exitDate: staffFormData.exitDate.trim() || undefined,
        status: autoStatus,
        remarks: staffFormData.remarks.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [newStaff, ...staffList];
      setStaffList(updated);
      storage.saveStaff(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace A – Master Data',
        entityType: 'Staff',
        entityId: newStaff.id,
        details: `Added new staff member ${newStaff.name} (${newStaff.employeeId}, ${newStaff.source})`,
      });
    }

    setIsStaffModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.type === 'staff') {
      const updated = staffList.filter((s) => s.id !== deleteConfirmation.id);
      setStaffList(updated);
      storage.saveStaff(updated);
      storage.logAudit({
        action: 'DELETE',
        workspace: 'Workspace A – Master Data',
        entityType: 'Staff',
        entityId: deleteConfirmation.id,
        details: `Deleted staff record: ${deleteConfirmation.name}`,
      });
    } else {
      const updated = vendorList.filter((v) => v.id !== deleteConfirmation.id);
      setVendorList(updated);
      storage.saveVendors(updated);
      storage.logAudit({
        action: 'DELETE',
        workspace: 'Workspace A / L – Vendor Master',
        entityType: 'Vendor',
        entityId: deleteConfirmation.id,
        details: `Deleted vendor record: ${deleteConfirmation.name}`,
      });
    }
    setDeleteConfirmation({ isOpen: false, type: 'staff', id: '', name: '' });
  };

  const handleImportStaff = (rows: Record<string, any>[]) => {
    const errors: string[] = [];
    const validNewStaff: StaffMember[] = [];
    const existingIds = new Set(staffList.map((s) => s.employeeId.toLowerCase()));

    rows.forEach((r, idx) => {
      const empId = String(r['Employee ID'] || r.employeeId || '').trim();
      const name = String(r['Name of Employee'] || r.name || '').trim();
      const source = (String(r['Employee Source'] || r.source || 'TPL').trim() === 'Outsource'
        ? 'Outsource'
        : 'TPL') as StaffSource;
      const joinDate = String(r['Date of Joining'] || r.joiningDate || '').trim();
      const exitDate = String(r['Date of Exit'] || r.exitDate || '').trim();
      const remarks = String(r['Remarks'] || r.remarks || '').trim();

      if (!empId) {
        errors.push(`Row ${idx + 1}: Missing Employee ID`);
        return;
      }
      if (existingIds.has(empId.toLowerCase())) {
        errors.push(`Row ${idx + 1}: Duplicate Employee ID ${empId}`);
        return;
      }
      if (!name) {
        errors.push(`Row ${idx + 1}: Missing Name of Employee`);
        return;
      }

      existingIds.add(empId.toLowerCase());
      validNewStaff.push({
        id: `stf-imp-${Date.now()}-${idx}`,
        employeeId: empId,
        name,
        source,
        joiningDate: joinDate || new Date().toISOString().split('T')[0],
        exitDate: exitDate || undefined,
        status: calculateStaffStatus(exitDate),
        remarks: remarks || undefined,
        createdAt: new Date().toISOString(),
      });
    });

    if (validNewStaff.length > 0) {
      const updated = [...validNewStaff, ...staffList];
      setStaffList(updated);
      storage.saveStaff(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace A – Master Data',
        entityType: 'Staff Import',
        entityId: `bulk-${validNewStaff.length}`,
        details: `Imported ${validNewStaff.length} staff records from Excel`,
      });
    }

    return { successCount: validNewStaff.length, errors };
  };

  // -------------------------------------------------------------
  // VENDOR HANDLERS
  // -------------------------------------------------------------
  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVendorFormData({
      vendorCode: `VND-2026-${String(vendorList.length + 1).padStart(3, '0')}`,
      vendorName: '',
      providedServices: '',
      address: '',
      state: 'Gujarat',
      email: '',
      contactNo: '',
      gstNo: '',
    });
    setVendorErrors({});
    setIsVendorModalOpen(true);
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVendorFormData({
      vendorCode: v.vendorCode,
      vendorName: v.vendorName,
      providedServices: v.providedServices,
      address: v.address,
      state: v.state,
      email: v.email,
      contactNo: v.contactNo,
      gstNo: v.gstNo,
    });
    setVendorErrors({});
    setIsVendorModalOpen(true);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!vendorFormData.vendorCode.trim()) errors.vendorCode = 'Vendor Code is required';
    if (!vendorFormData.vendorName.trim()) errors.vendorName = 'Vendor Name is required';
    if (!vendorFormData.providedServices.trim())
      errors.providedServices = 'Provided Services is required';
    if (!vendorFormData.address.trim()) errors.address = 'Address is required';
    if (!vendorFormData.email.trim() || !vendorFormData.email.includes('@'))
      errors.email = 'Valid Email ID is required';
    
    // Contact No validation
    if (!validatePhone(vendorFormData.contactNo)) {
      errors.contactNo = 'Contact number must be exactly 10 digits';
    }

    // GSTIN validation
    if (!validateGST(vendorFormData.gstNo)) {
      errors.gstNo = 'Enter valid 15-character GSTIN (e.g. 24AAACA1234C1Z9)';
    }

    // Unique Vendor Code check
    const duplicate = vendorList.find(
      (v) =>
        v.vendorCode.toLowerCase() === vendorFormData.vendorCode.trim().toLowerCase() &&
        (!editingVendor || v.id !== editingVendor.id)
    );
    if (duplicate) {
      errors.vendorCode = 'Vendor Code must be unique';
    }

    if (Object.keys(errors).length > 0) {
      setVendorErrors(errors);
      return;
    }

    const cleanContact = vendorFormData.contactNo.replace(/\D/g, '');
    const cleanGST = vendorFormData.gstNo.trim().toUpperCase();

    if (editingVendor) {
      const updated = vendorList.map((v) =>
        v.id === editingVendor.id
          ? {
              ...v,
              vendorCode: vendorFormData.vendorCode.trim(),
              vendorName: vendorFormData.vendorName.trim(),
              providedServices: vendorFormData.providedServices.trim(),
              address: vendorFormData.address.trim(),
              state: vendorFormData.state,
              email: vendorFormData.email.trim(),
              contactNo: cleanContact,
              gstNo: cleanGST,
            }
          : v
      );
      setVendorList(updated);
      storage.saveVendors(updated);
      storage.logAudit({
        action: 'UPDATE',
        workspace: 'Workspace A / L – Vendor Master',
        entityType: 'Vendor',
        entityId: editingVendor.id,
        details: `Updated vendor ${vendorFormData.vendorName} (${vendorFormData.vendorCode})`,
      });
    } else {
      const newVendor: Vendor = {
        id: `ven-${Date.now()}`,
        vendorCode: vendorFormData.vendorCode.trim(),
        vendorName: vendorFormData.vendorName.trim(),
        providedServices: vendorFormData.providedServices.trim(),
        address: vendorFormData.address.trim(),
        state: vendorFormData.state,
        email: vendorFormData.email.trim(),
        contactNo: cleanContact,
        gstNo: cleanGST,
        createdAt: new Date().toISOString(),
      };
      const updated = [newVendor, ...vendorList];
      setVendorList(updated);
      storage.saveVendors(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace A / L – Vendor Master',
        entityType: 'Vendor',
        entityId: newVendor.id,
        details: `Created new vendor ${newVendor.vendorName} (${newVendor.vendorCode})`,
      });
    }

    setIsVendorModalOpen(false);
  };

  const handleImportVendors = (rows: Record<string, any>[]) => {
    const errors: string[] = [];
    const validNewVendors: Vendor[] = [];
    const existingCodes = new Set(vendorList.map((v) => v.vendorCode.toLowerCase()));

    rows.forEach((r, idx) => {
      const code = String(r['Vendor Code'] || r.vendorCode || '').trim();
      const name = String(r['Vendor Name'] || r.vendorName || '').trim();
      const services = String(r['Provided Services'] || r.providedServices || '').trim();
      const addr = String(r['Address'] || r.address || '').trim();
      const state = String(r['State'] || r.state || 'Gujarat').trim();
      const email = String(r['Email ID'] || r.email || '').trim();
      const phone = String(r['Contact No'] || r.contactNo || '').replace(/\D/g, '');
      const gst = String(r['GST No'] || r.gstNo || '').trim().toUpperCase();

      if (!code) {
        errors.push(`Row ${idx + 1}: Missing Vendor Code`);
        return;
      }
      if (existingCodes.has(code.toLowerCase())) {
        errors.push(`Row ${idx + 1}: Duplicate Vendor Code ${code}`);
        return;
      }
      if (!name) {
        errors.push(`Row ${idx + 1}: Missing Vendor Name`);
        return;
      }
      if (!validateGST(gst)) {
        errors.push(`Row ${idx + 1}: Invalid 15-char GSTIN '${gst}'`);
        return;
      }

      existingCodes.add(code.toLowerCase());
      validNewVendors.push({
        id: `ven-imp-${Date.now()}-${idx}`,
        vendorCode: code,
        vendorName: name,
        providedServices: services || 'Contractor Services',
        address: addr || 'Project Site, Dahej',
        state,
        email: email || 'vendor@example.com',
        contactNo: phone.length === 10 ? phone : '9876543210',
        gstNo: gst,
        createdAt: new Date().toISOString(),
      });
    });

    if (validNewVendors.length > 0) {
      const updated = [...validNewVendors, ...vendorList];
      setVendorList(updated);
      storage.saveVendors(updated);
      storage.logAudit({
        action: 'CREATE',
        workspace: 'Workspace A / L – Vendor Master',
        entityType: 'Vendor Import',
        entityId: `bulk-${validNewVendors.length}`,
        details: `Imported ${validNewVendors.length} vendors from spreadsheet`,
      });
    }

    return { successCount: validNewVendors.length, errors };
  };

  // Staff Table Column Definitions
  const staffColumns: ColumnDef<StaffMember>[] = [
    {
      key: 'employeeId',
      header: 'Employee ID',
      sortable: true,
      sampleTemplateValue: 'EPCC-1007',
      render: (item) => <span className="font-mono font-bold text-blue-700">{item.employeeId}</span>,
    },
    {
      key: 'name',
      header: 'Name of Employee',
      sortable: true,
      sampleTemplateValue: 'Rajesh Sen',
      render: (item) => <span className="font-semibold text-slate-900">{item.name}</span>,
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      filterable: true,
      filterOptions: ['TPL', 'Outsource'],
      sampleTemplateValue: 'TPL',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            item.source === 'TPL'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-purple-100 text-purple-800 border border-purple-200'
          }`}
        >
          {item.source}
        </span>
      ),
    },
    {
      key: 'joiningDate',
      header: 'Date of Joining',
      sortable: true,
      sampleTemplateValue: '2025-01-15',
      render: (item) => formatDDMMMYYYY(item.joiningDate),
    },
    {
      key: 'exitDate',
      header: 'Date of Exit',
      sortable: true,
      sampleTemplateValue: '',
      render: (item) => (item.exitDate ? formatDDMMMYYYY(item.exitDate) : '-'),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      filterOptions: ['Active', 'Exited'],
      sampleTemplateValue: 'Active',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            item.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-slate-200 text-slate-700 border border-slate-300'
          }`}
        >
          {item.status === 'Active' && <Check className="w-3 h-3 text-emerald-600" />}
          {item.status}
        </span>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      sampleTemplateValue: 'Site Piping Lead',
      render: (item) => <span className="text-slate-600 text-xs">{item.remarks || '-'}</span>,
    },
  ];

  // Vendor Table Column Definitions
  const vendorColumns: ColumnDef<Vendor>[] = [
    {
      key: 'vendorCode',
      header: 'Vendor Code',
      sortable: true,
      sampleTemplateValue: 'VND-2026-006',
      render: (item) => <span className="font-mono font-bold text-emerald-700">{item.vendorCode}</span>,
    },
    {
      key: 'vendorName',
      header: 'Vendor Name',
      sortable: true,
      sampleTemplateValue: 'Shiv Shambhu Engineering Works',
      render: (item) => <span className="font-semibold text-slate-900">{item.vendorName}</span>,
    },
    {
      key: 'providedServices',
      header: 'Provided Services',
      sortable: true,
      sampleTemplateValue: 'Heavy Rigging & Crane Operations',
      render: (item) => <span className="text-slate-700 text-xs">{item.providedServices}</span>,
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      filterable: true,
      filterOptions: INDIAN_STATES,
      sampleTemplateValue: 'Gujarat',
    },
    {
      key: 'contactNo',
      header: 'Contact No',
      sampleTemplateValue: '9876543210',
      render: (item) => <span className="font-mono text-slate-800">{item.contactNo}</span>,
    },
    {
      key: 'gstNo',
      header: 'GST No',
      sortable: true,
      sampleTemplateValue: '24AAACA1234C1Z9',
      render: (item) => (
        <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
          {item.gstNo}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email ID',
      sampleTemplateValue: 'accounts@shivshambhu.in',
      render: (item) => (
        <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline text-xs">
          {item.email}
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Workspace A – Enterprise Master Data
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central repository for Project Staff and Registered Service Vendors across all site
            workspaces.
          </p>
        </div>

        {/* Tab switcher buttons */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'staff'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            Staff Details ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'vendors'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            Vendor Master ({vendorList.length})
          </button>
        </div>
      </div>

      {/* Staff Tab View */}
      {activeTab === 'staff' && (
        <DataTable<StaffMember>
          title="Staff Master Register"
          subtitle="All EPCC employees and outsourced specialists. Exits automatically transition status to Exited."
          data={staffList}
          columns={staffColumns}
          canAdd={canEdit}
          canEdit={canEdit}
          canDelete={canDelete}
          onAdd={handleOpenAddStaff}
          onEdit={handleOpenEditStaff}
          onDelete={(item) =>
            setDeleteConfirmation({
              isOpen: true,
              type: 'staff',
              id: item.id,
              name: `${item.name} (${item.employeeId})`,
            })
          }
          onImportClick={() => setIsStaffImportOpen(true)}
          exportFileName="EPCC_Staff_Master"
        />
      )}

      {/* Vendor Tab View */}
      {activeTab === 'vendors' && (
        <DataTable<Vendor>
          title="Vendor Master Directory"
          subtitle="Single source of truth for contractors, material suppliers, catering and medical agencies."
          data={vendorList}
          columns={vendorColumns}
          canAdd={canEdit}
          canEdit={canEdit}
          canDelete={canDelete}
          onAdd={handleOpenAddVendor}
          onEdit={handleOpenEditVendor}
          onDelete={(item) =>
            setDeleteConfirmation({
              isOpen: true,
              type: 'vendor',
              id: item.id,
              name: `${item.vendorName} (${item.vendorCode})`,
            })
          }
          onImportClick={() => setIsVendorImportOpen(true)}
          exportFileName="EPCC_Vendor_Master"
        />
      )}

      {/* Staff Add / Edit Modal */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
        subtitle="Staff members are eligible for Guest House room allotments"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStaff} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={staffFormData.employeeId}
                onChange={(e) => setStaffFormData({ ...staffFormData, employeeId: e.target.value })}
                placeholder="e.g. EPCC-1008"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
              {staffErrors.employeeId && (
                <p className="text-xs text-red-600 mt-1">{staffErrors.employeeId}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Employee Source <span className="text-red-500">*</span>
              </label>
              <select
                value={staffFormData.source}
                onChange={(e) =>
                  setStaffFormData({ ...staffFormData, source: e.target.value as StaffSource })
                }
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="TPL">TPL (Permanent / Direct)</option>
                <option value="Outsource">Outsource (Agency / Contract)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Name of Employee <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={staffFormData.name}
              onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
              placeholder="e.g. Suresh Roy"
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {staffErrors.name && <p className="text-xs text-red-600 mt-1">{staffErrors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Date of Joining <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={staffFormData.joiningDate}
                onChange={(e) => setStaffFormData({ ...staffFormData, joiningDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {staffErrors.joiningDate && (
                <p className="text-xs text-red-600 mt-1">{staffErrors.joiningDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Date of Exit (If Applicable)
              </label>
              <input
                type="date"
                value={staffFormData.exitDate}
                onChange={(e) => setStaffFormData({ ...staffFormData, exitDate: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Status automatically set to &quot;Exited&quot; if filled.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">Remarks / Designation</label>
            <textarea
              rows={2}
              value={staffFormData.remarks}
              onChange={(e) => setStaffFormData({ ...staffFormData, remarks: e.target.value })}
              placeholder="Project discipline, designation, site gate pass number..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStaffModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              {editingStaff ? 'Update Staff Member' : 'Save Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vendor Add / Edit Modal */}
      <Modal
        isOpen={isVendorModalOpen}
        onClose={() => setIsVendorModalOpen(false)}
        title={editingVendor ? 'Edit Vendor Details' : 'Register New Vendor'}
        subtitle="Vendors are available across Invoices, Colony, Utilities, Sanitation, Canteen and Medical"
        maxWidth="xl"
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Vendor Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={vendorFormData.vendorCode}
                onChange={(e) => setVendorFormData({ ...vendorFormData, vendorCode: e.target.value })}
                placeholder="VND-2026-001"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
              {vendorErrors.vendorCode && (
                <p className="text-xs text-red-600 mt-1">{vendorErrors.vendorCode}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={vendorFormData.vendorName}
                onChange={(e) => setVendorFormData({ ...vendorFormData, vendorName: e.target.value })}
                placeholder="e.g. Apex Facility Management"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
              />
              {vendorErrors.vendorName && (
                <p className="text-xs text-red-600 mt-1">{vendorErrors.vendorName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Provided Services <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vendorFormData.providedServices}
              onChange={(e) =>
                setVendorFormData({ ...vendorFormData, providedServices: e.target.value })
              }
              placeholder="e.g. Sanitation, Water Tanker Supply, Canteen Catering"
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {vendorErrors.providedServices && (
              <p className="text-xs text-red-600 mt-1">{vendorErrors.providedServices}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                GST Number (15 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={vendorFormData.gstNo}
                onChange={(e) =>
                  setVendorFormData({ ...vendorFormData, gstNo: e.target.value.toUpperCase() })
                }
                placeholder="24AAACA1234C1Z9"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 uppercase"
              />
              {vendorErrors.gstNo && (
                <p className="text-xs text-red-600 mt-1">{vendorErrors.gstNo}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Contact Number (10 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={vendorFormData.contactNo}
                onChange={(e) =>
                  setVendorFormData({
                    ...vendorFormData,
                    contactNo: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="9825123456"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
              />
              {vendorErrors.contactNo && (
                <p className="text-xs text-red-600 mt-1">{vendorErrors.contactNo}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Email ID <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={vendorFormData.email}
                onChange={(e) => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                placeholder="billing@agency.in"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {vendorErrors.email && <p className="text-xs text-red-600 mt-1">{vendorErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={vendorFormData.state}
                onChange={(e) => setVendorFormData({ ...vendorFormData, state: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Registered Office Address <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={vendorFormData.address}
              onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
              placeholder="Plot / Survey No, Industrial Area, City..."
              className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {vendorErrors.address && (
              <p className="text-xs text-red-600 mt-1">{vendorErrors.address}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsVendorModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              {editingVendor ? 'Update Vendor' : 'Register Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Super Admin only) */}
      <Modal
        isOpen={deleteConfirmation.isOpen}
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, type: 'staff', id: '', name: '' })
        }
        title="Confirm Deletion (Super Admin)"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <p className="text-xs leading-relaxed">
              Are you sure you want to permanently delete <strong>{deleteConfirmation.name}</strong>?
              This action will be permanently recorded in the Audit Log.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, type: 'staff', id: '', name: '' })
              }
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
            >
              Yes, Delete Permanently
            </button>
          </div>
        </div>
      </Modal>

      {/* Staff Import Modal */}
      <ImportModal
        isOpen={isStaffImportOpen}
        onClose={() => setIsStaffImportOpen(false)}
        title="Staff Master"
        templateColumns={[
          { key: 'employeeId', label: 'Employee ID', sample: 'EPCC-1010' },
          { key: 'name', label: 'Name of Employee', sample: 'Amitabh Sen' },
          { key: 'source', label: 'Employee Source', sample: 'TPL' },
          { key: 'joiningDate', label: 'Date of Joining', sample: '2025-01-15' },
          { key: 'exitDate', label: 'Date of Exit', sample: '' },
          { key: 'remarks', label: 'Remarks', sample: 'Electrical Lead' },
        ]}
        onImportConfirm={handleImportStaff}
      />

      {/* Vendor Import Modal */}
      <ImportModal
        isOpen={isVendorImportOpen}
        onClose={() => setIsVendorImportOpen(false)}
        title="Vendor Master"
        templateColumns={[
          { key: 'vendorCode', label: 'Vendor Code', sample: 'VND-2026-010' },
          { key: 'vendorName', label: 'Vendor Name', sample: 'Shree Krishna Logistics' },
          { key: 'providedServices', label: 'Provided Services', sample: 'Water Supply' },
          { key: 'address', label: 'Address', sample: 'Plot 20, Dahej GIDC' },
          { key: 'state', label: 'State', sample: 'Gujarat' },
          { key: 'email', label: 'Email ID', sample: 'krishna@logistics.in' },
          { key: 'contactNo', label: 'Contact No', sample: '9876543210' },
          { key: 'gstNo', label: 'GST No', sample: '24AAACA1234C1Z9' },
        ]}
        onImportConfirm={handleImportVendors}
      />
    </div>
  );
}

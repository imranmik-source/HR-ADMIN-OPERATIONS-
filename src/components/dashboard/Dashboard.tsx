import React from 'react';
import {
  Users2,
  Truck,
  FileCheck2,
  Hotel,
  ScrollText,
  Zap,
  Droplets,
  Sparkles,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { NavItemKey } from '../layout/Sidebar.tsx';
import { UserProfile, WorkspaceId } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatINR, formatDDMMMYYYY, calculateInvoiceAgeing, calculateRentAgreementDetails } from '../../utils/calculations.ts';

interface DashboardProps {
  currentUser: UserProfile;
  onNavigate: (view: NavItemKey) => void;
}

export function Dashboard({ currentUser, onNavigate }: DashboardProps) {
  const canAccess = (wsId: WorkspaceId) => {
    if (currentUser.role === 'super_admin') return true;
    return currentUser.assignedWorkspaces.includes(wsId);
  };

  const {
    staff,
    vendors,
    invoices,
    guestHouses,
    rooms,
    allotments,
    workmenColonies,
    waterRecords,
    sanitationRecords,
    canteenRecords,
    rentAgreements,
    electricityBills,
    medicalRecords,
  } = storage;

  // 1. Staff Calculations
  const activeStaff = staff.filter((s) => s.status === 'Active');
  const tplCount = activeStaff.filter((s) => s.source === 'TPL').length;
  const outsourceCount = activeStaff.filter((s) => s.source === 'Outsource').length;
  // Exits this month (Oct 2026 or current month)
  const exitsThisMonth = staff.filter((s) => {
    if (!s.exitDate) return false;
    const now = new Date();
    const exit = new Date(s.exitDate);
    return exit.getMonth() === now.getMonth() && exit.getFullYear() === now.getFullYear();
  }).length;

  // 2. Vendors Count
  const totalVendors = vendors.length;

  // 3. Invoices
  const submittedInvoices = invoices.filter((i) => i.status === 'Submitted');
  const approvedInvoices = invoices.filter((i) => i.status === 'Approved');
  const pendingAmount = submittedInvoices.reduce((sum, i) => sum + i.amountDue, 0);
  const overdueAgeing30Invoices = invoices.filter((i) => {
    if (i.status === 'Approved') return false;
    const age = calculateInvoiceAgeing(i.invoiceDate, i.approvedDate);
    return age > 30;
  });

  // 4. Guest Houses & Accommodation
  const totalGuestHouses = guestHouses.length;
  const totalRoomsCount = rooms.length;
  let totalBedsCount = 0;
  let occupiedBedsCount = 0;
  rooms.forEach((r) => {
    totalBedsCount += r.capacity;
    occupiedBedsCount += r.beds.filter((b) => b.isOccupied).length;
  });
  const vacantBedsCount = Math.max(0, totalBedsCount - occupiedBedsCount);
  const occupancyRate = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  // 5. Rent Agreements
  const activeAgreements = rentAgreements;
  const agreementAlerts = rentAgreements.map((ra) => ({
    agreement: ra,
    details: calculateRentAgreementDetails({
      rentStartDate: ra.rentStartDate,
      leaseTenureMonths: ra.leaseTenureMonths,
      lockingPeriodMonths: ra.lockingPeriodMonths,
      noticePeriodMonths: ra.noticePeriodMonths,
      rentAmountYear1: ra.rentAmountYear1,
      rentAmountYear2: ra.rentAmountYear2,
      rentAmountYear3: ra.rentAmountYear3,
    }),
  }));
  const expiringNext60Days = agreementAlerts.filter((a) => a.details.alertStatus === 'amber');
  const noticeOverdueAlerts = agreementAlerts.filter((a) => a.details.alertStatus === 'red');

  // 6. Electricity
  const elecUnitsThisMonth = electricityBills.reduce((sum, b) => sum + b.unitConsumed, 0);
  const elecAmountThisMonth = electricityBills.reduce((sum, b) => sum + b.billAmount, 0);

  // 7. Water
  const waterLitresThisMonth = waterRecords.reduce((sum, w) => sum + w.quantityLitres, 0);
  const waterCostThisMonth = waterRecords.reduce((sum, w) => sum + w.amount, 0);

  // 8. Sanitation & Canteen
  const sanitationDoneToday = sanitationRecords.filter((s) => s.status === 'Done').length;
  const canteenMealsServed = canteenRecords.reduce((sum, c) => sum + c.mealsServed, 0);

  // 9. Medical Facility
  const activeMedicalAgency = medicalRecords.find((m) => m.status === 'Active');

  // High priority alerts
  const allAlerts: {
    id: string;
    type: 'red' | 'amber' | 'blue';
    title: string;
    description: string;
    target: NavItemKey;
  }[] = [];

  overdueAgeing30Invoices.forEach((inv) => {
    allAlerts.push({
      id: `inv-alert-${inv.id}`,
      type: 'red',
      title: `Invoice Ageing > 30 Days: ${inv.invoiceNo}`,
      description: `Vendor: ${inv.vendorName} • Amount: ${formatINR(inv.amountDue)} • Ageing: ${calculateInvoiceAgeing(inv.invoiceDate, inv.approvedDate)} days`,
      target: 'workspace_b',
    });
  });

  noticeOverdueAlerts.forEach((item) => {
    allAlerts.push({
      id: `ra-red-${item.agreement.id}`,
      type: 'red',
      title: `Rent Notice/Tenure Overdue: ${item.agreement.ownerName}`,
      description: `${item.details.alertMessage} • Property: ${item.agreement.propertyType}`,
      target: 'workspace_h',
    });
  });

  expiringNext60Days.forEach((item) => {
    allAlerts.push({
      id: `ra-amber-${item.agreement.id}`,
      type: 'amber',
      title: `Rent Agreement Expiring Soon: ${item.agreement.ownerName}`,
      description: `${item.details.alertMessage} • Notice before: ${formatDDMMMYYYY(item.details.noticeToBeServedBeforeDate)}`,
      target: 'workspace_h',
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Project Context */}
      <div className="bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
              Live Operations Feed
            </span>
            <span className="text-xs text-blue-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Auto-synced
            </span>
          </div>
          <h2 className="text-2xl font-black mt-1">EPCC Project Site Admin Operations</h2>
          <p className="text-sm text-blue-100 max-w-2xl mt-1">
            Real-time control tower for manpower, vendor logistics, invoice approval pipelines,
            camp accommodation, utilities, and site welfare compliance.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
          <div className="text-right">
            <p className="text-xs text-blue-200">Logged in User</p>
            <p className="font-bold text-sm text-white">{currentUser.name}</p>
            <p className="text-[11px] text-blue-300 capitalize">{currentUser.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Critical Alerts & Reminders Panel */}
      {allAlerts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Operational Alerts &amp; Action Reminders ({allAlerts.length})</span>
            </div>
            <span className="text-xs text-amber-800 font-medium">Action Required Immediately</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onNavigate(alert.target)}
                className={`p-3.5 rounded-xl border cursor-pointer hover:shadow-md transition flex flex-col justify-between ${
                  alert.type === 'red'
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        alert.type === 'red' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                      }`}
                    >
                      {alert.type === 'red' ? 'Critical' : 'Notice'}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-60" />
                  </div>
                  <h4 className="text-sm font-bold mt-2">{alert.title}</h4>
                  <p className="text-xs opacity-80 mt-1 leading-snug">{alert.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[11px] font-semibold">
                  <span>Open Module</span>
                  <span className="underline">Resolve &rarr;</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards Grid (Only visible for workspaces user can access) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Card 1: Staff Master */}
        {canAccess('workspace_a') && (
          <div
            onClick={() => onNavigate('workspace_a')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Staff Strength
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Users2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-slate-900">{activeStaff.length}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Active Staff</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">TPL</p>
                  <p className="font-bold text-slate-800 mt-0.5">{tplCount}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Outsource</p>
                  <p className="font-bold text-slate-800 mt-0.5">{outsourceCount}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Exits</p>
                  <p className="font-bold text-rose-600 mt-0.5">{exitsThisMonth}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              View Staff Master &rarr;
            </p>
          </div>
        )}

        {/* Card 2: Vendor Master */}
        {(canAccess('workspace_a') || canAccess('workspace_l')) && (
          <div
            onClick={() => onNavigate('workspace_l')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Approved Vendors
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-slate-900">{totalVendors}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Registered Agencies</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                All 100% verified with 15-digit GSTIN, bank records &amp; site security clearances.
              </p>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Open Vendor Directory &rarr;
            </p>
          </div>
        )}

        {/* Card 3: Invoices */}
        {canAccess('workspace_b') && (
          <div
            onClick={() => onNavigate('workspace_b')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Invoice Verification
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {formatINR(pendingAmount, false)}
                </span>
                <p className="text-xs text-slate-500 font-medium">Pending Verification</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Submitted:</span>{' '}
                  <span className="font-bold text-amber-600">{submittedInvoices.length}</span>
                </div>
                <div>
                  <span className="text-slate-500">Approved:</span>{' '}
                  <span className="font-bold text-emerald-600">{approvedInvoices.length}</span>
                </div>
                {overdueAgeing30Invoices.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                    {overdueAgeing30Invoices.length} &gt; 30d
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-indigo-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Verify Invoices &rarr;
            </p>
          </div>
        )}

        {/* Card 4: Staff Accommodation */}
        {canAccess('workspace_c') && (
          <div
            onClick={() => onNavigate('workspace_c')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Accommodation
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Hotel className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-slate-900">{occupancyRate}%</span>
                  <span className="text-xs text-slate-500 ml-1.5 font-medium">Occupancy</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {totalGuestHouses} Guest Houses
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Rooms</span>
                  <span className="font-bold text-slate-800">{totalRoomsCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Occupied</span>
                  <span className="font-bold text-purple-700">{occupiedBedsCount} Beds</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Vacant</span>
                  <span className="font-bold text-emerald-600">{vacantBedsCount} Beds</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-purple-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Room Matrix &amp; Allotment &rarr;
            </p>
          </div>
        )}

        {/* Card 5: Rent Agreements */}
        {canAccess('workspace_h') && (
          <div
            onClick={() => onNavigate('workspace_h')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Rent Agreements
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                  <ScrollText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-3xl font-black text-slate-900">{activeAgreements.length}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">Active Leases</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Expiring in 60d:{' '}
                  <strong className="text-amber-600 font-bold">{expiringNext60Days.length}</strong>
                </span>
                <span className="text-slate-600">
                  Notice Alerts:{' '}
                  <strong className="text-rose-600 font-bold">{noticeOverdueAlerts.length}</strong>
                </span>
              </div>
            </div>
            <p className="text-xs text-amber-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Review Agreements &rarr;
            </p>
          </div>
        )}

        {/* Card 6: Electricity Consumption */}
        {canAccess('workspace_i') && (
          <div
            onClick={() => onNavigate('workspace_i')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Electricity
                </span>
                <div className="w-9 h-9 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {elecUnitsThisMonth.toLocaleString('en-IN')} kWh
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Cost: {formatINR(elecAmountThisMonth)}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                Monitored across site colonies and guest houses with 30% surge checks.
              </p>
            </div>
            <p className="text-xs text-yellow-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Energy Consumption Logs &rarr;
            </p>
          </div>
        )}

        {/* Card 7: Water Consumption */}
        {canAccess('workspace_e') && (
          <div
            onClick={() => onNavigate('workspace_e')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Water Supply
                </span>
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Droplets className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {(waterLitresThisMonth / 1000).toLocaleString('en-IN')} KL
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Expense: {formatINR(waterCostThisMonth)}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                Tanker deliveries &amp; municipal supply reconciliation.
              </p>
            </div>
            <p className="text-xs text-cyan-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Water Logs &rarr;
            </p>
          </div>
        )}

        {/* Card 8: Sanitation & Canteen */}
        {(canAccess('workspace_f') || canAccess('workspace_g')) && (
          <div
            onClick={() => onNavigate('workspace_f')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Sanitation &amp; Canteen
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-900">
                  {sanitationDoneToday} Tasks Done
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  Meals Served: {canteenMealsServed.toLocaleString('en-IN')}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                Hygiene inspections 100% compliant across central mess &amp; executive dining.
              </p>
            </div>
            <p className="text-xs text-teal-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              Daily Checklists &rarr;
            </p>
          </div>
        )}

        {/* Card 9: Medical Facility (On Duty Now Card) */}
        {canAccess('workspace_j') && (
          <div
            onClick={() => onNavigate('workspace_j')}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  24x7 Site Medical OHC
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                  <HeartPulse className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Agency Active
                </span>
                <p className="text-xs font-bold text-slate-900 mt-2 truncate">
                  {activeMedicalAgency?.doctorName || 'Doctor on site'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Ambulance: {activeMedicalAgency?.ambulanceType || 'ALS'} (
                  {activeMedicalAgency?.vehicleNo || 'Vehicle on duty'})
                </p>
              </div>
            </div>
            <p className="text-xs text-rose-600 font-semibold mt-3 flex items-center gap-1 group-hover:translate-x-1 transition">
              View OHC &amp; Ambulance &rarr;
            </p>
          </div>
        )}
      </div>

      {/* Operational Analytical Charts (Bar / Line representation) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Monthly Electricity Consumption */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Monthly Electricity Trend</h3>
              <p className="text-xs text-slate-500">Units consumed (kWh)</p>
            </div>
            <Zap className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="space-y-3">
            {[
              { month: 'Jul 2026', units: 8200, pct: 60 },
              { month: 'Aug 2026', units: 10400, pct: 75 },
              { month: 'Sep 2026', units: 11950, pct: 86 },
              { month: 'Oct 2026', units: 13550, pct: 98 },
            ].map((d) => (
              <div key={d.month} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{d.month}</span>
                  <span className="font-bold text-slate-900">{d.units.toLocaleString('en-IN')} kWh</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Monthly Water Consumption */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Water Consumption by Sector</h3>
              <p className="text-xs text-slate-500">Daily average supply (Litres)</p>
            </div>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="space-y-3">
            {[
              { sector: 'Workmen Colony Sector 1', litres: 120000, pct: 77 },
              { sector: 'Workmen Colony Sector 2', litres: 80000, pct: 52 },
              { sector: 'Ganga & Yamuna Guest Houses', litres: 20000, pct: 15 },
              { sector: 'Site Office & Admin Area', litres: 15000, pct: 10 },
            ].map((d) => (
              <div key={d.sector} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 truncate pr-2">{d.sector}</span>
                  <span className="font-bold text-slate-900">{d.litres.toLocaleString('en-IN')} L</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Monthly Invoice Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Invoice Pipeline Value</h3>
              <p className="text-xs text-slate-500">Breakdown by workflow status</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="space-y-3">
            {[
              {
                label: 'Approved & Verified',
                amount: approvedInvoices.reduce((s, i) => s + i.amountDue, 0),
                color: 'bg-emerald-500',
              },
              {
                label: 'Submitted (Pending Verification)',
                amount: submittedInvoices.reduce((s, i) => s + i.amountDue, 0),
                color: 'bg-blue-600',
              },
              {
                label: 'Draft Stage',
                amount: invoices
                  .filter((i) => i.status === 'Draft')
                  .reduce((s, i) => s + i.amountDue, 0),
                color: 'bg-slate-400',
              },
            ].map((item) => (
              <div key={item.label} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="font-bold text-slate-900">{formatINR(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { History, Shield, Filter, Clock } from 'lucide-react';
import { DataTable, ColumnDef } from '../common/DataTable.tsx';
import { AuditLogEntry, UserProfile } from '../../types/index.ts';
import { storage } from '../../services/storage.ts';
import { formatDDMMMYYYY } from '../../utils/calculations.ts';

interface AuditLogViewProps {
  currentUser: UserProfile;
}

export function AuditLogView({ currentUser }: AuditLogViewProps) {
  const [logs] = useState<AuditLogEntry[]>(storage.auditLogs);

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const datePart = formatDDMMMYYYY(d);
      const timePart = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `${datePart} ${timePart}`;
    } catch {
      return isoString;
    }
  };

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
          {formatTimestamp(item.timestamp)}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'Executed By',
      sortable: true,
      filterable: true,
      render: (item) => (
        <div>
          <span className="font-bold text-slate-900">{item.userName}</span>
          <span className="block text-[11px] text-slate-400 capitalize">
            {item.userRole.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      filterable: true,
      filterOptions: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'SUBMIT',
        'APPROVE',
        'REJECT',
        'CHECK_IN',
        'CHECK_OUT',
      ],
      render: (item) => {
        const badgeClasses = {
          CREATE: 'bg-blue-100 text-blue-800 border-blue-300',
          UPDATE: 'bg-slate-100 text-slate-800 border-slate-300',
          DELETE: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          SUBMIT: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold',
          APPROVE: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black',
          REJECT: 'bg-red-100 text-red-800 border-red-300 font-black',
          CHECK_IN: 'bg-purple-100 text-purple-800 border-purple-300',
          CHECK_OUT: 'bg-amber-100 text-amber-800 border-amber-300',
        }[item.action];

        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${badgeClasses}`}>
            {item.action}
          </span>
        );
      },
    },
    {
      key: 'workspace',
      header: 'Workspace / Module',
      sortable: true,
      filterable: true,
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.workspace}</span>,
    },
    {
      key: 'entityType',
      header: 'Entity',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700">
          {item.entityType}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Operation Details',
      render: (item) => (
        <span className="text-xs text-slate-800 font-medium leading-relaxed">{item.details}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">
              Governance &amp; Statutory Audit Trail
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              Super Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident record of all user activities: who added, modified, submitted, approved,
            rejected or deleted records across the portal.
          </p>
        </div>
      </div>

      <DataTable<AuditLogEntry>
        title="Complete Audit Log History"
        subtitle="Chronological transaction ledger with full actor accountability"
        data={logs}
        columns={columns}
        canAdd={false}
        canEdit={false}
        canDelete={false}
        initialSortKey="timestamp"
        initialSortDirection="desc"
        exportFileName="EPCC_Audit_Trail"
      />
    </div>
  );
}

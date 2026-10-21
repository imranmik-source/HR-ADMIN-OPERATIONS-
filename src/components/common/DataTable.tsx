import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { exportToExcel, exportToCSV, downloadExcelTemplate } from '../../utils/exportImport.ts';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[];
  width?: string;
  align?: 'left' | 'center' | 'right';
  sampleTemplateValue?: string | number;
}

interface DataTableProps<T extends { id: string }> {
  title: string;
  subtitle?: string;
  data: T[];
  columns: ColumnDef<T>[];
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onImportClick?: () => void;
  customActions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  exportFileName?: string;
  initialSortKey?: string;
  initialSortDirection?: 'asc' | 'desc';
}

export function DataTable<T extends { id: string }>({
  title,
  subtitle,
  data,
  columns,
  canAdd = true,
  canEdit = true,
  canDelete = false,
  onAdd,
  onEdit,
  onDelete,
  onImportClick,
  customActions,
  emptyMessage = 'No records found.',
  exportFileName = 'export',
  initialSortKey,
  initialSortDirection = 'asc',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDirection);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Filter and Search logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // General search across all columns
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSearch = columns.some((col) => {
          const val = col.accessor ? col.accessor(item) : (item as any)[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
        if (!matchesSearch) return false;
      }

      // Column-specific active filters
      for (const [colKey, filterVal] of Object.entries(activeFilters)) {
        if (!filterVal || filterVal === 'ALL') continue;
        const col = columns.find((c) => c.key === colKey);
        const cellVal = col?.accessor ? col.accessor(item) : (item as any)[colKey];
        if (String(cellVal) !== filterVal) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, activeFilters, columns]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);

    return [...filteredData].sort((a, b) => {
      const valA = col?.accessor ? col.accessor(a) : (a as any)[sortKey];
      const valB = col?.accessor ? col.accessor(b) : (b as any)[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDir, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExportExcel = () => {
    const exportRows = sortedData.map((item) => {
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        row[col.header] = col.accessor ? col.accessor(item) : (item as any)[col.key];
      });
      return row;
    });
    exportToExcel(exportRows, `${exportFileName}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const exportRows = sortedData.map((item) => {
      const row: Record<string, any> = {};
      columns.forEach((col) => {
        row[col.header] = col.accessor ? col.accessor(item) : (item as any)[col.key];
      });
      return row;
    });
    exportToCSV(exportRows, `${exportFileName}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleDownloadTemplate = () => {
    const templateCols = columns.map((col) => ({
      key: col.key,
      label: col.header,
      sample: col.sampleTemplateValue ?? 'Sample Data',
    }));
    downloadExcelTemplate(templateCols, exportFileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Table Header & Action Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {filteredData.length} records
            </span>
          </div>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Global search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          {/* Toggle Column Filter Bar */}
          <button
            type="button"
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition ${
              showFilterBar || Object.keys(activeFilters).length > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            title="Filter by column"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
          </button>

          {/* Export & Import dropdown/buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition"
              title="Export to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition"
              title="Export to CSV"
            >
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            {onImportClick && (
              <button
                type="button"
                onClick={onImportClick}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition"
                title="Import Excel file"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition"
              title="Download Excel Template"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Template</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 flex items-center gap-1 transition"
              title="Print Table"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {/* Add New Entry button */}
          {canAdd && onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition active:scale-95 ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* Optional Filter Row */}
      {showFilterBar && (
        <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-blue-900 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Quick Column Filters:
          </span>
          {columns
            .filter((c) => c.filterable)
            .map((col) => {
              const options =
                col.filterOptions ||
                Array.from(
                  new Set(
                    data
                      .map((d) => (col.accessor ? col.accessor(d) : (d as any)[col.key]))
                      .filter(Boolean)
                  )
                );

              return (
                <div key={col.key} className="flex items-center gap-1.5">
                  <span className="text-slate-600">{col.header}:</span>
                  <select
                    value={activeFilters[col.key] || 'ALL'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActiveFilters((prev) => {
                        const next = { ...prev };
                        if (val === 'ALL') delete next[col.key];
                        else next[col.key] = val;
                        return next;
                      });
                      setCurrentPage(1);
                    }}
                    className="py-1 px-2 text-xs bg-white border border-slate-300 rounded font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ALL">All ({options.length})</option>
                    {options.map((opt) => (
                      <option key={String(opt)} value={String(opt)}>
                        {String(opt)}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          {Object.keys(activeFilters).length > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilters({})}
              className="text-xs text-red-600 hover:text-red-700 font-semibold underline ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Main Table view */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    className={`px-4 py-3 select-none ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-200/60' : ''}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div
                      className={`inline-flex items-center gap-1 ${
                        col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {(canEdit || canDelete || customActions) && (
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (canEdit || canDelete || customActions ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="font-medium text-slate-600">{emptyMessage}</p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Clear search query
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`hover:bg-blue-50/40 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                  }`}
                >
                  {columns.map((col) => {
                    const content = col.render
                      ? col.render(item)
                      : col.accessor
                      ? col.accessor(item)
                      : (item as any)[col.key];

                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {content !== undefined && content !== null && content !== '' ? content : '-'}
                      </td>
                    );
                  })}
                  {(canEdit || canDelete || customActions) && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {customActions && customActions(item)}
                        {canEdit && onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete Record (Super Admin only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="py-1 px-2 border border-slate-300 rounded bg-white font-medium text-slate-700"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
          <span>
            Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-medium"
          >
            Previous
          </button>
          <span className="px-2 font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

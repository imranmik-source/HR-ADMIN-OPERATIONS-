import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, Download } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { readExcelOrCsvFile, downloadExcelTemplate } from '../../utils/exportImport.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateColumns: { key: string; label: string; sample: string | number }[];
  onImportConfirm: (rows: Record<string, any>[]) => { successCount: number; errors: string[] };
}

export function ImportModal({
  isOpen,
  onClose,
  title,
  templateColumns,
  onImportConfirm,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    success: boolean;
    text: string;
    errors?: string[];
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setIsLoading(true);
    setResultMessage(null);

    try {
      const rows = await readExcelOrCsvFile(selected);
      setParsedRows(rows);
    } catch (err: any) {
      setResultMessage({
        success: false,
        text: 'Failed to read spreadsheet: ' + (err.message || 'Invalid format'),
      });
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (parsedRows.length === 0) return;
    const { successCount, errors } = onImportConfirm(parsedRows);
    if (errors.length === 0) {
      setResultMessage({
        success: true,
        text: `Successfully imported ${successCount} record(s).`,
      });
      setTimeout(() => {
        onClose();
        setFile(null);
        setParsedRows([]);
        setResultMessage(null);
      }, 1200);
    } else {
      setResultMessage({
        success: false,
        text: `Imported ${successCount} records, but encountered ${errors.length} validation errors:`,
        errors,
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setResultMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title={`Import Data – ${title}`}
      subtitle="Upload an Excel (.xlsx / .xls) or CSV file with the required columns"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Template guide */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div>
            <p className="font-semibold">Need the standard spreadsheet format?</p>
            <p className="text-blue-700 mt-0.5">
              Download our ready-made template with correct column headers and sample data.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadExcelTemplate(templateColumns, title)}
            className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 flex items-center gap-1.5 shrink-0 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Template
          </button>
        </div>

        {/* Upload box */}
        {!file && (
          <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition group">
            <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-600 mb-2 transition" />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
              Click to browse or drag and drop Excel/CSV file
            </span>
            <span className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}

        {/* File Preview */}
        {file && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Change File
              </button>
            </div>

            {/* Preview table of first 3 rows */}
            {parsedRows.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 sticky top-0">
                    <tr>
                      {Object.keys(parsedRows[0]).map((h) => (
                        <th key={h} className="p-2 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {parsedRows.slice(0, 3).map((r, i) => (
                      <tr key={i}>
                        {Object.values(r).map((v, j) => (
                          <td key={j} className="p-2 whitespace-nowrap">
                            {String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Result message */}
        {resultMessage && (
          <div
            className={`p-3 rounded-lg border text-xs ${
              resultMessage.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              {resultMessage.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span>{resultMessage.text}</span>
            </div>
            {resultMessage.errors && (
              <ul className="mt-2 list-disc list-inside space-y-0.5 text-red-600 max-h-32 overflow-y-auto">
                {resultMessage.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || parsedRows.length === 0 || isLoading}
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition"
          >
            {isLoading ? 'Processing...' : `Confirm Import (${parsedRows.length} Rows)`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

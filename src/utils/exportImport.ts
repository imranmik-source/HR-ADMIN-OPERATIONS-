import * as XLSX from 'xlsx';

/**
 * Export table data to an Excel (.xlsx) file
 */
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName = 'Data'
): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Export table data to a CSV file
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a starter template for importing into an Excel sheet
 */
export function downloadExcelTemplate(
  columns: { key: string; label: string; sample: string | number }[],
  filename: string
): void {
  const rowSample: Record<string, string | number> = {};
  columns.forEach((col) => {
    rowSample[col.label] = col.sample;
  });

  const worksheet = XLSX.utils.json_to_sheet([rowSample]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}_Template.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Read and parse an Excel (.xlsx/.xls) or .csv file into JSON rows
 */
export function readExcelOrCsvFile(file: File): Promise<Record<string, any>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '',
        });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

/**
 * Trigger clean browser window print for current view
 */
export function triggerPrintView(title?: string): void {
  const originalTitle = document.title;
  if (title) {
    document.title = `${title} – HRADMOPTS Print`;
  }
  window.print();
  document.title = originalTitle;
}

/**
 * Core business calculation and formatting utilities for HRADMOPTS.
 * Decoupled as pure functions for testability and stability.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Format date string (YYYY-MM-DD or ISO) into DD-MMM-YYYY
 * Example: "2026-10-19" -> "19-Oct-2026"
 */
export function formatDDMMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format amount into Indian Rupee format with ₹ symbol
 * Uses Indian numbering system: ₹ 1,50,000.00
 */
export function formatINR(amount?: number | null, includeDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(amount);

  return `₹${formatted}`;
}

/**
 * GSTIN Validation: 15-character standard Indian GST number
 * e.g. 27AAPFU0955L1ZV
 */
export function validateGST(gst?: string): boolean {
  if (!gst) return false;
  const trimmed = gst.trim().toUpperCase();
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(trimmed);
}

/**
 * Validate 10-digit Indian Mobile / Contact Number
 */
export function validatePhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Determine Staff Active / Exited status based on exit date
 */
export function calculateStaffStatus(exitDate?: string | null): 'Active' | 'Exited' {
  if (!exitDate || exitDate.trim() === '') return 'Active';
  return 'Exited';
}

/**
 * Add N months to a YYYY-MM-DD date string
 */
export function addMonthsToDate(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';

  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() + months);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Difference in days between two date strings (dateB - dateA)
 */
export function diffDays(dateStrA: string, dateStrB: string): number {
  const da = new Date(dateStrA).getTime();
  const db = new Date(dateStrB).getTime();
  if (isNaN(da) || isNaN(db)) return 0;
  return Math.floor((db - da) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate Ageing days:
 * Today minus Invoice Date, or minus Approved Date once approved.
 * Stops counting after approval.
 */
export function calculateInvoiceAgeing(
  invoiceDateStr: string,
  approvedDateStr?: string,
  referenceDateStr?: string
): number {
  if (!invoiceDateStr) return 0;
  const endDateStr = approvedDateStr || referenceDateStr || new Date().toISOString().split('T')[0];
  const days = diffDays(invoiceDateStr, endDateStr);
  return Math.max(0, days);
}

/**
 * Get color badge styling based on ageing days
 */
export function getAgeingSeverity(ageingDays: number): {
  color: 'green' | 'amber' | 'red';
  label: string;
} {
  if (ageingDays < 15) {
    return { color: 'green', label: '< 15 days' };
  }
  if (ageingDays <= 30) {
    return { color: 'amber', label: '15-30 days' };
  }
  return { color: 'red', label: '> 30 days' };
}

/**
 * Generate sequential invoice sequence: INV-YYYY-0001
 */
export function generateInvoiceSeqNo(existingSeqNumbers: string[], targetYear?: number): string {
  const year = targetYear || new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  let maxSeq = 0;
  for (const seq of existingSeqNumbers) {
    if (seq && seq.startsWith(prefix)) {
      const numPart = parseInt(seq.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Calculate completed tenure in full months from start date to today
 */
export function calculateCompletedTenureMonths(
  startDateStr: string,
  referenceDateStr?: string
): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr);
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  if (isNaN(start.getTime()) || isNaN(ref.getTime())) return 0;

  if (ref < start) return 0;

  let months = (ref.getFullYear() - start.getFullYear()) * 12 + (ref.getMonth() - start.getMonth());
  if (ref.getDate() < start.getDate()) {
    months = Math.max(0, months - 1);
  }
  return Math.max(0, months);
}

/**
 * Calculate Rent Agreement fields automatically
 */
export function calculateRentAgreementDetails(params: {
  rentStartDate: string;
  leaseTenureMonths: number;
  lockingPeriodMonths: number;
  noticePeriodMonths: number;
  rentAmountYear1: number;
  rentAmountYear2: number;
  rentAmountYear3: number;
  referenceDateStr?: string;
}) {
  const {
    rentStartDate,
    leaseTenureMonths,
    lockingPeriodMonths,
    noticePeriodMonths,
    rentAmountYear1,
    rentAmountYear2,
    rentAmountYear3,
    referenceDateStr
  } = params;

  const tenureEndDate = addMonthsToDate(rentStartDate, leaseTenureMonths);
  const lockingPeriodCompletionDate = addMonthsToDate(rentStartDate, lockingPeriodMonths);
  
  // Notice to be served before date: notice period in months before locking period ends
  const noticeToBeServedBeforeDate = addMonthsToDate(
    lockingPeriodCompletionDate,
    -noticePeriodMonths
  );

  const completedTenureMonths = calculateCompletedTenureMonths(rentStartDate, referenceDateStr);

  // Current year rent based on completed tenure
  let currentYearRent = rentAmountYear1;
  if (completedTenureMonths > 24) {
    currentYearRent = rentAmountYear3 || rentAmountYear2 || rentAmountYear1;
  } else if (completedTenureMonths > 12) {
    currentYearRent = rentAmountYear2 || rentAmountYear1;
  }

  // Alerts: Amber if <= 60 days before notice date or tenure end date; Red if past notice date or overdue
  const refDateStr = referenceDateStr || new Date().toISOString().split('T')[0];
  const daysToNotice = diffDays(refDateStr, noticeToBeServedBeforeDate);
  const daysToEnd = diffDays(refDateStr, tenureEndDate);

  let alertStatus: 'normal' | 'amber' | 'red' = 'normal';
  let alertMessage = 'Active';

  if (daysToEnd < 0) {
    alertStatus = 'red';
    alertMessage = `Agreement Expired (${Math.abs(daysToEnd)}d ago)`;
  } else if (completedTenureMonths < lockingPeriodMonths && daysToNotice < 0) {
    alertStatus = 'red';
    alertMessage = `Notice Overdue (${Math.abs(daysToNotice)}d ago)`;
  } else if (daysToEnd <= 60 && daysToEnd >= 0) {
    alertStatus = 'amber';
    alertMessage = `Expiring in ${daysToEnd} days`;
  } else if (completedTenureMonths < lockingPeriodMonths && daysToNotice <= 60 && daysToNotice >= 0) {
    alertStatus = 'amber';
    alertMessage = `Notice due in ${daysToNotice} days`;
  }

  return {
    tenureEndDate,
    lockingPeriodCompletionDate,
    noticeToBeServedBeforeDate,
    completedTenureMonths,
    currentYearRent,
    alertStatus,
    alertMessage,
    daysToEnd,
    daysToNotice,
  };
}

/**
 * Calculate electricity units consumed and validate
 */
export function calculateElectricityUnits(present: number, past: number): {
  units: number;
  isValid: boolean;
  error?: string;
} {
  if (isNaN(present) || isNaN(past)) {
    return { units: 0, isValid: false, error: 'Readings must be valid numbers' };
  }
  if (present < past) {
    return {
      units: 0,
      isValid: false,
      error: 'Present reading cannot be less than past reading',
    };
  }
  return {
    units: present - past,
    isValid: true,
  };
}

/**
 * Check if electricity bill consumption is 30% above previous bill
 */
export function checkElectricitySurge(currentUnits: number, previousUnits?: number): boolean {
  if (previousUnits === undefined || previousUnits <= 0) return false;
  return currentUnits >= previousUnits * 1.30;
}

/**
 * Determine room status from occupied beds and maintenance flag
 */
export function calculateRoomStatus(
  beds: { isOccupied: boolean }[],
  isUnderMaintenance?: boolean
): 'Vacant' | 'Partially Occupied' | 'Occupied' | 'Under Maintenance' {
  if (isUnderMaintenance) return 'Under Maintenance';
  if (!beds || beds.length === 0) return 'Vacant';
  
  const occupiedCount = beds.filter((b) => b.isOccupied).length;
  if (occupiedCount === 0) return 'Vacant';
  if (occupiedCount === beds.length) return 'Occupied';
  return 'Partially Occupied';
}

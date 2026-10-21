import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDDMMMYYYY,
  formatINR,
  validateGST,
  validatePhone,
  calculateStaffStatus,
  calculateInvoiceAgeing,
  getAgeingSeverity,
  generateInvoiceSeqNo,
  calculateRentAgreementDetails,
  calculateElectricityUnits,
  checkElectricitySurge,
  calculateRoomStatus,
} from './calculations.ts';

test('formatDDMMMYYYY formats correctly to DD-MMM-YYYY', () => {
  assert.equal(formatDDMMMYYYY('2026-10-19'), '19-Oct-2026');
  assert.equal(formatDDMMMYYYY('2025-01-05'), '05-Jan-2025');
  assert.equal(formatDDMMMYYYY(null), '-');
});

test('formatINR formats into Indian Rupee format', () => {
  const result = formatINR(150000);
  assert.ok(result.includes('1,50,000'));
  assert.ok(result.startsWith('₹'));
});

test('validateGST validates 15-character GST numbers correctly', () => {
  assert.equal(validateGST('27AAPFU0955L1ZV'), true);
  assert.equal(validateGST('07AAAAA0000A1Z5'), true);
  assert.equal(validateGST('INVALIDGST123'), false);
  assert.equal(validateGST(''), false);
});

test('validatePhone validates 10-digit mobile numbers', () => {
  assert.equal(validatePhone('9876543210'), true);
  assert.equal(validatePhone('98765-43210'), true);
  assert.equal(validatePhone('12345'), false);
});

test('calculateStaffStatus sets Active or Exited', () => {
  assert.equal(calculateStaffStatus(''), 'Active');
  assert.equal(calculateStaffStatus(undefined), 'Active');
  assert.equal(calculateStaffStatus('2026-10-15'), 'Exited');
});

test('calculateInvoiceAgeing calculates days and freezes after approval', () => {
  const ageing = calculateInvoiceAgeing('2026-10-01', undefined, '2026-10-19');
  assert.equal(ageing, 18);

  const approvedAgeing = calculateInvoiceAgeing('2026-10-01', '2026-10-10', '2026-10-19');
  assert.equal(approvedAgeing, 9);
});

test('getAgeingSeverity assigns green, amber, and red correctly', () => {
  assert.equal(getAgeingSeverity(10).color, 'green');
  assert.equal(getAgeingSeverity(20).color, 'amber');
  assert.equal(getAgeingSeverity(35).color, 'red');
});

test('generateInvoiceSeqNo generates sequential numbers per year', () => {
  const seq1 = generateInvoiceSeqNo([], 2026);
  assert.equal(seq1, 'INV-2026-0001');

  const seq2 = generateInvoiceSeqNo(['INV-2026-0001', 'INV-2026-0002'], 2026);
  assert.equal(seq2, 'INV-2026-0003');
});

test('calculateRentAgreementDetails calculates auto dates and alert status', () => {
  const result = calculateRentAgreementDetails({
    rentStartDate: '2025-01-01',
    leaseTenureMonths: 36,
    lockingPeriodMonths: 12,
    noticePeriodMonths: 2,
    rentAmountYear1: 50000,
    rentAmountYear2: 55000,
    rentAmountYear3: 60000,
    referenceDateStr: '2026-10-19',
  });

  assert.equal(result.tenureEndDate, '2028-01-01');
  assert.equal(result.lockingPeriodCompletionDate, '2026-01-01');
  assert.equal(result.noticeToBeServedBeforeDate, '2025-11-01');
  assert.equal(result.completedTenureMonths, 21);
  assert.equal(result.currentYearRent, 55000); // 2nd year rent
});

test('calculateElectricityUnits validates present >= past reading', () => {
  const valid = calculateElectricityUnits(1500, 1200);
  assert.equal(valid.isValid, true);
  assert.equal(valid.units, 300);

  const invalid = calculateElectricityUnits(1100, 1200);
  assert.equal(invalid.isValid, false);
});

test('checkElectricitySurge flags >= 30% consumption rise', () => {
  assert.equal(checkElectricitySurge(1350, 1000), true);
  assert.equal(checkElectricitySurge(1200, 1000), false);
});

test('calculateRoomStatus computes status correctly', () => {
  assert.equal(calculateRoomStatus([{ isOccupied: false }, { isOccupied: false }]), 'Vacant');
  assert.equal(calculateRoomStatus([{ isOccupied: true }, { isOccupied: false }]), 'Partially Occupied');
  assert.equal(calculateRoomStatus([{ isOccupied: true }, { isOccupied: true }]), 'Occupied');
  assert.equal(calculateRoomStatus([], true), 'Under Maintenance');
});

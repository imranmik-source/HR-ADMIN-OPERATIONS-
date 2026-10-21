export type UserRole = 'super_admin' | 'admin_personnel' | 'viewer';

export type WorkspaceId =
  | 'workspace_a' // Master Data (Staff & Vendor)
  | 'workspace_b' // Invoice Verification
  | 'workspace_c' // Staff Accommodation
  | 'workspace_d' // Workmen Colony
  | 'workspace_e' // Water Consumption
  | 'workspace_f' // Sanitation
  | 'workspace_g' // Workmen Canteen
  | 'workspace_h' // Rent Agreements
  | 'workspace_i' // Electricity Consumption
  | 'workspace_j' // Medical Facility
  | 'workspace_l'; // Service Vendor Master shortcut

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedWorkspaces: WorkspaceId[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'CHECK_IN' | 'CHECK_OUT';
  workspace: string;
  entityType: string;
  entityId: string;
  details: string;
}

// Master Data: Staff
export type StaffSource = 'TPL' | 'Outsource';
export type StaffStatus = 'Active' | 'Exited';

export interface StaffMember {
  id: string;
  employeeId: string; // unique
  name: string;
  source: StaffSource;
  joiningDate: string; // YYYY-MM-DD
  exitDate?: string; // YYYY-MM-DD
  status: StaffStatus; // auto-calculated
  remarks?: string;
  createdAt: string;
}

// Master Data: Vendor
export interface Vendor {
  id: string;
  vendorCode: string; // unique
  vendorName: string;
  providedServices: string;
  address: string;
  state: string;
  email: string;
  contactNo: string; // 10 digits
  gstNo: string; // 15 characters
  createdAt: string;
}

// Workspace B: Invoices
export type InvoiceStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface Invoice {
  id: string;
  seqNo?: string; // auto on submit: INV-YYYY-0001
  invoiceMonth: string; // MM-YYYY
  invoiceDate: string; // YYYY-MM-DD
  invoiceNo: string;
  faTokenNo: string;
  faTokenDate: string; // YYYY-MM-DD
  poNo: string; // WO/PO No
  projectName: string;
  vendorId: string;
  vendorName: string;
  vendorType: string; // auto-filled
  sesNo: string;
  sesDate: string; // YYYY-MM-DD
  amountDue: number; // ₹ incl. GST
  ageingDays: number; // auto-calculated
  status: InvoiceStatus;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedDate?: string;
  remarks?: string; // mandatory on reject
  createdAt: string;
}

// Workspace C: Accommodation
export interface RoomFacilities {
  singleBed: number;
  doubleBed: number;
  bunkBed: number;
  ceilingFan: number;
  acSplit: number;
  acWindow: number;
  desertCooler: number;
  mattress: number;
  sofa3Seater: number;
  sofa5Seater: number;
  geyser: number;
  refrigerator: number;
  sideTable: number;
  studyTable: number;
  studyChair: number;
  centreTable: number;
  remarks?: string;
}

export interface GuestHouse {
  id: string;
  name: string;
  address: string;
  numberOfRooms: number;
  proposedOccupancy: number;
  hiringDate: string; // YYYY-MM-DD
  dehiringDate?: string; // YYYY-MM-DD
  status: 'Furnished' | 'Unfurnished';
  facilities: RoomFacilities;
  createdAt: string;
}

export type RoomType = 'Single' | 'Double' | 'Quad';
export type RoomStatus = 'Vacant' | 'Partially Occupied' | 'Occupied' | 'Under Maintenance';

export interface Bed {
  bedNo: string;
  isOccupied: boolean;
  currentAllotmentId?: string;
}

export interface Room {
  id: string;
  guestHouseId: string;
  guestHouseName: string;
  roomNo: string;
  roomType: RoomType;
  capacity: number;
  beds: Bed[];
  status: RoomStatus;
  notes?: string;
}

export interface Allotment {
  id: string;
  guestHouseId: string;
  guestHouseName: string;
  roomId: string;
  roomNo: string;
  bedNo: string;
  employeeId: string;
  employeeName: string;
  allotmentCategory: StaffSource; // auto-filled from staff source
  checkInDate: string; // YYYY-MM-DD
  expectedCheckOutDate: string; // YYYY-MM-DD
  actualCheckOutDate?: string;
  status: 'Active' | 'Checked Out';
  remarks?: string;
  createdAt: string;
}

// Workspace D: Workmen Colony
export interface WorkmenColony {
  id: string;
  colonyName: string;
  location: string;
  totalBlocksRooms: number;
  capacity: number;
  currentOccupancy: number;
  contractorName: string; // from vendor master
  facilities: {
    electricity: boolean;
    water: boolean;
    toilets: boolean;
    lighting: boolean;
    fireSafety: boolean;
    remarks?: string;
  };
  inspectionDate: string;
  inspectionFindings: string;
  actionRequired: string;
  actionClosureDate?: string;
  createdAt: string;
}

// Workspace E: Water Consumption
export interface WaterConsumptionRecord {
  id: string;
  date: string;
  location: 'Colony' | 'Guest House' | 'Office';
  source: 'Tanker' | 'Borewell' | 'Municipal';
  numberOfTankers: number;
  quantityLitres: number;
  supplierName: string; // Vendor Master
  rate: number;
  amount: number; // auto = quantity or tankers * rate
  remarks?: string;
  createdAt: string;
}

// Workspace F: Sanitation
export interface SanitationRecord {
  id: string;
  date: string;
  location: string;
  activity: 'Cleaning' | 'Pest Control' | 'Garbage Lifting' | 'Septic Tank Cleaning' | 'Other';
  agencyName: string; // Vendor Master
  workersDeployed: number;
  status: 'Done' | 'Pending';
  supervisorName: string;
  remarks?: string;
  createdAt: string;
}

// Workspace G: Workmen Canteen
export interface CanteenRecord {
  id: string;
  date: string;
  canteenName: string;
  agencyName: string; // Vendor Master
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Tea';
  mealsServed: number;
  ratePerMeal: number;
  amount: number; // auto: mealsServed * ratePerMeal
  hygieneInspectionDone: boolean;
  menuRemarks?: string;
  createdAt: string;
}

// Workspace H: Rent Agreements
export interface RentAgreement {
  id: string;
  srNo: number;
  projectNo: string;
  ownerName: string;
  floor: string;
  bhkType: string;
  rentStartDate: string; // YYYY-MM-DD
  leaseTenureMonths: number;
  tenureEndDate: string; // auto
  rentEndDateAgreement: string;
  lockingPeriodMonths: number;
  lockingPeriodCompletionDate: string; // auto
  completedTenureMonths: number; // auto
  securityDeposit: number;
  rentAmountYear1: number;
  rentAmountYear2: number;
  rentAmountYear3: number;
  currentYearRent: number; // auto
  propertyType: string;
  utilityPaymentResponsible: string; // Electricity/Water/Maintenance who pays
  noticePeriodMonths: number;
  noticeToBeServedBeforeDate: string; // auto
  vacateDate?: string;
  location: string;
  createdAt: string;
}

// Workspace I: Electricity Consumption
export interface ElectricityBill {
  id: string;
  slNo: number;
  project: string;
  ownerName: string;
  guestHouseNo: string;
  billNo: string;
  billDate: string;
  kNo: string; // Consumer number
  presentReading: number;
  pastReading: number;
  unitConsumed: number; // auto: present - past
  billStartDate: string;
  billEndDate: string;
  billAmount: number;
  amountBeforeDueDate: number;
  amountAfterDueDate: number;
  dueDate: string;
  paymentStatus: 'Paid' | 'Unpaid';
  paidDate?: string;
  surgeAlert?: boolean; // auto flagged if >= 30% above previous bill
  createdAt: string;
}

// Workspace J: Medical Facility
export interface MedicalRecord {
  id: string;
  agencyName: string;
  workStartDate: string;
  workEndDate: string;
  doctorName: string;
  paramedicName: string;
  ambulanceType: 'ALS' | 'BLS';
  driverName: string;
  vehicleNo: string;
  contactNumbers: string;
  status: 'Active' | 'Closed'; // auto from workEndDate
  createdAt: string;
}

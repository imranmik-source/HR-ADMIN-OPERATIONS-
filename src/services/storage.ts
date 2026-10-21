import {
  UserProfile,
  StaffMember,
  Vendor,
  Invoice,
  GuestHouse,
  Room,
  Allotment,
  WorkmenColony,
  WaterConsumptionRecord,
  SanitationRecord,
  CanteenRecord,
  RentAgreement,
  ElectricityBill,
  MedicalRecord,
  AuditLogEntry,
  UserRole,
} from '../types/index.ts';

import {
  INITIAL_USERS,
  INITIAL_STAFF,
  INITIAL_VENDORS,
  INITIAL_INVOICES,
  INITIAL_GUEST_HOUSES,
  INITIAL_ROOMS,
  INITIAL_ALLOTMENTS,
  INITIAL_WORKMEN_COLONIES,
  INITIAL_WATER_RECORDS,
  INITIAL_SANITATION_RECORDS,
  INITIAL_CANTEEN_RECORDS,
  INITIAL_RENT_AGREEMENTS,
  INITIAL_ELECTRICITY_BILLS,
  INITIAL_MEDICAL_RECORDS,
  INITIAL_AUDIT_LOGS,
} from './demoData.ts';

const STORAGE_KEYS = {
  USERS: 'hradmopts_users',
  CURRENT_USER: 'hradmopts_current_user',
  STAFF: 'hradmopts_staff',
  VENDORS: 'hradmopts_vendors',
  INVOICES: 'hradmopts_invoices',
  GUEST_HOUSES: 'hradmopts_guesthouses',
  ROOMS: 'hradmopts_rooms',
  ALLOTMENTS: 'hradmopts_allotments',
  WORKMEN_COLONIES: 'hradmopts_workmen_colonies',
  WATER_RECORDS: 'hradmopts_water_records',
  SANITATION_RECORDS: 'hradmopts_sanitation_records',
  CANTEEN_RECORDS: 'hradmopts_canteen_records',
  RENT_AGREEMENTS: 'hradmopts_rent_agreements',
  ELECTRICITY_BILLS: 'hradmopts_electricity_bills',
  MEDICAL_RECORDS: 'hradmopts_medical_records',
  AUDIT_LOGS: 'hradmopts_audit_logs',
  FIREBASE_CONFIG: 'hradmopts_firebase_config',
};

// Safe JSON local storage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to load ${key} from storage:`, err);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

// BroadcastChannel for live real-time sync across multiple browser tabs / windows
const broadcastChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('hradmopts_channel')
  : null;

export class StorageService {
  private static instance: StorageService;
  private listeners: Set<() => void> = new Set();

  public users: UserProfile[] = [];
  public currentUser: UserProfile;
  public staff: StaffMember[] = [];
  public vendors: Vendor[] = [];
  public invoices: Invoice[] = [];
  public guestHouses: GuestHouse[] = [];
  public rooms: Room[] = [];
  public allotments: Allotment[] = [];
  public workmenColonies: WorkmenColony[] = [];
  public waterRecords: WaterConsumptionRecord[] = [];
  public sanitationRecords: SanitationRecord[] = [];
  public canteenRecords: CanteenRecord[] = [];
  public rentAgreements: RentAgreement[] = [];
  public electricityBills: ElectricityBill[] = [];
  public medicalRecords: MedicalRecord[] = [];
  public auditLogs: AuditLogEntry[] = [];

  private constructor() {
    this.users = loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.currentUser = loadFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    this.staff = loadFromStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    this.vendors = loadFromStorage(STORAGE_KEYS.VENDORS, INITIAL_VENDORS);
    this.invoices = loadFromStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    this.guestHouses = loadFromStorage(STORAGE_KEYS.GUEST_HOUSES, INITIAL_GUEST_HOUSES);
    this.rooms = loadFromStorage(STORAGE_KEYS.ROOMS, INITIAL_ROOMS);
    this.allotments = loadFromStorage(STORAGE_KEYS.ALLOTMENTS, INITIAL_ALLOTMENTS);
    this.workmenColonies = loadFromStorage(STORAGE_KEYS.WORKMEN_COLONIES, INITIAL_WORKMEN_COLONIES);
    this.waterRecords = loadFromStorage(STORAGE_KEYS.WATER_RECORDS, INITIAL_WATER_RECORDS);
    this.sanitationRecords = loadFromStorage(STORAGE_KEYS.SANITATION_RECORDS, INITIAL_SANITATION_RECORDS);
    this.canteenRecords = loadFromStorage(STORAGE_KEYS.CANTEEN_RECORDS, INITIAL_CANTEEN_RECORDS);
    this.rentAgreements = loadFromStorage(STORAGE_KEYS.RENT_AGREEMENTS, INITIAL_RENT_AGREEMENTS);
    this.electricityBills = loadFromStorage(STORAGE_KEYS.ELECTRICITY_BILLS, INITIAL_ELECTRICITY_BILLS);
    this.medicalRecords = loadFromStorage(STORAGE_KEYS.MEDICAL_RECORDS, INITIAL_MEDICAL_RECORDS);
    this.auditLogs = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        if (event.data === 'SYNC_STATE') {
          this.reloadFromStorage();
          this.notify();
        }
      };
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(broadcast = true): void {
    this.listeners.forEach((listener) => listener());
    if (broadcast && broadcastChannel) {
      broadcastChannel.postMessage('SYNC_STATE');
    }
  }

  private reloadFromStorage(): void {
    this.users = loadFromStorage(STORAGE_KEYS.USERS, this.users);
    this.currentUser = loadFromStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.staff = loadFromStorage(STORAGE_KEYS.STAFF, this.staff);
    this.vendors = loadFromStorage(STORAGE_KEYS.VENDORS, this.vendors);
    this.invoices = loadFromStorage(STORAGE_KEYS.INVOICES, this.invoices);
    this.guestHouses = loadFromStorage(STORAGE_KEYS.GUEST_HOUSES, this.guestHouses);
    this.rooms = loadFromStorage(STORAGE_KEYS.ROOMS, this.rooms);
    this.allotments = loadFromStorage(STORAGE_KEYS.ALLOTMENTS, this.allotments);
    this.workmenColonies = loadFromStorage(STORAGE_KEYS.WORKMEN_COLONIES, this.workmenColonies);
    this.waterRecords = loadFromStorage(STORAGE_KEYS.WATER_RECORDS, this.waterRecords);
    this.sanitationRecords = loadFromStorage(STORAGE_KEYS.SANITATION_RECORDS, this.sanitationRecords);
    this.canteenRecords = loadFromStorage(STORAGE_KEYS.CANTEEN_RECORDS, this.canteenRecords);
    this.rentAgreements = loadFromStorage(STORAGE_KEYS.RENT_AGREEMENTS, this.rentAgreements);
    this.electricityBills = loadFromStorage(STORAGE_KEYS.ELECTRICITY_BILLS, this.electricityBills);
    this.medicalRecords = loadFromStorage(STORAGE_KEYS.MEDICAL_RECORDS, this.medicalRecords);
    this.auditLogs = loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // Current User management
  public setCurrentUser(user: UserProfile): void {
    this.currentUser = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit({
      action: 'UPDATE',
      workspace: 'System',
      entityType: 'User Session',
      entityId: user.id,
      details: `Switched active session to ${user.name} (${user.role})`,
    });
    this.notify();
  }

  // Audit Logging
  public logAudit(entry: {
    action: AuditLogEntry['action'];
    workspace: string;
    entityType: string;
    entityId: string;
    details: string;
  }): void {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: this.currentUser?.id || 'sys',
      userName: this.currentUser?.name || 'System User',
      userRole: this.currentUser?.role || 'viewer',
      action: entry.action,
      workspace: entry.workspace,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
    };
    this.auditLogs = [newLog, ...this.auditLogs].slice(0, 1000); // keep last 1000 logs
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  // User Management
  public addUser(user: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
    const newUser: UserProfile = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users = [...this.users, newUser];
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.logAudit({
      action: 'CREATE',
      workspace: 'User Management',
      entityType: 'UserProfile',
      entityId: newUser.id,
      details: `Created user ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
    });
    this.notify();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): void {
    this.users = this.users.map((u) => (u.id === id ? { ...u, ...updates } : u));
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    if (this.currentUser.id === id) {
      this.currentUser = { ...this.currentUser, ...updates };
      saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }
    this.logAudit({
      action: 'UPDATE',
      workspace: 'User Management',
      entityType: 'UserProfile',
      entityId: id,
      details: `Updated user profile/workspace permissions for ID: ${id}`,
    });
    this.notify();
  }

  public deleteUser(id: string): void {
    const user = this.users.find((u) => u.id === id);
    if (!user) return;
    this.users = this.users.filter((u) => u.id !== id);
    saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.logAudit({
      action: 'DELETE',
      workspace: 'User Management',
      entityType: 'UserProfile',
      entityId: id,
      details: `Deleted user ${user.name} (${user.email})`,
    });
    this.notify();
  }

  // Generic generic entity save helper
  public setCollection<T>(key: string, data: T[]): void {
    saveToStorage(key, data);
    this.notify();
  }

  // Master Data: Staff
  public saveStaff(staffList: StaffMember[]): void {
    this.staff = staffList;
    saveToStorage(STORAGE_KEYS.STAFF, staffList);
    this.notify();
  }

  // Master Data: Vendors
  public saveVendors(vendorsList: Vendor[]): void {
    this.vendors = vendorsList;
    saveToStorage(STORAGE_KEYS.VENDORS, vendorsList);
    this.notify();
  }

  // Invoices
  public saveInvoices(invoicesList: Invoice[]): void {
    this.invoices = invoicesList;
    saveToStorage(STORAGE_KEYS.INVOICES, invoicesList);
    this.notify();
  }

  // Guest Houses
  public saveGuestHouses(list: GuestHouse[]): void {
    this.guestHouses = list;
    saveToStorage(STORAGE_KEYS.GUEST_HOUSES, list);
    this.notify();
  }

  // Rooms
  public saveRooms(list: Room[]): void {
    this.rooms = list;
    saveToStorage(STORAGE_KEYS.ROOMS, list);
    this.notify();
  }

  // Allotments
  public saveAllotments(list: Allotment[]): void {
    this.allotments = list;
    saveToStorage(STORAGE_KEYS.ALLOTMENTS, list);
    this.notify();
  }

  // Workmen Colonies
  public saveWorkmenColonies(list: WorkmenColony[]): void {
    this.workmenColonies = list;
    saveToStorage(STORAGE_KEYS.WORKMEN_COLONIES, list);
    this.notify();
  }

  // Water Records
  public saveWaterRecords(list: WaterConsumptionRecord[]): void {
    this.waterRecords = list;
    saveToStorage(STORAGE_KEYS.WATER_RECORDS, list);
    this.notify();
  }

  // Sanitation Records
  public saveSanitationRecords(list: SanitationRecord[]): void {
    this.sanitationRecords = list;
    saveToStorage(STORAGE_KEYS.SANITATION_RECORDS, list);
    this.notify();
  }

  // Canteen Records
  public saveCanteenRecords(list: CanteenRecord[]): void {
    this.canteenRecords = list;
    saveToStorage(STORAGE_KEYS.CANTEEN_RECORDS, list);
    this.notify();
  }

  // Rent Agreements
  public saveRentAgreements(list: RentAgreement[]): void {
    this.rentAgreements = list;
    saveToStorage(STORAGE_KEYS.RENT_AGREEMENTS, list);
    this.notify();
  }

  // Electricity Bills
  public saveElectricityBills(list: ElectricityBill[]): void {
    this.electricityBills = list;
    saveToStorage(STORAGE_KEYS.ELECTRICITY_BILLS, list);
    this.notify();
  }

  // Medical Records
  public saveMedicalRecords(list: MedicalRecord[]): void {
    this.medicalRecords = list;
    saveToStorage(STORAGE_KEYS.MEDICAL_RECORDS, list);
    this.notify();
  }

  // Clear demo data
  public clearDemoData(): void {
    this.staff = [];
    this.vendors = [];
    this.invoices = [];
    this.guestHouses = [];
    this.rooms = [];
    this.allotments = [];
    this.workmenColonies = [];
    this.waterRecords = [];
    this.sanitationRecords = [];
    this.canteenRecords = [];
    this.rentAgreements = [];
    this.electricityBills = [];
    this.medicalRecords = [];
    
    saveToStorage(STORAGE_KEYS.STAFF, []);
    saveToStorage(STORAGE_KEYS.VENDORS, []);
    saveToStorage(STORAGE_KEYS.INVOICES, []);
    saveToStorage(STORAGE_KEYS.GUEST_HOUSES, []);
    saveToStorage(STORAGE_KEYS.ROOMS, []);
    saveToStorage(STORAGE_KEYS.ALLOTMENTS, []);
    saveToStorage(STORAGE_KEYS.WORKMEN_COLONIES, []);
    saveToStorage(STORAGE_KEYS.WATER_RECORDS, []);
    saveToStorage(STORAGE_KEYS.SANITATION_RECORDS, []);
    saveToStorage(STORAGE_KEYS.CANTEEN_RECORDS, []);
    saveToStorage(STORAGE_KEYS.RENT_AGREEMENTS, []);
    saveToStorage(STORAGE_KEYS.ELECTRICITY_BILLS, []);
    saveToStorage(STORAGE_KEYS.MEDICAL_RECORDS, []);

    this.logAudit({
      action: 'DELETE',
      workspace: 'System',
      entityType: 'All Data',
      entityId: 'ALL',
      details: 'Cleared all operational demo data from portal',
    });

    this.notify();
  }

  // Restore demo data
  public restoreDemoData(): void {
    this.users = INITIAL_USERS;
    this.staff = INITIAL_STAFF;
    this.vendors = INITIAL_VENDORS;
    this.invoices = INITIAL_INVOICES;
    this.guestHouses = INITIAL_GUEST_HOUSES;
    this.rooms = INITIAL_ROOMS;
    this.allotments = INITIAL_ALLOTMENTS;
    this.workmenColonies = INITIAL_WORKMEN_COLONIES;
    this.waterRecords = INITIAL_WATER_RECORDS;
    this.sanitationRecords = INITIAL_SANITATION_RECORDS;
    this.canteenRecords = INITIAL_CANTEEN_RECORDS;
    this.rentAgreements = INITIAL_RENT_AGREEMENTS;
    this.electricityBills = INITIAL_ELECTRICITY_BILLS;
    this.medicalRecords = INITIAL_MEDICAL_RECORDS;
    this.auditLogs = INITIAL_AUDIT_LOGS;

    saveToStorage(STORAGE_KEYS.USERS, this.users);
    saveToStorage(STORAGE_KEYS.STAFF, this.staff);
    saveToStorage(STORAGE_KEYS.VENDORS, this.vendors);
    saveToStorage(STORAGE_KEYS.INVOICES, this.invoices);
    saveToStorage(STORAGE_KEYS.GUEST_HOUSES, this.guestHouses);
    saveToStorage(STORAGE_KEYS.ROOMS, this.rooms);
    saveToStorage(STORAGE_KEYS.ALLOTMENTS, this.allotments);
    saveToStorage(STORAGE_KEYS.WORKMEN_COLONIES, this.workmenColonies);
    saveToStorage(STORAGE_KEYS.WATER_RECORDS, this.waterRecords);
    saveToStorage(STORAGE_KEYS.SANITATION_RECORDS, this.sanitationRecords);
    saveToStorage(STORAGE_KEYS.CANTEEN_RECORDS, this.canteenRecords);
    saveToStorage(STORAGE_KEYS.RENT_AGREEMENTS, this.rentAgreements);
    saveToStorage(STORAGE_KEYS.ELECTRICITY_BILLS, this.electricityBills);
    saveToStorage(STORAGE_KEYS.MEDICAL_RECORDS, this.medicalRecords);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);

    this.logAudit({
      action: 'CREATE',
      workspace: 'System',
      entityType: 'Demo Data',
      entityId: 'ALL',
      details: 'Restored standard EPCC project demo datasets',
    });

    this.notify();
  }
}

export const storage = StorageService.getInstance();

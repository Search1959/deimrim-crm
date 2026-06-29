/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  UserRole,
  Company,
  Branch,
  Category,
  Brand,
  Warehouse,
  Product,
  BatchStock,
  Supplier,
  Lead,
  Customer,
  Employee,
  LeaveRequest,
  Transaction,
  AppDocument,
  AppNotification,
  AuditLog,
  PurchaseOrder,
  Invoice,
  StockMovement,
  Department,
  Designation
} from "./types";

// ==========================================
// SEED: SYSTEM SETUP & COMPANYS
// ==========================================

export const defaultCompany: Company = {
  id: "comp-1",
  name: "DEINRIM India Private Limited",
  code: "DEIN",
  taxId: "27AAECD9988A1Z5", // Maharashtra GSTIN
  email: "hq@deinrim.in",
  phone: "+91 22 5555 1234",
  address: "742 Evergreen Galleria, Powai, Mumbai, Maharashtra - 400076",
  settings: {
    whatsappEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    currency: "INR",
  },
};

export const defaultBranches: Branch[] = [
  {
    id: "br-hq",
    companyId: "comp-1",
    name: "Mumbai Headquarters (HQ)",
    code: "DEIN-MUM",
    address: "742 Evergreen Galleria, Powai, Mumbai, Maharashtra - 400076",
    phone: "+91 22 5555 1234",
  },
  {
    id: "br-se",
    companyId: "comp-1",
    name: "Bengaluru Technology Branch",
    code: "DEIN-BLR",
    address: "109 Outer Ring Road, Tech Park, Bengaluru, Karnataka - 560103",
    phone: "+91 80 4434 2900",
  },
];

export const defaultDepartments: Department[] = [
  { id: "dept-it", name: "Information Technology", code: "IT" },
  { id: "dept-ops", name: "Operations & Inventory", code: "OPS" },
  { id: "dept-sales", name: "Sales & Marketing", code: "MKT" },
  { id: "dept-hr", name: "Human Resources", code: "HR" },
  { id: "dept-fin", name: "Finance & Accounts", code: "FIN" },
];

export const defaultDesignations: Designation[] = [
  { id: "des-se", name: "Senior Software Engineer" },
  { id: "des-im", name: "Inventory Controller" },
  { id: "des-sm", name: "Sales Account Executive" },
  { id: "des-hr", name: "Human Resources Lead" },
  { id: "des-fa", name: "Financial Controller" },
];

export const defaultUsers: User[] = [
  {
    id: "u-apex",
    name: "Apex Tech Admin",
    email: "apex7tech@gmail.com",
    role: UserRole.SYSTEM_ADMIN,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-it",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-demo",
    name: "Demo User",
    email: "demo@deinrim.in",
    role: UserRole.READ_ONLY,
    companyId: "comp-1",
    branchId: "br-hq",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-1",
    name: "Alex Mercer",
    email: "alex.mercer@deinrim.com",
    role: UserRole.SYSTEM_ADMIN,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-it",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-2",
    name: "Sarah Jenkins",
    email: "sarah.j@deinrim.com",
    role: UserRole.COMPANY_ADMIN,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-ops",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-3",
    name: "Marcus Vance",
    email: "marcus.v@deinrim.com",
    role: UserRole.PURCHASE_MANAGER,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-ops",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-4",
    name: "Devon Lane",
    email: "devon.l@deinrim.com",
    role: UserRole.INVENTORY_MANAGER,
    companyId: "comp-1",
    branchId: "br-se",
    departmentId: "dept-ops",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-5",
    name: "Theresa Webb",
    email: "theresa.w@deinrim.com",
    role: UserRole.SALES_MANAGER,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-sales",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-6",
    name: "Bessie Cooper",
    email: "bessie.c@deinrim.com",
    role: UserRole.FINANCE_MANAGER,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-fin",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
  {
    id: "u-7",
    name: "Emma Watson",
    email: "emma.w@deinrim.com",
    role: UserRole.HR_MANAGER,
    companyId: "comp-1",
    branchId: "br-hq",
    departmentId: "dept-hr",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
    status: "active",
  },
];

// ==========================================
// SEED: PRODUCT CATALOG, CATEGORIES, BRANDS
// ==========================================

export const defaultCategories: Category[] = [
  { id: "cat-1", name: "Enterprise Server Hardware", code: "ESH", description: "Rackmount units, blades, and network components" },
  { id: "cat-2", name: "Personal Workstations", code: "PWS", description: "Laptops, desktops, and ultra-books for employees" },
  { id: "cat-3", name: "Industrial IoT Devices", code: "IIOT", description: "Sensors, smart meters, and edge gateways" },
  { id: "cat-4", name: "Office Infrastructure", code: "OFF", description: "Commercial furniture and climate appliances" },
];

export const defaultBrands: Brand[] = [
  { id: "b-1", name: "DEINRIM SmartHardware" },
  { id: "b-2", name: "CoreSilicon Industries" },
  { id: "b-3", name: "Steelcase" },
  { id: "b-4", name: "Schneider Electric" },
];

export const defaultWarehouses: Warehouse[] = [
  {
    id: "wh-main",
    branchId: "br-hq",
    name: "Central Godown - HQ",
    code: "CG-HQ",
    location: "Shed A-B, Tech City Core",
  },
  {
    id: "wh-se",
    branchId: "br-se",
    name: "Port Transit Depot",
    code: "PTD-SE",
    location: "Dockside Terminal 4, Coastal Area",
  },
];

export const defaultProducts: Product[] = [];

export const defaultBatchStocks: BatchStock[] = [];

// ==========================================
// SEED: PURCHASE & SUPPLIERS
// ==========================================

export const defaultSuppliers: Supplier[] = [];

export const defaultPurchaseOrders: PurchaseOrder[] = [];

// ==========================================
// SEED: SALES, LEADS & CUSTOMERS
// ==========================================

export const defaultLeads: Lead[] = [];

export const defaultCustomers: Customer[] = [];

export const defaultInvoices: Invoice[] = [];

// ==========================================
// SEED: HR MANAGEMENT
// ==========================================

export const defaultEmployees: Employee[] = [];

export const defaultLeaveRequests: LeaveRequest[] = [];

// ==========================================
// SEED: FINANCE & INCOME/EXPENSE
// ==========================================

export const defaultTransactions: Transaction[] = [];

// ==========================================
// SEED: DOCUMENTS & NOTIFICATIONS & AUDIT
// ==========================================

export const defaultDocuments: AppDocument[] = [];

export const defaultNotifications: AppNotification[] = [];

export const defaultAuditLogs: AuditLog[] = [];

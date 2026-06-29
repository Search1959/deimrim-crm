/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// SYSTEM ADMINISTRATION & MULTI-TENANCY
// ==========================================

export enum UserRole {
  SYSTEM_ADMIN = "System Administrator",
  COMPANY_ADMIN = "Company Admin",
  PURCHASE_MANAGER = "Purchase Manager",
  INVENTORY_MANAGER = "Inventory Manager",
  SALES_MANAGER = "Sales Manager",
  CRM_EXECUTIVE = "CRM Executive",
  HR_MANAGER = "HR Manager",
  FINANCE_MANAGER = "Finance Manager",
  EMPLOYEE = "Employee",
  READ_ONLY = "Read Only User",
}

export interface Permission {
  id: string;
  module: string;
  action: "create" | "read" | "update" | "delete" | "approve";
  granted: boolean;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
  settings: {
    whatsappEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    currency: string;
  };
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  managerId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  branchId: string;
  departmentId?: string;
  avatarUrl?: string;
  status: "active" | "inactive";
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

// ==========================================
// INVENTORY & PRODUCT CORE
// ==========================================

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface Warehouse {
  id: string;
  branchId: string;
  name: string;
  code: string;
  location: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  brandId: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  barcode?: string;
  qrCode?: string;
  description?: string;
}

export interface BatchStock {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  serialNumber?: string;
  expiryDate?: string;
  quantity: number;
  rackLocation?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  type: "IN" | "OUT";
  source: "PURCHASE" | "SALES" | "RETURN" | "DAMAGE" | "CONSUMPTION" | "TRANSFER" | "OPENING";
  referenceId: string; // PO Number, Invoice Number, etc.
  quantity: number;
  unitPrice: number;
  userId: string;
  timestamp: string;
  remarks?: string;
}

// ==========================================
// PURCHASE MANAGEMENT
// ==========================================

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  creditDays: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  branchId: string;
  departmentId: string;
  requestedBy: string;
  items: Array<{
    productId: string;
    quantity: number;
    estimatedCost: number;
  }>;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  branchId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    receivedQuantity: number;
  }>;
  totalAmount: number;
  status: "draft" | "sent" | "approved" | "grn_pending" | "completed" | "cancelled";
  paymentStatus: "unpaid" | "partially_paid" | "paid";
  deliveryDate?: string;
  remarks?: string;
  createdAt: string;
}

export interface GRN {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  supplierId: string;
  warehouseId: string;
  receivedBy: string;
  items: Array<{
    productId: string;
    orderedQty: number;
    receivedQty: number;
    batchNumber?: string;
    expiryDate?: string;
    rackLocation?: string;
  }>;
  receivedDate: string;
  remarks?: string;
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  type: "INVOICE" | "PAYMENT" | "RETURN";
  referenceId: string;
  amount: number;
  balance: number;
  timestamp: string;
}

// ==========================================
// SALES & CRM
// ==========================================

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  status: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  source: string;
  assignedTo: string;
  lastContacted?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  outstandingBalance: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  branchId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: "unpaid" | "partially_paid" | "paid" | "overdue" | "void";
  createdAt: string;
  dueDate: string;
}

// ==========================================
// HR MANAGEMENT
// ==========================================

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Designation {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  designationId: string;
  joiningDate: string;
  salary: number;
  status: "active" | "on_leave" | "terminated";
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: "present" | "absent" | "leave" | "late";
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "annual" | "sick" | "casual" | "maternity" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
}

// ==========================================
// FINANCE MANAGEMENT
// ==========================================

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  date: string;
  referenceId?: string; // Links to Invoice/PO if relevant
  paymentMethod: "CASH" | "BANK" | "CHEQUE" | "UPI";
  description: string;
  branchId: string;
}

export interface Asset {
  id: string;
  name: string;
  code: string;
  category: string;
  purchaseValue: number;
  currentValue: number;
  purchaseDate: string;
  depreciationRate: number; // percentage per year
}

// ==========================================
// DOCUMENT STORAGE & NOTIFICATIONS
// ==========================================

export interface AppDocument {
  id: string;
  name: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  attachedToType: "CUSTOMER" | "SUPPLIER" | "EMPLOYEE" | "PURCHASE" | "SALES" | "ASSET";
  attachedToId: string;
  url: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

// ==========================================
// LOCALIZED INDIAN CURRENCY & FORMATTING
// ==========================================

export function formatINR(amount: number): string {
  const val = Number(amount || 0);
  return "₹" + val.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

export function formatINRSort(amount: number): string {
  const val = Number(amount || 0);
  if (val >= 10000000) {
    return "₹" + (val / 10000000).toFixed(1) + "Cr";
  }
  if (val >= 100000) {
    return "₹" + (val / 100000).toFixed(1) + "L";
  }
  if (val >= 1000) {
    return "₹" + (val / 1000).toFixed(1) + "K";
  }
  return "₹" + val.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

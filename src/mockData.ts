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
  taxId: "19AAECD9988A1Z5", // West Bengal GSTIN
  email: "hq@deinrim.in",
  phone: "+91 33 5555 1234",
  address: "742 Salt Lake Sector V, Electronics Complex, Kolkata, West Bengal - 700091",
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
    name: "Kolkata Headquarters (HQ)",
    code: "DEIN-KOL",
    address: "742 Salt Lake Sector V, Electronics Complex, Kolkata, West Bengal - 700091",
    phone: "+91 33 5555 1234",
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

export const defaultProducts: Product[] = [
  {
    id: "p-1",
    sku: "DEIN-SRV-X10",
    name: "Enterprise Server Rack Unit X10",
    categoryId: "cat-1",
    brandId: "b-1",
    unit: "Pcs",
    purchasePrice: 120000,
    sellingPrice: 180000,
    minStockLevel: 2,
    maxStockLevel: 10,
    barcode: "8901122334455",
    qrCode: "DEINRIM-SRV-X10-QR",
    description: "High-density enterprise-level rack cabinet with integrated cooling and power modules."
  },
  {
    id: "p-2",
    sku: "SCHN-EC-990",
    name: "Schneider Smart Edge Controller 990",
    categoryId: "cat-3",
    brandId: "b-4",
    unit: "Pcs",
    purchasePrice: 15000,
    sellingPrice: 25000,
    minStockLevel: 5,
    maxStockLevel: 30,
    barcode: "8902233445566",
    qrCode: "SCHN-EC-990-QR",
    description: "Industrial IoT controller for real-time sensor processing and cloud diagnostics."
  },
  {
    id: "p-3",
    sku: "CORE-WS-PX7",
    name: "CoreSilicon Workstation Pro X7",
    categoryId: "cat-2",
    brandId: "b-2",
    unit: "Pcs",
    purchasePrice: 45000,
    sellingPrice: 65000,
    minStockLevel: 3,
    maxStockLevel: 15,
    barcode: "8903344556677",
    qrCode: "CORE-WS-PX7-QR",
    description: "Premium hardware layout workstation for developer compiles and 3D modeling pipelines."
  }
];

export const defaultBatchStocks: BatchStock[] = [
  {
    id: "bs-1",
    productId: "p-1",
    warehouseId: "wh-main",
    batchNumber: "B-SRV-2026-01",
    expiryDate: "2031-12-31",
    quantity: 6,
    rackLocation: "Rack A-3"
  },
  {
    id: "bs-2",
    productId: "p-2",
    warehouseId: "wh-main",
    batchNumber: "B-SCHN-99-A",
    expiryDate: "2029-06-30",
    quantity: 18,
    rackLocation: "Rack B-2"
  },
  {
    id: "bs-3",
    productId: "p-3",
    warehouseId: "wh-se",
    batchNumber: "B-CORE-WS-02",
    expiryDate: "2030-12-31",
    quantity: 8,
    rackLocation: "Bay 4"
  }
];

// ==========================================
// SEED: PURCHASE & SUPPLIERS
// ==========================================

export const defaultSuppliers: Supplier[] = [
  {
    id: "sup-1",
    companyId: "comp-1",
    name: "CoreSilicon Labs Ltd",
    code: "SUP-CORE",
    contactPerson: "Rajiv Mehta",
    email: "procure@coresilicon.in",
    phone: "+91 80 2234 5678",
    address: "Plot 12, Electronic City, Phase 1, Bengaluru, Karnataka - 560100",
    taxId: "29AABC1234F1Z1",
    creditDays: 30
  },
  {
    id: "sup-2",
    companyId: "comp-1",
    name: "Schneider Electric India Pvt Ltd",
    code: "SUP-SCHN",
    contactPerson: "Amrita Sen",
    email: "orders@schneider.co.in",
    phone: "+91 22 6677 8899",
    address: "Corporate Park, Saki Naka, Andheri East, Mumbai, Maharashtra - 400072",
    taxId: "27AAACS4321A2Z5",
    creditDays: 45
  }
];

export const defaultPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO-2026-001",
    supplierId: "sup-1",
    branchId: "br-hq",
    items: [
      { productId: "p-3", quantity: 10, unitPrice: 45000, receivedQuantity: 8 }
    ],
    totalAmount: 450000,
    status: "completed",
    paymentStatus: "paid",
    deliveryDate: "2026-06-15",
    remarks: "Initial seed workstation stock procurement.",
    createdAt: "2026-06-01T10:00:00.000Z"
  }
];

// ==========================================
// SEED: SALES, LEADS & CUSTOMERS
// ==========================================

export const defaultLeads: Lead[] = [
  {
    id: "lead-1",
    companyId: "comp-1",
    name: "HDFC IT Infrastructure Desk",
    companyName: "HDFC Bank Ltd",
    email: "infra@hdfcbank.com",
    phone: "+91 22 3344 5566",
    status: "Proposal",
    source: "Website",
    assignedTo: "Sarah Jenkins",
    lastContacted: "2026-06-25",
    notes: "Requires standard quotes for 5 units of Server Racks and 20 Edge devices."
  },
  {
    id: "lead-2",
    companyId: "comp-1",
    name: "Wipro Technologies procurement",
    companyName: "Wipro Limited",
    email: "procure@wipro.com",
    phone: "+91 80 1122 3344",
    status: "Qualified",
    source: "Direct Referral",
    assignedTo: "Theresa Webb",
    lastContacted: "2026-06-28",
    notes: "Expressed strong interest in CoreSilicon Workstations for their Bengaluru expansion."
  }
];

export const defaultCustomers: Customer[] = [
  {
    id: "cust-1",
    companyId: "comp-1",
    name: "Reliance Digital Solutions",
    code: "CUST-RELI",
    email: "tech@reliance.co.in",
    phone: "+91 22 7700 9900",
    address: "Reliance Corporate Park, Ghansoli, Navi Mumbai, Maharashtra - 400701",
    outstandingBalance: 450000
  },
  {
    id: "cust-2",
    companyId: "comp-1",
    name: "Tata Consultancy Services Ltd",
    code: "CUST-TATA",
    email: "it.procurement@tcs.com",
    phone: "+91 20 6611 2233",
    address: "Hinjawadi Phase III, Rajiv Gandhi Infotech Park, Pune, Maharashtra - 411057",
    outstandingBalance: 125000
  }
];

export const defaultInvoices: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0001",
    customerId: "cust-1",
    branchId: "br-hq",
    items: [
      { productId: "p-1", quantity: 2, unitPrice: 180000, discount: 0 }
    ],
    subtotal: 360000,
    taxAmount: 64800, // 18% standard GST
    totalAmount: 424800,
    status: "paid",
    createdAt: "2026-06-20",
    dueDate: "2026-07-20"
  }
];

// ==========================================
// SEED: HR MANAGEMENT
// ==========================================

export const defaultEmployees: Employee[] = [
  {
    id: "emp-1",
    employeeCode: "EMP-DEIN-001",
    name: "Sarah Jenkins",
    email: "sarah.j@deinrim.com",
    phone: "+91 98765 43210",
    departmentId: "dept-ops",
    designationId: "des-im",
    joiningDate: "2023-05-10",
    salary: 85000,
    status: "active"
  },
  {
    id: "emp-2",
    employeeCode: "EMP-DEIN-002",
    name: "Marcus Vance",
    email: "marcus.v@deinrim.com",
    phone: "+91 90011 22334",
    departmentId: "dept-ops",
    designationId: "des-im",
    joiningDate: "2024-02-01",
    salary: 72000,
    status: "active"
  }
];

export const defaultLeaveRequests: LeaveRequest[] = [
  {
    id: "lr-1",
    employeeId: "emp-1",
    leaveType: "sick",
    startDate: "2026-06-15",
    endDate: "2026-06-16",
    reason: "Severe fever and dental appointment.",
    status: "approved",
    approvedBy: "Emma Watson"
  }
];

// ==========================================
// SEED: FINANCE & INCOME/EXPENSE
// ==========================================

export const defaultTransactions: Transaction[] = [
  {
    id: "tx-1",
    type: "INCOME",
    category: "Product Sales",
    amount: 424800,
    date: "2026-06-20",
    referenceId: "INV-2026-0001",
    paymentMethod: "BANK",
    description: "Invoiced amount received from Reliance Digital Solutions",
    branchId: "br-hq"
  },
  {
    id: "tx-2",
    type: "EXPENSE",
    category: "Cost of Goods Sold (COGS)",
    amount: 180000,
    date: "2026-06-10",
    referenceId: "PO-2026-001",
    paymentMethod: "BANK",
    description: "Paid procurement clearance charges for workstation shipment",
    branchId: "br-hq"
  },
  {
    id: "tx-3",
    type: "EXPENSE",
    category: "Utilities",
    amount: 8500,
    date: "2026-06-18",
    referenceId: "UPI-UTIL-99",
    paymentMethod: "UPI",
    description: "Cloud infrastructure subscription and high-speed office fiber broadband",
    branchId: "br-hq"
  }
];

// ==========================================
// SEED: DOCUMENTS & NOTIFICATIONS & AUDIT
// ==========================================

export const defaultDocuments: AppDocument[] = [];

export const defaultNotifications: AppNotification[] = [
  {
    id: "n-1",
    title: "System Boot Successful",
    message: "Deinrim OMS ERP cloud nodes initialized across multi-tenant clusters.",
    type: "success",
    read: false,
    createdAt: "2026-06-28T12:00:00.000Z"
  }
];

export const defaultAuditLogs: AuditLog[] = [
  {
    id: "audit-1",
    userId: "u-1",
    userName: "Alex Mercer",
    userRole: "System Administrator",
    action: "BOOT",
    module: "SYSTEM",
    details: "Initialized system and established seed corporate branches.",
    timestamp: "2026-06-28T11:55:00.000Z",
    ipAddress: "192.168.1.1"
  }
];

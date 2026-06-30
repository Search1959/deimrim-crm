/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Shield, FileText, HelpCircle, AlertTriangle, CheckCircle2, Trash2, Plus, MessageSquare, Clipboard, Calendar, Zap } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import PurchaseView from "./components/PurchaseView";
import InventoryView from "./components/InventoryView";
import SalesCRMView from "./components/SalesCRMView";
import HRView from "./components/HRView";
import FinanceView from "./components/FinanceView";
import AdminView from "./components/AdminView";
import DocumentView from "./components/DocumentView";
import HomePage from "./components/HomePage";

// Seed states imports
import {
  defaultCompany,
  defaultBranches,
  defaultUsers,
  defaultProducts,
  defaultCategories,
  defaultBrands,
  defaultWarehouses,
  defaultBatchStocks,
  defaultSuppliers,
  defaultPurchaseOrders,
  defaultLeads,
  defaultCustomers,
  defaultInvoices,
  defaultEmployees,
  defaultLeaveRequests,
  defaultTransactions,
  defaultDocuments,
  defaultNotifications,
  defaultAuditLogs,
  defaultDepartments,
  defaultDesignations
} from "./mockData";

import { 
  User, 
  Branch, 
  Product, 
  BatchStock, 
  Category,
  Brand,
  Supplier, 
  PurchaseOrder, 
  Lead, 
  Customer, 
  Invoice, 
  Employee, 
  LeaveRequest, 
  Transaction, 
  AppDocument, 
  AppNotification, 
  AuditLog,
  StockMovement,
  formatINR,
  UserRole
} from "./types";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  
  // Login Session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Dynamic SEO Title and Meta Description updater
  useEffect(() => {
    if (!isLoggedIn) {
      document.title = "DEINRIM OMS - Whitelabel Tenant Workspace & Office Management System";
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", "DEINRIM Office Management System (OMS) is a premium whitelabel ERP & CRM workspace offering integrated inventory control, financial ledgers, HR operations, and secure tenant sub-accounts.");
      }
      return;
    }

    let pageTitle = "DEINRIM OMS";
    let pageDesc = "Manage your office operations with DEINRIM Office Management System.";

    switch (activeView) {
      case "dashboard":
        pageTitle = "Enterprise Control Dashboard | DEINRIM OMS";
        pageDesc = "Real-time key metrics, branch inventories, revenue flow, pending approvals, and centralized command dashboard.";
        break;
      case "inventory":
        pageTitle = "Inventory Control & Ledger | DEINRIM OMS";
        pageDesc = "Track product stocks, brands, categories, low-stock warnings, and real-time ledger accounting of inventory physical items.";
        break;
      case "purchase":
        pageTitle = "Purchase Orders & Vendor Tracker | DEINRIM OMS";
        pageDesc = "Manage raw material procuring pipeline, supplier directories, purchase approvals, and receive stock workflows.";
        break;
      case "sales-crm":
        pageTitle = "Sales Pipeline, Leads & Invoices | DEINRIM OMS";
        pageDesc = "Oversee CRM client sales loops, active leads tracking, invoice generations, and customer accounts statuses.";
        break;
      case "hr":
        pageTitle = "HR Directory, Payroll & Leaves | DEINRIM OMS";
        pageDesc = "Manage staff registrations, attendance directories, payroll sheets, and leave request workflows.";
        break;
      case "finance":
        pageTitle = "Financial Ledger & Account Books | DEINRIM OMS";
        pageDesc = "Double-entry accounting, custom charts of accounts, transaction ledgers, and cash flow sheets.";
        break;
      case "documents":
        pageTitle = "Secure Vault Document Manager | DEINRIM OMS";
        pageDesc = "Upload, categorize, search, and securely manage corporate contracts, templates, and spreadsheets.";
        break;
      case "admin":
        pageTitle = "System Whitelabel Configurations | DEINRIM OMS";
        pageDesc = "System administrator white-label tenant registrations, branding settings, security audits, and system nodes.";
        break;
      default:
        pageTitle = "Workspace Platform | DEINRIM OMS";
        pageDesc = "Secure collaborative work office management system tools.";
    }

    document.title = pageTitle;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", pageDesc);
    }
  }, [isLoggedIn, activeView]);

  // Helper to determine the landing view for a role upon login
  const getDefaultViewForRole = (role: UserRole): string => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.COMPANY_ADMIN:
      case UserRole.READ_ONLY:
        return "dashboard";
      case UserRole.INVENTORY_MANAGER:
        return "inventory";
      case UserRole.PURCHASE_MANAGER:
        return "purchase";
      case UserRole.SALES_MANAGER:
      case UserRole.CRM_EXECUTIVE:
        return "sales-crm";
      case UserRole.HR_MANAGER:
        return "hr";
      case UserRole.FINANCE_MANAGER:
        return "finance";
      case UserRole.EMPLOYEE:
        return "dashboard";
      default:
        return "dashboard";
    }
  };

  // Helper to check if a specific view is allowed for the user's role
  const isViewAllowed = (role: UserRole, view: string): boolean => {
    if (role === UserRole.SYSTEM_ADMIN || role === UserRole.COMPANY_ADMIN) {
      return true;
    }
    if (role === UserRole.READ_ONLY) {
      return view !== "admin";
    }

    if (view === "dashboard" && role === UserRole.EMPLOYEE) {
      return true;
    }

    switch (view) {
      case "inventory":
        return role === UserRole.INVENTORY_MANAGER;
      case "purchase":
        return role === UserRole.PURCHASE_MANAGER;
      case "sales-crm":
        return role === UserRole.SALES_MANAGER || role === UserRole.CRM_EXECUTIVE;
      case "hr":
        return role === UserRole.HR_MANAGER;
      case "finance":
        return role === UserRole.FINANCE_MANAGER;
      default:
        return false;
    }
  };

  // Core Mutable States
  const [currentUser, setCurrentUser] = useState<User>(defaultUsers[0]); // Initialized to default but guarded by isLoggedIn
  const [currentBranch, setCurrentBranch] = useState<Branch>(defaultBranches[0]); // HQ
  const [company, setCompany] = useState(defaultCompany);
  const [branches, setBranches] = useState(defaultBranches);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [brands, setBrands] = useState<Brand[]>(defaultBrands);
  const [batchStocks, setBatchStocks] = useState<BatchStock[]>(defaultBatchStocks);
  const [suppliers, setSuppliers] = useState<Supplier[]>(defaultSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(defaultPurchaseOrders);
  const [leads, setLeads] = useState<Lead[]>(defaultLeads);
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(defaultInvoices);
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(defaultLeaveRequests);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [documents, setDocuments] = useState<AppDocument[]>(defaultDocuments);
  const [notifications, setNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(defaultAuditLogs);
  const [users, setUsers] = useState<User[]>(defaultUsers);

  // Global search parameters
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Floating Quick Action Menu Dialog States
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);
  const [showQuickAddLeadModal, setShowQuickAddLeadModal] = useState(false);
  const [showQuickCreatePOModal, setShowQuickCreatePOModal] = useState(false);
  const [showQuickRequestLeaveModal, setShowQuickRequestLeaveModal] = useState(false);

  // Quick Action Form Fields
  const [qLeadName, setQLeadName] = useState("");
  const [qLeadCompany, setQLeadCompany] = useState("");
  const [qLeadEmail, setQLeadEmail] = useState("");
  const [qLeadPhone, setQLeadPhone] = useState("");
  const [qLeadNotes, setQLeadNotes] = useState("");

  const [qPOSupplier, setQPOSupplier] = useState("");
  const [qPOProduct, setQPOProduct] = useState("");
  const [qPOQty, setQPOQty] = useState("10");
  const [qPORate, setQPORate] = useState("500");

  const [qLeaveEmployee, setQLeaveEmployee] = useState("");
  const [qLeaveType, setQLeaveType] = useState("Casual Leave");
  const [qLeaveStart, setQLeaveStart] = useState("");
  const [qLeaveEnd, setQLeaveEnd] = useState("");
  const [qLeaveReason, setQLeaveReason] = useState("");

  // Simulated assets seed
  const [assets, setAssets] = useState<any[]>([]);

  // Chronological stock movements list log
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  // -------------------------------------------------------------
  // MULTI-TENANT LOCAL PERSISTENCE SYSTEM (DURABLE & BLANK WORKSPACES)
  // -------------------------------------------------------------

  // A. Boot list of global operator accounts from localStorage
  useEffect(() => {
    const storedUsers = localStorage.getItem("deinrim_users");
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error("Failed to parse stored users directory", e);
      }
    } else {
      localStorage.setItem("deinrim_users", JSON.stringify(defaultUsers));
    }
  }, []);

  // Save users whenever directory changes (e.g. System Admin registers new clients)
  useEffect(() => {
    localStorage.setItem("deinrim_users", JSON.stringify(users));
  }, [users]);

  // B. Switch and boot specific Tenant State when user logs in / changes company
  useEffect(() => {
    if (!isLoggedIn) return;

    const companyId = currentUser.companyId;

    // Local Helper to query localStorage keys with tenant partition
    const getTenantStored = (key: string) => {
      const val = localStorage.getItem(`deinrim_${key}_${companyId}`);
      if (val) {
        try { return JSON.parse(val); } catch (e) { return null; }
      }
      return null;
    };

    // 1. Company Setup
    let tenantCompany = getTenantStored("company");
    if (!tenantCompany) {
      if (companyId === "comp-1") {
        tenantCompany = defaultCompany;
      } else {
        const cleanCode = companyId.replace("comp-", "").toUpperCase();
        tenantCompany = {
          id: companyId,
          name: currentUser.companyName || `${cleanCode} Industries`,
          code: cleanCode,
          taxId: "GST-UNSET-0000",
          email: currentUser.email,
          phone: "+91 98361-30393",
          address: "Custom Whitelabel Office Address",
          logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&auto=format&fit=crop&q=60",
          settings: {
            taxScheme: "GST-18",
            requireAuditLog: true,
            alertMinStock: true,
            allowNegativeStock: false,
          }
        };
      }
      localStorage.setItem(`deinrim_company_${companyId}`, JSON.stringify(tenantCompany));
    }
    setCompany(tenantCompany);

    // 2. Branches Setup
    let tenantBranches = getTenantStored("branches");
    if (!tenantBranches) {
      if (companyId === "comp-1") {
        tenantBranches = defaultBranches;
      } else {
        const cleanCode = companyId.replace("comp-", "").toUpperCase();
        tenantBranches = [
          {
            id: `br-${cleanCode.toLowerCase()}-hq`,
            companyId: companyId,
            name: "Headquarters (Main)",
            code: `${cleanCode}-HQ`,
            location: "Corporate HQ, Operational Block",
          }
        ];
      }
      localStorage.setItem(`deinrim_branches_${companyId}`, JSON.stringify(tenantBranches));
    } else {
      // Force migration/replacement of Mumbai to Kolkata in loaded branches
      let migrated = false;
      const updatedBranches = tenantBranches.map((br: any) => {
        if (br.name && br.name.includes("Mumbai")) {
          migrated = true;
          return {
            ...br,
            name: br.name.replace("Mumbai", "Kolkata"),
            address: br.address ? br.address.replace("Mumbai", "Kolkata") : br.address,
            code: br.code === "DEIN-BOM" ? "DEIN-KOL" : br.code
          };
        }
        return br;
      });
      if (migrated) {
        tenantBranches = updatedBranches;
        localStorage.setItem(`deinrim_branches_${companyId}`, JSON.stringify(tenantBranches));
      }
    }
    setBranches(tenantBranches);
    setCurrentBranch(tenantBranches[0]);

    // 3. Products Ledger
    let tenantProducts = getTenantStored("products");
    if (tenantProducts === null) {
      tenantProducts = companyId === "comp-1" ? defaultProducts : [];
    }
    setProducts(tenantProducts);

    // 4. Batch Stocks Ledger
    let tenantBatchStocks = getTenantStored("batchStocks");
    if (tenantBatchStocks === null) {
      tenantBatchStocks = companyId === "comp-1" ? defaultBatchStocks : [];
    }
    setBatchStocks(tenantBatchStocks);

    // 5. Suppliers Directory
    let tenantSuppliers = getTenantStored("suppliers");
    if (tenantSuppliers === null) {
      tenantSuppliers = companyId === "comp-1" ? defaultSuppliers : [];
    }
    setSuppliers(tenantSuppliers);

    // 6. Purchase Orders Directory
    let tenantPO = getTenantStored("purchaseOrders");
    if (tenantPO === null) {
      tenantPO = companyId === "comp-1" ? defaultPurchaseOrders : [];
    }
    setPurchaseOrders(tenantPO);

    // 7. CRM Sales Leads
    let tenantLeads = getTenantStored("leads");
    if (tenantLeads === null) {
      tenantLeads = companyId === "comp-1" ? defaultLeads : [];
    }
    setLeads(tenantLeads);

    // 8. CRM Customer Ledger
    let tenantCustomers = getTenantStored("customers");
    if (tenantCustomers === null) {
      tenantCustomers = companyId === "comp-1" ? defaultCustomers : [];
    }
    setCustomers(tenantCustomers);

    // 9. Accounts Invoices
    let tenantInvoices = getTenantStored("invoices");
    if (tenantInvoices === null) {
      tenantInvoices = companyId === "comp-1" ? defaultInvoices : [];
    }
    setInvoices(tenantInvoices);

    // 10. HR Employee Registry
    let tenantEmployees = getTenantStored("employees");
    if (tenantEmployees === null) {
      tenantEmployees = companyId === "comp-1" ? defaultEmployees : [];
    }
    setEmployees(tenantEmployees);

    // 11. HR Leaves Requests
    let tenantLeaves = getTenantStored("leaveRequests");
    if (tenantLeaves === null) {
      tenantLeaves = companyId === "comp-1" ? defaultLeaveRequests : [];
    }
    setLeaveRequests(tenantLeaves);

    // 12. Finance Double-entry Transactions
    let tenantTransactions = getTenantStored("transactions");
    if (tenantTransactions === null) {
      tenantTransactions = companyId === "comp-1" ? defaultTransactions : [];
    }
    setTransactions(tenantTransactions);

    // 13. Shared Documents
    let tenantDocs = getTenantStored("documents");
    if (tenantDocs === null) {
      tenantDocs = companyId === "comp-1" ? defaultDocuments : [];
    }
    setDocuments(tenantDocs);

    // 14. Real-time Notifications
    let tenantNotifications = getTenantStored("notifications");
    if (tenantNotifications === null) {
      tenantNotifications = companyId === "comp-1" ? defaultNotifications : [
        {
          id: `n-${Date.now()}`,
          title: "Tenant Space Activated",
          message: `Welcome to your customized whitelabel enterprise suite: "${tenantCompany.name}". Your flat subscription of ₹500/month is active. Start adding your own suppliers, products, and clients on a 100% clean slate!`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        }
      ];
    }
    setNotifications(tenantNotifications);

    // 15. Operational Audit Trail Logs
    let tenantAudit = getTenantStored("auditLogs");
    if (tenantAudit === null) {
      tenantAudit = companyId === "comp-1" ? defaultAuditLogs : [
        {
          id: `audit-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: currentUser.role,
          action: "BOOT",
          module: "SYSTEM",
          details: `Tenant workspace launched for corporate node: ${tenantCompany.name}.`,
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        }
      ];
    }
    setAuditLogs(tenantAudit);

    // 16. Fixed Business Assets
    let tenantAssets = getTenantStored("assets");
    if (tenantAssets === null) {
      tenantAssets = [];
    }
    setAssets(tenantAssets);

    // 17. Batch Stock Movements Ledger
    let tenantMovements = getTenantStored("stockMovements");
    if (tenantMovements === null) {
      tenantMovements = [];
    }
    setStockMovements(tenantMovements);

  }, [isLoggedIn, currentUser.companyId]);

  // C. Auto-save Tenant State back to partitioned LocalStorage on any local mutations
  useEffect(() => {
    if (!isLoggedIn) return;
    const companyId = currentUser.companyId;

    localStorage.setItem(`deinrim_company_${companyId}`, JSON.stringify(company));
    localStorage.setItem(`deinrim_branches_${companyId}`, JSON.stringify(branches));
    localStorage.setItem(`deinrim_products_${companyId}`, JSON.stringify(products));
    localStorage.setItem(`deinrim_batchStocks_${companyId}`, JSON.stringify(batchStocks));
    localStorage.setItem(`deinrim_suppliers_${companyId}`, JSON.stringify(suppliers));
    localStorage.setItem(`deinrim_purchaseOrders_${companyId}`, JSON.stringify(purchaseOrders));
    localStorage.setItem(`deinrim_leads_${companyId}`, JSON.stringify(leads));
    localStorage.setItem(`deinrim_customers_${companyId}`, JSON.stringify(customers));
    localStorage.setItem(`deinrim_invoices_${companyId}`, JSON.stringify(invoices));
    localStorage.setItem(`deinrim_employees_${companyId}`, JSON.stringify(employees));
    localStorage.setItem(`deinrim_leaveRequests_${companyId}`, JSON.stringify(leaveRequests));
    localStorage.setItem(`deinrim_transactions_${companyId}`, JSON.stringify(transactions));
    localStorage.setItem(`deinrim_documents_${companyId}`, JSON.stringify(documents));
    localStorage.setItem(`deinrim_notifications_${companyId}`, JSON.stringify(notifications));
    localStorage.setItem(`deinrim_auditLogs_${companyId}`, JSON.stringify(auditLogs));
    localStorage.setItem(`deinrim_assets_${companyId}`, JSON.stringify(assets));
    localStorage.setItem(`deinrim_stockMovements_${companyId}`, JSON.stringify(stockMovements));
  }, [
    isLoggedIn,
    currentUser.companyId,
    company,
    branches,
    products,
    batchStocks,
    suppliers,
    purchaseOrders,
    leads,
    customers,
    invoices,
    employees,
    leaveRequests,
    transactions,
    documents,
    notifications,
    auditLogs,
    assets,
    stockMovements
  ]);

  // ==========================================
  // STATE WORKFLOWS: THE "ENTER ONCE" ENGINE
  // ==========================================

  // 1. Goods Receipt Note (GRN) triggers Stock Increase & Log updates
  const handleReceiveGRN = (
    poId: string, 
    warehouseId: string, 
    items: Array<{ productId: string; qty: number; batchNumber: string; expiryDate?: string; rack?: string }>
  ) => {
    // A. Mutate batch stocks
    setBatchStocks(prev => {
      const copy = [...prev];
      items.forEach(item => {
        const existingIdx = copy.findIndex(
          b => b.productId === item.productId && 
               b.warehouseId === warehouseId && 
               b.batchNumber === item.batchNumber
        );

        if (existingIdx > -1) {
          copy[existingIdx].quantity += item.qty;
        } else {
          copy.push({
            id: `bs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            productId: item.productId,
            warehouseId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate || "2031-12-31",
            quantity: item.qty,
            rackLocation: item.rack || "General Rack",
          });
        }
      });
      return copy;
    });

    // B. Write chronological movements log
    const targetPO = purchaseOrders.find(po => po.id === poId);
    items.forEach(item => {
      const moveLog: StockMovement = {
        id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: item.productId,
        warehouseId,
        type: "IN",
        source: "PURCHASE",
        referenceId: targetPO?.poNumber || "GRN-RCV",
        quantity: item.qty,
        unitPrice: targetPO?.items.find(i => i.productId === item.productId)?.unitPrice || 0,
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        remarks: `GRN received against Purchase Order. Stored at warehouse ${warehouseId}.`,
      };
      setStockMovements(prev => [moveLog, ...prev]);
    });

    // C. Automatically write operational liabilities expense log to Finance module!
    const grnTotalCost = items.reduce((sum, item) => {
      const rate = targetPO?.items.find(i => i.productId === item.productId)?.unitPrice || 0;
      return sum + (item.qty * rate);
    }, 0);

    const financeLog: Transaction = {
      id: `tx-${Date.now()}`,
      type: "EXPENSE",
      category: "Cost of Goods Sold (COGS)",
      amount: grnTotalCost,
      date: new Date().toISOString().split("T")[0],
      referenceId: targetPO?.poNumber || "GRN-EXP",
      paymentMethod: "BANK",
      description: `Stock procurement COGS settlement for GRN - ${targetPO?.poNumber}`,
      branchId: currentBranch.id,
    };
    setTransactions(prev => [financeLog, ...prev]);

    // D. Raise System Alert & audit history logs
    const alertLog: AppNotification = {
      id: `n-${Date.now()}`,
      title: "GRN Goods Received Successfully",
      message: `Goods for ${targetPO?.poNumber} stored. Total Cost asset value ${formatINR(grnTotalCost)} linked.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [alertLog, ...prev]);

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "CREATED",
      module: "INVENTORY_GRN",
      details: `Generated GRN against ${targetPO?.poNumber}. Inventory valuation increased by ${formatINR(grnTotalCost)}.`,
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.100",
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // FLOATING QUICK ACTION SAVING CALLBACKS
  // -------------------------------------------------------------
  const handleQuickSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qLeadName || !qLeadCompany) return;

    const newLeadItem: Lead = {
      id: `lead-${Date.now()}`,
      companyId: currentUser.companyId,
      name: qLeadName,
      companyName: qLeadCompany,
      email: qLeadEmail || "contact@example.com",
      phone: qLeadPhone || "+91 98300 00000",
      status: "New",
      notes: qLeadNotes,
      source: "Quick Action",
      assignedTo: "Kolkata Sales Node",
      lastContacted: new Date().toISOString().split("T")[0]
    };

    setLeads(prev => [newLeadItem, ...prev]);
    setShowQuickAddLeadModal(false);
    
    // Clear fields
    setQLeadName("");
    setQLeadCompany("");
    setQLeadEmail("");
    setQLeadPhone("");
    setQLeadNotes("");

    // Create Audit Log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "CREATED",
      module: "LEADS_PIPELINE",
      details: `Quick Added Lead: "${qLeadName}" for "${qLeadCompany}" via Floating Action Menu.`,
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
    };
    setAuditLogs(prev => [audit, ...prev]);

    // Go to view
    setActiveView("sales-crm");
  };

  const handleQuickSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPOSupplier || !qPOProduct) return;

    const qtyVal = Number(qPOQty) || 1;
    const rateVal = Number(qPORate) || 100;
    const totalAmount = qtyVal * rateVal;

    const poNumber = `PO-2026-000${purchaseOrders.length + 1}`;
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: qPOSupplier,
      branchId: currentBranch.id,
      items: [{ productId: qPOProduct, quantity: qtyVal, unitPrice: rateVal, receivedQuantity: 0 }],
      totalAmount,
      status: "draft",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString().split("T")[0]
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    setShowQuickCreatePOModal(false);

    // Clear fields
    setQPOSupplier("");
    setQPOProduct("");
    setQPOQty("10");
    setQPORate("500");

    // Create Audit Log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "CREATED",
      module: "PURCHASING",
      details: `Quick Created PO "${poNumber}" for total ${formatINR(totalAmount)} via Floating Action Menu.`,
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
    };
    setAuditLogs(prev => [audit, ...prev]);

    setActiveView("purchase");
  };

  const handleQuickSaveLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qLeaveEmployee || !qLeaveStart || !qLeaveEnd) return;

    // Map label to LeaveRequest["leaveType"]
    let typeVal: "casual" | "sick" | "annual" | "maternity" | "unpaid" = "casual";
    if (qLeaveType === "Sick Leave") typeVal = "sick";
    else if (qLeaveType === "Earned Leave") typeVal = "annual";
    else if (qLeaveType === "Maternity Leave") typeVal = "maternity";

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: qLeaveEmployee,
      leaveType: typeVal,
      startDate: qLeaveStart,
      endDate: qLeaveEnd,
      status: "pending",
      reason: qLeaveReason
    };

    setLeaveRequests(prev => [newLeave, ...prev]);
    setShowQuickRequestLeaveModal(false);

    // Clear fields
    setQLeaveEmployee("");
    setQLeaveType("Casual Leave");
    setQLeaveStart("");
    setQLeaveEnd("");
    setQLeaveReason("");

    // Create Audit Log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "CREATED",
      module: "HR_OPERATIONS",
      details: `Quick Requested Leave for employee ID: ${qLeaveEmployee} via Floating Action Menu.`,
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
    };
    setAuditLogs(prev => [audit, ...prev]);

    setActiveView("hr");
  };

  // 2. Sales Billing Invoices triggers Stock Depletion & Ledgers updates
  const handleGenerateInvoice = (
    invoiceId: string, 
    customerId: string, 
    items: Array<{ productId: string; qty: number }>,
    customTotalAmount?: number
  ) => {
    // A. Deplete available batch stock quantities
    setBatchStocks(prev => {
      const copy = [...prev];
      items.forEach(item => {
        // Find any batches that contain this product and possess on-hand quantities
        let remainingToDeplete = item.qty;
        
        for (let i = 0; i < copy.length; i++) {
          if (copy[i].productId === item.productId && copy[i].quantity > 0) {
            if (copy[i].quantity >= remainingToDeplete) {
              copy[i].quantity -= remainingToDeplete;
              remainingToDeplete = 0;
              break;
            } else {
              remainingToDeplete -= copy[i].quantity;
              copy[i].quantity = 0;
            }
          }
        }
      });
      return copy;
    });

    // B. Write chronological movements log
    const invoiceNum = `INV-2026-000${invoices.length + 1}`;
    items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const moveLog: StockMovement = {
        id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: item.productId,
        warehouseId: "wh-main", // Default Headquarters central godown
        type: "OUT",
        source: "SALES",
        referenceId: invoiceNum,
        quantity: item.qty,
        unitPrice: prod?.sellingPrice || 0,
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        remarks: `Auto-depleted from sales billing Invoice - ${invoiceNum}`,
      };
      setStockMovements(prev => [moveLog, ...prev]);
    });

    // C. Increase Customer outstanding billing ledger balance
    const billingTotalCost = customTotalAmount !== undefined ? customTotalAmount : items.reduce((sum, item) => {
      const rate = products.find(p => p.id === item.productId)?.sellingPrice || 0;
      return sum + (item.qty * rate);
    }, 0) * 1.18; // adding 18% GST tax (Indian standard)

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          outstandingBalance: c.outstandingBalance + billingTotalCost,
        };
      }
      return c;
    }));

    // D. Post revenue transaction details into finance
    const targetCustName = customers.find(c => c.id === customerId)?.name || "Client Account";
    const financeLog: Transaction = {
      id: `tx-${Date.now()}`,
      type: "INCOME",
      category: "Product Sales",
      amount: billingTotalCost,
      date: new Date().toISOString().split("T")[0],
      referenceId: invoiceNum,
      paymentMethod: "BANK",
      description: `Billed Revenue receivable from ${targetCustName} for invoice ${invoiceNum}`,
      branchId: currentBranch.id,
    };
    setTransactions(prev => [financeLog, ...prev]);

    // E. Raise System Alert & audit logs
    const alertLog: AppNotification = {
      id: `n-${Date.now()}`,
      title: "Invoice Generated & Posted",
      message: `Invoice ${invoiceNum} generated. Customer ledger balance updated. Stock depleted.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [alertLog, ...prev]);

    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "CREATED",
      module: "CRM_SALES",
      details: `Generated Invoice ${invoiceNum} worth ${formatINR(billingTotalCost)}. Real-time stock counts adjusted.`,
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.100",
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  // ==========================================
  // VIEW ORCHESTRATION & GLOBAL SEARCH
  // ==========================================

  const renderView = () => {
    // Role privilege check
    if (!isViewAllowed(currentUser.role, activeView)) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 bg-slate-900">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-950/20 border border-red-500/30 flex items-center justify-center text-red-400 text-lg">
              ⚠️
            </div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">Access Restricted</h2>
            <p className="text-xs leading-relaxed text-slate-400">
              Your staff user account (<strong className="text-indigo-400">{currentUser.role}</strong>) is restricted to your assigned role-based dashboard only.
            </p>
          </div>
        </div>
      );
    }

    // If global search query exists, show search outcomes overview
    if (globalSearchQuery.trim() !== "") {
      const query = globalSearchQuery.toLowerCase();
      
      const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query));
      const filteredProds = products.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
      const filteredLeads = leads.filter(l => l.name.toLowerCase().includes(query) || l.companyName?.toLowerCase().includes(query));
      const filteredInvoices = invoices.filter(inv => inv.invoiceNumber.toLowerCase().includes(query));

      return (
        <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left bg-slate-900 text-slate-100">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white">Global Search Outcomes</h2>
            <p className="text-xs text-slate-400 mt-1">Found results matching: <strong className="text-indigo-400 font-mono">"{globalSearchQuery}"</strong></p>
          </div>

          <div className="space-y-6">
            {/* Products */}
            {filteredProds.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Matched Products ({filteredProds.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
                  {filteredProds.map(p => (
                    <div key={p.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <div className="text-slate-100">{p.name}</div>
                        <div className="text-slate-400 font-mono text-[10px] mt-0.5">{p.sku}</div>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearchQuery(""); setActiveView("inventory"); }} 
                        className="text-indigo-400 hover:text-indigo-300 text-[10px]"
                      >
                        View Stock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers */}
            {filteredSuppliers.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Matched Suppliers ({filteredSuppliers.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
                  {filteredSuppliers.map(s => (
                    <div key={s.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <div className="text-slate-100">{s.name}</div>
                        <div className="text-slate-400 font-mono text-[10px] mt-0.5">{s.contactPerson}</div>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearchQuery(""); setActiveView("purchase"); }} 
                        className="text-indigo-400 hover:text-indigo-300 text-[10px]"
                      >
                        View Ledger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invoices */}
            {filteredInvoices.length > 0 && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Matched Invoices ({filteredInvoices.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
                  {filteredInvoices.map(inv => (
                    <div key={inv.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 flex justify-between items-center">
                      <div>
                        <div className="text-slate-100">{inv.invoiceNumber}</div>
                        <div className="text-slate-400 font-mono text-[10px] mt-0.5 font-normal">Total: {formatINR(inv.totalAmount)}</div>
                      </div>
                      <button 
                        onClick={() => { setGlobalSearchQuery(""); setActiveView("sales-crm"); }} 
                        className="text-indigo-400 hover:text-indigo-300 text-[10px]"
                      >
                        View Billing
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty result safety */}
            {filteredProds.length === 0 && filteredSuppliers.length === 0 && filteredInvoices.length === 0 && filteredLeads.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <span>No results match your query. Try searching for "Server", "Tech", or invoice numbers.</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            products={products}
            batchStocks={batchStocks}
            invoices={invoices}
            purchaseOrders={purchaseOrders}
            setPurchaseOrders={setPurchaseOrders}
            transactions={transactions}
            employees={employees}
            leads={leads}
            setLeads={setLeads}
            leaveRequests={leaveRequests}
            setLeaveRequests={setLeaveRequests}
            suppliers={suppliers}
            onNavigate={setActiveView}
            currentUser={currentUser}
            company={company}
          />
        );
      case "inventory":
        return (
          <InventoryView
            products={products}
            setProducts={setProducts}
            categories={categories}
            setCategories={setCategories}
            brands={brands}
            setBrands={setBrands}
            warehouses={defaultWarehouses}
            batchStocks={batchStocks}
            setBatchStocks={setBatchStocks}
            movements={stockMovements}
            setMovements={setStockMovements}
          />
        );
      case "purchase":
        return (
          <PurchaseView
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            purchaseOrders={purchaseOrders}
            setPurchaseOrders={setPurchaseOrders}
            products={products}
            warehouses={defaultWarehouses}
            userRole={currentUser.role}
            onReceiveGRN={handleReceiveGRN}
          />
        );
      case "sales-crm":
        return (
          <SalesCRMView
            leads={leads}
            setLeads={setLeads}
            customers={customers}
            setCustomers={setCustomers}
            invoices={invoices}
            setInvoices={setInvoices}
            products={products}
            batchStocks={batchStocks}
            userRole={currentUser.role}
            onGenerateInvoice={handleGenerateInvoice}
            companyId={currentUser.companyId}
          />
        );
      case "hr":
        return (
          <HRView
            employees={employees}
            setEmployees={setEmployees}
            leaveRequests={leaveRequests}
            setLeaveRequests={setLeaveRequests}
            departments={defaultDepartments}
            designations={defaultDesignations}
            userRole={currentUser.role}
          />
        );
      case "finance":
        return (
          <FinanceView
            transactions={transactions}
            setTransactions={setTransactions}
            assets={assets}
            userRole={currentUser.role}
          />
        );
      case "admin":
        return (
          <AdminView
            company={company}
            setCompany={setCompany}
            branches={branches}
            setBranches={setBranches}
            users={users}
            setUsers={setUsers}
            userRole={currentUser.role}
          />
        );
      case "documents":
        return (
          <DocumentView
            documents={documents}
            setDocuments={setDocuments}
            suppliers={suppliers}
            customers={customers}
            employees={employees}
            assets={assets}
            userRole={currentUser.role}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <span>View context mapping error.</span>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return (
      <HomePage 
        onLogin={(user) => { 
          setCurrentUser(user); 
          setIsLoggedIn(true); 
          const landingView = getDefaultViewForRole(user.role);
          setActiveView(landingView);
        }} 
        usersList={users} 
        setUsers={setUsers} 
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans antialiased text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setGlobalSearchQuery(""); // Auto-clear search query on tab change
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        userRole={currentUser.role}
        company={company}
      />

      {/* Main Panel Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Dynamic header panel */}
        <Header
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          usersList={users}
          currentBranch={currentBranch}
          setCurrentBranch={setCurrentBranch}
          branchesList={branches}
          notifications={notifications}
          setNotifications={setNotifications}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          onNavigate={(view) => {
            setActiveView(view);
            setGlobalSearchQuery("");
          }}
          onLogout={() => {
            setIsLoggedIn(false);
            // Default view back to dashboard for next login
            setActiveView("dashboard");
          }}
        />

        {/* Dynamic workspace context panel */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-900">
          {renderView()}
        </main>
      </div>

      {/* Floating Quick Action Menu (one-click access to Add Lead, Create PO, Request Leave) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Expanded Options */}
        {showQuickActionMenu && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-fadeIn">
            {/* Quick action: Add Lead */}
            <div className="flex items-center gap-2">
              <span className="bg-slate-950/90 text-[10px] text-slate-200 border border-slate-800 px-2 py-1 rounded-md font-bold shadow-lg uppercase font-mono">
                Add Lead
              </span>
              <button
                onClick={() => {
                  setShowQuickAddLeadModal(true);
                  setShowQuickActionMenu(false);
                }}
                className="h-10 w-10 rounded-full bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                title="Add CRM Lead"
              >
                <MessageSquare className="h-5 w-5" />
              </button>
            </div>

            {/* Quick action: Create PO */}
            <div className="flex items-center gap-2">
              <span className="bg-slate-950/90 text-[10px] text-slate-200 border border-slate-800 px-2 py-1 rounded-md font-bold shadow-lg uppercase font-mono">
                Create PO
              </span>
              <button
                onClick={() => {
                  setShowQuickCreatePOModal(true);
                  setShowQuickActionMenu(false);
                }}
                className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                title="Create Purchase Order"
              >
                <Clipboard className="h-5 w-5" />
              </button>
            </div>

            {/* Quick action: Request Leave */}
            <div className="flex items-center gap-2">
              <span className="bg-slate-950/90 text-[10px] text-slate-200 border border-slate-800 px-2 py-1 rounded-md font-bold shadow-lg uppercase font-mono">
                Request Leave
              </span>
              <button
                onClick={() => {
                  setShowQuickRequestLeaveModal(true);
                  setShowQuickActionMenu(false);
                }}
                className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                title="Request Leave"
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Dial Button */}
        <button
          onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 text-white cursor-pointer ${
            showQuickActionMenu 
              ? "bg-rose-600 hover:bg-rose-500 rotate-45" 
              : "bg-indigo-600 hover:bg-indigo-500"
          }`}
          title="Quick Action Menu"
        >
          {showQuickActionMenu ? (
            <X className="h-6 w-6" />
          ) : (
            <Zap className="h-6 w-6 animate-pulse" />
          )}
        </button>
      </div>

      {/* MODAL: QUICK ADD LEAD */}
      {showQuickAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 text-left">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="border-b border-slate-800 p-5 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Add Lead</h3>
              </div>
              <button onClick={() => setShowQuickAddLeadModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuickSaveLead} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Contact Person / Name *</label>
                <input
                  type="text"
                  required
                  value={qLeadName}
                  onChange={e => setQLeadName(e.target.value)}
                  placeholder="e.g. Anand Sharma"
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Company Name *</label>
                <input
                  type="text"
                  required
                  value={qLeadCompany}
                  onChange={e => setQLeadCompany(e.target.value)}
                  placeholder="e.g. Reliance Retail"
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Email ID</label>
                  <input
                    type="email"
                    value={qLeadEmail}
                    onChange={e => setQLeadEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={qLeadPhone}
                    onChange={e => setQLeadPhone(e.target.value)}
                    placeholder="+91 99000 12345"
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Internal Requirement Notes</label>
                <textarea
                  value={qLeadNotes}
                  onChange={e => setQLeadNotes(e.target.value)}
                  rows={3}
                  placeholder="Provide requirement details here..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickAddLeadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg shadow-orange-950/20 cursor-pointer"
                >
                  Save & View Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK CREATE PURCHASE ORDER */}
      {showQuickCreatePOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 text-left">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="border-b border-slate-800 p-5 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Create PO</h3>
              </div>
              <button onClick={() => setShowQuickCreatePOModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuickSavePO} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Supplier *</label>
                <select
                  required
                  value={qPOSupplier}
                  onChange={e => setQPOSupplier(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Product *</label>
                <select
                  required
                  value={qPOProduct}
                  onChange={e => setQPOProduct(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Order Qty *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={qPOQty}
                    onChange={e => setQPOQty(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Procurement Rate (₹/unit)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={qPORate}
                    onChange={e => setQPORate(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Total PO Valuation:</span>
                <span className="text-white font-extrabold font-mono text-sm">
                  {formatINR((Number(qPOQty) || 0) * (Number(qPORate) || 0))}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickCreatePOModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-950/20 cursor-pointer"
                >
                  Save & View PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK REQUEST LEAVE */}
      {showQuickRequestLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 text-left">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="border-b border-slate-800 p-5 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Request Leave</h3>
              </div>
              <button onClick={() => setShowQuickRequestLeaveModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleQuickSaveLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Employee *</label>
                <select
                  required
                  value={qLeaveEmployee}
                  onChange={e => setQLeaveEmployee(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Leave Type *</label>
                <select
                  required
                  value={qLeaveType}
                  onChange={e => setQLeaveType(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Earned Leave">Earned Leave</option>
                  <option value="Maternity Leave">Maternity Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={qLeaveStart}
                    onChange={e => setQLeaveStart(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">End Date *</label>
                  <input
                    type="date"
                    required
                    value={qLeaveEnd}
                    onChange={e => setQLeaveEnd(e.target.value)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Reason *</label>
                <textarea
                  required
                  value={qLeaveReason}
                  onChange={e => setQLeaveReason(e.target.value)}
                  rows={2}
                  placeholder="Reason for requesting leave..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickRequestLeaveModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/20 cursor-pointer"
                >
                  Submit & View Leaves
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

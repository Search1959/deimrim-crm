/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "./utils/toast";
import { loadAllEntities, saveEntity, loadUsers, saveUsers } from "./api";
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
import GSTView from "./components/GSTView";
import HomePage from "./components/HomePage";
import ToastContainer from "./components/ToastContainer";

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
  ServiceCatalogItem,
  VendorInvoice,
  Payment,
  formatINR,
  UserRole
} from "./types";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  
  // Login Session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Guard: prevents persistTenant from writing stale previous-tenant data
  // into the new tenant's localStorage before the loading useEffect completes
  const tenantLoading = useRef(false);

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
      case "gst":
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
  const [vendorBills, setVendorBills] = useState<VendorInvoice[]>([]);
  const [salesPayments, setSalesPayments] = useState<Payment[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
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
  const [quickNewInvoice, setQuickNewInvoice] = useState(false);
  const [showStockCheck, setShowStockCheck] = useState(false);
  const [stockCheckQuery, setStockCheckQuery] = useState("");
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
  // MULTI-TENANT PERSISTENCE — MySQL via API (localStorage as fast cache)
  // -------------------------------------------------------------

  // A. Boot global users: try API first, fall back to localStorage, then seed defaults
  useEffect(() => {
    (async () => {
      // Try server DB first
      const serverUsers = await loadUsers<typeof defaultUsers>();
      if (serverUsers && Array.isArray(serverUsers) && serverUsers.length > 0) {
        setUsers(serverUsers);
        localStorage.setItem("deinrim_users", JSON.stringify(serverUsers));
        return;
      }
      // Fall back to localStorage cache
      const cached = localStorage.getItem("deinrim_users");
      if (cached) {
        try { setUsers(JSON.parse(cached)); return; } catch {}
      }
      // Seed defaults
      localStorage.setItem("deinrim_users", JSON.stringify(defaultUsers));
    })();
  }, []);

  // Save users to API + localStorage whenever directory changes
  const usersSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    localStorage.setItem("deinrim_users", JSON.stringify(users));
    if (usersSaveTimer.current) clearTimeout(usersSaveTimer.current);
    usersSaveTimer.current = setTimeout(() => saveUsers(users), 1500);
  }, [users]);

  // B. Switch and boot specific Tenant State when user logs in / changes company
  // B. On login: load tenant data from MySQL API, fall back to localStorage, then defaults
  useEffect(() => {
    if (!isLoggedIn) return;
    const companyId = currentUser.companyId;

    // HARD RULE: only the original built-in seeded accounts (IDs like u-apex, u-1 ... u-8,
    // u-demo) ever see demo data. Any account created through the UI gets id starting with
    // "u-client-" or "u-staff-" and ALWAYS starts with a blank slate — regardless of which
    // companyId they happen to have.
    const isCreatedAccount = currentUser.id.startsWith("u-client-") || currentUser.id.startsWith("u-staff-");
    const isDemo = !isCreatedAccount && companyId === "comp-1";

    const lsGet = (key: string) => {
      const v = localStorage.getItem(`deinrim_${key}_${companyId}`);
      try { return v ? JSON.parse(v) : null; } catch { return null; }
    };

    const pick = <T,>(fromAPI: T | null | undefined, lsKey: string, fallback: T): T => {
      if (fromAPI != null) return fromAPI;
      // For non-demo tenants, NEVER fall back to localStorage.
      // localStorage may hold contaminated demo data from a previous session bug.
      // MySQL is the source of truth; if MySQL has no data, the company is new → blank slate.
      if (isDemo) {
        const cached = lsGet(lsKey);
        if (cached != null) return cached;
      }
      return fallback;
    };

    tenantLoading.current = true;
    // For non-demo tenants: purge ALL their localStorage keys so any contaminated demo
    // data from a previous session bug is erased. MySQL is their source of truth.
    if (companyId !== "comp-1") {
      ["company","branches","products","categories","brands","batchStocks","suppliers",
       "purchaseOrders","leads","customers","invoices","employees","leaveRequests",
       "transactions","documents","notifications","auditLogs","assets","stockMovements"
      ].forEach(key => localStorage.removeItem(`deinrim_${key}_${companyId}`));
    }
    // Immediately wipe previous-tenant data so persistTenant (which fires on state change)
    // cannot write the old tenant's data into this tenant's localStorage before the async
    // API load completes and sets the correct data.
    setProducts([]); setBatchStocks([]); setSuppliers([]); setPurchaseOrders([]);
    setLeads([]); setCustomers([]); setInvoices([]); setEmployees([]); setLeaveRequests([]);
    setTransactions([]); setDocuments([]); setNotifications([]); setAuditLogs([]);
    setAssets([]); setStockMovements([]); setServiceCatalog([]);
    (async () => {
      // Load all 19 entities from MySQL in parallel (one round-trip each via Promise.all)
      const [
        apiCompany, apiBranches, apiProducts, apiCategories, apiBrands,
        apiBatchStocks, apiSuppliers, apiPOs, apiLeads, apiCustomers,
        apiInvoices, apiEmployees, apiLeaves, apiTransactions, apiDocs,
        apiNotifications, apiAudit, apiAssets, apiMovements,
      ] = await Promise.all([
        loadAllEntities(companyId).then(d => d)
      ]).then(([d]) => [
        d.company, d.branches, d.products, d.categories, d.brands,
        d.batchStocks, d.suppliers, d.purchaseOrders, d.leads, d.customers,
        d.invoices, d.employees, d.leaveRequests, d.transactions, d.documents,
        d.notifications, d.auditLogs, d.assets, d.stockMovements,
      ]);

      // Build blank tenant defaults for new companies (isDemo defined above)
      const cleanCode = companyId.replace("comp-", "").toUpperCase();

      const blankCompany = isDemo ? defaultCompany : {
        id: companyId,
        name: currentUser.companyName || `${cleanCode} Industries`,
        code: cleanCode, taxId: "GST-UNSET-0000",
        email: currentUser.email, phone: "+91 98361-30393",
        address: "Custom Whitelabel Office Address",
        logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&auto=format&fit=crop&q=60",
        settings: { taxScheme: "GST-18", requireAuditLog: true, alertMinStock: true, allowNegativeStock: false },
      };
      const blankBranches = isDemo ? defaultBranches : [{
        id: `br-${cleanCode.toLowerCase()}-hq`, companyId,
        name: "Headquarters (Main)", code: `${cleanCode}-HQ`,
        location: "Corporate HQ, Operational Block",
      }];

      // Resolve each entity: API → localStorage → seed default
      //
      // Contamination guard: the old race-condition bug saved the entire demo dataset
      // (comp-1 records) into this tenant's MySQL slot. The company record is the canary —
      // if apiCompany.id !== companyId, the whole MySQL snapshot for this tenant is stale/
      // contaminated. Discard ALL MySQL data in that case so every entity falls through to
      // its clean fallback ([] for non-demo tenants).
      const validApiCompany = (apiCompany as any)?.id === companyId ? apiCompany : undefined;
      const dbContaminated  = validApiCompany === undefined && apiCompany !== undefined;
      // When contaminated, treat every other MySQL result as if it returned nothing.
      const safe = <T,>(v: T) => dbContaminated ? undefined : v;

      const resolvedCompany   = pick(validApiCompany,        "company",        blankCompany);
      const resolvedBranches  = pick(safe(apiBranches),      "branches",       blankBranches);
      const resolvedProducts  = pick(safe(apiProducts),      "products",       isDemo ? defaultProducts       : []);
      const resolvedCats      = pick(safe(apiCategories),    "categories",     defaultCategories);
      const resolvedBrands    = pick(safe(apiBrands),        "brands",         defaultBrands);
      const resolvedStocks    = pick(safe(apiBatchStocks),   "batchStocks",    isDemo ? defaultBatchStocks    : []);
      const resolvedSuppliers = pick(safe(apiSuppliers),     "suppliers",      isDemo ? defaultSuppliers      : []);
      const resolvedPOs       = pick(safe(apiPOs),           "purchaseOrders", isDemo ? defaultPurchaseOrders : []);
      const resolvedLeads     = pick(safe(apiLeads),         "leads",          isDemo ? defaultLeads          : []);
      const resolvedCustomers = pick(safe(apiCustomers),     "customers",      isDemo ? defaultCustomers      : []);
      const resolvedInvoices  = pick(safe(apiInvoices),      "invoices",       isDemo ? defaultInvoices       : []);
      const resolvedEmployees = pick(safe(apiEmployees),     "employees",      isDemo ? defaultEmployees      : []);
      const resolvedLeaves    = pick(safe(apiLeaves),        "leaveRequests",  isDemo ? defaultLeaveRequests  : []);
      const rawTxns           = pick(safe(apiTransactions),  "transactions",   isDemo ? defaultTransactions   : []);
      // Migration: remove stale accrual entries auto-posted by old handleGenerateInvoice code.
      // Cash-basis model: only payment-recording entries belong in the ledger.
      const resolvedTxns = (rawTxns as any[]).filter(
        (t: any) => !(t.description?.startsWith("Revenue receivable from"))
      );
      const resolvedDocs      = pick(safe(apiDocs),          "documents",      isDemo ? defaultDocuments      : []);
      const resolvedNotes     = pick(safe(apiNotifications), "notifications",  isDemo ? defaultNotifications  : [{
        id: `n-${Date.now()}`, title: "Tenant Space Activated",
        message: `Welcome to your whitelabel workspace: "${(resolvedCompany as any).name}".`,
        type: "success", read: false, createdAt: new Date().toISOString(),
      }]);
      const resolvedAudit     = pick(apiAudit,     "auditLogs",     isDemo ? defaultAuditLogs : [{
        id: `audit-${Date.now()}`, userId: currentUser.id, userName: currentUser.name,
        userRole: currentUser.role, action: "BOOT", module: "SYSTEM",
        details: `Tenant workspace launched: ${(resolvedCompany as any).name}.`,
        timestamp: new Date().toISOString(), ipAddress: "127.0.0.1",
      }]);
      const resolvedAssets    = pick(apiAssets,    "assets",        []);
      const resolvedMovements = pick(apiMovements, "stockMovements",[]);

      // Apply branch migration (Mumbai → Kolkata)
      const migratedBranches = (resolvedBranches as any[]).map((br: any) =>
        br.name?.includes("Mumbai")
          ? { ...br, name: br.name.replace("Mumbai","Kolkata"), code: br.code==="DEIN-BOM"?"DEIN-KOL":br.code }
          : br
      );

      // Set all React state at once
      setCompany(resolvedCompany as any);
      setBranches(migratedBranches as any);
      setCurrentBranch(migratedBranches[0] as any);
      setProducts(resolvedProducts as any);
      setCategories(resolvedCats as any);
      setBrands(resolvedBrands as any);
      setBatchStocks(resolvedStocks as any);
      setSuppliers(resolvedSuppliers as any);
      setPurchaseOrders(resolvedPOs as any);
      setLeads(resolvedLeads as any);
      setCustomers(resolvedCustomers as any);
      setInvoices(resolvedInvoices as any);
      setEmployees(resolvedEmployees as any);
      setLeaveRequests(resolvedLeaves as any);
      setTransactions(resolvedTxns as any);
      setDocuments(resolvedDocs as any);
      setNotifications(resolvedNotes as any);
      setAuditLogs(resolvedAudit as any);
      setAssets(resolvedAssets as any);
      setStockMovements(resolvedMovements as any);
      tenantLoading.current = false;
      setServiceCatalog(isDemo ? [
        { id: "svc-1", name: "Consulting / Advisory", sacCode: "998311", unit: "Hour", defaultRate: 2500, description: "Professional consulting and advisory services" },
        { id: "svc-2", name: "Annual Maintenance Contract (AMC)", sacCode: "998719", unit: "Year", defaultRate: 15000, description: "Comprehensive annual maintenance and support" },
        { id: "svc-3", name: "Installation & Commissioning", sacCode: "995461", unit: "Job", defaultRate: 8000, description: "On-site installation and commissioning" },
        { id: "svc-4", name: "Training & Capacity Building", sacCode: "999293", unit: "Day", defaultRate: 5000, description: "Staff training and skill development" },
        { id: "svc-5", name: "Software / SaaS Subscription", sacCode: "998314", unit: "Month", defaultRate: 3000, description: "Software license or SaaS subscription fee" },
      ] : []);
    })();
  }, [isLoggedIn, currentUser.companyId]);

  // C. Auto-save to MySQL (debounced 1.5s) + localStorage on every state change
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistTenant = useCallback(() => {
    if (!isLoggedIn) return;
    if (tenantLoading.current) return; // block writes while tenant data is loading
    const cid = currentUser.companyId;

    // Write-through to localStorage immediately (instant cache)
    localStorage.setItem(`deinrim_company_${cid}`,        JSON.stringify(company));
    localStorage.setItem(`deinrim_branches_${cid}`,       JSON.stringify(branches));
    localStorage.setItem(`deinrim_products_${cid}`,       JSON.stringify(products));
    localStorage.setItem(`deinrim_batchStocks_${cid}`,    JSON.stringify(batchStocks));
    localStorage.setItem(`deinrim_suppliers_${cid}`,      JSON.stringify(suppliers));
    localStorage.setItem(`deinrim_purchaseOrders_${cid}`, JSON.stringify(purchaseOrders));
    localStorage.setItem(`deinrim_leads_${cid}`,          JSON.stringify(leads));
    localStorage.setItem(`deinrim_customers_${cid}`,      JSON.stringify(customers));
    localStorage.setItem(`deinrim_invoices_${cid}`,       JSON.stringify(invoices));
    localStorage.setItem(`deinrim_employees_${cid}`,      JSON.stringify(employees));
    localStorage.setItem(`deinrim_leaveRequests_${cid}`,  JSON.stringify(leaveRequests));
    localStorage.setItem(`deinrim_transactions_${cid}`,   JSON.stringify(transactions));
    localStorage.setItem(`deinrim_documents_${cid}`,      JSON.stringify(documents));
    localStorage.setItem(`deinrim_notifications_${cid}`,  JSON.stringify(notifications));
    localStorage.setItem(`deinrim_auditLogs_${cid}`,      JSON.stringify(auditLogs));
    localStorage.setItem(`deinrim_assets_${cid}`,         JSON.stringify(assets));
    localStorage.setItem(`deinrim_stockMovements_${cid}`, JSON.stringify(stockMovements));

    // Debounced write to MySQL API (fire-and-forget, no blocking UI)
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveEntity(cid, "company",        company);
      saveEntity(cid, "branches",       branches);
      saveEntity(cid, "products",       products);
      saveEntity(cid, "batchStocks",    batchStocks);
      saveEntity(cid, "suppliers",      suppliers);
      saveEntity(cid, "purchaseOrders", purchaseOrders);
      saveEntity(cid, "leads",          leads);
      saveEntity(cid, "customers",      customers);
      saveEntity(cid, "invoices",       invoices);
      saveEntity(cid, "employees",      employees);
      saveEntity(cid, "leaveRequests",  leaveRequests);
      saveEntity(cid, "transactions",   transactions);
      saveEntity(cid, "documents",      documents);
      saveEntity(cid, "notifications",  notifications);
      saveEntity(cid, "auditLogs",      auditLogs);
      saveEntity(cid, "assets",         assets);
      saveEntity(cid, "stockMovements", stockMovements);
    }, 1500);
  }, [
    isLoggedIn, currentUser.companyId,
    company, branches, products, batchStocks, suppliers, purchaseOrders,
    leads, customers, invoices, employees, leaveRequests, transactions,
    documents, notifications, auditLogs, assets, stockMovements,
  ]);

  useEffect(() => { persistTenant(); }, [persistTenant]);

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

  // One-click PO → Inventory (no separate GRN step required)
  const handleMarkPOReceived = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;
    const targetWh = defaultWarehouses.find(w => w.branchId === po.branchId) || defaultWarehouses[0];
    const warehouseId = targetWh?.id || "wh-main";
    const grnItems = po.items.map(item => ({
      productId: item.productId,
      qty: item.quantity,
      batchNumber: `B${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      expiryDate: "2031-12-31",
      rack: "Rack A",
    }));
    handleReceiveGRN(poId, warehouseId, grnItems);
    setPurchaseOrders(prev => prev.map(p =>
      p.id === poId ? { ...p, status: "completed" as const } : p
    ));
    toast.success("Stock Updated", `PO ${po.poNumber} received — inventory updated automatically`);
  };

  // Salary disbursed → post EXPENSE to Finance
  const handleSalaryDisbursed = (_employeeId: string, employeeName: string, amount: number, month: string) => {
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "EXPENSE",
      category: "Salary & Payroll",
      amount,
      date: new Date().toISOString().split("T")[0],
      referenceId: `SAL-${month.replace(" ", "-").toUpperCase()}`,
      paymentMethod: "BANK",
      description: `Salary disbursed to ${employeeName} for ${month}`,
      branchId: currentBranch.id,
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Payment recorded → post INCOME to Finance (cash basis) + clear outstanding balance.
  const handlePaymentRecorded = (invoiceId: string, amount: number, method: string, invoiceNumber: string, customerName: string) => {
    const finTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "INCOME",
      category: "Payment Received",
      amount,
      date: new Date().toISOString().split("T")[0],
      referenceId: invoiceNumber,
      paymentMethod: method === "Bank Transfer" ? "BANK" : method === "UPI" ? "UPI" : method === "Cash" ? "CASH" : "BANK",
      description: `Payment received from ${customerName} for ${invoiceNumber}`,
      branchId: currentBranch.id,
    };
    setTransactions(prev => [finTx, ...prev]);
    const inv = invoices.find(i => i.id === invoiceId);
    if (inv) {
      setCustomers(prev => prev.map(c =>
        c.id === inv.customerId
          ? { ...c, outstandingBalance: Math.max(0, c.outstandingBalance - amount) }
          : c
      ));
    }
    const newPay: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      invoiceNumber,
      companyName: customerName,
      amount,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: method,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSalesPayments(prev => [newPay, ...prev]);
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
    if ([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE].includes(currentUser.role)) {
      setActiveView("sales-crm");
    }
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

    if ([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.PURCHASE_MANAGER].includes(currentUser.role)) {
      setActiveView("purchase");
    }
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

    if ([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER].includes(currentUser.role)) {
      setActiveView("hr");
    }
  };

  // 2. Sales Billing Invoices triggers Stock Depletion & Ledgers updates
  const handleGenerateInvoice = (
    invoiceId: string,
    customerId: string,
    items: Array<{ productId: string; qty: number; itemType?: "product" | "service" }>,
    customTotalAmount?: number
  ) => {
    // A. Deplete stock ONLY for product lines (services have no stock)
    const productItems = items.filter(i => i.itemType !== "service" && i.productId);
    setBatchStocks(prev => {
      const copy = [...prev];
      productItems.forEach(item => {
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

    // B. Write stock movement log for product lines only
    const invoiceNum = `INV-2026-000${invoices.length + 1}`;
    productItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      const moveLog: StockMovement = {
        id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: item.productId,
        warehouseId: "wh-main",
        type: "OUT",
        source: "SALES",
        referenceId: invoiceNum,
        quantity: item.qty,
        unitPrice: prod?.sellingPrice || 0,
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        remarks: `Auto-depleted from sales invoice - ${invoiceNum}`,
      };
      setStockMovements(prev => [moveLog, ...prev]);
    });

    // C. Increase Customer outstanding billing ledger balance
    const billingTotalCost = customTotalAmount !== undefined ? customTotalAmount : items.reduce((sum, item) => {
      const rate = products.find(p => p.id === item.productId)?.sellingPrice || 0;
      return sum + (item.qty * rate);
    }, 0) * 1.18;

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return { ...c, outstandingBalance: c.outstandingBalance + billingTotalCost };
      }
      return c;
    }));

    // D. Invoice raised — income posts only when payment is recorded (cash basis).
    // No Finance transaction here; just update customer outstanding balance above.

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
            companyId={currentUser.companyId}
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
            userRole={currentUser.role}
            currentUserId={currentUser.id}
          />
        );
      case "purchase":
        return (
          <PurchaseView
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            purchaseOrders={purchaseOrders}
            setPurchaseOrders={setPurchaseOrders}
            vendorBills={vendorBills}
            setVendorBills={setVendorBills}
            products={products}
            warehouses={defaultWarehouses}
            batchStocks={batchStocks}
            userRole={currentUser.role}
            companyId={currentUser.companyId}
            onReceiveGRN={handleReceiveGRN}
            onMarkPOReceived={handleMarkPOReceived}
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
            serviceCatalog={serviceCatalog}
            setServiceCatalog={setServiceCatalog}
            userRole={currentUser.role}
            onGenerateInvoice={handleGenerateInvoice}
            onPaymentRecorded={handlePaymentRecorded}
            salesPayments={salesPayments}
            setSalesPayments={setSalesPayments}
            companyId={currentUser.companyId}
            company={company}
            setCompany={setCompany}
            branchId={currentBranch.id}
            isDemo={!currentUser.id.startsWith("u-client-") && !currentUser.id.startsWith("u-staff-") && currentUser.companyId === "comp-1"}
            autoOpenInvoiceBuilder={quickNewInvoice}
            onAutoOpenHandled={() => setQuickNewInvoice(false)}
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
            companyId={currentUser.companyId || ""}
            onSalaryDisbursed={handleSalaryDisbursed}
          />
        );
      case "finance":
        return (
          <FinanceView
            transactions={transactions}
            setTransactions={setTransactions}
            assets={assets}
            userRole={currentUser.role}
            branchId={currentBranch.id}
            invoices={invoices}
            purchaseOrders={purchaseOrders}
            customers={customers}
            suppliers={suppliers}
            vendorBills={vendorBills}
            salesPayments={salesPayments}
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
            currentUserName={currentUser.name}
          />
        );
      case "gst":
        return (
          <GSTView
            invoices={invoices}
            customers={customers}
            transactions={transactions}
            company={company}
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
      <div className="flex flex-1 flex-col min-h-0">
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
            setActiveView("dashboard");
          }}
          onUpdateCredentials={(userId, newEmail, newPassword) => {
            setUsers(prev => prev.map(u =>
              u.id === userId ? { ...u, email: newEmail, password: newPassword } : u
            ));
            setCurrentUser(prev => ({ ...prev, email: newEmail, password: newPassword }));
          }}
        />

        {/* Dynamic workspace context panel */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-900">
          {renderView()}
        </main>
      </div>

      {/* Floating Quick Action Menu */}
      {currentUser.role !== UserRole.READ_ONLY && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {showQuickActionMenu && (
            <div className="flex flex-col items-end gap-2 mb-2 animate-fadeIn">

              {/* New Invoice */}
              <div className="flex items-center gap-2">
                <span className="bg-slate-950/90 text-[10px] text-slate-200 border border-slate-800 px-2 py-1 rounded-md font-bold shadow-lg uppercase font-mono">New Invoice</span>
                <button
                  onClick={() => { setActiveView("sales-crm"); setQuickNewInvoice(true); setShowQuickActionMenu(false); }}
                  className="h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer"
                  title="New Invoice"
                >
                  <FileText className="h-5 w-5" />
                </button>
              </div>

              {/* Stock Check */}
              <div className="flex items-center gap-2">
                <span className="bg-slate-950/90 text-[10px] text-slate-200 border border-slate-800 px-2 py-1 rounded-md font-bold shadow-lg uppercase font-mono">Stock Check</span>
                <button
                  onClick={() => { setShowStockCheck(true); setStockCheckQuery(""); setShowQuickActionMenu(false); }}
                  className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 cursor-pointer"
                  title="Quick Stock Check"
                >
                  <Clipboard className="h-5 w-5" />
                </button>
              </div>

            </div>
          )}
          <button
            onClick={() => setShowQuickActionMenu(!showQuickActionMenu)}
            className={`h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 text-white cursor-pointer ${showQuickActionMenu ? "bg-rose-600 hover:bg-rose-500 rotate-45" : "bg-indigo-600 hover:bg-indigo-500"}`}
            title="Quick Actions"
          >
            {showQuickActionMenu ? <X className="h-6 w-6" /> : <Zap className="h-6 w-6 animate-pulse" />}
          </button>
        </div>
      )}

      {/* Stock Check popup */}
      {showStockCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowStockCheck(false)}>
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Stock Check</h3>
              <button onClick={() => setShowStockCheck(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4">
              <input
                autoFocus
                value={stockCheckQuery}
                onChange={e => setStockCheckQuery(e.target.value)}
                placeholder="Type product name…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
              <div className="mt-3 max-h-72 overflow-y-auto space-y-1">
                {stockCheckQuery.trim() === "" ? (
                  <p className="text-xs text-slate-500 text-center py-4">Start typing to search products…</p>
                ) : (() => {
                  const q = stockCheckQuery.toLowerCase();
                  const matched = products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 20);
                  if (matched.length === 0) return <p className="text-xs text-slate-500 text-center py-4">No products found</p>;
                  return matched.map(p => {
                    const qty = batchStocks.filter(b => b.productId === p.id).reduce((s, b) => s + b.quantity, 0);
                    return (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div>
                          <div className="text-xs font-semibold text-slate-100">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.description || ""}</div>
                        </div>
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${qty === 0 ? "bg-red-900/50 text-red-300" : qty < (p.minStockLevel || 5) ? "bg-amber-900/50 text-amber-300" : "bg-emerald-900/50 text-emerald-300"}`}>
                          {qty} {p.unit || "nos"}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

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
      <ToastContainer />
    </div>
  );
}

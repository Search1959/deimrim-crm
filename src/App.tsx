/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Shield, FileText, HelpCircle, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
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

  // 2. Sales Billing Invoices triggers Stock Depletion & Ledgers updates
  const handleGenerateInvoice = (
    invoiceId: string, 
    customerId: string, 
    items: Array<{ productId: string; qty: number }>
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
    const billingTotalCost = items.reduce((sum, item) => {
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
            transactions={transactions}
            employees={employees}
            leads={leads}
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
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  formatINR
} from "./types";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  
  // Login Session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    return <HomePage onLogin={(user) => { setCurrentUser(user); setIsLoggedIn(true); }} usersList={users} />;
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

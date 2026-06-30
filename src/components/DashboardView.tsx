/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { toast } from "../utils/toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Wallet,
  DollarSign,
  Percent, 
  AlertTriangle, 
  Users, 
  Calendar, 
  ListTodo, 
  CheckCircle, 
  EyeOff, 
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MessageSquare,
  Sparkles,
  Clock,
  X
} from "lucide-react";
import { 
  Product, 
  BatchStock, 
  Invoice, 
  PurchaseOrder, 
  Transaction, 
  Employee, 
  Lead,
  formatINR,
  User,
  Company,
  UserRole,
  LeaveRequest,
  Supplier
} from "../types";

interface DashboardViewProps {
  products: Product[];
  batchStocks: BatchStock[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  transactions: Transaction[];
  employees: Employee[];
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  suppliers: Supplier[];
  onNavigate: (view: string) => void;
  currentUser: User;
  company: Company;
}

export default function DashboardView({
  products,
  batchStocks,
  invoices,
  purchaseOrders,
  setPurchaseOrders,
  transactions,
  employees,
  leads,
  setLeads,
  leaveRequests,
  setLeaveRequests,
  suppliers,
  onNavigate,
  currentUser,
  company,
}: DashboardViewProps) {
  const [showConfig, setShowConfig] = useState(false);
  
  // Quick Action menu and modal state
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [activeQuickActionModal, setActiveQuickActionModal] = useState<"lead" | "po" | "leave" | null>(null);

  // 1. Add Lead form states
  const [leadTitle, setLeadTitle] = useState("");
  const [leadCompany, setLeadCompany] = useState("");
  const [leadSource, setLeadSource] = useState("Website");
  const [leadStatus, setLeadStatus] = useState<Lead["status"]>("New");
  const [leadValue, setLeadValue] = useState("");
  const [leadNotes, setLeadNotes] = useState("");

  // 2. Create PO form states
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [poDeliveryDate, setPoDeliveryDate] = useState("");
  const [poRemarks, setPoRemarks] = useState("");

  // 3. Request Leave form states
  const [leaveEmployeeId, setLeaveEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveRequest["leaveType"]>("annual");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const handleQuickAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadTitle.trim()) {
      toast.error("Lead title is required"); return;
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      companyId: company?.id || "comp-1",
      name: leadTitle,
      companyName: leadCompany,
      email: `${leadTitle.toLowerCase().replace(/\s+/g, "") || "contact"}@example.com`,
      phone: "+91 98300 00000",
      status: leadStatus,
      source: leadSource,
      assignedTo: "Kolkata Sales Node",
      notes: leadNotes ? `${leadNotes} | Est. Value: ₹${leadValue}` : `Est. Value: ₹${leadValue}`,
      lastContacted: new Date().toISOString().split("T")[0]
    };

    setLeads(prev => [newLead, ...prev]);
    setActiveQuickActionModal(null);
    setLeadTitle("");
    setLeadCompany("");
    setLeadSource("Website");
    setLeadStatus("New");
    setLeadValue("");
    setLeadNotes("");
    toast.success("Lead Added", `"${leadTitle}" saved to CRM pipeline`);
  };

  const handleQuickCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      toast.error("Please select a vendor/supplier"); return;
      return;
    }
    if (!poAmount || Number(poAmount) <= 0) {
      toast.error("Enter a valid PO amount"); return;
      return;
    }

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-000${purchaseOrders.length + 1}`,
      supplierId: poSupplierId,
      branchId: "br-hq",
      items: [
        { productId: products[0]?.id || "prod-1", quantity: 1, unitPrice: Number(poAmount), receivedQuantity: 0 }
      ],
      totalAmount: Number(poAmount),
      status: "draft",
      paymentStatus: "unpaid",
      deliveryDate: poDeliveryDate || undefined,
      remarks: poRemarks || "Quick action created PO",
      createdAt: new Date().toISOString()
    };

    // Save in LocalStorage as well to sync since OrdersPanel loads independently
    const companyId = currentUser.companyId || "comp-1";
    try {
      const stored = localStorage.getItem(`deinrim_purchaseOrders_${companyId}`);
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem(`deinrim_purchaseOrders_${companyId}`, JSON.stringify([newPO, ...list]));
    } catch (err) {
      console.error(err);
    }

    setPurchaseOrders(prev => [newPO, ...prev]);
    setActiveQuickActionModal(null);
    setPoSupplierId("");
    setPoAmount("");
    setPoDeliveryDate("");
    setPoRemarks("");
    toast.success("Purchase Order Created", `${newPO.poNumber} saved as draft`);
  };

  const handleQuickRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmployeeId) {
      toast.error("Please select an employee"); return;
      return;
    }
    if (!leaveStartDate || !leaveEndDate) {
      toast.error("Please specify start and end dates"); return;
      return;
    }

    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: leaveEmployeeId,
      leaveType: leaveType,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      status: "pending"
    };

    setLeaveRequests(prev => [newLeave, ...prev]);
    setActiveQuickActionModal(null);
    setLeaveEmployeeId("");
    setLeaveType("annual");
    setLeaveStartDate("");
    setLeaveEndDate("");
    setLeaveReason("");
    toast.success("Leave Request Submitted", "Pending approval from HR manager");
  };
  
  // Widget customization states
  const [enabledWidgets, setEnabledWidgets] = useState<Record<string, boolean>>({
    sales: true,
    purchases: true,
    expenses: true,
    revenue: true,
    profit: true,
    pendingPay: true,
    lowStock: true,
    negativeStock: true,
    attendance: true,
    followups: true,
  });

  // Calculate Metrics
  const totalSalesVal = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPurchaseVal = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  
  const todayExpenses = transactions
    .filter(t => t.type === "EXPENSE" && (t.date === "2026-06-01" || t.date === "2026-05-30"))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseSum = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalRevenue - totalExpenseSum;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const pendingPaymentsSum = invoices
    .filter(inv => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Compute stock levels per product
  const productStockMap = products.reduce((acc, p) => {
    const qty = batchStocks
      .filter(bs => bs.productId === p.id)
      .reduce((s, bs) => s + bs.quantity, 0);
    acc[p.id] = qty;
    return acc;
  }, {} as Record<string, number>);

  const lowStockProducts = products.filter(p => {
    const currentStock = productStockMap[p.id] || 0;
    return currentStock <= p.minStockLevel;
  });

  const negativeStockProducts = products.filter(p => {
    const currentStock = productStockMap[p.id] || 0;
    return currentStock < 0;
  });

  const activeLeadsFollowups = leads.filter(l => l.status !== "Won" && l.status !== "Lost");

  // Build last-6-months revenue vs expense chart data from transactions
  const revenueChartData = useMemo(() => {
    const months: Record<string, { month: string; Revenue: number; Expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      months[key] = { month: label, Revenue: 0, Expenses: 0 };
    }
    transactions.forEach(t => {
      const key = t.date?.slice(0, 7);
      if (key && months[key]) {
        if (t.type === "INCOME") months[key].Revenue += t.amount;
        else months[key].Expenses += t.amount;
      }
    });
    return Object.values(months);
  }, [transactions]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Welcome Bar with customization toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                Root System Admin Access
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold uppercase tracking-wider">
                Client Tenant Access
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-mono font-semibold">User: {currentUser?.name} ({currentUser?.role})</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {currentUser?.role === UserRole.SYSTEM_ADMIN ? "System Administrator Control Center" : "Executive Enterprise Dashboard"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentUser?.role === UserRole.SYSTEM_ADMIN 
              ? "Global operational overview of enterprise databases, registered tenant nodes, and administrative activity streams." 
              : "Real-time dynamic business intelligence, custom inventory counts, CRM pipelines, and financial ledgers."}
          </p>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors self-start"
        >
          <SlidersHorizontal className="h-4 w-4 text-gray-500" />
          <span>Customize Widgets</span>
        </button>
      </div>

      {/* Dynamic Dashboard Hero Card tailored for System Admin vs Client */}
      {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-xl p-5 border border-indigo-500/10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>🛡️ Global Operations Node Operational</span>
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
                Logged in as root system administrator. You have unrestricted access to oversee global business nodes, provision and review clean tenant client workspaces, inspect double-entry journals, and audit operations history.
              </p>
            </div>
            <div className="flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate("admin")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                Provision Client Tenant
              </button>
              <button
                type="button"
                onClick={() => onNavigate("admin")}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-700 transition-all cursor-pointer"
              >
                RBAC Permissions
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white rounded-xl p-5 border border-indigo-500/10 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-extrabold uppercase tracking-widest border border-emerald-500/30">
                  🏢 Whitelabel Active Workspace
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-semibold">Tenant Code: {company?.code || "OMS"}</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-1">
                Welcome to {company?.name || "Client Workspace"}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl font-normal leading-relaxed">
                Your whitelabel business suite is active. Double-entry accounts, supplier registries, custom employee files, and batch locations are isolated inside your clean workspace container. Standard monthly charge flat ₹500/month.
              </p>
            </div>
            <div className="flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate("sales-crm")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
              >
                + Issue Invoice
              </button>
              <button
                type="button"
                onClick={() => onNavigate("inventory")}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-lg border border-slate-700 transition-all cursor-pointer"
              >
                Check Inventory Stocks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Customization Panel */}
      {showConfig && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-3">Configure Active Dashboard Components</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.keys(enabledWidgets).map((widgetKey) => (
              <label key={widgetKey} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledWidgets[widgetKey]}
                  onChange={(e) => setEnabledWidgets(prev => ({ ...prev, [widgetKey]: e.target.checked }))}
                  className="rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="capitalize">{widgetKey.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Sales */}
        {enabledWidgets.sales && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs hover:border-indigo-100 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Sales Invoiced</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-bold text-gray-900 font-mono">{formatINR(totalSalesVal)}</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>+12.4% vs last month</span>
              </div>
            </div>
          </div>
        )}

        {/* Purchases */}
        {enabledWidgets.purchases && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs hover:border-indigo-100 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Orders</span>
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-bold text-gray-900 font-mono">{formatINR(totalPurchaseVal)}</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>-2.1% logistics delay</span>
              </div>
            </div>
          </div>
        )}

        {/* Expenses */}
        {enabledWidgets.expenses && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs hover:border-indigo-100 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Outflows</span>
              <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-bold text-gray-900 font-mono">{formatINR(totalExpenseSum)}</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Payroll & COGS bound</span>
              </div>
            </div>
          </div>
        )}

        {/* Revenue */}
        {enabledWidgets.revenue && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs hover:border-indigo-100 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Cash Revenue</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-bold text-gray-900 font-mono">{formatINR(totalRevenue)}</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Settlements cleared</span>
              </div>
            </div>
          </div>
        )}

        {/* Profit */}
        {enabledWidgets.profit && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs hover:border-indigo-100 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Profit Margin</span>
              <div className="rounded-lg bg-teal-50 p-2 text-teal-600">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-bold text-gray-900 font-mono">{profitMargin.toFixed(1)}%</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-teal-600">
                <span>Value: {formatINR(netProfit)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments */}
        {enabledWidgets.pendingPay && (
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs hover:border-indigo-100 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Receivables</span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <span className="text-lg font-bold text-gray-900 font-mono">{formatINR(pendingPaymentsSum)}</span>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                <span>Invoices pending payment</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Operational Alerts & Status row */}
      {/* Revenue vs Expenses — 6-Month Trend Chart */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue vs Expenses</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Last 6 months financial flow</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-600"><span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" />Revenue</span>
            <span className="flex items-center gap-1.5 text-rose-500"><span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />Expenses</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.10} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              formatter={(val: number) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }}
              labelStyle={{ color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}
            />
            <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradRevenue)" dot={{ r: 3, fill: "#6366f1" }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gradExpenses)" dot={{ r: 3, fill: "#f43f5e" }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low / Negative Stock Widget */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-gray-50 pb-2.5">Stock Integrity Alarms</h3>
          
          <div className="mt-4 flex gap-4">
            {enabledWidgets.lowStock && (
              <button
                onClick={() => onNavigate("inventory")}
                className="flex-1 rounded-lg border border-amber-100 bg-amber-50/30 p-3.5 text-center hover:bg-amber-50/60 transition-colors cursor-pointer"
              >
                <AlertTriangle className="mx-auto h-6 w-6 text-amber-500" />
                <span className="mt-2 block text-2xl font-bold text-slate-950 font-mono">{lowStockProducts.length}</span>
                <span className="mt-1 block text-[10px] font-bold text-amber-800 uppercase tracking-wider">Low Stock SKUs</span>
              </button>
            )}

            {enabledWidgets.negativeStock && (
              <button
                onClick={() => onNavigate("inventory")}
                className="flex-1 rounded-lg border border-red-100 bg-red-50/30 p-3.5 text-center hover:bg-red-50/60 transition-colors cursor-pointer"
              >
                <AlertTriangle className="mx-auto h-6 w-6 text-red-500" />
                <span className="mt-2 block text-2xl font-bold text-slate-950 font-mono">{negativeStockProducts.length}</span>
                <span className="mt-1 block text-[10px] font-bold text-red-800 uppercase tracking-wider">Negative Stock</span>
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Triggered Alert Items</span>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-emerald-600 font-medium">No low-stock events registered.</p>
            ) : (
              lowStockProducts.slice(0, 2).map(p => {
                const stockQty = productStockMap[p.id] || 0;
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg border border-gray-100/50">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{p.name}</span>
                    <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-bold">
                      {stockQty} / {p.minStockLevel} {p.unit}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* HR & CRM Indicators */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-gray-50 pb-2.5">Staff & Lead Conversions</h3>
          <div className="mt-4 space-y-4">
            {enabledWidgets.attendance && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600 flex items-center gap-1">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <span>Employee Attendance</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800">{employees.length} / {employees.length} Present</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: employees.length > 0 ? "100%" : "0%" }}></div>
                </div>
              </div>
            )}

            {enabledWidgets.followups && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span>Active CRM Leads Pipeline</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700">{activeLeadsFollowups.length} Open</span>
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-1 text-center text-[9px] font-bold">
                  <div className="bg-blue-50 text-blue-800 p-1 rounded-sm">New (1)</div>
                  <div className="bg-amber-50 text-amber-800 p-1 rounded-sm">Contact (1)</div>
                  <div className="bg-indigo-50 text-indigo-800 p-1 rounded-sm">Proposal (1)</div>
                  <div className="bg-emerald-50 text-emerald-800 p-1 rounded-sm">Won (0)</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks & Direct Link */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-gray-50 pb-2.5">Active Office Agenda</h3>
            <div className="mt-3.5 space-y-2.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="line-through opacity-60">Prepare Q2 supplier review sheets</span>
              </div>
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Verify received GRN for R750 server nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Process payroll allocations for month ending</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("architecture")}
            className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-50 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <span>Review System Specs & API Guides</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Interactive SVG Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Outflow SVG Graph */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Cash Flow Trendlines</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Vector representation of historic cash flow metrics.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600"></span>
                <span>Revenue</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                <span>Expenses</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex h-48 w-full items-end justify-between px-2 border-b border-l border-gray-100 relative">
            {/* Grid Line Overlay */}
            <div className="absolute top-1/4 left-0 w-full border-t border-gray-100/60 border-dashed"></div>
            <div className="absolute top-2/4 left-0 w-full border-t border-gray-100/60 border-dashed"></div>
            <div className="absolute top-3/4 left-0 w-full border-t border-gray-100/60 border-dashed"></div>

            {/* Simulated Bar Charts representing March, April, May, June */}
            {[
              { month: "Mar", revenue: 15, expenses: 8 },
              { month: "Apr", revenue: 25, expenses: 14 },
              { month: "May", revenue: 45, expenses: 25 },
              { month: "Jun", revenue: 75, expenses: 40 },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                <div className="flex items-end gap-1.5 w-full justify-center h-32">
                  <div 
                    className="w-4 rounded-t-xs bg-indigo-600 transition-all duration-500" 
                    style={{ height: `${bar.revenue}%` }}
                    title={`Revenue: ₹${bar.revenue * 100}K`}
                  ></div>
                  <div 
                    className="w-4 rounded-t-xs bg-rose-500 transition-all duration-500" 
                    style={{ height: `${bar.expenses}%` }}
                    title={`Expenses: ₹${bar.expenses * 100}K`}
                  ></div>
                </div>
                <span className="text-[10px] font-semibold text-gray-500">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Category Wise Stock distribution */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="border-b border-gray-50 pb-2.5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Inventory Valuation Share</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Asset capital valuation divided by catalogue categories.</p>
          </div>

          <div className="mt-4 flex flex-col md:flex-row items-center gap-6">
            {/* Simulated Pie / Donut SVG Segment */}
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full rotate-270" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="45 100" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="25 100" strokeDashoffset="-45" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-70" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e11d48" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset="-90" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-sm font-extrabold text-slate-900 font-mono">₹64.2L</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Valuation</span>
              </div>
            </div>

            {/* Category breakdown key values */}
            <div className="flex-1 space-y-2 w-full text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500"></span>
                  <span className="font-medium text-gray-600">Enterprise Servers</span>
                </div>
                <span className="font-bold text-slate-800">45% (₹28.8L)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-orange-500"></span>
                  <span className="font-medium text-gray-600">Workstations</span>
                </div>
                <span className="font-bold text-slate-800">25% (₹16.0L)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-sky-500"></span>
                  <span className="font-medium text-gray-600">IoT Equipment</span>
                </div>
                <span className="font-bold text-slate-800">20% (₹12.8L)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-rose-500"></span>
                  <span className="font-medium text-gray-600">Office Infrastructure</span>
                </div>
                <span className="font-bold text-slate-800">10% (₹6.4L)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* QUICK ACTIONS FLOATING MENU (BOTTOM RIGHT) */}
      {/* ========================================== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="quick-action-floating-container">
        {/* Expanded Quick Action Popover */}
        {quickMenuOpen && (
          <div className="flex flex-col gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-xl w-56 animate-in slide-in-from-bottom-2 duration-200">
            <div className="border-b border-slate-800 pb-2 px-1 mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block">Quick Actions</span>
            </div>
            
            <button
              onClick={() => {
                setActiveQuickActionModal("lead");
                setQuickMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <MessageSquare className="h-4 w-4 shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 leading-tight">Add Lead</span>
                <span className="text-[9px] text-slate-400 leading-none mt-0.5">Register sales enquiry</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveQuickActionModal("po");
                setQuickMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <ShoppingBag className="h-4 w-4 shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 leading-tight">Create PO</span>
                <span className="text-[9px] text-slate-400 leading-none mt-0.5">Issue procurement order</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveQuickActionModal("leave");
                setQuickMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <Clock className="h-4 w-4 shrink-0" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-100 leading-tight">Request Leave</span>
                <span className="text-[9px] text-slate-400 leading-none mt-0.5">Apply for employee timeoff</span>
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setQuickMenuOpen(!quickMenuOpen)}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer border ${
            quickMenuOpen 
              ? "bg-slate-800 border-slate-700 text-slate-300" 
              : "bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20 hover:shadow-indigo-600/40"
          }`}
          title="Quick Actions Menu"
        >
          {quickMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* ========================================== */}
      {/* QUICK ACTION MODALS                        */}
      {/* ========================================== */}

      {/* 1. Add Lead Modal */}
      {activeQuickActionModal === "lead" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Add Lead</h3>
              </div>
              <button 
                onClick={() => setActiveQuickActionModal(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Lead Title / Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe, Cloud Architect"
                  value={leadTitle}
                  onChange={(e) => setLeadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Company Name</label>
                <input
                  type="text"
                  placeholder="Acme Tech Solutions"
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Lead Source</label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Campaign">Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Status</label>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Estimated Pipeline Value (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Detailed Notes</label>
                <textarea
                  placeholder="Additional context or requirements..."
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveQuickActionModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Save Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Purchase Order Modal */}
      {activeQuickActionModal === "po" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Quick Create PO</h3>
              </div>
              <button 
                onClick={() => setActiveQuickActionModal(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Approved Vendor / Supplier *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                >
                  <option value="">-- Select Vendor --</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.code})
                    </option>
                  ))}
                  {suppliers.length === 0 && (
                    <option value="sup-1">Mock Vendor Ltd (sup-1)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Total Amount / Value (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 75000"
                  value={poAmount}
                  onChange={(e) => setPoAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Expected Delivery Date</label>
                <input
                  type="date"
                  value={poDeliveryDate}
                  onChange={(e) => setPoDeliveryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Remarks & Terms</label>
                <textarea
                  placeholder="Regular deployment inventory. Net 30 payment terms."
                  value={poRemarks}
                  onChange={(e) => setPoRemarks(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveQuickActionModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Issue draft PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Request Leave Modal */}
      {activeQuickActionModal === "leave" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Request Leave</h3>
              </div>
              <button 
                onClick={() => setActiveQuickActionModal(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleQuickRequestLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Employee Name *</label>
                <select
                  required
                  value={leaveEmployeeId}
                  onChange={(e) => setLeaveEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="unpaid">Loss of Pay / Unpaid</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">End Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Reason / Description</label>
                <textarea
                  placeholder="State reason for leave request..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveQuickActionModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Submit Leave Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

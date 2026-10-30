/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { toast } from "../utils/toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Wallet,
  DollarSign,
  Percent,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Plus,
  MessageSquare,
  Sparkles,
  Clock,
  X,
  CheckCircle,
  FileText,
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
    if (!leadTitle.trim()) { toast.error("Lead title is required"); return; }
    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      companyId: company?.id || "",
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
    setLeadTitle(""); setLeadCompany(""); setLeadSource("Website"); setLeadStatus("New"); setLeadValue(""); setLeadNotes("");
    toast.success("Lead Added", `"${leadTitle}" saved to CRM pipeline`);
  };

  const handleQuickCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) { toast.error("Please select a vendor/supplier"); return; }
    if (!poAmount || Number(poAmount) <= 0) { toast.error("Enter a valid PO amount"); return; }
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, "0")}`,
      supplierId: poSupplierId,
      branchId: "br-hq",
      items: [{ productId: products[0]?.id || "prod-1", quantity: 1, unitPrice: Number(poAmount), receivedQuantity: 0 }],
      totalAmount: Number(poAmount),
      status: "draft",
      paymentStatus: "unpaid",
      deliveryDate: poDeliveryDate || undefined,
      remarks: poRemarks || "Quick action created PO",
      createdAt: new Date().toISOString()
    };
    const companyId = currentUser.companyId || "";
    try {
      const stored = localStorage.getItem(`deinrim_purchaseOrders_${companyId}`);
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem(`deinrim_purchaseOrders_${companyId}`, JSON.stringify([newPO, ...list]));
    } catch (err) { console.error(err); }
    setPurchaseOrders(prev => [newPO, ...prev]);
    setActiveQuickActionModal(null);
    setPoSupplierId(""); setPoAmount(""); setPoDeliveryDate(""); setPoRemarks("");
    toast.success("Purchase Order Created", `${newPO.poNumber} saved as draft`);
  };

  const handleQuickRequestLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveEmployeeId) { toast.error("Please select an employee"); return; }
    if (!leaveStartDate || !leaveEndDate) { toast.error("Please specify start and end dates"); return; }
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
    setLeaveEmployeeId(""); setLeaveType("annual"); setLeaveStartDate(""); setLeaveEndDate(""); setLeaveReason("");
    toast.success("Leave Request Submitted", "Pending approval from HR manager");
  };

  // Metrics
  const totalSalesVal = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPurchaseVal = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalRevenue = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseSum = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalRevenue - totalExpenseSum;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const pendingPaymentsSum = invoices.filter(inv => inv.status !== "paid").reduce((sum, inv) => sum + inv.totalAmount, 0);

  const productStockMap = products.reduce((acc, p) => {
    acc[p.id] = batchStocks.filter(bs => bs.productId === p.id).reduce((s, bs) => s + bs.quantity, 0);
    return acc;
  }, {} as Record<string, number>);

  const lowStockProducts = products.filter(p => (productStockMap[p.id] || 0) <= p.minStockLevel);
  const activeLeadsFollowups = leads.filter(l => l.status !== "Won" && l.status !== "Lost");

  const revenueChartData = useMemo(() => {
    const months: Record<string, { month: string; Revenue: number; Expenses: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { month: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }), Revenue: 0, Expenses: 0 };
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

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const KPI_CARDS = [
    { label: "TOTAL SALES", value: formatINR(totalSalesVal), sub: `${invoices.length} invoices issued`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", accent: "bg-indigo-500" },
    { label: "PURCHASE ORDERS", value: formatINR(totalPurchaseVal), sub: `${purchaseOrders.length} orders placed`, icon: ShoppingBag, color: "text-amber-600", bg: "bg-amber-50", accent: "bg-amber-500" },
    { label: "NET REVENUE", value: formatINR(totalRevenue), sub: "Cash settlements cleared", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", accent: "bg-emerald-500" },
    { label: "TOTAL OUTFLOWS", value: formatINR(totalExpenseSum), sub: "Payroll & COGS bound", icon: Wallet, color: "text-rose-600", bg: "bg-rose-50", accent: "bg-rose-500" },
    { label: "PROFIT MARGIN", value: `${profitMargin.toFixed(1)}%`, sub: formatINR(netProfit) + " net profit", icon: Percent, color: "text-teal-600", bg: "bg-teal-50", accent: "bg-teal-500" },
    { label: "PENDING RECEIVABLES", value: formatINR(pendingPaymentsSum), sub: `${invoices.filter(i => i.status !== "paid").length} invoices unpaid`, icon: AlertTriangle, color: "text-violet-600", bg: "bg-violet-50", accent: "bg-violet-500" },
  ];

  const LEAD_STATUS_COLORS: Record<string, string> = {
    New: "bg-blue-100 text-blue-700",
    Contacted: "bg-amber-100 text-amber-700",
    Qualified: "bg-indigo-100 text-indigo-700",
    Proposal: "bg-violet-100 text-violet-700",
    Negotiation: "bg-orange-100 text-orange-700",
    Won: "bg-emerald-100 text-emerald-700",
    Lost: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-5 p-6 text-left">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-slate-400 mb-1">{today}</p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {currentUser?.role === UserRole.SYSTEM_ADMIN ? "System Control Center" : "Executive Dashboard"}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-wide">System Admin</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase tracking-wide">{company?.code || "OMS"} Workspace</span>
            )}
            <span className="text-[10px] text-slate-400">{currentUser?.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveQuickActionModal("lead")}
            className="flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-slate-500" /> New Lead
          </button>
          <button
            onClick={() => onNavigate("sales-crm")}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Issue Invoice
          </button>
        </div>
      </div>

      {/* Workspace Info Strip */}
      {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
        <div className="bg-rose-50 border border-rose-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900">Global Operations Node — Active</p>
              <p className="text-xs text-rose-400 mt-0.5">Root admin · provision workspaces, audit journals, manage RBAC</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onNavigate("admin")} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">Provision Tenant</button>
            <button onClick={() => onNavigate("admin")} className="bg-white border border-rose-200 text-rose-700 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-rose-50 transition-colors">RBAC Permissions</button>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">{company?.name || "Client Workspace"}</p>
              <p className="text-xs text-indigo-400 mt-0.5">Active workspace · accounts, inventory, HR and CRM isolated</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-5 mr-2">
            <div className="text-center">
              <p className="text-sm font-black text-indigo-700">{invoices.length}</p>
              <p className="text-[9px] text-indigo-400 uppercase tracking-wide font-semibold">Invoices</p>
            </div>
            <div className="w-px h-6 bg-indigo-200" />
            <div className="text-center">
              <p className="text-sm font-black text-indigo-700">{employees.length}</p>
              <p className="text-[9px] text-indigo-400 uppercase tracking-wide font-semibold">Staff</p>
            </div>
            <div className="w-px h-6 bg-indigo-200" />
            <div className="text-center">
              <p className="text-sm font-black text-indigo-700">{products.length}</p>
              <p className="text-[9px] text-indigo-400 uppercase tracking-wide font-semibold">Products</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onNavigate("inventory")} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-indigo-50 transition-colors">Check Stocks</button>
          </div>
        </div>
      )}

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition-all">
            <div className={`h-[3px] w-full ${kpi.accent}`} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{kpi.label}</span>
                <div className={`${kpi.bg} p-1.5 rounded-lg shrink-0`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              </div>
              <p className="text-xl font-black text-slate-900 leading-none">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-column layout */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Left 3/5: Revenue Chart + Recent Invoices + Active Leads */}
        <div className="lg:col-span-3 space-y-4">

          {/* Revenue vs Expenses Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Revenue vs Expenses</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Last 6 months financial flow</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
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
                <YAxis tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={52} />
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

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Recent Invoices</h3>
              <button onClick={() => onNavigate("sales-crm")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">All invoices</button>
            </div>
            {invoices.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-5 text-sm text-slate-400">
                <FileText className="h-4 w-4" /><span>No invoices yet. Issue your first invoice.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {invoices.slice(0, 5).map(inv => {
                  const statusColor = inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : inv.status === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
                  return (
                    <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{inv.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{inv.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-800">{formatINR(inv.totalAmount)}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize ${statusColor}`}>{inv.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active CRM Leads */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Active Pipeline</h3>
              <button onClick={() => onNavigate("sales-crm")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">CRM view</button>
            </div>
            {activeLeadsFollowups.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-5 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" /><span>No open leads — add a lead to get started.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeLeadsFollowups.slice(0, 4).map(lead => {
                  const initials = lead.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={lead.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{lead.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{lead.companyName || lead.source || "—"}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${LEAD_STATUS_COLORS[lead.status] || "bg-slate-100 text-slate-600"}`}>{lead.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 2/5: Quick Actions + Stock Alerts + Staff */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveQuickActionModal("lead")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Add Lead</p>
                  <p className="text-[10px] text-slate-400">Register sales enquiry in CRM</p>
                </div>
              </button>
              <button
                onClick={() => setActiveQuickActionModal("po")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-amber-50 hover:border-amber-100 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100">
                  <ShoppingBag className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Create Purchase Order</p>
                  <p className="text-[10px] text-slate-400">Issue procurement draft PO</p>
                </div>
              </button>
              <button
                onClick={() => setActiveQuickActionModal("leave")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 hover:bg-rose-50 hover:border-rose-100 transition-colors text-left group"
              >
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0 group-hover:bg-rose-100">
                  <Clock className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Request Leave</p>
                  <p className="text-[10px] text-slate-400">Apply for employee time-off</p>
                </div>
              </button>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Stock Alerts</h3>
              <button onClick={() => onNavigate("inventory")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Inventory</button>
            </div>
            <div className="px-4 py-3">
              <div className="flex gap-3 mb-3">
                <button onClick={() => onNavigate("inventory")} className="flex-1 bg-amber-50 rounded-lg p-2.5 text-center border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer">
                  <p className="text-xl font-black text-amber-700">{lowStockProducts.length}</p>
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">Low Stock</p>
                </button>
                <button onClick={() => onNavigate("inventory")} className="flex-1 bg-red-50 rounded-lg p-2.5 text-center border border-red-100 hover:bg-red-100 transition-colors cursor-pointer">
                  <p className="text-xl font-black text-red-700">{products.filter(p => (productStockMap[p.id] || 0) < 0).length}</p>
                  <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mt-0.5">Negative</p>
                </button>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">All products in healthy stock.</p>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map(p => {
                    const qty = productStockMap[p.id] || 0;
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">{p.name}</p>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">{qty} / {p.minStockLevel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Staff & HR Overview */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Staff Overview</h3>
              <button onClick={() => onNavigate("hr")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">HR module</button>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-600">Total Employees</span>
                </div>
                <span className="text-sm font-black text-slate-800">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-600">Leave Approvals</span>
                </div>
                <span className="text-sm font-black text-amber-600">{leaveRequests.filter(l => l.status === "pending").length} pending</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-600">Open Leads</span>
                </div>
                <span className="text-sm font-black text-emerald-600">{activeLeadsFollowups.length}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* Add Lead Modal */}
      {activeQuickActionModal === "lead" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Add Lead</h3>
              </div>
              <button onClick={() => setActiveQuickActionModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleQuickAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lead Title / Contact Name *</label>
                <input type="text" required placeholder="John Doe, Cloud Architect" value={leadTitle} onChange={e => setLeadTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Company Name</label>
                <input type="text" placeholder="Acme Tech Solutions" value={leadCompany} onChange={e => setLeadCompany(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Source</label>
                  <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    <option>Website</option><option>Referral</option><option>LinkedIn</option><option>Cold Call</option><option>Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select value={leadStatus} onChange={e => setLeadStatus(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                    <option>New</option><option>Contacted</option><option>Qualified</option><option>Proposal</option><option>Negotiation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Est. Value (₹)</label>
                <input type="number" placeholder="e.g. 150000" value={leadValue} onChange={e => setLeadValue(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                <textarea placeholder="Additional context..." value={leadNotes} onChange={e => setLeadNotes(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setActiveQuickActionModal(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {activeQuickActionModal === "po" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Create Purchase Order</h3>
              </div>
              <button onClick={() => setActiveQuickActionModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleQuickCreatePO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vendor / Supplier *</label>
                <select required value={poSupplierId} onChange={e => setPoSupplierId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="">-- Select Vendor --</option>
                  {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name} ({sup.code})</option>)}
                  {suppliers.length === 0 && <option value="sup-1">Mock Vendor Ltd</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total Amount (₹) *</label>
                <input type="number" required placeholder="e.g. 75000" value={poAmount} onChange={e => setPoAmount(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Delivery Date</label>
                <input type="date" value={poDeliveryDate} onChange={e => setPoDeliveryDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                <textarea placeholder="Net 30 payment terms..." value={poRemarks} onChange={e => setPoRemarks(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setActiveQuickActionModal(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> Issue Draft PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Leave Modal */}
      {activeQuickActionModal === "leave" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Request Leave</h3>
              </div>
              <button onClick={() => setActiveQuickActionModal(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleQuickRequestLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee *</label>
                <select required value={leaveEmployeeId} onChange={e => setLeaveEmployeeId(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Type</label>
                <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="unpaid">Loss of Pay / Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date *</label>
                  <input type="date" required value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date *</label>
                  <input type="date" required value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
                <textarea placeholder="State reason for leave..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setActiveQuickActionModal(null)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg py-2 text-sm font-semibold">
                  <Sparkles className="h-3.5 w-3.5" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

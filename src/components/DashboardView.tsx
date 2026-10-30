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

  // ── dark card style helpers ──────────────────────────────────────────────
  const DC = "rounded-xl border" as const;
  const dcStyle = { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" };
  const dcHdr = { borderColor: "rgba(255,255,255,0.07)" };

  return (
    <div className="space-y-5 p-5 text-left" style={{ background: "#070d1a", minHeight: "100%" }}>

      {/* ── TOP BAR ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: "#475569" }}>
            {today} &nbsp;·&nbsp; {currentUser?.role === UserRole.SYSTEM_ADMIN ? "SYS-ADMIN" : `REF: ${company?.code || "OMS"}-HQ`}
          </p>
          <h1 className="text-2xl font-black tracking-tight leading-none" style={{ color: "#ffffff" }}>
            {currentUser?.role === UserRole.SYSTEM_ADMIN ? "System Control Center" : "Executive Dashboard"}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setActiveQuickActionModal("lead")} className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer border" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", color: "#cbd5e1" }}>
            <MessageSquare className="h-3.5 w-3.5" /> New Lead
          </button>
          <button onClick={() => onNavigate("sales-crm")} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer" style={{ background: "linear-gradient(to right,#6366f1,#7c3aed)", color: "#ffffff" }}>
            <Plus className="h-3.5 w-3.5" /> Issue Invoice
          </button>
        </div>
      </div>

      {/* ── TENANT PROFILE STRIP ── */}
      {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
        <div className={`${DC} px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`} style={{ background: "rgba(239,68,68,0.07)", borderColor: "rgba(239,68,68,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
              <Sparkles className="h-4 w-4" style={{ color: "#f87171" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#fca5a5" }}>Global Operations Node — Active</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Root admin · provision workspaces, audit journals, manage RBAC</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onNavigate("admin")} className="text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer" style={{ background: "#ef4444", color: "#fff" }}>Provision Tenant</button>
            <button onClick={() => onNavigate("admin")} className="text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer border" style={{ borderColor: "rgba(239,68,68,0.3)", color: "#f87171", background: "transparent" }}>RBAC Permissions</button>
          </div>
        </div>
      ) : (
        <div className={`${DC} px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`} style={{ background: "rgba(99,102,241,0.07)", borderColor: "rgba(99,102,241,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.15)" }}>
              <Sparkles className="h-4 w-4" style={{ color: "#818cf8" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{company?.name || "Client Workspace"}</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>Verified Tenant</span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Active workspace · accounts, inventory, HR and CRM isolated</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-5 mr-2">
            {[{ val: invoices.length, lbl: "INVOICES" }, { val: employees.length, lbl: "STAFF" }, { val: products.length, lbl: "PRODUCTS" }].map((s, i) => (
              <React.Fragment key={s.lbl}>
                {i > 0 && <div className="w-px h-6" style={{ background: "rgba(99,102,241,0.3)" }} />}
                <div className="text-center">
                  <p className="text-sm font-black" style={{ color: "#818cf8" }}>{s.val}</p>
                  <p className="text-[9px] uppercase tracking-wide font-bold" style={{ color: "#4f46e5" }}>{s.lbl}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <button onClick={() => onNavigate("inventory")} className="text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer border shrink-0" style={{ borderColor: "rgba(99,102,241,0.3)", color: "#818cf8", background: "rgba(99,102,241,0.08)" }}>Check Stocks</button>
        </div>
      )}

      {/* ── 6 KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className={`${DC} overflow-hidden hover:border-indigo-500/30 transition-all`} style={dcStyle}>
            <div className={`h-[3px] w-full ${kpi.accent}`} />
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[9px] font-bold uppercase tracking-wide leading-tight" style={{ color: "#475569" }}>{kpi.label}</span>
                <div className="p-1.5 rounded-lg shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
              </div>
              <p className="text-xl font-black leading-none" style={{ color: "#ffffff" }}>{kpi.value}</p>
              <p className="text-[10px] mt-1.5 leading-snug" style={{ color: "#475569" }}>{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN 2-COL LAYOUT ── */}
      <div className="grid lg:grid-cols-5 gap-4">

        {/* LEFT 3/5 — Chart + Transactions */}
        <div className="lg:col-span-3 space-y-4">

          {/* Revenue vs Expenses Chart */}
          <div className={`${DC} p-5`} style={dcStyle}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Revenue vs Expenses</h3>
                <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>Last 6 months financial flow</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1.5" style={{ color: "#818cf8" }}><span className="h-2 w-2 rounded-full inline-block" style={{ background: "#6366f1" }} />Revenue</span>
                <span className="flex items-center gap-1.5" style={{ color: "#f87171" }}><span className="h-2 w-2 rounded-full inline-block" style={{ background: "#f43f5e" }} />Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpDark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.20} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  formatter={(val: number) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                  contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, fontSize: 11, color: "#e2e8f0" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradRevDark)" dot={{ r: 3, fill: "#6366f1", stroke: "#070d1a", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gradExpDark)" dot={{ r: 3, fill: "#f43f5e" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Transactions & Invoices Table */}
          <div className={`${DC} overflow-hidden`} style={dcStyle}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={dcHdr}>
              <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Recent Transactions &amp; Invoices</h3>
              <button onClick={() => onNavigate("sales-crm")} className="text-xs font-bold cursor-pointer" style={{ color: "#818cf8" }}>View All Invoices →</button>
            </div>
            {invoices.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-5 text-sm" style={{ color: "#475569" }}>
                <FileText className="h-4 w-4" /><span>No invoices yet.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {["INVOICE ID", "CLIENT / ACCOUNT", "ISSUE DATE", "TOTAL AMOUNT", "PAYMENT STATUS", "ACTIONS"].map(h => (
                        <th key={h} className="px-5 py-2.5 text-left font-bold uppercase tracking-wide" style={{ color: "#334155", fontSize: "9px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv, i) => {
                      const isPaid = inv.status === "paid";
                      const isOverdue = inv.status === "overdue";
                      return (
                        <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td className="px-5 py-3 font-mono font-bold" style={{ color: "#6366f1" }}>{inv.invoiceNumber}</td>
                          <td className="px-5 py-3 font-semibold truncate max-w-[140px]" style={{ color: "#cbd5e1" }}>{inv.clientName || "—"}</td>
                          <td className="px-5 py-3 font-mono" style={{ color: "#64748b" }}>{inv.date}</td>
                          <td className="px-5 py-3 font-bold" style={{ color: "#34d399" }}>{formatINR(inv.totalAmount)}</td>
                          <td className="px-5 py-3">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: isPaid ? "rgba(16,185,129,0.15)" : isOverdue ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: isPaid ? "#34d399" : isOverdue ? "#f87171" : "#fbbf24" }}>
                              {isPaid ? "✓ Paid & Cleared" : isOverdue ? "⚠ Overdue" : "⏳ Pending Due"}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => onNavigate("sales-crm")} className="text-[9px] font-bold cursor-pointer" style={{ color: "#6366f1" }}>Receipt</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active CRM Leads */}
          <div className={`${DC} overflow-hidden`} style={dcStyle}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={dcHdr}>
              <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Active CRM Pipeline</h3>
              <button onClick={() => onNavigate("sales-crm")} className="text-xs font-bold cursor-pointer" style={{ color: "#818cf8" }}>CRM view →</button>
            </div>
            {activeLeadsFollowups.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-5 text-sm" style={{ color: "#10b981" }}>
                <CheckCircle className="h-4 w-4" /><span>No open leads — add a lead to get started.</span>
              </div>
            ) : (
              <div>
                {activeLeadsFollowups.slice(0, 4).map((lead, i) => {
                  const initials = lead.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const sc: Record<string, { bg: string; color: string }> = {
                    New: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
                    Contacted: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
                    Qualified: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
                    Proposal: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa" },
                    Negotiation: { bg: "rgba(249,115,22,0.15)", color: "#fb923c" },
                    Won: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
                    Lost: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
                  };
                  const c = sc[lead.status] || { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" };
                  return (
                    <div key={lead.id} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < activeLeadsFollowups.slice(0,4).length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#e2e8f0" }}>{lead.name}</p>
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: "#475569" }}>{lead.companyName || lead.source || "—"}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0" style={c}>{lead.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 2/5 — Quick Actions + Stock + Staff */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick Actions */}
          <div className={`${DC} p-4`} style={dcStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Quick Actions</h3>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: "#334155" }}>Fast Operations</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Add Lead", sub: "Register sales enquiry in CRM", icon: MessageSquare, color: "#818cf8", bg: "rgba(99,102,241,0.12)", action: () => setActiveQuickActionModal("lead") },
                { label: "Create Purchase Order", sub: "Issue procurement draft PO", icon: ShoppingBag, color: "#fbbf24", bg: "rgba(245,158,11,0.10)", action: () => setActiveQuickActionModal("po") },
                { label: "Request Leave", sub: "Apply for employee time-off", icon: Clock, color: "#f87171", bg: "rgba(239,68,68,0.10)", action: () => setActiveQuickActionModal("leave") },
                { label: "Generate GST Voucher", sub: "Tax compliance automated call", icon: FileText, color: "#34d399", bg: "rgba(16,185,129,0.10)", action: () => onNavigate("finance") },
              ].map(qa => (
                <button key={qa.label} onClick={qa.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer group" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.25)"; (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: qa.bg }}>
                    <qa.icon className="h-4 w-4" style={{ color: qa.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{qa.label}</p>
                    <p className="text-[10px]" style={{ color: "#475569" }}>{qa.sub}</p>
                  </div>
                </button>
              ))}
              <div className="pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <button onClick={() => onNavigate("finance")} className="w-full text-left text-[10px] font-bold py-1 cursor-pointer" style={{ color: "#475569" }}>
                  Send automated bulk report → &nbsp; <span style={{ color: "#6366f1" }}>Batch Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className={`${DC} overflow-hidden`} style={dcStyle}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={dcHdr}>
              <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Stock Alerts</h3>
              <button onClick={() => onNavigate("inventory")} className="text-xs font-bold cursor-pointer" style={{ color: "#818cf8" }}>Inventory →</button>
            </div>
            <div className="px-4 py-3">
              <div className="flex gap-3 mb-3">
                <button onClick={() => onNavigate("inventory")} className="flex-1 rounded-lg p-2.5 text-center border cursor-pointer transition-all" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.2)" }}>
                  <p className="text-xl font-black" style={{ color: "#fbbf24" }}>{lowStockProducts.length}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "#d97706" }}>Low Stock</p>
                </button>
                <button onClick={() => onNavigate("inventory")} className="flex-1 rounded-lg p-2.5 text-center border cursor-pointer transition-all" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                  <p className="text-xl font-black" style={{ color: "#f87171" }}>{products.filter(p => (productStockMap[p.id] || 0) < 0).length}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "#dc2626" }}>Negative</p>
                </button>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-xs font-medium" style={{ color: "#10b981" }}>All products in healthy stock.</p>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map(p => {
                    const qty = productStockMap[p.id] || 0;
                    return (
                      <div key={p.id} className="flex items-center justify-between">
                        <p className="text-xs font-semibold truncate max-w-[130px]" style={{ color: "#94a3b8" }}>{p.name}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24" }}>{qty} / {p.minStockLevel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Staff Overview */}
          <div className={`${DC} overflow-hidden`} style={dcStyle}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={dcHdr}>
              <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>Staff Overview</h3>
              <button onClick={() => onNavigate("hr")} className="text-xs font-bold cursor-pointer" style={{ color: "#818cf8" }}>HR module →</button>
            </div>
            <div className="px-4 py-3 space-y-3">
              {[
                { icon: Users, label: "Total Employees", val: employees.length, valColor: "#ffffff", iconColor: "#818cf8" },
                { icon: Clock, label: "Leave Approvals", val: `${leaveRequests.filter(l => l.status === "pending").length} pending`, valColor: "#fbbf24", iconColor: "#f59e0b" },
                { icon: ArrowUpRight, label: "Open Leads", val: activeLeadsFollowups.length, valColor: "#34d399", iconColor: "#10b981" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <row.icon className="h-4 w-4" style={{ color: row.iconColor }} />
                    <span className="text-xs font-semibold" style={{ color: "#64748b" }}>{row.label}</span>
                  </div>
                  <span className="text-sm font-black" style={{ color: row.valColor }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* ── MODALS (dark themed) ── */}
      {activeQuickActionModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl border" style={{ background: "#0d1424", borderColor: "rgba(99,102,241,0.25)" }}>
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                {activeQuickActionModal === "lead" && <MessageSquare className="h-4 w-4" style={{ color: "#818cf8" }} />}
                {activeQuickActionModal === "po" && <ShoppingBag className="h-4 w-4" style={{ color: "#fbbf24" }} />}
                {activeQuickActionModal === "leave" && <Clock className="h-4 w-4" style={{ color: "#f87171" }} />}
                <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                  {activeQuickActionModal === "lead" ? "Add Lead" : activeQuickActionModal === "po" ? "Create Purchase Order" : "Request Leave"}
                </h3>
              </div>
              <button onClick={() => setActiveQuickActionModal(null)} style={{ color: "#475569" }}><X className="h-4 w-4" /></button>
            </div>
            {/* body */}
            <div className="p-6 space-y-4">
              {activeQuickActionModal === "lead" && (
                <form onSubmit={handleQuickAddLead} className="space-y-4">
                  {[
                    { label: "Lead Title / Contact Name *", el: <input type="text" required placeholder="John Doe, Cloud Architect" value={leadTitle} onChange={e => setLeadTitle(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /> },
                    { label: "Company Name", el: <input type="text" placeholder="Acme Tech Solutions" value={leadCompany} onChange={e => setLeadCompany(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /> },
                  ].map(f => <div key={f.label}><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{f.label}</label>{f.el}</div>)}
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Source</label>
                      <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                        <option>Website</option><option>Referral</option><option>LinkedIn</option><option>Cold Call</option><option>Campaign</option>
                      </select></div>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Status</label>
                      <select value={leadStatus} onChange={e => setLeadStatus(e.target.value as any)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                        <option>New</option><option>Contacted</option><option>Qualified</option><option>Proposal</option><option>Negotiation</option>
                      </select></div>
                  </div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Est. Value (₹)</label>
                    <input type="number" placeholder="e.g. 150000" value={leadValue} onChange={e => setLeadValue(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Notes</label>
                    <textarea placeholder="Additional context..." value={leadNotes} onChange={e => setLeadNotes(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setActiveQuickActionModal(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer border" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#64748b", background: "transparent" }}>Cancel</button>
                    <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold cursor-pointer" style={{ background: "linear-gradient(to right,#6366f1,#7c3aed)", color: "#ffffff" }}><Sparkles className="h-3.5 w-3.5" /> Save Lead</button>
                  </div>
                </form>
              )}
              {activeQuickActionModal === "po" && (
                <form onSubmit={handleQuickCreatePO} className="space-y-4">
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Vendor / Supplier *</label>
                    <select required value={poSupplierId} onChange={e => setPoSupplierId(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                      <option value="">-- Select Vendor --</option>
                      {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name} ({sup.code})</option>)}
                      {suppliers.length === 0 && <option value="sup-1">Mock Vendor Ltd</option>}
                    </select></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Total Amount (₹) *</label>
                    <input type="number" required placeholder="e.g. 75000" value={poAmount} onChange={e => setPoAmount(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Expected Delivery Date</label>
                    <input type="date" value={poDeliveryDate} onChange={e => setPoDeliveryDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Remarks</label>
                    <textarea placeholder="Net 30 payment terms..." value={poRemarks} onChange={e => setPoRemarks(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setActiveQuickActionModal(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer border" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#64748b", background: "transparent" }}>Cancel</button>
                    <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold cursor-pointer" style={{ background: "#d97706", color: "#ffffff" }}><Sparkles className="h-3.5 w-3.5" /> Issue Draft PO</button>
                  </div>
                </form>
              )}
              {activeQuickActionModal === "leave" && (
                <form onSubmit={handleQuickRequestLeave} className="space-y-4">
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Employee *</label>
                    <select required value={leaveEmployeeId} onChange={e => setLeaveEmployeeId(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                      <option value="">-- Select Employee --</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                    </select></div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Leave Type</label>
                    <select value={leaveType} onChange={e => setLeaveType(e.target.value as any)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }}>
                      <option value="annual">Annual Leave</option><option value="sick">Sick Leave</option><option value="casual">Casual Leave</option><option value="maternity">Maternity Leave</option><option value="unpaid">Loss of Pay / Unpaid</option>
                    </select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Start Date *</label>
                      <input type="date" required value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                    <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>End Date *</label>
                      <input type="date" required value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  </div>
                  <div><label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Reason</label>
                    <textarea placeholder="State reason for leave..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0" }} /></div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setActiveQuickActionModal(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer border" style={{ borderColor: "rgba(255,255,255,0.1)", color: "#64748b", background: "transparent" }}>Cancel</button>
                    <button type="submit" className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold cursor-pointer" style={{ background: "#dc2626", color: "#ffffff" }}><Sparkles className="h-3.5 w-3.5" /> Submit Request</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


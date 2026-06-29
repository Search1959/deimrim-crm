/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  ArrowDownRight
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
  UserRole
} from "../types";

interface DashboardViewProps {
  products: Product[];
  batchStocks: BatchStock[];
  invoices: Invoice[];
  purchaseOrders: PurchaseOrder[];
  transactions: Transaction[];
  employees: Employee[];
  leads: Lead[];
  onNavigate: (view: string) => void;
  currentUser: User;
  company: Company;
}

export default function DashboardView({
  products,
  batchStocks,
  invoices,
  purchaseOrders,
  transactions,
  employees,
  leads,
  onNavigate,
  currentUser,
  company,
}: DashboardViewProps) {
  const [showConfig, setShowConfig] = useState(false);
  
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
    .filter(t => t.type === "EXPENSE" && t.date === "2026-06-01" || t.date === "2026-05-30")
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
    .reduce((sum, inv) => sum + (inv.totalAmount - (inv.status === "partially_paid" ? 5000 : 0)), 0);

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
                  <span className="font-mono font-bold text-slate-800">3 / {employees.length} Present</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: "75%" }}></div>
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
    </div>
  );
}

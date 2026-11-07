/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Supplier, VendorInvoice, Invoice, Payment, Customer, formatINR } from "../../types";

// ── Types for Staff Ledger (read from HR localStorage) ──────────────────────
interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // "YYYY-MM"
  basicSalary: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: "draft" | "approved" | "paid";
  paidDate?: string;
}

interface PayrollAdj {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "advance" | "deduction" | "bonus" | "reimbursement";
  amount: number;
  month: string;
  reason: string;
  date: string;
}

// ── Style tokens ─────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(100,116,139,0.25)",
  borderRadius: "12px",
  padding: "16px",
};

const inpStyle: React.CSSProperties = {
  background: "rgba(30,41,59,0.9)",
  border: "1px solid rgba(100,116,139,0.45)",
  color: "#f1f5f9",
  borderRadius: "8px",
  padding: "6px 10px",
  fontSize: "13px",
  outline: "none",
  width: "100%",
};

// ── Props ────────────────────────────────────────────────────────────────────
interface LedgerPanelProps {
  companyId: string;
  suppliers?: Supplier[];
  vendorBills?: VendorInvoice[];
  invoices?: Invoice[];
  salesPayments?: Payment[];
  customers?: Customer[];
}

// ════════════════════════════════════════════════════════════════════
// VENDOR LEDGER
// ════════════════════════════════════════════════════════════════════
function VendorLedger({ suppliers = [], vendorBills = [] }: { suppliers: Supplier[]; vendorBills: VendorInvoice[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const supplierData = suppliers
    .filter(s => {
      const q = search.toLowerCase();
      return !q || s.name.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    })
    .map(s => {
      const bills = vendorBills.filter(b => b.supplierId === s.id);
      const totalBilled = bills.reduce((sum, b) => sum + (b.totalAmount ?? 0), 0);
      const totalPaid = bills.reduce((sum, b) => sum + (b.paidAmount ?? 0), 0);
      const outstanding = Math.max(0, totalBilled - totalPaid);

      const today = new Date();
      const aging = { current: 0, d30: 0, d60: 0, d90: 0 };
      bills.forEach(b => {
        const bal = Math.max(0, (b.totalAmount ?? 0) - (b.paidAmount ?? 0));
        if (bal <= 0) return;
        const due = new Date(b.dueDate);
        const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
        if (days <= 0) aging.current += bal;
        else if (days <= 30) aging.d30 += bal;
        else if (days <= 60) aging.d60 += bal;
        else aging.d90 += bal;
      });

      return { supplier: s, bills, totalBilled, totalPaid, outstanding, aging };
    })
    .sort((a, b) => b.outstanding - a.outstanding);

  const totalOutstanding = supplierData.reduce((s, d) => s + d.outstanding, 0);
  const overdueCount = supplierData.filter(d => d.aging.d30 + d.aging.d60 + d.aging.d90 > 0).length;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Suppliers", value: supplierData.length, color: "text-slate-300" },
          { label: "Total Payable", value: formatINR(totalOutstanding), color: "text-amber-400" },
          { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-400" : "text-emerald-400" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{k.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search supplier name or code…"
          style={{ ...inpStyle, border: "none", background: "transparent", padding: 0, flex: 1 }}
        />
      </div>

      {/* Supplier cards */}
      <div className="space-y-3">
        {supplierData.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">No supplier data found.</div>
        )}
        {supplierData.map(({ supplier: s, bills, totalBilled, totalPaid, outstanding, aging }) => {
          const isExp = expanded === s.id;
          const hasOverdue = aging.d30 + aging.d60 + aging.d90 > 0;

          return (
            <div
              key={s.id}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${hasOverdue ? "rgba(239,68,68,0.3)" : outstanding > 0 ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)"}`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {/* Header row */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(isExp ? null : s.id)}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: hasOverdue ? "rgba(239,68,68,0.15)" : outstanding > 0 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: hasOverdue ? "#f87171" : outstanding > 0 ? "#fbbf24" : "#34d399" }}
                >
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 text-sm truncate">{s.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{s.code} · {s.phone || "—"} · Credit: {s.creditDays}d</div>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">Payable</span>
                  <span className={`text-base font-bold font-mono ${outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                    {formatINR(outstanding)}
                  </span>
                </div>
                <div className="hidden md:flex gap-1 shrink-0">
                  {aging.d30 > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(234,179,8,0.15)", color: "#fde047" }}>30d {formatINR(aging.d30)}</span>}
                  {aging.d60 > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>60d {formatINR(aging.d60)}</span>}
                  {aging.d90 > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>90d+ {formatINR(aging.d90)}</span>}
                </div>
                <span className="text-slate-500 text-xs">{isExp ? "▲" : "▼"}</span>
              </div>

              {/* Expanded bills */}
              {isExp && (
                <div style={{ borderTop: "1px solid rgba(100,116,139,0.2)" }}>
                  {/* Summary strip */}
                  <div className="grid grid-cols-3 gap-3 p-4">
                    {[
                      { label: "Total Billed", val: formatINR(totalBilled), color: "text-slate-300" },
                      { label: "Total Paid", val: formatINR(totalPaid), color: "text-emerald-400" },
                      { label: "Balance Due", val: formatINR(outstanding), color: outstanding > 0 ? "text-amber-400" : "text-emerald-400" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "rgba(15,23,42,0.5)", borderRadius: 8, padding: "8px 12px" }}>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">{item.label}</div>
                        <div className={`font-bold font-mono text-sm mt-0.5 ${item.color}`}>{item.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Bills table */}
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(15,23,42,0.6)" }}>
                          {["Bill #", "Date", "Due", "Amount", "Paid", "Balance", "Status"].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {bills.length === 0 && (
                          <tr><td colSpan={7} className="text-center py-4 text-slate-500">No bills found.</td></tr>
                        )}
                        {bills.map(b => {
                          const bal = Math.max(0, (b.totalAmount ?? 0) - (b.paidAmount ?? 0));
                          const statusColor = b.status === "Paid" ? "text-emerald-400" : b.status === "Partially Paid" ? "text-yellow-400" : "text-red-400";
                          return (
                            <tr key={b.id} style={{ borderBottom: "1px solid rgba(100,116,139,0.1)" }}>
                              <td className="px-3 py-2 font-mono text-slate-300">{b.billNumber}</td>
                              <td className="px-3 py-2 text-slate-400">{b.invoiceDate?.slice(0, 10) || "—"}</td>
                              <td className="px-3 py-2 text-slate-400">{b.dueDate?.slice(0, 10) || "—"}</td>
                              <td className="px-3 py-2 font-mono text-slate-300">{formatINR(b.totalAmount)}</td>
                              <td className="px-3 py-2 font-mono text-emerald-400">{formatINR(b.paidAmount)}</td>
                              <td className={`px-3 py-2 font-mono font-bold ${bal > 0 ? "text-amber-400" : "text-emerald-400"}`}>{formatINR(bal)}</td>
                              <td className={`px-3 py-2 font-semibold ${statusColor}`}>{b.status}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// CLIENT LEDGER (lifted from FinanceView, dark-theme fixed)
// ════════════════════════════════════════════════════════════════════
function ClientLedger({ customers = [], invoices = [], salesPayments = [] }: { customers: Customer[]; invoices: Invoice[]; salesPayments: Payment[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const clientData = customers
    .filter(c => {
      const q = search.toLowerCase();
      return !q || c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
    })
    .map(c => {
      const cInvoices = invoices.filter(inv => inv.customerId === c.id);
      const cInvIds = new Set(cInvoices.map(inv => inv.id));
      const totalBilled = cInvoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);
      const totalPaid = salesPayments.filter(p => cInvIds.has(p.invoiceId)).reduce((s, p) => s + (p.amount ?? 0), 0);
      const outstanding = Math.max(0, totalBilled - totalPaid);

      const today = new Date();
      const aging = { current: 0, d30: 0, d60: 0, d90: 0 };
      cInvoices.forEach(inv => {
        const paidForInv = salesPayments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + (p.amount ?? 0), 0);
        const bal = Math.max(0, (inv.totalAmount ?? 0) - paidForInv);
        if (bal <= 0) return;
        const due = new Date(inv.dueDate);
        const days = Math.floor((today.getTime() - due.getTime()) / 86400000);
        if (days <= 0) aging.current += bal;
        else if (days <= 30) aging.d30 += bal;
        else if (days <= 60) aging.d60 += bal;
        else aging.d90 += bal;
      });

      return { customer: c, cInvoices, totalBilled, totalPaid, outstanding, aging };
    })
    .sort((a, b) => b.outstanding - a.outstanding);

  const totalOutstanding = clientData.reduce((s, d) => s + d.outstanding, 0);
  const overdueCount = clientData.filter(d => d.aging.d30 + d.aging.d60 + d.aging.d90 > 0).length;

  const sendWhatsApp = (phone: string, name: string, outstanding: number, invNums: string) => {
    const msg = encodeURIComponent(
      `Dear ${name},\n\nThis is a gentle reminder regarding your outstanding balance of ₹${outstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.\n\nUnpaid Invoice(s): ${invNums || "—"}\n\nKindly arrange payment at the earliest. Thank you.`
    );
    const clean = phone.replace(/\D/g, "");
    const wa = clean.startsWith("91") ? clean : `91${clean}`;
    window.open(`https://wa.me/${wa}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Clients", value: clientData.length, color: "text-slate-300" },
          { label: "Total Receivable", value: formatINR(totalOutstanding), color: "text-amber-400" },
          { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "text-red-400" : "text-emerald-400" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{k.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search client by name, phone, email…"
          style={{ ...inpStyle, border: "none", background: "transparent", padding: 0, flex: 1 }}
        />
      </div>

      <div className="space-y-3">
        {clientData.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">No clients found.</div>}
        {clientData.map(({ customer: c, cInvoices, totalBilled, totalPaid, outstanding, aging }) => {
          const isExp = expanded === c.id;
          const hasOverdue = aging.d30 + aging.d60 + aging.d90 > 0;

          return (
            <div
              key={c.id}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${hasOverdue ? "rgba(239,68,68,0.3)" : outstanding > 0 ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)"}`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : c.id)}>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: hasOverdue ? "rgba(239,68,68,0.15)" : outstanding > 0 ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: hasOverdue ? "#f87171" : outstanding > 0 ? "#fbbf24" : "#34d399" }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 text-sm truncate">{c.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{c.phone || "—"} · {c.email || "—"}</div>
                </div>
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono">Outstanding</span>
                  <span className={`text-base font-bold font-mono ${outstanding > 0 ? "text-amber-400" : "text-emerald-400"}`}>{formatINR(outstanding)}</span>
                </div>
                <div className="hidden md:flex gap-1 shrink-0">
                  {aging.d30 > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(234,179,8,0.15)", color: "#fde047" }}>30d {formatINR(aging.d30)}</span>}
                  {aging.d60 > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c" }}>60d {formatINR(aging.d60)}</span>}
                  {aging.d90 > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>90d+ {formatINR(aging.d90)}</span>}
                </div>
                <span className="text-slate-500 text-xs">{isExp ? "▲" : "▼"}</span>
              </div>

              {isExp && (
                <div style={{ borderTop: "1px solid rgba(100,116,139,0.2)" }}>
                  <div className="grid grid-cols-3 gap-3 p-4">
                    {[
                      { label: "Total Billed", val: formatINR(totalBilled), color: "text-slate-300" },
                      { label: "Total Received", val: formatINR(totalPaid), color: "text-emerald-400" },
                      { label: "Balance Due", val: formatINR(outstanding), color: outstanding > 0 ? "text-amber-400" : "text-emerald-400" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "rgba(15,23,42,0.5)", borderRadius: 8, padding: "8px 12px" }}>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">{item.label}</div>
                        <div className={`font-bold font-mono text-sm mt-0.5 ${item.color}`}>{item.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "rgba(15,23,42,0.6)" }}>
                          {["Invoice #", "Date", "Due", "Amount", "Paid", "Balance", "Status"].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cInvoices.length === 0 && <tr><td colSpan={7} className="text-center py-4 text-slate-500">No invoices.</td></tr>}
                        {cInvoices.map(inv => {
                          const paid = salesPayments.filter(p => p.invoiceId === inv.id).reduce((s, p) => s + (p.amount ?? 0), 0);
                          const bal = Math.max(0, (inv.totalAmount ?? 0) - paid);
                          const statusColor = inv.status === "paid" ? "text-emerald-400" : inv.status === "partially_paid" ? "text-yellow-400" : inv.status === "overdue" ? "text-red-400" : "text-amber-400";
                          return (
                            <tr key={inv.id} style={{ borderBottom: "1px solid rgba(100,116,139,0.1)" }}>
                              <td className="px-3 py-2 font-mono text-slate-300">{inv.invoiceNumber}</td>
                              <td className="px-3 py-2 text-slate-400">{inv.createdAt?.slice(0, 10) || "—"}</td>
                              <td className="px-3 py-2 text-slate-400">{inv.dueDate?.slice(0, 10) || "—"}</td>
                              <td className="px-3 py-2 font-mono text-slate-300">{formatINR(inv.totalAmount)}</td>
                              <td className="px-3 py-2 font-mono text-emerald-400">{formatINR(paid)}</td>
                              <td className={`px-3 py-2 font-mono font-bold ${bal > 0 ? "text-amber-400" : "text-emerald-400"}`}>{formatINR(bal)}</td>
                              <td className={`px-3 py-2 font-semibold capitalize ${statusColor}`}>{inv.status?.replace(/_/g, " ")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* WhatsApp reminder */}
                  {outstanding > 0 && c.phone && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={() => {
                          const unpaid = cInvoices.filter(inv => inv.status !== "paid" && inv.status !== "void");
                          sendWhatsApp(c.phone, c.name, outstanding, unpaid.map(i => i.invoiceNumber).join(", "));
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                        style={{ background: "rgba(37,211,102,0.15)", color: "#25d366", border: "1px solid rgba(37,211,102,0.25)" }}
                      >
                        📲 Send WhatsApp Reminder
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// STAFF LEDGER
// ════════════════════════════════════════════════════════════════════
function StaffLedger({ companyId }: { companyId: string }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [adjustments, setAdjustments] = useState<PayrollAdj[]>([]);

  useEffect(() => {
    try {
      const pr = JSON.parse(localStorage.getItem(`deinrim_payroll_status_${companyId}`) || "[]");
      setPayrollRecords(pr);
    } catch { setPayrollRecords([]); }
    try {
      const adj = JSON.parse(localStorage.getItem(`deinrim_payroll_adj_${companyId}`) || "[]");
      setAdjustments(adj);
    } catch { setAdjustments([]); }
  }, [companyId]);

  // Group by employee
  const empMap = new Map<string, { name: string; records: PayrollRecord[]; adjustments: PayrollAdj[] }>();
  payrollRecords.forEach(r => {
    if (!empMap.has(r.employeeId)) empMap.set(r.employeeId, { name: r.employeeName, records: [], adjustments: [] });
    empMap.get(r.employeeId)!.records.push(r);
  });
  adjustments.forEach(a => {
    if (!empMap.has(a.employeeId)) empMap.set(a.employeeId, { name: a.employeeName, records: [], adjustments: [] });
    empMap.get(a.employeeId)!.adjustments.push(a);
  });

  const staffData = Array.from(empMap.entries())
    .map(([empId, data]) => {
      const totalGross = data.records.reduce((s, r) => s + (r.grossPay ?? 0), 0);
      const totalNet = data.records.reduce((s, r) => s + (r.netPay ?? 0), 0);
      const totalPaid = data.records.filter(r => r.status === "paid").reduce((s, r) => s + (r.netPay ?? 0), 0);
      const pending = data.records.filter(r => r.status !== "paid").reduce((s, r) => s + (r.netPay ?? 0), 0);
      const totalAdv = data.adjustments.filter(a => a.type === "advance").reduce((s, a) => s + (a.amount ?? 0), 0);
      const totalBonus = data.adjustments.filter(a => a.type === "bonus").reduce((s, a) => s + (a.amount ?? 0), 0);
      return { empId, name: data.name, records: data.records, adjustments: data.adjustments, totalGross, totalNet, totalPaid, pending, totalAdv, totalBonus };
    })
    .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.pending - a.pending);

  const totalPayable = staffData.reduce((s, d) => s + d.pending, 0);
  const totalPaidAll = staffData.reduce((s, d) => s + d.totalPaid, 0);

  const adjTypeColor: Record<string, string> = {
    advance: "text-orange-400",
    deduction: "text-red-400",
    bonus: "text-emerald-400",
    reimbursement: "text-sky-400",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Staff on Payroll", value: staffData.length, color: "text-slate-300" },
          { label: "Total Paid (YTD)", value: formatINR(totalPaidAll), color: "text-emerald-400" },
          { label: "Pending Payout", value: formatINR(totalPayable), color: totalPayable > 0 ? "text-amber-400" : "text-slate-400" },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{k.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employee name…"
          style={{ ...inpStyle, border: "none", background: "transparent", padding: 0, flex: 1 }}
        />
      </div>

      {staffData.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">No payroll data found. Process payroll in HR → Payroll first.</div>
      )}

      <div className="space-y-3">
        {staffData.map(({ empId, name, records, adjustments: adjs, totalGross, totalPaid, pending, totalAdv, totalBonus }) => {
          const isExp = expanded === empId;

          return (
            <div
              key={empId}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${pending > 0 ? "rgba(245,158,11,0.2)" : "rgba(100,116,139,0.2)"}`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : empId)}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 text-sm truncate">{name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{records.length} payroll months · {adjs.length} adjustments</div>
                </div>
                <div className="hidden sm:flex gap-4 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-mono">Total Paid</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">{formatINR(totalPaid)}</span>
                  </div>
                  {pending > 0 && (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-slate-500 font-mono">Pending</span>
                      <span className="text-sm font-bold font-mono text-amber-400">{formatINR(pending)}</span>
                    </div>
                  )}
                </div>
                <span className="text-slate-500 text-xs">{isExp ? "▲" : "▼"}</span>
              </div>

              {isExp && (
                <div style={{ borderTop: "1px solid rgba(100,116,139,0.2)" }}>
                  {/* Summary strip */}
                  <div className="grid grid-cols-4 gap-3 p-4">
                    {[
                      { label: "Gross Earned", val: formatINR(totalGross), color: "text-slate-300" },
                      { label: "Net Payable", val: formatINR(records.reduce((s, r) => s + (r.netPay ?? 0), 0)), color: "text-slate-300" },
                      { label: "Total Paid", val: formatINR(totalPaid), color: "text-emerald-400" },
                      { label: "Advances", val: formatINR(totalAdv), color: "text-orange-400" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "rgba(15,23,42,0.5)", borderRadius: 8, padding: "8px 12px" }}>
                        <div className="text-[10px] text-slate-500 font-mono uppercase">{item.label}</div>
                        <div className={`font-bold font-mono text-sm mt-0.5 ${item.color}`}>{item.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Payroll history */}
                  <div className="px-4 pb-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Payroll History</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(15,23,42,0.6)" }}>
                            {["Month", "Gross", "Deductions", "Net Pay", "Status", "Paid On"].map(h => (
                              <th key={h} className="px-3 py-2 text-left font-bold text-slate-400">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {records.length === 0 && <tr><td colSpan={6} className="text-center py-3 text-slate-500">No records.</td></tr>}
                          {records.sort((a, b) => b.month.localeCompare(a.month)).map(r => {
                            const sc = r.status === "paid" ? "text-emerald-400" : r.status === "approved" ? "text-sky-400" : "text-slate-400";
                            return (
                              <tr key={r.id} style={{ borderBottom: "1px solid rgba(100,116,139,0.1)" }}>
                                <td className="px-3 py-2 font-mono text-slate-300">{r.month}</td>
                                <td className="px-3 py-2 font-mono text-slate-300">{formatINR(r.grossPay)}</td>
                                <td className="px-3 py-2 font-mono text-red-400">{formatINR(r.totalDeductions)}</td>
                                <td className="px-3 py-2 font-mono font-bold text-slate-200">{formatINR(r.netPay)}</td>
                                <td className={`px-3 py-2 font-semibold capitalize ${sc}`}>{r.status}</td>
                                <td className="px-3 py-2 text-slate-500">{r.paidDate?.slice(0, 10) || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Adjustments */}
                  {adjs.length > 0 && (
                    <div className="px-4 pb-4 mt-2">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Adjustments & Advances</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "rgba(15,23,42,0.6)" }}>
                              {["Month", "Type", "Amount", "Reason", "Date"].map(h => (
                                <th key={h} className="px-3 py-2 text-left font-bold text-slate-400">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {adjs.map(a => (
                              <tr key={a.id} style={{ borderBottom: "1px solid rgba(100,116,139,0.1)" }}>
                                <td className="px-3 py-2 font-mono text-slate-400">{a.month}</td>
                                <td className={`px-3 py-2 capitalize font-semibold ${adjTypeColor[a.type] || "text-slate-300"}`}>{a.type}</td>
                                <td className={`px-3 py-2 font-mono font-bold ${adjTypeColor[a.type] || "text-slate-300"}`}>{formatINR(a.amount)}</td>
                                <td className="px-3 py-2 text-slate-400">{a.reason || "—"}</td>
                                <td className="px-3 py-2 text-slate-500">{a.date?.slice(0, 10) || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN LEDGER PANEL
// ════════════════════════════════════════════════════════════════════
export default function LedgerPanel({
  companyId,
  suppliers = [],
  vendorBills = [],
  invoices = [],
  salesPayments = [],
  customers = [],
}: LedgerPanelProps) {
  const [tab, setTab] = useState<"vendor" | "client" | "staff">("vendor");

  const tabs = [
    { key: "vendor" as const, label: "🏭 Vendor Ledger", color: "bg-orange-600" },
    { key: "client" as const, label: "👤 Client Ledger", color: "bg-sky-600" },
    { key: "staff" as const, label: "👷 Staff Ledger", color: "bg-violet-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Inner tab bar */}
      <div className="flex gap-1 flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: "10px", padding: "6px" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === t.key ? `${t.color} text-white shadow-sm` : "text-slate-500 hover:text-slate-200 hover:bg-slate-700/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "vendor" && <VendorLedger suppliers={suppliers} vendorBills={vendorBills} />}
      {tab === "client" && <ClientLedger customers={customers} invoices={invoices} salesPayments={salesPayments} />}
      {tab === "staff" && <StaffLedger companyId={companyId} />}
    </div>
  );
}

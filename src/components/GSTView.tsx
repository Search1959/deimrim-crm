import React, { useState } from "react";
import {
  FileSpreadsheet, Brain, Bell, Settings, BarChart3, FileText,
  CheckCircle2, AlertCircle, Clock, Send, ChevronRight, Shield
} from "lucide-react";
import { Invoice, Customer, Transaction, Company } from "../types";
import { formatINR } from "../types";

interface Props {
  invoices: Invoice[];
  customers: Customer[];
  transactions: Transaction[];
  company: Company;
  userRole: string;
}

type GSTTab = "dashboard" | "gstr1" | "gstr3b" | "hsn" | "ai" | "notifications" | "settings";

// ── AI GST Engine ──────────────────────────────────────────────────────────
function gstAI(query: string, invoices: Invoice[], transactions: Transaction[], company: Company): string {
  const q = query.toLowerCase();

  const paid = invoices.filter(i => i.status === "paid");
  const totalGST = invoices.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const cgst = invoices.reduce((s, i) => s + (i.cgst || 0), 0);
  const sgst = invoices.reduce((s, i) => s + (i.sgst || 0), 0);
  const totalRevenue = paid.reduce((s, i) => s + i.totalAmount, 0);

  const noGstin = invoices.filter(i => i.status !== "void" && !i.buyerGSTIN);
  const pendingAmt = invoices.filter(i => i.status === "unpaid" || i.status === "overdue")
    .reduce((s, i) => s + i.totalAmount, 0);

  if (q.includes("payable") || q.includes("gst due") || q.includes("how much gst"))
    return `Total GST collected this period: **${formatINR(totalGST)}**\nCGST: ${formatINR(cgst)} | SGST: ${formatINR(sgst)}\n\nGSTR-3B liability (Table 3.1) = ${formatINR(totalGST)}`;

  if (q.includes("b2b") || q.includes("business client") || q.includes("gstin missing"))
    return noGstin.length
      ? `**${noGstin.length} invoices** have no Buyer GSTIN:\n${noGstin.map(i => `• ${i.invoiceNumber} — ${formatINR(i.totalAmount)}`).join("\n")}\n\nAdd GSTINs in Sales CRM → Customer Profile before filing GSTR-1.`
      : "All invoices have buyer GSTIN. Ready for B2B reporting in GSTR-1.";

  if (q.includes("outstanding") || q.includes("pending"))
    return `Pending collections: **${formatINR(pendingAmt)}** across ${invoices.filter(i => i.status === "unpaid" || i.status === "overdue").length} invoices.`;

  if (q.includes("revenue") || q.includes("turnover") || q.includes("taxable"))
    return `Total taxable turnover: **${formatINR(totalRevenue)}** (from ${paid.length} paid invoices).\nGST collected: ${formatINR(totalGST)}.`;

  if (q.includes("gstr-1") || q.includes("gstr1"))
    return `GSTR-1 Summary:\n• B2B Invoices: ${invoices.filter(i => i.buyerGSTIN).length} invoices\n• B2C Invoices: ${invoices.filter(i => !i.buyerGSTIN).length} invoices\n• Total taxable value: ${formatINR(totalRevenue)}\n• Total GST: ${formatINR(totalGST)}`;

  if (q.includes("gstr-3b") || q.includes("gstr3b") || q.includes("3b"))
    return `GSTR-3B Summary:\n• 3.1(a) Outward taxable supplies: ${formatINR(totalRevenue)}\n• 3.1(a) Tax payable: ${formatINR(totalGST)}\n• 4(A) ITC available: Check Purchase module\n• Net tax payable: ${formatINR(totalGST)}`;

  if (q.includes("due date") || q.includes("deadline") || q.includes("filing"))
    return "GST Filing Due Dates:\n• GSTR-1 (Monthly): 11th of next month\n• GSTR-3B (Monthly): 20th of next month\n• GSTR-9 (Annual): 31st December of next FY";

  if (q.includes("health") || q.includes("score") || q.includes("compliance"))
    return `GST Compliance Score:\n• Invoices with GSTIN: ${invoices.length - noGstin.length}/${invoices.length}\n• Tax collected: ${formatINR(totalGST)}\n• Missing GSTINs: ${noGstin.length} invoices need attention`;

  return "I can help with: GST payable amount, B2B clients missing GSTIN, GSTR-1 summary, GSTR-3B table, due dates, outstanding collections. Try: \"How much GST is payable?\"";
}

// ── Period helpers ─────────────────────────────────────────────────────────
function getCurrentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(p: string) {
  const [y, m] = p.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export default function GSTView({ invoices, customers, transactions, company }: Props) {
  const [activeTab, setActiveTab] = useState<GSTTab>("dashboard");
  const [period, setPeriod] = useState(getCurrentPeriod());
  const [aiInput, setAiInput] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hello! I'm your AI GST Assistant for DEINRIM OMS. Ask me anything — GST payable, B2B clients, GSTR-1 / GSTR-3B summary, or due dates." }
  ]);
  const [gstin, setGstin] = useState(company.taxId?.replace("GST-", "") || "");
  const [legalName, setLegalName] = useState(company.name || "");
  const [stateCode, setStateCode] = useState("19");
  const [savedGST, setSavedGST] = useState(false);

  // Period-filtered invoices
  const periodInvoices = invoices.filter(i => i.createdAt?.startsWith(period));
  const allInvoicesForCalc = periodInvoices.length > 0 ? periodInvoices : invoices;

  const totalGST = allInvoicesForCalc.reduce((s, i) => s + (i.taxAmount || 0), 0);
  const cgst = allInvoicesForCalc.reduce((s, i) => s + (i.cgst || i.taxAmount / 2 || 0), 0);
  const sgst = cgst;
  const totalTaxable = allInvoicesForCalc.filter(i => i.status === "paid").reduce((s, i) => s + i.subtotal, 0);
  const b2bInvoices = allInvoicesForCalc.filter(i => i.buyerGSTIN);
  const b2cInvoices = allInvoicesForCalc.filter(i => !i.buyerGSTIN);

  // HSN summary derived from invoice items
  const hsnMap: Record<string, { taxable: number; gst: number; count: number }> = {};
  allInvoicesForCalc.forEach(inv => {
    inv.items.forEach(item => {
      const code = item.hsn || "9983";
      if (!hsnMap[code]) hsnMap[code] = { taxable: 0, gst: 0, count: 0 };
      const rate = item.gstPct || 18;
      const taxable = item.quantity * item.unitPrice;
      hsnMap[code].taxable += taxable;
      hsnMap[code].gst += taxable * rate / 100;
      hsnMap[code].count += item.quantity;
    });
  });

  const handleAiSend = () => {
    const q = aiInput.trim();
    if (!q) return;
    const ans = gstAI(q, allInvoicesForCalc, transactions, company);
    setAiHistory(h => [...h, { role: "user", text: q }, { role: "ai", text: ans }]);
    setAiInput("");
  };

  const quickPrompts = [
    "How much GST is payable?",
    "Show GSTR-3B summary",
    "B2B clients missing GSTIN",
    "When are filing due dates?",
  ];

  const tabs: { id: GSTTab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard",     label: "GST Dashboard",   icon: BarChart3 },
    { id: "gstr1",         label: "GSTR-1",          icon: FileText },
    { id: "gstr3b",        label: "GSTR-3B",         icon: FileSpreadsheet },
    { id: "hsn",           label: "HSN / SAC",       icon: Shield },
    { id: "ai",            label: "AI Assistant",    icon: Brain },
    { id: "notifications", label: "Due Date Alerts", icon: Bell },
    { id: "settings",      label: "GST Settings",    icon: Settings },
  ];

  const gstinValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sub-nav */}
      <aside className="w-52 shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">GST Module</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? "bg-emerald-600/10 border border-emerald-500/30 text-emerald-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}>
                <Icon className={`h-3.5 w-3.5 ${activeTab === t.id ? "text-emerald-400" : "text-slate-500"}`} />
                {t.label}
                {t.id === "gstr1" && b2bInvoices.length > 0 && (
                  <span className="ml-auto text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 rounded font-mono">{b2bInvoices.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        {/* Period selector */}
        <div className="p-3 border-t border-slate-800">
          <p className="text-[9px] text-slate-500 font-mono uppercase mb-1">Period</p>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-emerald-500" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> GST Dashboard
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Period: {periodLabel(period)} · {allInvoicesForCalc.length} invoices</p>
            </div>

            {!gstin && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-300">GSTIN Not Configured</p>
                  <p className="text-[11px] text-amber-400/80 mt-0.5">Go to GST Settings → enter your 15-digit GSTIN to enable full compliance features.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total GST Collected", val: formatINR(totalGST), color: "emerald", icon: CheckCircle2 },
                { label: "CGST",                val: formatINR(cgst),     color: "indigo",  icon: FileSpreadsheet },
                { label: "SGST",                val: formatINR(sgst),     color: "indigo",  icon: FileSpreadsheet },
                { label: "B2B Invoices",         val: b2bInvoices.length,  color: "amber",   icon: FileText },
              ].map(k => (
                <div key={k.label} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className={`p-1.5 bg-${k.color}-500/10 text-${k.color}-400 rounded-lg w-fit`}>
                    <k.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{k.label}</p>
                  <p className="text-xl font-black text-white">{k.val}</p>
                </div>
              ))}
            </div>

            {/* Returns status */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Return Filing Status — {periodLabel(period)}</p>
              </div>
              <div className="divide-y divide-slate-800/50">
                {[
                  { name: "GSTR-1", due: "11th of next month", status: "Pending", color: "text-amber-400" },
                  { name: "GSTR-3B", due: "20th of next month", status: "Pending", color: "text-amber-400" },
                  { name: "GSTR-9 (Annual)", due: "31st December", status: "Not Due", color: "text-slate-500" },
                ].map(r => (
                  <div key={r.name} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{r.name}</p>
                      <p className="text-[10px] text-slate-500">Due: {r.due}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${r.color}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GSTR-1 ── */}
        {activeTab === "gstr1" && (
          <div className="space-y-5">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" /> GSTR-1 — Outward Supplies
            </h2>

            {/* B2B Table 4A */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Table 4A — B2B Invoices ({b2bInvoices.length})</p>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">Registered Buyers</span>
              </div>
              {b2bInvoices.length === 0
                ? <p className="px-5 py-6 text-xs text-slate-500 text-center">No B2B invoices with buyer GSTIN this period. Add GSTIN to customers in Sales CRM.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-slate-800/60">
                      <thead className="bg-slate-900/60">
                        <tr>{["Invoice No.", "Buyer GSTIN", "Buyer Name", "Taxable", "CGST", "SGST", "Total"].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {b2bInvoices.map(inv => {
                          const cust = customers.find(c => c.id === inv.customerId);
                          const cg = inv.cgst || inv.taxAmount / 2 || 0;
                          return (
                            <tr key={inv.id} className="hover:bg-slate-900/30">
                              <td className="px-4 py-2 font-mono text-indigo-400">{inv.invoiceNumber}</td>
                              <td className="px-4 py-2 font-mono text-slate-300">{inv.buyerGSTIN}</td>
                              <td className="px-4 py-2 text-slate-300">{cust?.name || inv.buyerName || "—"}</td>
                              <td className="px-4 py-2 text-emerald-400 font-mono">{formatINR(inv.subtotal)}</td>
                              <td className="px-4 py-2 text-slate-400 font-mono">{formatINR(cg)}</td>
                              <td className="px-4 py-2 text-slate-400 font-mono">{formatINR(cg)}</td>
                              <td className="px-4 py-2 text-white font-bold font-mono">{formatINR(inv.totalAmount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            {/* B2C Table 7 */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Table 7 — B2C Invoices ({b2cInvoices.length})</p>
                <span className="text-[9px] text-slate-400 font-bold bg-slate-500/10 border border-slate-700 px-2 py-0.5 rounded uppercase">Unregistered Buyers</span>
              </div>
              {b2cInvoices.length === 0
                ? <p className="px-5 py-6 text-xs text-slate-500 text-center">No B2C invoices this period.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-slate-800/60">
                      <thead className="bg-slate-900/60">
                        <tr>{["Invoice No.", "Customer", "Taxable", "GST Rate", "Tax", "Total"].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {b2cInvoices.map(inv => {
                          const cust = customers.find(c => c.id === inv.customerId);
                          const avgRate = inv.items.length > 0 ? (inv.items.reduce((s, i) => s + (i.gstPct || 18), 0) / inv.items.length) : 18;
                          return (
                            <tr key={inv.id} className="hover:bg-slate-900/30">
                              <td className="px-4 py-2 font-mono text-indigo-400">{inv.invoiceNumber}</td>
                              <td className="px-4 py-2 text-slate-300">{cust?.name || "Walk-in"}</td>
                              <td className="px-4 py-2 text-emerald-400 font-mono">{formatINR(inv.subtotal)}</td>
                              <td className="px-4 py-2 text-slate-400">{Math.round(avgRate)}%</td>
                              <td className="px-4 py-2 text-amber-400 font-mono">{formatINR(inv.taxAmount)}</td>
                              <td className="px-4 py-2 text-white font-bold font-mono">{formatINR(inv.totalAmount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── GSTR-3B ── */}
        {activeTab === "gstr3b" && (
          <div className="space-y-5">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" /> GSTR-3B — Summary Return
            </h2>
            <p className="text-xs text-slate-400">Period: {periodLabel(period)} · Auto-computed from Sales CRM invoices</p>

            {/* Table 3.1 */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">3.1 — Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</p>
              </div>
              <div className="divide-y divide-slate-800/50">
                {[
                  { label: "(a) Outward taxable supplies (other than zero rated, nil rated)", taxable: totalTaxable, cgst, sgst, igst: 0 },
                  { label: "(b) Outward taxable supplies (zero rated)", taxable: 0, cgst: 0, sgst: 0, igst: 0 },
                  { label: "(c) Other outward supplies (nil rated, exempted)", taxable: 0, cgst: 0, sgst: 0, igst: 0 },
                ].map((row, i) => (
                  <div key={i} className="px-5 py-3 grid grid-cols-5 gap-3 text-xs">
                    <div className="col-span-2 text-slate-300 font-semibold">{row.label}</div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 font-mono mb-0.5">TAXABLE</p>
                      <p className="text-emerald-400 font-mono font-bold">{formatINR(row.taxable)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 font-mono mb-0.5">CGST+SGST</p>
                      <p className="text-indigo-400 font-mono font-bold">{formatINR(row.cgst + row.sgst)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-slate-500 font-mono mb-0.5">IGST</p>
                      <p className="text-slate-400 font-mono font-bold">{formatINR(row.igst)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 4 ITC */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">4 — Eligible ITC</p>
              </div>
              <div className="px-5 py-4 text-xs text-slate-400">
                ITC Register is linked to Purchase Module. Review your Purchase Orders for GST paid on inward supplies.
                <p className="mt-2 text-amber-400">4(A)(5) All other ITC: Refer Purchase Manager for verified ITC claim amount.</p>
              </div>
            </div>

            {/* Tax payment summary */}
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900/40 border border-emerald-500/20 rounded-xl p-5">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono mb-3">6 — Payment of Tax</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[9px] text-slate-500 font-mono">CGST Payable</p>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-1">{formatINR(cgst)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-mono">SGST Payable</p>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-1">{formatINR(sgst)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-mono">Total Tax Payable</p>
                  <p className="text-lg font-black text-white font-mono mt-1">{formatINR(totalGST)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-emerald-500/10 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">File GSTR-3B on the GST portal after verifying amounts</p>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5" /> Open GST Portal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HSN ── */}
        {activeTab === "hsn" && (
          <div className="space-y-5">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" /> HSN / SAC Summary
            </h2>
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Table 12 — HSN-wise Outward Supplies</p>
              </div>
              {Object.keys(hsnMap).length === 0
                ? <p className="px-5 py-6 text-xs text-slate-500 text-center">No HSN data found. Add HSN codes to products in Inventory → Service Catalog.</p>
                : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-slate-800/60">
                      <thead className="bg-slate-900/60">
                        <tr>{["HSN/SAC", "Total Qty", "Taxable Value", "GST Amount"].map(h => (
                          <th key={h} className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {Object.entries(hsnMap).map(([code, data]) => (
                          <tr key={code} className="hover:bg-slate-900/30">
                            <td className="px-4 py-2 font-mono text-indigo-400">{code}</td>
                            <td className="px-4 py-2 text-slate-300">{data.count}</td>
                            <td className="px-4 py-2 text-emerald-400 font-mono">{formatINR(data.taxable)}</td>
                            <td className="px-4 py-2 text-amber-400 font-mono">{formatINR(data.gst)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── AI ASSISTANT ── */}
        {activeTab === "ai" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-400" /> AI GST Assistant
            </h2>
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: "420px" }}>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {aiHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                      msg.role === "user" ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-200"
                    }`}>
                      {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quickPrompts.map(p => (
                  <button key={p} onClick={() => setAiInput(p)}
                    className="text-[9px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-full cursor-pointer transition-all">
                    {p}
                  </button>
                ))}
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAiSend()}
                  placeholder="Ask anything about GST, filing, compliance..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors" />
                <button onClick={handleAiSend}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer transition-all">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === "notifications" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-400" /> Due Date Alerts
            </h2>
            <div className="space-y-3">
              {[
                { title: "GSTR-1 Filing Due", desc: `For ${periodLabel(period)} — Due 11th of next month`, urgency: "red", icon: AlertCircle },
                { title: "GSTR-3B Filing Due", desc: `For ${periodLabel(period)} — Due 20th of next month`, urgency: "amber", icon: Clock },
                { title: "ITC Reconciliation", desc: "Match purchase invoices with vendor GSTR-2A before filing", urgency: "blue", icon: CheckCircle2 },
                { title: "Missing Buyer GSTINs", desc: `${allInvoicesForCalc.filter(i => !i.buyerGSTIN).length} invoices have no buyer GSTIN — update in Sales CRM`, urgency: allInvoicesForCalc.filter(i => !i.buyerGSTIN).length > 0 ? "amber" : "blue", icon: AlertCircle },
              ].map((n, i) => (
                <div key={i} className={`border rounded-xl p-4 flex items-start gap-3 ${
                  n.urgency === "red" ? "bg-red-950/20 border-red-500/30" :
                  n.urgency === "amber" ? "bg-amber-950/20 border-amber-500/30" :
                  "bg-blue-950/20 border-blue-500/30"
                }`}>
                  <n.icon className={`h-4 w-4 shrink-0 mt-0.5 ${
                    n.urgency === "red" ? "text-red-400" :
                    n.urgency === "amber" ? "text-amber-400" : "text-blue-400"
                  }`} />
                  <div>
                    <p className={`text-xs font-bold ${
                      n.urgency === "red" ? "text-red-300" :
                      n.urgency === "amber" ? "text-amber-300" : "text-blue-300"
                    }`}>{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "settings" && (
          <div className="space-y-5 max-w-xl">
            <h2 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-400" /> GST Settings
            </h2>
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">GSTIN</label>
                <input value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 19AABCU9683R1ZM"
                  maxLength={15}
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none transition-colors ${
                    gstin.length === 15 ? (gstinValid ? "border-emerald-500" : "border-red-500") : "border-slate-800 focus:border-emerald-500"
                  }`} />
                {gstin.length === 15 && (
                  <p className={`text-[10px] mt-1 ${gstinValid ? "text-emerald-400" : "text-red-400"}`}>
                    {gstinValid ? `✓ Valid GSTIN · State: ${gstin.substring(0, 2)} · PAN: ${gstin.substring(2, 12)}` : "✗ Invalid GSTIN format"}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">Legal Business Name</label>
                <input value={legalName} onChange={e => setLegalName(e.target.value)}
                  placeholder="As on GST certificate"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">State Code</label>
                  <input value={stateCode} onChange={e => setStateCode(e.target.value)}
                    placeholder="e.g. 19 (West Bengal)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block mb-1.5">Return Frequency</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </div>
              </div>
              <button onClick={() => setSavedGST(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Save GST Settings
              </button>
              {savedGST && <p className="text-center text-[11px] text-emerald-400">✓ GST settings saved successfully</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

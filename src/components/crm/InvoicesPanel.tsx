import React, { useState } from "react";
import { Plus, Search, Eye, Trash2, Download, Share2, Edit, Package, Wrench } from "lucide-react";
import { Invoice, Customer, Product, BatchStock, ServiceCatalogItem, Company, formatINR } from "../../types";
import { toast } from "../../utils/toast";
import { exportInvoicesCSV } from "../../utils/exportCSV";
import GSTInvoiceBuilder from "./GSTInvoiceBuilder";

interface InvoicesPanelProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  products: Product[];
  batchStocks?: BatchStock[];
  serviceCatalog?: ServiceCatalogItem[];
  onGenerateInvoice: (
    invoiceId: string,
    customerId: string,
    items: Array<{ productId: string; qty: number; itemType?: "product" | "service" }>,
    customTotalAmount?: number
  ) => void;
  companyId: string;
  company?: Company;
  setCompany?: React.Dispatch<React.SetStateAction<Company>>;
}

type LineItemType = "product" | "service";

interface LineItem {
  itemType: LineItemType;
  productId: string;       // product id if product; empty if service
  desc: string;            // service description (or auto from product)
  hsn: string;             // HSN for product, SAC for service
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

function getStock(productId: string, batchStocks: BatchStock[]): number {
  return batchStocks.filter(b => b.productId === productId).reduce((s, b) => s + b.quantity, 0);
}

const BLANK_ITEM = (type: LineItemType = "product"): LineItem => ({
  itemType: type, productId: "", desc: "", hsn: "", qty: 1, unit: "Nos", rate: 0, amount: 0,
});

export default function InvoicesPanel({
  invoices, setInvoices, customers, products, batchStocks = [],
  serviceCatalog = [], onGenerateInvoice, companyId, company, setCompany,
}: InvoicesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGSTBuilder, setShowGSTBuilder] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [gstPct, setGstPct] = useState("18");
  const [lineItems, setLineItems] = useState<LineItem[]>([BLANK_ITEM("product")]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  const resetForm = () => {
    setCustomerId(""); setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate(""); setGstPct("18"); setLineItems([BLANK_ITEM("product")]);
    setNotes(""); setTerms("");
  };

  const handleOpenAdd = () => { resetForm(); setEditingInvoice(null); setShowAddModal(true); };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setCustomerId(inv.customerId);
    setInvoiceDate(inv.createdAt);
    setDueDate(inv.dueDate);
    setNotes(inv.notes || "");
    setTerms(inv.terms || "");
    setGstPct(inv.taxAmount && inv.subtotal && inv.subtotal > 0
      ? Math.round((inv.taxAmount / inv.subtotal) * 100).toString() : "18");
    setLineItems(inv.items && inv.items.length > 0
      ? inv.items.map(it => ({
          itemType: (it.itemType ?? "product") as LineItemType,
          productId: it.productId,
          desc: it.description || products.find(p => p.id === it.productId)?.name || "",
          hsn: it.hsn || "",
          qty: it.quantity,
          unit: it.unit || "Nos",
          rate: it.unitPrice,
          amount: it.quantity * it.unitPrice,
        }))
      : [BLANK_ITEM("product")]);
    setShowAddModal(true);
  };

  // When switching a line item's type, reset fields appropriately
  const handleTypeToggle = (idx: number, type: LineItemType) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return BLANK_ITEM(type);
    }));
  };

  const handleUpdateLineItem = (idx: number, key: keyof LineItem, val: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [key]: val };
      if (key === "productId" && item.itemType === "product") {
        const prod = products.find(p => p.id === val);
        if (prod) {
          updated.desc = prod.name;
          updated.rate = prod.sellingPrice ?? 0;
          updated.unit = prod.unit || "Nos";
          updated.amount = updated.qty * (prod.sellingPrice ?? 0);
        }
      }
      if (key === "qty" || key === "rate") {
        const q = key === "qty" ? Number(val) : updated.qty;
        const r = key === "rate" ? Number(val) : updated.rate;
        updated.amount = q * r;
      }
      return updated;
    }));
  };

  // Quick-pick from service catalog
  const handlePickService = (idx: number, svcId: string) => {
    const svc = serviceCatalog.find(s => s.id === svcId);
    if (!svc) return;
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        itemType: "service",
        productId: svcId,
        desc: svc.name,
        hsn: svc.sacCode,
        unit: svc.unit,
        rate: svc.defaultRate,
        qty: 1,
        amount: svc.defaultRate,
      };
    }));
  };

  const subtotalSum = lineItems.reduce((s, i) => s + i.amount, 0);
  const gstTax = subtotalSum * (parseFloat(gstPct) / 100);
  const totalSum = subtotalSum + gstTax;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (lineItems.some(i => i.itemType === "product" && !i.productId)) {
      toast.error("All product lines need a product selected"); return;
    }
    if (lineItems.some(i => i.itemType === "service" && !i.desc)) {
      toast.error("All service lines need a description"); return;
    }
    if (lineItems.some(i => i.qty <= 0)) {
      toast.error("All line items need quantity > 0"); return;
    }

    const invId = editingInvoice?.id ?? `inv-${Date.now()}`;
    const invoiceNumber = editingInvoice?.invoiceNumber
      ?? `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, "0")}`;

    const invoiceItems = lineItems.map(li => ({
      itemType: li.itemType,
      productId: li.productId,
      description: li.desc,
      hsn: li.hsn,
      unit: li.unit,
      quantity: li.qty,
      unitPrice: li.rate,
    }));

    const stockItems = lineItems.map(li => ({
      productId: li.productId,
      qty: li.qty,
      itemType: li.itemType,
    }));

    onGenerateInvoice(invId, customerId, stockItems, totalSum);

    const inv: Invoice = {
      id: invId, invoiceNumber, customerId, branchId: "br-hq",
      items: invoiceItems, subtotal: subtotalSum, taxAmount: gstTax,
      totalAmount: totalSum, status: editingInvoice?.status ?? "unpaid",
      createdAt: invoiceDate, dueDate: dueDate || invoiceDate,
      notes: notes || "", terms: terms || "",
    };

    if (editingInvoice) {
      setInvoices(prev => prev.map(x => x.id === invId ? inv : x));
      toast.success("Invoice Updated", invoiceNumber);
    } else {
      setInvoices(prev => [inv, ...prev]);
      toast.success("Invoice Created", `${invoiceNumber} — ${formatINR(totalSum)}`);
    }
    setShowAddModal(false); setEditingInvoice(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Void this invoice?")) return;
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.warning("Invoice Voided", "Invoice removed");
  };

  const downloadInvoicePDF = (inv: Invoice) => {
    const cust = customers.find(c => c.id === inv.customerId);
    const subtotal = inv.subtotal || 0;
    const tax = inv.taxAmount || 0;
    const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const rows = (inv.items || []).map((item, idx) => {
      const isService = item.itemType === "service";
      const label = item.description || (isService ? "Service" : products.find(p => p.id === item.productId)?.name || "—");
      return `
      <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}">
        <td style="padding:10px 12px;font-size:12px;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:500;">${label}${isService ? ' <span style="font-size:9px;background:#ede9fe;color:#7c3aed;padding:2px 5px;border-radius:3px;font-weight:700;">SERVICE</span>' : ''}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:center;font-family:monospace;">${item.hsn || "—"}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:center;">${item.unit || "Nos"}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;">${item.quantity}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;">${inr(item.unitPrice)}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;font-weight:600;">${inr(item.quantity * item.unitPrice)}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoiceNumber}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:#1e293b;background:#fff}.page{max-width:794px;margin:auto;padding:40px}.no-print{background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-weight:700;cursor:pointer;font-size:13px;margin-bottom:20px}@media print{.no-print{display:none}.page{padding:20px}}table{width:100%;border-collapse:collapse}thead tr{background:#1e293b;color:#fff}th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}td{border-bottom:1px solid #f1f5f9}</style>
</head><body><div class="page">
<div style="text-align:center;margin-bottom:16px"><button class="no-print" onclick="window.print()">Print / Save as PDF</button></div>
<div style="display:flex;justify-content:space-between;border-bottom:3px solid #4f46e5;padding-bottom:16px;margin-bottom:20px">
  <div><div style="font-size:22px;font-weight:800;color:#4f46e5;">${company?.name || "Your Company"}</div><div style="font-size:11px;color:#64748b;margin-top:3px">${company?.email || ""}</div></div>
  <div style="text-align:right"><div style="background:#4f46e5;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;display:inline-block;margin-bottom:4px">TAX INVOICE</div><div style="font-size:18px;font-weight:800;font-family:monospace">${inv.invoiceNumber}</div></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;background:#f8fafc">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Bill To</div>
    <div style="font-size:13px;font-weight:700;">${cust?.name || "—"}</div>
    <div style="font-size:11px;color:#475569;margin-top:3px">${cust?.email || ""} · ${cust?.phone || ""}</div>
  </div>
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;background:#f8fafc">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Invoice Details</div>
    <div style="font-size:12px;line-height:2"><strong>Invoice No.:</strong> ${inv.invoiceNumber}<br><strong>Date:</strong> ${inv.createdAt}<br><strong>Due:</strong> ${inv.dueDate}<br><strong>Status:</strong> ${inv.status.toUpperCase()}</div>
  </div>
</div>
<table><thead><tr><th style="width:36px">#</th><th style="text-align:left">Description</th><th style="width:80px">HSN/SAC</th><th style="width:56px">Unit</th><th style="width:60px">Qty</th><th style="width:110px">Rate (₹)</th><th style="width:120px">Amount (₹)</th></tr></thead><tbody>${rows}</tbody></table>
<div style="display:flex;justify-content:flex-end;margin:20px 0">
  <div style="width:280px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:12px;border-bottom:1px solid #f1f5f9"><span>Subtotal</span><span style="font-family:monospace">${inr(subtotal)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:12px;border-bottom:1px solid #f1f5f9"><span>GST/Tax</span><span style="font-family:monospace">${inr(tax)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:12px 14px;font-size:14px;font-weight:800;background:#4f46e5;color:#fff"><span>GRAND TOTAL</span><span style="font-family:monospace">${inr(inv.totalAmount)}</span></div>
  </div>
</div>
${inv.notes ? `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:11px;color:#475569;margin-bottom:16px"><strong>Notes:</strong> ${inv.notes}</div>` : ""}
<div style="border-top:1px solid #e2e8f0;padding-top:14px;font-size:10px;color:#94a3b8;text-align:center">Computer-generated Tax Invoice · ${company?.name || "Your Company"} · ${company?.email || ""}</div>
</div></body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    else toast.warning("Popup Blocked", "Allow popups to print");
  };

  const filtered = invoices.filter(inv => {
    const cust = customers.find(c => c.id === inv.customerId);
    return inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cust?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
  });

  const hasServices = lineItems.some(i => i.itemType === "service");
  const hasProducts = lineItems.some(i => i.itemType === "product");

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text" placeholder="Search invoices..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportInvoicesCSV(invoices, customers)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer">
            <Share2 className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button onClick={() => setShowGSTBuilder(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer">
            <Plus className="h-3.5 w-3.5" /> New GST Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Invoice No.</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 font-mono">Total</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No invoices found.</td></tr>
            ) : filtered.map(inv => {
              const cust = customers.find(c => c.id === inv.customerId);
              const invHasSvc = inv.items?.some(i => i.itemType === "service");
              const invHasProd = inv.items?.some(i => !i.itemType || i.itemType === "product");
              return (
                <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{cust?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{inv.createdAt}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{inv.dueDate}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">{formatINR(inv.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {invHasProd && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"><Package className="h-2.5 w-2.5" />Prod</span>}
                      {invHasSvc && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20"><Wrench className="h-2.5 w-2.5" />Svc</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      inv.status === "partially_paid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewingInvoice(inv)} className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleOpenEdit(inv)} className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => downloadInvoicePDF(inv)} className="p-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/10 rounded cursor-pointer"><Download className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form onSubmit={handleSaveInvoice}
            className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4 my-8">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">{editingInvoice ? "Edit Invoice" : "New Invoice"}</h3>
              <button type="button" onClick={() => { setShowAddModal(false); setEditingInvoice(null); }}
                className="text-slate-400 hover:text-white font-bold text-lg leading-none">×</button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1">
              {/* Customer + Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Customer *</label>
                  <select required value={customerId} onChange={e => setCustomerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="">— Select Customer —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Invoice Date</label>
                  <input type="date" required value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Due Date *</label>
                  <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Line Items *</span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setLineItems(p => [...p, BLANK_ITEM("product")])}
                      className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer">
                      <Package className="h-3 w-3" /> + Product
                    </button>
                    <button type="button" onClick={() => setLineItems(p => [...p, BLANK_ITEM("service")])}
                      className="flex items-center gap-1 px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-[10px] font-bold cursor-pointer">
                      <Wrench className="h-3 w-3" /> + Service
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className={`border rounded-lg overflow-hidden ${
                      item.itemType === "service"
                        ? "border-violet-500/25 bg-violet-500/5"
                        : "border-slate-800 bg-slate-900/40"
                    }`}>
                      {/* Line header with type badge */}
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.itemType === "service"
                              ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                              : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                          }`}>
                            {item.itemType === "service" ? <Wrench className="h-2.5 w-2.5" /> : <Package className="h-2.5 w-2.5" />}
                            {item.itemType === "service" ? "Service" : "Product"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Line {idx + 1}</span>
                          {/* Toggle buttons */}
                          <div className="flex gap-1 ml-1">
                            <button type="button" onClick={() => handleTypeToggle(idx, "product")}
                              className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-bold border transition-all ${item.itemType === "product" ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/30" : "text-slate-500 border-slate-700 hover:text-slate-300"}`}>
                              Product
                            </button>
                            <button type="button" onClick={() => handleTypeToggle(idx, "service")}
                              className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-bold border transition-all ${item.itemType === "service" ? "bg-violet-600/20 text-violet-400 border-violet-500/30" : "text-slate-500 border-slate-700 hover:text-slate-300"}`}>
                              Service
                            </button>
                          </div>
                        </div>
                        {lineItems.length > 1 && (
                          <button type="button" onClick={() => setLineItems(p => p.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 font-bold text-sm cursor-pointer">×</button>
                        )}
                      </div>

                      {/* Line fields */}
                      <div className="p-2 grid grid-cols-12 gap-2 text-[10px]">
                        {/* Product: dropdown. Service: catalog pick + free text */}
                        <div className={item.itemType === "service" ? "col-span-5" : "col-span-5"}>
                          {item.itemType === "product" ? (
                            <>
                              <label className="block text-slate-500 mb-0.5 font-mono uppercase">Product (Stock)</label>
                              <select required value={item.productId}
                                onChange={e => handleUpdateLineItem(idx, "productId", e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white focus:outline-none">
                                <option value="">— Select Product —</option>
                                {products.map(p => {
                                  const stock = getStock(p.id, batchStocks);
                                  return <option key={p.id} value={p.id}>{p.name} ({stock} in stock)</option>;
                                })}
                              </select>
                            </>
                          ) : (
                            <>
                              <label className="block text-slate-500 mb-0.5 font-mono uppercase">Service Description *</label>
                              <div className="flex gap-1">
                                <input required type="text" value={item.desc}
                                  onChange={e => handleUpdateLineItem(idx, "desc", e.target.value)}
                                  placeholder="Service description..."
                                  className="flex-1 bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white focus:outline-none" />
                                {serviceCatalog.length > 0 && (
                                  <select
                                    onChange={e => { if (e.target.value) handlePickService(idx, e.target.value); e.target.value = ""; }}
                                    className="bg-violet-900/30 border border-violet-500/30 text-violet-300 rounded p-1 text-[9px] focus:outline-none cursor-pointer"
                                    defaultValue=""
                                  >
                                    <option value="">Catalog</option>
                                    {serviceCatalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <div className="col-span-2">
                          <label className="block text-slate-500 mb-0.5 font-mono uppercase">{item.itemType === "service" ? "SAC" : "HSN"}</label>
                          <input type="text" value={item.hsn}
                            onChange={e => handleUpdateLineItem(idx, "hsn", e.target.value)}
                            placeholder={item.itemType === "service" ? "998311" : "HSN"}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none" />
                        </div>

                        <div className="col-span-1">
                          <label className="block text-slate-500 mb-0.5 font-mono uppercase">Qty</label>
                          <input type="number" min={1} required value={item.qty}
                            onChange={e => handleUpdateLineItem(idx, "qty", Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none" />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-slate-500 mb-0.5 font-mono uppercase">Rate ₹</label>
                          <input type="number" min={0} value={item.rate}
                            onChange={e => handleUpdateLineItem(idx, "rate", Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none" />
                        </div>

                        <div className="col-span-2 flex flex-col justify-end">
                          <label className="block text-slate-500 mb-0.5 font-mono uppercase">Amount</label>
                          <div className={`font-mono font-bold text-xs p-1 ${item.itemType === "service" ? "text-violet-400" : "text-slate-200"}`}>
                            {formatINR(item.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 mt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">GST %</span>
                    <select value={gstPct} onChange={e => setGstPct(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1 text-xs text-white focus:outline-none font-mono">
                      <option value="18">18%</option>
                      <option value="12">12%</option>
                      <option value="5">5%</option>
                      <option value="0">0%</option>
                    </select>
                    {/* Composition badges */}
                    <div className="flex gap-1 ml-2">
                      {hasProducts && <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold">Products</span>}
                      {hasServices && <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded font-bold">Services</span>}
                    </div>
                  </div>
                  <div className="text-right font-mono space-y-0.5 text-slate-400">
                    <div>Subtotal: <span className="text-slate-200 font-bold">{formatINR(subtotalSum)}</span></div>
                    <div>GST ({gstPct}%): <span className="text-slate-200 font-bold">{formatINR(gstTax)}</span></div>
                    <div className="text-emerald-400 font-bold text-sm border-t border-slate-800 pt-0.5">Total: {formatINR(totalSum)}</div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Payment instructions, bank details..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Terms & Conditions</label>
                  <textarea rows={2} value={terms} onChange={e => setTerms(e.target.value)}
                    placeholder="Payment due within 30 days..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => { setShowAddModal(false); setEditingInvoice(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                {editingInvoice ? "Save Changes" : "Create Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-400">{viewingInvoice.invoiceNumber}</span>
              <button onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>Customer: <span className="text-white font-semibold">{customers.find(c => c.id === viewingInvoice.customerId)?.name ?? "—"}</span></div>
                <div>Status: <span className="text-indigo-400 font-semibold uppercase">{viewingInvoice.status}</span></div>
                <div>Date: <span className="text-white font-semibold">{viewingInvoice.createdAt}</span></div>
                <div>Due: <span className="text-white font-semibold">{viewingInvoice.dueDate}</span></div>
              </div>
              <div className="border-t border-slate-800 pt-2 text-right">
                <span className="text-slate-500 block text-[10px]">Total Amount</span>
                <strong className="text-base text-emerald-400 font-mono">{formatINR(viewingInvoice.totalAmount)}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => downloadInvoicePDF(viewingInvoice)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button onClick={() => setViewingInvoice(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* GST Invoice Builder */}
      {showGSTBuilder && company && setCompany && (
        <GSTInvoiceBuilder
          company={company}
          setCompany={setCompany}
          customers={customers}
          products={products}
          batchStocks={batchStocks}
          serviceCatalog={serviceCatalog}
          invoices={invoices}
          onSave={(invoice) => {
            setInvoices(prev => [invoice, ...prev]);
            onGenerateInvoice(
              invoice.id,
              invoice.customerId,
              invoice.items.map(it => ({ productId: it.productId, qty: it.quantity, itemType: it.itemType })),
              invoice.totalAmount,
            );
            setShowGSTBuilder(false);
          }}
          onClose={() => setShowGSTBuilder(false)}
        />
      )}
      {showGSTBuilder && (!company || !setCompany) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-white text-sm max-w-md">
            <p className="mb-4">Company profile not loaded. Please reload the page and try again.</p>
            <button onClick={() => setShowGSTBuilder(false)} className="px-4 py-2 bg-slate-700 rounded-lg cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

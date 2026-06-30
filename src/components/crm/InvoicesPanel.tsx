import React, { useState } from "react";
import { Plus, Search, Eye, Trash2, Download, Share2, Edit } from "lucide-react";
import { Invoice, Customer, Product, BatchStock, formatINR } from "../../types";
import { toast } from "../../utils/toast";
import { exportInvoicesCSV } from "../../utils/exportCSV";

interface InvoicesPanelProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  products: Product[];
  batchStocks?: BatchStock[];
  onGenerateInvoice: (invoiceId: string, customerId: string, items: Array<{ productId: string; qty: number }>, customTotalAmount?: number) => void;
  companyId: string;
}

interface LineItem {
  productId: string;
  desc: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

function getStock(productId: string, batchStocks: BatchStock[]): number {
  return batchStocks.filter(b => b.productId === productId).reduce((s, b) => s + b.quantity, 0);
}

const BLANK_ITEM = (): LineItem => ({
  productId: "", desc: "", hsn: "", qty: 1, unit: "Nos", rate: 0, amount: 0,
});

export default function InvoicesPanel({
  invoices,
  setInvoices,
  customers,
  products,
  batchStocks = [],
  onGenerateInvoice,
  companyId,
}: InvoicesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [gstPct, setGstPct] = useState("18");
  const [lineItems, setLineItems] = useState<LineItem[]>([BLANK_ITEM()]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  const resetForm = () => {
    setCustomerId(""); setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate(""); setGstPct("18"); setLineItems([BLANK_ITEM()]);
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
          productId: it.productId,
          desc: it.description || products.find(p => p.id === it.productId)?.name || "",
          hsn: it.hsn || "",
          qty: it.quantity,
          unit: it.unit || "Nos",
          rate: it.unitPrice,
          amount: it.quantity * it.unitPrice,
        }))
      : [BLANK_ITEM()]);
    setShowAddModal(true);
  };

  const handleUpdateLineItem = (idx: number, key: keyof LineItem, val: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [key]: val };
      if (key === "productId") {
        const prod = products.find(p => p.id === val);
        if (prod) {
          updated.desc = prod.name;
          updated.rate = prod.sellingPrice ?? 0;
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

  const subtotalSum = lineItems.reduce((s, i) => s + i.amount, 0);
  const gstTax = subtotalSum * (parseFloat(gstPct) / 100);
  const totalSum = subtotalSum + gstTax;

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (lineItems.some(i => !i.productId || i.qty <= 0)) {
      toast.error("Each line item needs a product and quantity"); return;
    }

    const invId = editingInvoice?.id ?? `inv-${Date.now()}`;
    const invoiceNumber = editingInvoice?.invoiceNumber
      ?? `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, "0")}`;

    const invoiceItems = lineItems.map(li => ({
      productId: li.productId,
      description: li.desc,
      hsn: li.hsn,
      unit: li.unit,
      quantity: li.qty,
      unitPrice: li.rate,
    }));

    const stockItems = lineItems.map(li => ({ productId: li.productId, qty: li.qty }));
    onGenerateInvoice(invId, customerId, stockItems, totalSum);

    const inv: Invoice = {
      id: invId,
      invoiceNumber,
      customerId,
      branchId: "br-hq",
      items: invoiceItems,
      subtotal: subtotalSum,
      taxAmount: gstTax,
      totalAmount: totalSum,
      status: editingInvoice?.status ?? "unpaid",
      createdAt: invoiceDate,
      dueDate: dueDate || invoiceDate,
      notes: notes || "",
      terms: terms || "",
    };

    if (editingInvoice) {
      setInvoices(prev => prev.map(x => x.id === invId ? inv : x));
      toast.success("Invoice Updated", `${invoiceNumber} saved`);
    } else {
      setInvoices(prev => [inv, ...prev]);
      toast.success("Invoice Created", `${invoiceNumber} — ${formatINR(totalSum)}`);
    }
    setShowAddModal(false);
    setEditingInvoice(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Void this invoice?")) return;
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.warning("Invoice Voided", "The invoice has been removed");
  };

  const downloadInvoicePDF = (inv: Invoice) => {
    const cust = customers.find(c => c.id === inv.customerId);
    const subtotal = inv.subtotal || 0;
    const tax = inv.taxAmount || 0;

    const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

    const rows = (inv.items || []).map((item, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}">
        <td style="padding:10px 12px;font-size:12px;">${idx + 1}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:500;">${item.description || products.find(p => p.id === item.productId)?.name || "—"}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:center;font-family:monospace;">${item.hsn || "—"}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:center;">${item.unit || "Nos"}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;">${item.quantity}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;">${inr(item.unitPrice)}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;font-weight:600;">${inr(item.quantity * item.unitPrice)}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoiceNumber}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:#1e293b;background:#fff;padding:0}.page{max-width:794px;margin:auto;padding:40px}.no-print{background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-weight:700;cursor:pointer;font-size:13px;margin-bottom:20px}@media print{.no-print{display:none}.page{padding:20px}}table{width:100%;border-collapse:collapse}thead tr{background:#1e293b;color:#fff}th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}td{border-bottom:1px solid #f1f5f9}</style>
</head><body><div class="page">
<div style="text-align:center;margin-bottom:16px"><button class="no-print" onclick="window.print()">Print / Save as PDF</button></div>
<div style="display:flex;justify-content:space-between;border-bottom:3px solid #4f46e5;padding-bottom:16px;margin-bottom:20px">
  <div><div style="font-size:22px;font-weight:800;color:#4f46e5;">DEINRIM OMS</div><div style="font-size:11px;color:#64748b;margin-top:3px">deinrim360.in</div></div>
  <div style="text-align:right"><div style="background:#4f46e5;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;display:inline-block;margin-bottom:4px">TAX INVOICE</div><div style="font-size:18px;font-weight:800;font-family:monospace">${inv.invoiceNumber}</div></div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;background:#f8fafc">
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Bill To</div>
    <div style="font-size:13px;font-weight:700;">${cust?.name || "—"}</div>
    <div style="font-size:11px;color:#475569;margin-top:3px">${cust?.email || ""}<br>${cust?.phone || ""}</div>
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
    <div style="display:flex;justify-content:space-between;padding:8px 14px;font-size:12px;border-bottom:1px solid #f1f5f9"><span>GST</span><span style="font-family:monospace">${inr(tax)}</span></div>
    <div style="display:flex;justify-content:space-between;padding:12px 14px;font-size:14px;font-weight:800;background:#4f46e5;color:#fff"><span>GRAND TOTAL</span><span style="font-family:monospace">${inr(inv.totalAmount)}</span></div>
  </div>
</div>
${inv.notes ? `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:11px;color:#475569;margin-bottom:16px"><strong>Notes:</strong> ${inv.notes}</div>` : ""}
<div style="border-top:1px solid #e2e8f0;padding-top:14px;font-size:10px;color:#94a3b8;text-align:center">Computer-generated Tax Invoice · DEINRIM OMS · deinrim360.in</div>
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

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoicesCSV(invoices, customers)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Invoice
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
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No invoices found.</td></tr>
            ) : filtered.map(inv => {
              const cust = customers.find(c => c.id === inv.customerId);
              return (
                <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{cust?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{inv.createdAt}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{inv.dueDate}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">{formatINR(inv.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      inv.status === "partially_paid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewingInvoice(inv)} className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleOpenEdit(inv)} className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => downloadInvoicePDF(inv)} className="p-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/10 rounded cursor-pointer" title="PDF"><Download className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded cursor-pointer" title="Void"><Trash2 className="h-3.5 w-3.5" /></button>
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
          <form
            onSubmit={handleSaveInvoice}
            className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4 my-8"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">{editingInvoice ? "Edit Invoice" : "New Invoice"}</h3>
              <button type="button" onClick={() => { setShowAddModal(false); setEditingInvoice(null); }} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-1">
              {/* Customer + Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
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
                  <button type="button" onClick={() => setLineItems(p => [...p, BLANK_ITEM()])}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer">
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="border border-slate-800 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-800 text-[10px]">
                    <thead className="bg-slate-900/60 text-slate-300 font-semibold">
                      <tr>
                        <th className="px-2 py-2 text-left">Product (Stock)</th>
                        <th className="px-2 py-2 w-20">HSN</th>
                        <th className="px-2 py-2 w-14">Qty</th>
                        <th className="px-2 py-2 w-24">Rate ₹</th>
                        <th className="px-2 py-2 text-right w-24">Amount</th>
                        <th className="px-2 py-2 w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1.5">
                            <select
                              required
                              value={item.productId}
                              onChange={e => handleUpdateLineItem(idx, "productId", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value="">— Select Product —</option>
                              {products.map(p => {
                                const stock = getStock(p.id, batchStocks);
                                return <option key={p.id} value={p.id}>{p.name} ({stock} in stock)</option>;
                              })}
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="text" value={item.hsn} onChange={e => handleUpdateLineItem(idx, "hsn", e.target.value)}
                              placeholder="HSN" className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={1} required value={item.qty}
                              onChange={e => handleUpdateLineItem(idx, "qty", Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none" />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" min={0} value={item.rate}
                              onChange={e => handleUpdateLineItem(idx, "rate", Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-[10px] text-white font-mono focus:outline-none" />
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-300">
                            {formatINR(item.amount)}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            {lineItems.length > 1 && (
                              <button type="button" onClick={() => setLineItems(p => p.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-300 font-bold text-sm">×</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* GST + Totals */}
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

      {/* View Invoice Modal */}
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
              {viewingInvoice.notes && (
                <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-slate-400 text-[10px]">
                  <strong>Notes:</strong> {viewingInvoice.notes}
                </div>
              )}
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
    </div>
  );
}

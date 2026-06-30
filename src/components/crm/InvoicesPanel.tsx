import React, { useState } from "react";
import { Plus, Search, Eye, Trash2, FileText, Edit, Download, Share2 } from "lucide-react";
import { Invoice, Customer, Product, formatINR } from "../../types";
import { toast } from "../../utils/toast";
import { exportInvoicesCSV } from "../../utils/exportCSV";

interface InvoicesPanelProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  products: Product[];
  onGenerateInvoice: (invoiceId: string, customerId: string, items: Array<{ productId: string; qty: number }>, customTotalAmount?: number) => void;
  companyId: string;
}

export default function InvoicesPanel({ 
  invoices, 
  setInvoices, 
  customers, 
  products, 
  onGenerateInvoice,
  companyId
}: InvoicesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [dealId, setDealId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [gstPct, setGstPct] = useState("18");
  const [lineItems, setLineItems] = useState<Array<{ desc: string; hsn: string; qty: number; unit: string; rate: number; amount: number }>>([
    { desc: "", hsn: "998311", qty: 1, unit: "Nos", rate: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  const handleOpenAdd = () => {
    setCustomerId("");
    setQuotationId("");
    setDealId("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setGstPct("18");
    setLineItems([{ desc: "", hsn: "998311", qty: 1, unit: "Nos", rate: 0, amount: 0 }]);
    setNotes("");
    setTerms("");
    setShowAddModal(true);
  };

  const handleOpenEdit = (inv: Invoice) => {
    setEditingInvoice(inv);
    setCustomerId(inv.customerId);
    setInvoiceDate(inv.createdAt);
    setDueDate(inv.dueDate);
    const notesParts = (inv.notes || "").split(" | HSN: ");
    setNotes(notesParts[0] || "");
    setTerms(inv.terms || "");
    
    const customLineItems = inv.items && inv.items.length > 0 ? inv.items.map(it => {
      const prodName = products.find(p => p.id === it.productId)?.name || "Enterprise Workspace Licence";
      return {
        desc: prodName,
        hsn: notesParts[1] || "998311",
        qty: it.quantity,
        unit: "Nos",
        rate: it.unitPrice,
        amount: it.quantity * it.unitPrice
      };
    }) : [{ desc: "Enterprise SLA Item", hsn: "998311", qty: 1, unit: "Nos", rate: inv.subtotal || 0, amount: inv.subtotal || 0 }];
    
    setLineItems(customLineItems);
    setGstPct(inv.taxAmount && inv.subtotal ? Math.round((inv.taxAmount / inv.subtotal) * 100).toString() : "18");
  };

  const handleSaveEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice || !customerId) return;

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxPct = parseFloat(gstPct) / 100;
    const taxAmount = subtotal * taxPct;
    const totalAmount = subtotal + taxAmount;

    const matchedProduct = products[0]?.id || "prod-1";
    // Propagate correct financial calculations to double-entry ledger!
    onGenerateInvoice(editingInvoice.id, customerId, [{ productId: matchedProduct, qty: 1 }], totalAmount);

    setInvoices(prev => prev.map(inv => {
      if (inv.id === editingInvoice.id) {
        return {
          ...inv,
          customerId,
          items: lineItems.map(li => ({
            productId: matchedProduct,
            description: li.desc,
            hsn: li.hsn,
            unit: li.unit,
            quantity: li.qty,
            unitPrice: li.rate,
          })),
          subtotal,
          taxAmount,
          totalAmount,
          createdAt: invoiceDate,
          dueDate: dueDate || invoiceDate,
          notes: notes || "",
          terms: terms || "",
        };
      }
      return inv;
    }));
    setEditingInvoice(null);
    toast.success("Invoice Updated", `${editingInvoice.invoiceNumber} saved successfully`);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { desc: "", hsn: "998311", qty: 1, unit: "Nos", rate: 0, amount: 0 }]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleUpdateLineItem = (idx: number, key: any, val: any) => {
    const updated = lineItems.map((item, i) => {
      if (i === idx) {
        const copy = { ...item, [key]: val };
        if (key === "qty" || key === "rate") {
          const q = key === "qty" ? Number(val) : copy.qty;
          const r = key === "rate" ? Number(val) : copy.rate;
          copy.amount = q * r;
        }
        return copy;
      }
      return item;
    });
    setLineItems(updated);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxPct = parseFloat(gstPct) / 100;
    const taxAmount = subtotal * taxPct;
    const totalAmount = subtotal + taxAmount;

    const invoiceNumber = `INV-2026-${String(invoices.length + 1).padStart(4, "0")}`;
    const invId = `inv-${Date.now()}`;
    const matchedProduct = products[0]?.id || "prod-1";

    onGenerateInvoice(invId, customerId, [{ productId: matchedProduct, qty: 1 }], totalAmount);

    const newInv: Invoice = {
      id: invId,
      invoiceNumber,
      customerId,
      branchId: "br-hq",
      items: lineItems.map(li => ({
        productId: matchedProduct,
        description: li.desc,
        hsn: li.hsn,
        unit: li.unit,
        quantity: li.qty,
        unitPrice: li.rate,
      })),
      subtotal,
      taxAmount,
      totalAmount,
      status: "unpaid",
      createdAt: invoiceDate,
      dueDate: dueDate || invoiceDate,
      notes: notes || "",
      terms: terms || "",
    };

    setInvoices(prev => [newInv, ...prev]);
    setShowAddModal(false);
    toast.success("Invoice Created", `${invoiceNumber} — ${formatINR(totalAmount)}`);
  };

  const downloadInvoicePDF = (inv: Invoice) => {
    const cust = customers.find(c => c.id === inv.customerId);
    const subtotal = inv.subtotal || 0;
    const taxTotal = inv.taxAmount || 0;
    const cgst = taxTotal / 2;
    const sgst = taxTotal / 2;

    const inr = (n: number) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const rowsBg = ["#ffffff", "#f8fafc"];
    const lineItemsHtml = (inv.items || []).map((item, idx) => {
      const desc = item.description || `Service Item #${idx + 1}`;
      const hsn  = item.hsn  || "998311";
      const unit = item.unit || "Nos";
      const amt  = item.quantity * item.unitPrice;
      return `
        <tr style="background:${rowsBg[idx % 2]}">
          <td style="padding:10px 12px;font-size:12px;">${idx + 1}</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:500;">${desc}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;font-family:monospace;">${hsn}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:center;">${unit}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;">${item.quantity}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;">${inr(item.unitPrice)}</td>
          <td style="padding:10px 12px;font-size:12px;text-align:right;font-family:monospace;font-weight:600;">${inr(amt)}</td>
        </tr>`;
    }).join("") || `<tr><td colspan="7" style="padding:16px;text-align:center;color:#64748b;">No line items.</td></tr>`;

    const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<title>TAX INVOICE — ${inv.invoiceNumber}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,-apple-system,sans-serif;color:#1e293b;background:#fff;padding:0}
  .page{max-width:794px;margin:auto;padding:40px}
  .no-print{background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:10px 22px;font-weight:700;cursor:pointer;font-size:13px;margin-bottom:20px}
  .no-print:hover{background:#4338ca}
  @media print{.no-print{display:none}.page{padding:20px}}
  .logo-row{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #4f46e5;padding-bottom:16px;margin-bottom:20px}
  .company-name{font-size:22px;font-weight:800;color:#4f46e5;letter-spacing:-0.02em}
  .company-sub{font-size:11px;color:#64748b;margin-top:3px}
  .inv-badge{background:#4f46e5;color:#fff;font-size:11px;font-weight:700;letter-spacing:.1em;padding:4px 10px;border-radius:4px;display:inline-block;margin-bottom:4px}
  .inv-num{font-size:18px;font-weight:800;color:#1e293b;font-family:monospace}
  .meta-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
  .meta-box{border:1px solid #e2e8f0;border-radius:8px;padding:14px;background:#f8fafc}
  .meta-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px}
  .meta-val{font-size:13px;font-weight:700;color:#0f172a}
  .meta-sub{font-size:11px;color:#475569;margin-top:3px;line-height:1.5}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px}
  thead tr{background:#1e293b;color:#fff}
  th{padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
  th:not(:first-child){text-align:right}
  th:nth-child(3),th:nth-child(4),th:nth-child(5){text-align:center}
  td{border-bottom:1px solid #f1f5f9}
  .totals-box{display:flex;justify-content:flex-end;margin-bottom:24px}
  .totals-inner{width:280px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  .totals-row{display:flex;justify-content:space-between;padding:8px 14px;font-size:12px;border-bottom:1px solid #f1f5f9}
  .totals-row:last-child{border-bottom:none;background:#4f46e5;color:#fff;font-weight:800;font-size:14px;padding:12px 14px}
  .notice{border:1px solid #e2e8f0;border-radius:8px;padding:14px;font-size:11px;color:#475569;line-height:1.6;margin-bottom:20px}
  .footer{border-top:1px solid #e2e8f0;padding-top:14px;font-size:10px;color:#94a3b8;text-align:center}
  .status-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;background:${inv.status==="paid"?"#dcfce7":"#fef3c7"};color:${inv.status==="paid"?"#15803d":"#92400e"}}
</style></head><body>
<div class="page">
  <div style="text-align:center;margin-bottom:16px">
    <button class="no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="logo-row">
    <div>
      <div class="company-name">DEINRIM OMS</div>
      <div class="company-sub">Enterprise Office Management System · deinrim360.in</div>
    </div>
    <div style="text-align:right">
      <div class="inv-badge">TAX INVOICE</div>
      <div class="inv-num">${inv.invoiceNumber}</div>
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-box">
      <div class="meta-label">Bill To</div>
      <div class="meta-val">${cust?.name || "—"}</div>
      <div class="meta-sub">
        ${cust?.address ? `${cust.address}<br>` : ""}
        ${cust?.gstin ? `<strong>GSTIN:</strong> ${cust.gstin}<br>` : ""}
        ${cust?.email || ""} · ${cust?.phone || ""}
      </div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Invoice Details</div>
      <div class="meta-sub" style="font-size:12px;line-height:2">
        <strong>Invoice No.:</strong> ${inv.invoiceNumber}<br>
        <strong>Invoice Date:</strong> ${inv.createdAt}<br>
        <strong>Due Date:</strong> ${inv.dueDate}<br>
        <strong>Status:</strong> <span class="status-badge">${inv.status}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th style="text-align:left">Description of Goods / Services</th>
        <th style="width:80px">HSN/SAC</th>
        <th style="width:56px">Unit</th>
        <th style="width:60px">Qty</th>
        <th style="width:110px">Rate (₹)</th>
        <th style="width:120px">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>${lineItemsHtml}</tbody>
  </table>

  <div class="totals-box">
    <div class="totals-inner">
      <div class="totals-row"><span>Subtotal</span><span style="font-family:monospace">${inr(subtotal)}</span></div>
      <div class="totals-row"><span>CGST (${(taxTotal / subtotal * 50).toFixed(0)}%)</span><span style="font-family:monospace">${inr(cgst)}</span></div>
      <div class="totals-row"><span>SGST (${(taxTotal / subtotal * 50).toFixed(0)}%)</span><span style="font-family:monospace">${inr(sgst)}</span></div>
      <div class="totals-row"><span>GRAND TOTAL</span><span style="font-family:monospace">${inr(inv.totalAmount)}</span></div>
    </div>
  </div>

  ${inv.notes || inv.terms ? `
  <div class="notice">
    ${inv.notes ? `<div><strong>Notes / Payment Instructions:</strong><br>${inv.notes}</div>` : ""}
    ${inv.notes && inv.terms ? "<br>" : ""}
    ${inv.terms ? `<div><strong>Terms &amp; Conditions:</strong><br>${inv.terms}</div>` : ""}
  </div>` : ""}

  <div class="footer">
    This is a computer-generated Tax Invoice. No physical signature required.<br>
    Generated by DEINRIM OMS · deinrim360.in · ${new Date().toLocaleDateString("en-IN")}
  </div>
</div>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    toast.info("Invoice Opened", "Use Ctrl+P or the Print button to save as PDF");
  };

  const handleDelete = (id: string) => {
    if (confirm("Void this invoice? This cannot be undone.")) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.warning("Invoice Voided", "The invoice has been removed");
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const cust = customers.find(c => c.id === inv.customerId);
    return inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const subtotalSum = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const gstTax = subtotalSum * (parseFloat(gstPct) / 100);
  const totalSum = subtotalSum + gstTax;

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoices ledger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportInvoicesCSV(invoices, customers)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
            title="Export to CSV"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Invoice No.</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3">Billing Date</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 font-mono">Invoice Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No billing invoices issued.
                </td>
              </tr>
            ) : (
              filteredInvoices.map(inv => {
                const cust = customers.find(c => c.id === inv.customerId);
                return (
                  <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-bold text-slate-200">{cust?.name || "Unregistered Company"}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{inv.createdAt}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{inv.dueDate}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">{formatINR(inv.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        inv.status === "partially_paid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all cursor-pointer"
                          title="View Invoice"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadInvoicePDF(inv)}
                          className="p-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/10 rounded transition-all cursor-pointer"
                          title="Download Invoice HTML/PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                          title="Void Invoice"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New / Edit Invoice Modal */}
      {(showAddModal || editingInvoice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={editingInvoice ? handleSaveEditInvoice : handleSaveInvoice}
            className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingInvoice ? "Edit Invoice" : "New Invoice"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingInvoice(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bill To (Company) *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="">— Select Company —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Linked Quotation</label>
                  <input
                    type="text"
                    placeholder="Quotation ID (optional)"
                    value={quotationId}
                    onChange={(e) => setQuotationId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Linked Deal</label>
                  <input
                    type="text"
                    placeholder="Deal ID (optional)"
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Invoice Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST %</label>
                  <select
                    value={gstPct}
                    onChange={(e) => setGstPct(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="18">18% GST (Standard)</option>
                    <option value="12">12% GST</option>
                    <option value="5">5% GST</option>
                    <option value="0">0% GST</option>
                  </select>
                </div>
              </div>

              {/* LINE ITEMS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Line Items *</span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-850 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-800 text-[10px]">
                    <thead className="bg-slate-900/60 text-slate-300 font-semibold text-left">
                      <tr>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2 w-20">HSN/SAC</th>
                        <th className="px-3 py-2 w-16">Qty</th>
                        <th className="px-3 py-2 w-16">Unit</th>
                        <th className="px-3 py-2 w-24">Rate (₹)</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              required
                              placeholder="Item description..."
                              value={item.desc}
                              onChange={(e) => handleUpdateLineItem(idx, "desc", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleUpdateLineItem(idx, "hsn", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleUpdateLineItem(idx, "qty", Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateLineItem(idx, "unit", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(e) => handleUpdateLineItem(idx, "rate", Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-200 text-right font-semibold">
                            {formatINR(item.amount)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {lineItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(idx)}
                                className="text-red-400 hover:text-red-355 font-bold"
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals card */}
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-850 flex flex-col items-end text-xs font-mono space-y-1 text-slate-300">
                  <div>Subtotal: <span className="font-bold text-slate-200">{formatINR(subtotalSum)}</span></div>
                  <div>GST ({gstPct}%): <span className="font-bold text-slate-200">{formatINR(gstTax)}</span></div>
                  <div className="border-t border-slate-800 pt-1 text-sm text-emerald-400 font-bold">Total: {formatINR(totalSum)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Notes / Payment Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bank transfer to HDFC A/c 1234567890, IFSC HDFC0001234"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Payment due within 30 days. Late fee 2% per month."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingInvoice(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingInvoice ? "Save Changes" : "Create Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Viewing invoice preview details */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-400">{viewingInvoice.invoiceNumber} Invoicing Specifications</span>
              <button type="button" onClick={() => setViewingInvoice(null)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-400 border-b border-slate-900 pb-2 font-semibold">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Customer Name</span>
                  <strong className="text-slate-200">{customers.find(c => c.id === viewingInvoice.customerId)?.name || "Unregistered"}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Invoice Date</span>
                  <strong className="text-slate-200">{viewingInvoice.createdAt}</strong>
                </div>
              </div>

              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider font-mono text-slate-400">Total Settlement Due</span>
                <p className="text-slate-300 font-mono font-bold text-emerald-400">{formatINR(viewingInvoice.totalAmount)}</p>
              </div>

              {viewingInvoice.notes && (
                <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-850 text-slate-400 text-[10px]">
                  <strong>Notes:</strong> {viewingInvoice.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => downloadInvoicePDF(viewingInvoice)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingInvoice(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

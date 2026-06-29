import React, { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, Calendar, FileText } from "lucide-react";
import { Invoice, Customer, Product, formatINR } from "../../types";

interface InvoicesPanelProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  products: Product[];
  onGenerateInvoice: (invoiceId: string, customerId: string, items: Array<{ productId: string; qty: number }>) => void;
}

export default function InvoicesPanel({ 
  invoices, 
  setInvoices, 
  customers, 
  products, 
  onGenerateInvoice 
}: InvoicesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

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
    if (!customerId) return alert("Please select a customer");

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxPct = parseFloat(gstPct) / 100;
    const taxAmount = subtotal * taxPct;
    const totalAmount = subtotal + taxAmount;

    const invoiceNumber = `INV-2026-000${invoices.length + 1}`;
    const invId = `inv-${Date.now()}`;

    // Standard items mapping for standard hook
    const matchedProduct = products[0]?.id || "prod-1"; // Fallback to avoid crash
    
    // Call the original onGenerateInvoice standard hook to trigger double-entry finance ledgers
    onGenerateInvoice(invId, customerId, [{ productId: matchedProduct, qty: 1 }]);

    // Insert rich custom fields
    const newInv: Invoice & { notes?: string; terms?: string } = {
      id: invId,
      invoiceNumber,
      customerId,
      branchId: "br-hq",
      items: lineItems.map(li => ({
        productId: matchedProduct,
        quantity: li.qty,
        unitPrice: li.rate,
      })),
      subtotal,
      taxAmount,
      totalAmount,
      status: "unpaid",
      createdAt: invoiceDate,
      dueDate: dueDate || invoiceDate,
      notes: `${notes || ""} | HSN: ${lineItems[0]?.hsn || ""}`,
      terms
    };

    setInvoices(prev => [newInv, ...prev]);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to void this invoice?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
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
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Invoice</span>
        </button>
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
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
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

      {/* New Invoice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleSaveInvoice}
            className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">New Invoice</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">×</button>
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
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Create Invoice
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

            <div className="flex justify-end pt-2 border-t border-slate-800/80">
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

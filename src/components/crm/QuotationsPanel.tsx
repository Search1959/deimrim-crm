import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, FileText, Check, Download } from "lucide-react";
import { Quotation, Customer, Deal, formatINR } from "../../types";

interface QuotationsPanelProps {
  customers: Customer[];
  companyId: string;
  isDemo?: boolean;
}

export default function QuotationsPanel({ customers, companyId, isDemo }: QuotationsPanelProps) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [gstNo, setGstNo] = useState("19AABCT1234D1Z5"); // Kolkata GST
  const [billingAddress, setBillingAddress] = useState("");
  const [quotationNo, setQuotationNo] = useState("");
  const [dealId, setDealId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Quotation["items"]>([
    { productName: "", unit: "pcs", quantity: 0, unitPrice: 0, amount: 0 }
  ]);
  const [overrideTotal, setOverrideTotal] = useState("");

  // Load state
  useEffect(() => {
    const keyQ = `deinrim_quotations_${companyId}`;
    const storedQ = localStorage.getItem(keyQ);
    if (storedQ) {
      try { setQuotations(JSON.parse(storedQ)); } catch (e) {}
    } else {
      const defaultQ: Quotation[] = isDemo === true ? [
        {
          id: "quot-1",
          quotationNumber: "QT-2026-001",
          companyName: "Tata Motors Ltd",
          contactPerson: "Rohan Sen",
          gstNo: "19AABCT1234D1Z5",
          billingAddress: "Chowringhee Road, Kolkata",
          validUntil: "2026-07-20",
          notes: "Commercial SLA Proposal",
          items: [
            { productName: "Enterprise Workspace License", unit: "User", quantity: 150, unitPrice: 3000, amount: 450000 }
          ],
          totalAmount: 450000,
          createdAt: "2026-06-25",
          status: "Pending"
        }
      ] : [];
      setQuotations(defaultQ);
      localStorage.setItem(keyQ, JSON.stringify(defaultQ));
    }

    const keyD = `deinrim_deals_${companyId}`;
    const storedD = localStorage.getItem(keyD);
    if (storedD) {
      try { setDeals(JSON.parse(storedD)); } catch (e) {}
    }
  }, [companyId]);

  const saveQuotations = (updated: Quotation[]) => {
    setQuotations(updated);
    localStorage.setItem(`deinrim_quotations_${companyId}`, JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setCompanyName("");
    setContactPerson("");
    setGstNo("19AABCT1234D1Z5");
    setBillingAddress("");
    setQuotationNo(`QT-2026-00${quotations.length + 1}`);
    setDealId("");
    setValidUntil("");
    setNotes("");
    setItems([{ productName: "", unit: "pcs", quantity: 1, unitPrice: 0, amount: 0 }]);
    setOverrideTotal("");
    setShowAddModal(true);
  };

  const handleAddItem = () => {
    setItems([...items, { productName: "", unit: "pcs", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, key: keyof Quotation["items"][0], val: any) => {
    const updated = items.map((item, i) => {
      if (i === idx) {
        const copy = { ...item, [key]: val };
        if (key === "quantity" || key === "unitPrice") {
          const qty = key === "quantity" ? Number(val) : copy.quantity;
          const price = key === "unitPrice" ? Number(val) : copy.unitPrice;
          copy.amount = qty * price;
        }
        return copy;
      }
      return item;
    });
    setItems(updated);
  };

  const handleCompanyChange = (name: string) => {
    setCompanyName(name);
    const matched = customers.find(c => c.name === name);
    if (matched) {
      setBillingAddress(matched.address || "");
      setContactPerson(matched.name + " Representative");
    }
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) { toast.error("Please select a company"); return; }

    const calculatedSum = items.reduce((sum, item) => sum + item.amount, 0);
    const finalTotal = overrideTotal ? parseFloat(overrideTotal) : calculatedSum;

    const linkedDeal = deals.find(d => d.id === dealId);

    const newQ: Quotation = {
      id: `quot-${Date.now()}`,
      quotationNumber: quotationNo || `QT-2026-00${quotations.length + 1}`,
      companyName,
      contactPerson,
      gstNo,
      billingAddress,
      dealId,
      dealTitle: linkedDeal ? linkedDeal.title : "",
      validUntil,
      notes,
      items,
      totalAmount: finalTotal,
      createdAt: new Date().toISOString().split("T")[0],
      status: "Pending"
    };

    const updated = [newQ, ...quotations];
    saveQuotations(updated);
    setShowAddModal(false);
  };

  const handleAccept = (id: string) => {
    const updated = quotations.map(q => {
      if (q.id === id) {
        return { ...q, status: "Accepted" as const };
      }
      return q;
    });
    saveQuotations(updated);
    toast.success("Quotation Accepted", "Stock auto-deducted per ERP rules")
  };

  const handleOpenEdit = (q: Quotation) => {
    setEditingQuotation(q);
    setCompanyName(q.companyName);
    setContactPerson(q.contactPerson);
    setGstNo(q.gstNo || "19AABCT1234D1Z5");
    setBillingAddress(q.billingAddress || "");
    setQuotationNo(q.quotationNumber);
    setDealId(q.dealId || "");
    setValidUntil(q.validUntil || "");
    setNotes(q.notes || "");
    setItems(q.items || [{ productName: "", unit: "pcs", quantity: 1, unitPrice: 0, amount: 0 }]);
    setOverrideTotal(q.totalAmount ? q.totalAmount.toString() : "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation || !companyName) return;

    const calculatedSum = items.reduce((sum, item) => sum + item.amount, 0);
    const finalTotal = overrideTotal ? parseFloat(overrideTotal) : calculatedSum;
    const linkedDeal = deals.find(d => d.id === dealId);

    const updated = quotations.map(q => {
      if (q.id === editingQuotation.id) {
        return {
          ...q,
          quotationNumber: quotationNo,
          companyName,
          contactPerson,
          gstNo,
          billingAddress,
          dealId,
          dealTitle: linkedDeal ? linkedDeal.title : "",
          validUntil,
          notes,
          items,
          totalAmount: finalTotal
        };
      }
      return q;
    });

    saveQuotations(updated);
    setEditingQuotation(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      const updated = quotations.filter(q => q.id !== id);
      saveQuotations(updated);
    }
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = quotations.map(q => ({
      "Quotation No": q.quotationNumber, "Date": q.createdAt, "Valid Until": q.validUntil || "",
      "Company": q.companyName, "Contact": q.contactPerson, "GSTIN": q.gstNo || "",
      "Total Amount": q.totalAmount, "Status": q.status, "Notes": q.notes || "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Quotations");
    XLSX.writeFile(wb, "Quotations_Export.xlsx");
    toast.success("Exported", `${rows.length} quotations downloaded`);
  };

  const filteredQuotations = quotations.filter(q => 
    q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search quotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer border border-slate-700">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={handleOpenAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Quot No.</th>
              <th className="px-4 py-3">Company Name</th>
              <th className="px-4 py-3 font-mono">Total Amount</th>
              <th className="px-4 py-3">Valid Until</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No quotations created.
                </td>
              </tr>
            ) : (
              filteredQuotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{q.quotationNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{q.companyName}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-100">{formatINR(q.totalAmount)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{q.validUntil || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      q.status === "Accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      q.status === "Rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {q.status === "Pending" && (
                        <button
                          onClick={() => handleAccept(q.id)}
                          className="px-2 py-0.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Accept
                        </button>
                      )}
                      <button
                        onClick={() => setViewingQuotation(q)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all cursor-pointer"
                        title="View Quotation"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all cursor-pointer"
                        title="Edit Quotation"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                        title="Delete Quotation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Quotation Modal */}
      {(showAddModal || editingQuotation) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={editingQuotation ? handleSaveEdit : handleSaveQuotation}
            className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingQuotation ? "Edit Quotation" : "New Quotation"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingQuotation(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {/* CLIENT DETAILS */}
              <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-lg space-y-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">Client Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Company Name *</label>
                    <select
                      required
                      value={companyName}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="">— Select Company —</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Contact Person</label>
                    <input
                      type="text"
                      placeholder="Contact name"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST No.</label>
                    <input
                      type="text"
                      value={gstNo}
                      onChange={(e) => setGstNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Billing Address</label>
                    <textarea
                      rows={2}
                      placeholder="Full billing address..."
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* QUOTATION DETAILS */}
              <div className="bg-slate-900/40 border border-slate-850 p-3.5 rounded-lg space-y-3">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block font-mono">Quotation Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Quotation No.</label>
                    <input
                      type="text"
                      placeholder="Auto-generated if blank"
                      value={quotationNo}
                      onChange={(e) => setQuotationNo(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Deal (optional)</label>
                    <select
                      value={dealId}
                      onChange={(e) => setDealId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    >
                      <option value="">— None —</option>
                      {deals.map(d => (
                        <option key={d.id} value={d.id}>{d.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Valid Until</label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes</label>
                    <input
                      type="text"
                      placeholder="Short memo notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* PRODUCTS / SERVICES TABLE */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Product / Service Items</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
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
                        <th className="px-3 py-2">Product / Service</th>
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Unit Price</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/20 text-slate-300">
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              required
                              placeholder="Product or service name..."
                              value={item.productName}
                              onChange={(e) => handleUpdateItem(idx, "productName", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                            />
                          </td>
                          <td className="px-3 py-2 w-16">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, "unit", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2 w-16">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, "quantity", Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2 w-24">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(idx, "unitPrice", Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-mono focus:outline-hidden"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-right text-slate-200">
                            {formatINR(item.amount)}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-400 hover:text-red-300 font-bold"
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
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold bg-slate-900/20 px-3 py-2 rounded-lg border border-slate-850">
                  <span>When accepted → stock auto-deducted from Inventory</span>
                  <span className="font-mono text-slate-200">Total: {formatINR(calculatedTotal)}</span>
                </div>
              </div>

              {/* OVERRIDE */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Total Amount (₹) — override if no line items</label>
                <input
                  type="number"
                  placeholder="Auto-calculated from items above"
                  value={overrideTotal}
                  onChange={(e) => setOverrideTotal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingQuotation(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingQuotation ? "Save Changes" : "Save Quotation"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Quotation Preview Modal */}
      {viewingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-400">{viewingQuotation.quotationNumber} Specifications</span>
              <button type="button" onClick={() => setViewingQuotation(null)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-400 border-b border-slate-900 pb-2">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Client Name</span>
                  <strong className="text-slate-200">{viewingQuotation.companyName}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Contact Person</span>
                  <strong className="text-slate-200">{viewingQuotation.contactPerson || "—"}</strong>
                </div>
              </div>

              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider font-mono text-slate-400">Billing Location</span>
                <p className="text-slate-300 font-semibold">{viewingQuotation.billingAddress || "—"}</p>
              </div>

              <div className="border border-slate-850 rounded-lg p-2.5 bg-slate-900/20 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider font-mono text-indigo-400">Items Ordered</span>
                {viewingQuotation.items.map((it, i) => (
                  <div key={i} className="flex justify-between items-center text-slate-300 border-b border-slate-900/40 pb-1.5 last:border-b-0 last:pb-0">
                    <div>
                      <div className="font-bold">{it.productName}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{it.quantity} {it.unit} × {formatINR(it.unitPrice)}</div>
                    </div>
                    <span className="font-mono font-bold">{formatINR(it.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-bold uppercase font-mono text-[10px]">Total Proposal Value</span>
                <strong className="text-emerald-400 font-mono text-sm">{formatINR(viewingQuotation.totalAmount)}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setViewingQuotation(null)}
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

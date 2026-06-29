import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, FileCheck, Landmark, CheckSquare } from "lucide-react";
import { VendorInvoice, Supplier, PurchaseOrder, formatINR } from "../../types";

interface VendorBillsPanelProps {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
}

export default function VendorBillsPanel({ suppliers, orders }: VendorBillsPanelProps) {
  const [bills, setBills] = useState<VendorInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Image 6
  const [poId, setPoId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [amountBeforeGst, setAmountBeforeGst] = useState(0);
  const [gstType, setGstType] = useState("CGST + SGST (Intra-state)");
  const [gstRate, setGstRate] = useState(18);
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<VendorInvoice["status"]>("Pending Payment");

  useEffect(() => {
    const stored = localStorage.getItem("deinrim_vendor_bills");
    if (stored) {
      try { setBills(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultBills: VendorInvoice[] = [
        {
          id: "bill-1",
          billNumber: "BILL-2026-0001",
          poId: "po-1",
          poNumber: "PO-2026-0001",
          supplierId: "sup-1",
          supplierName: "PowerCell Systems India",
          amountBeforeGst: 63559,
          gstType: "CGST + SGST (Intra-state)",
          gstRate: 18,
          totalAmount: 75000,
          dueDate: "2026-07-20",
          status: "Paid",
          createdAt: "2026-06-21"
        },
        {
          id: "bill-2",
          billNumber: "BILL-2026-0002",
          poId: "po-2",
          poNumber: "PO-2026-0002",
          supplierId: "sup-2",
          supplierName: "Global Hardware Distributors",
          amountBeforeGst: 72033,
          gstType: "IGST (Inter-state)",
          gstRate: 18,
          totalAmount: 85000,
          dueDate: "2026-07-28",
          status: "Pending Payment",
          createdAt: "2026-06-29"
        }
      ];
      setBills(defaultBills);
      localStorage.setItem("deinrim_vendor_bills", JSON.stringify(defaultBills));
    }
  }, []);

  const saveBills = (updated: VendorInvoice[]) => {
    setBills(updated);
    localStorage.setItem("deinrim_vendor_bills", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setPoId("");
    setVendorId("");
    setAmountBeforeGst(0);
    setGstType("CGST + SGST (Intra-state)");
    setGstRate(18);
    setDueDate("");
    setStatus("Pending Payment");
    setShowAddModal(true);
  };

  const handlePOChange = (selectedPoId: string) => {
    setPoId(selectedPoId);
    if (!selectedPoId) return;

    const matchedPo = orders.find(o => o.id === selectedPoId);
    if (matchedPo) {
      setVendorId(matchedPo.supplierId);
      // Backtrack amount before GST from totalAmount
      const calculatedBefore = Math.round(matchedPo.totalAmount / 1.18);
      setAmountBeforeGst(calculatedBefore);
    }
  };

  const calculateTotal = () => {
    return Math.round(amountBeforeGst * (1 + (gstRate / 100)));
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || amountBeforeGst <= 0 || !dueDate) {
      alert("Please ensure Vendor, Pre-Tax Amount, and Due Date are completed!");
      return;
    }

    const matchedPo = orders.find(o => o.id === poId);
    const matchedVendor = suppliers.find(s => s.id === vendorId);

    const totalVal = calculateTotal();

    const newBill: VendorInvoice = {
      id: `bill-${Date.now()}`,
      billNumber: `BILL-2026-000${bills.length + 1}`,
      poId: poId || undefined,
      poNumber: matchedPo?.poNumber || undefined,
      supplierId: vendorId,
      supplierName: matchedVendor?.name || "Unregistered Vendor",
      amountBeforeGst,
      gstType,
      gstRate,
      totalAmount: totalVal,
      dueDate,
      status,
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newBill, ...bills];
    saveBills(updated);
    setShowAddModal(false);

    // Save supplier ledger impact
    const storedLedgers = localStorage.getItem("deinrim_supplier_ledgers");
    const currentLedgers = storedLedgers ? JSON.parse(storedLedgers) : [];
    const newLedgerEntry = {
      id: `ledger-${Date.now()}`,
      supplierId: vendorId,
      type: "INVOICE",
      referenceId: newBill.billNumber,
      amount: totalVal,
      balance: totalVal, // simplify outstanding tracking
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("deinrim_supplier_ledgers", JSON.stringify([newLedgerEntry, ...currentLedgers]));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to write off/delete this vendor bill?")) {
      const updated = bills.filter(b => b.id !== id);
      saveBills(updated);
    }
  };

  const filtered = bills.filter(b => {
    const matchesSearch = b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (b.poNumber && b.poNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "All" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Bills (by Bill #, PO #, Vendor)..."
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
          <span>Post Vendor Invoice</span>
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "Draft", "Pending Payment", "Partially Paid", "Paid"].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              statusFilter === st
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {st.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table grid */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Bill Number</th>
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Linked PO</th>
                <th className="px-5 py-3 text-left">Pre-Tax Amt</th>
                <th className="px-5 py-3 text-left">GST Rate / Type</th>
                <th className="px-5 py-3 text-left">Total Amount</th>
                <th className="px-5 py-3 text-left">Due Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-indigo-400 font-mono text-xs">{b.billNumber}</td>
                  <td className="px-5 py-4 font-bold text-slate-200">{b.supplierName}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{b.poNumber || "Direct Billing"}</td>
                  <td className="px-5 py-4 font-mono text-slate-300">{formatINR(b.amountBeforeGst)}</td>
                  <td className="px-5 py-4">
                    <div className="font-mono text-slate-200 font-bold">{b.gstRate}%</div>
                    <div className="text-[9px] text-slate-500 uppercase">{b.gstType}</div>
                  </td>
                  <td className="px-5 py-4 font-bold font-mono text-indigo-300">{formatINR(b.totalAmount)}</td>
                  <td className="px-5 py-4 font-mono text-rose-400 font-bold">{b.dueDate}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                      b.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      b.status === "Pending Payment" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-slate-850 text-slate-400 border-slate-700"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Bill Modal matching Image 6 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreateBill}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <FileCheck className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Post Vendor Invoice (Bill)
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1 font-semibold">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Select Purchase Order</label>
                <select
                  value={poId}
                  onChange={(e) => handlePOChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="">-- Select PO (optional) --</option>
                  {orders.map(o => <option key={o.id} value={o.id}>{o.poNumber} - Grand Total: {formatINR(o.totalAmount)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Select Vendor *</label>
                <select
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="">-- Choose Vendor --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount Before GST (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amountBeforeGst}
                    onChange={(e) => setAmountBeforeGst(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST Rate (%) *</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST Type *</label>
                  <select
                    required
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  >
                    <option value="CGST + SGST (Intra-state)">CGST + SGST (Intra-state)</option>
                    <option value="IGST (Inter-state)">IGST (Inter-state)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Invoice Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bill Status *</label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VendorInvoice["status"])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              <div className="bg-slate-900/60 p-3 border border-slate-850 rounded-lg mt-2 text-right">
                <span className="text-slate-400 text-[10px] block mb-0.5">Calculated Total with Tax:</span>
                <strong className="text-sm text-indigo-400 font-mono font-bold">{formatINR(calculateTotal())}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer"
              >
                Post Vendor Bill
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

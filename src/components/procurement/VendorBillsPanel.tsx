import React, { useState } from "react";
import { FileCheck, Plus, X, IndianRupee } from "lucide-react";
import { Supplier, PurchaseOrder, VendorInvoice, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
}

const STATUS_COLORS: Record<VendorInvoice["status"], string> = {
  "Draft":             "bg-slate-700/40 text-slate-400 border-slate-600/30",
  "Pending Payment":   "bg-red-500/10 text-red-400 border-red-500/20",
  "Partially Paid":    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Paid":              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function VendorBillsPanel({ suppliers, orders }: Props) {
  const [bills, setBills] = useState<VendorInvoice[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [formSupplierId, setFormSupplierId] = useState("");
  const [formBillNumber, setFormBillNumber] = useState("");
  const [formPoId, setFormPoId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formGstRate, setFormGstRate] = useState("18");
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] = useState<VendorInvoice["status"]>("Pending Payment");

  const resetForm = () => {
    setFormSupplierId(""); setFormBillNumber(""); setFormPoId("");
    setFormAmount(""); setFormGstRate("18"); setFormDueDate("");
    setFormStatus("Pending Payment");
  };

  const supplierPOs = orders.filter(po => po.supplierId === formSupplierId);

  const amountBeforeGst = parseFloat(formAmount) || 0;
  const gstRate = parseFloat(formGstRate) || 0;
  const gstAmount = +(amountBeforeGst * gstRate / 100).toFixed(2);
  const totalAmount = +(amountBeforeGst + gstAmount).toFixed(2);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplierId || !formBillNumber || !formAmount) {
      toast.error("Supplier, Bill Number and Amount are required");
      return;
    }
    const sup = suppliers.find(s => s.id === formSupplierId);
    const po = orders.find(o => o.id === formPoId);
    const newBill: VendorInvoice = {
      id: `vb-${Date.now()}`,
      billNumber: formBillNumber,
      poId: formPoId || undefined,
      poNumber: po?.poNumber,
      supplierId: formSupplierId,
      supplierName: sup?.name || "",
      amountBeforeGst,
      gstType: "GST",
      gstRate,
      totalAmount,
      dueDate: formDueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: formStatus,
      createdAt: new Date().toISOString(),
    };
    setBills(prev => [newBill, ...prev]);
    toast.success("Bill Recorded", `₹${totalAmount.toLocaleString()} bill from ${sup?.name}`);
    setShowForm(false);
    resetForm();
  };

  const markPaid = (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, status: "Paid" } : b));
    toast.success("Marked as Paid");
  };

  const totalPending = bills.filter(b => b.status !== "Paid").reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid    = bills.filter(b => b.status === "Paid").reduce((s, b) => s + b.totalAmount, 0);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Vendor Bills</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Record bills received from suppliers</p>
          </div>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Record Bill
        </button>
      </div>

      {/* Summary cards */}
      {bills.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
            <p className="text-[10px] text-red-400 font-mono uppercase font-bold mb-1">Pending Payment</p>
            <p className="text-lg font-bold text-red-300 font-mono">{formatINR(totalPending)}</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-4">
            <p className="text-[10px] text-emerald-400 font-mono uppercase font-bold mb-1">Total Paid</p>
            <p className="text-lg font-bold text-emerald-300 font-mono">{formatINR(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Bills table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Bill No.</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">PO Ref</th>
              <th className="px-4 py-3 text-left">Bill Date</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                  No bills recorded yet. Click <span className="text-indigo-400 font-semibold">Record Bill</span> to add one.
                </td>
              </tr>
            ) : bills.map(b => (
              <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="px-4 py-3 font-bold text-indigo-400 font-mono">{b.billNumber}</td>
                <td className="px-4 py-3 font-semibold text-slate-100">{b.supplierName}</td>
                <td className="px-4 py-3 text-slate-400 font-mono">{b.poNumber || "—"}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{b.createdAt.slice(0,10)}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{b.dueDate}</td>
                <td className="px-4 py-3 text-right font-bold font-mono text-slate-200">{formatINR(b.totalAmount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {b.status !== "Paid" && (
                    <button
                      onClick={() => markPaid(b.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      <IndianRupee className="w-3 h-3" /> Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Bill Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white font-mono">Record Vendor Bill</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Supplier *</label>
                  <select
                    required
                    value={formSupplierId}
                    onChange={e => { setFormSupplierId(e.target.value); setFormPoId(""); }}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bill Number *</label>
                  <input
                    required
                    value={formBillNumber}
                    onChange={e => setFormBillNumber(e.target.value)}
                    placeholder="e.g. INV/2025/001"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Link to PO (optional) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Link to Purchase Order (Optional)</label>
                <select
                  value={formPoId}
                  onChange={e => {
                    setFormPoId(e.target.value);
                    const po = orders.find(o => o.id === e.target.value);
                    if (po) setFormAmount(String(po.totalAmount || ""));
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="">-- No PO Link --</option>
                  {supplierPOs.map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber} — {formatINR(po.totalAmount)}</option>
                  ))}
                </select>
              </div>

              {/* Amount + GST */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount Before GST *</label>
                  <input
                    required
                    type="number"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST %</label>
                  <select
                    value={formGstRate}
                    onChange={e => setFormGstRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none"
                  >
                    {["0","5","12","18","28"].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Total Amount</label>
                  <div className="w-full rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 text-xs font-bold font-mono text-emerald-400">
                    {formatINR(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Due date + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as VendorInvoice["status"])}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option>Draft</option>
                    <option>Pending Payment</option>
                    <option>Partially Paid</option>
                    <option>Paid</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 cursor-pointer">
                  Cancel
                </button>
                <button type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer">
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

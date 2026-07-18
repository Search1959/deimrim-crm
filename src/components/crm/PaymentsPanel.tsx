import { toast } from "../../utils/toast";
import React, { useState } from "react";
import { Plus, Search, CreditCard, Eye, Pencil, Trash2, X, Check } from "lucide-react";
import { Payment, Invoice, Customer, formatINR } from "../../types";

interface PaymentsPanelProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  companyId: string;
  onPaymentRecorded?: (invoiceId: string, amount: number, method: string, invoiceNumber: string, customerName: string) => void;
  salesPayments: Payment[];
  setSalesPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

const EMPTY_FORM = {
  invoiceId: "",
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentMethod: "Bank Transfer",
  referenceNo: "",
  notes: "",
};

export default function PaymentsPanel({ invoices, setInvoices, customers, companyId, onPaymentRecorded, salesPayments: payments, setSalesPayments: setPayments }: PaymentsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Modal modes: null | "add" | "edit" | "view"
  const [modalMode, setModalMode] = useState<null | "add" | "edit" | "view">(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Form states
  const [invoiceId, setInvoiceId] = useState(EMPTY_FORM.invoiceId);
  const [amount, setAmount] = useState(EMPTY_FORM.amount);
  const [paymentDate, setPaymentDate] = useState(EMPTY_FORM.paymentDate);
  const [paymentMethod, setPaymentMethod] = useState(EMPTY_FORM.paymentMethod);
  const [referenceNo, setReferenceNo] = useState(EMPTY_FORM.referenceNo);
  const [notes, setNotes] = useState(EMPTY_FORM.notes);

  const savePayments = (updated: Payment[]) => {
    setPayments(updated);
  };

  const resetForm = () => {
    setInvoiceId(EMPTY_FORM.invoiceId);
    setAmount(EMPTY_FORM.amount);
    setPaymentDate(EMPTY_FORM.paymentDate);
    setPaymentMethod(EMPTY_FORM.paymentMethod);
    setReferenceNo(EMPTY_FORM.referenceNo);
    setNotes(EMPTY_FORM.notes);
  };

  const openAdd = () => { resetForm(); setSelectedPayment(null); setModalMode("add"); };

  const openView = (p: Payment) => { setSelectedPayment(p); setModalMode("view"); };

  const openEdit = (p: Payment) => {
    setSelectedPayment(p);
    setInvoiceId(p.invoiceId);
    setAmount(String(p.amount));
    setPaymentDate(p.paymentDate);
    setPaymentMethod(p.paymentMethod);
    setReferenceNo(p.referenceNo || "");
    setNotes(p.notes || "");
    setModalMode("edit");
  };

  const handleDelete = (p: Payment) => {
    if (!confirm(`Delete payment receipt ${p.id} for ${formatINR(p.amount)}? This cannot be undone.`)) return;
    savePayments(payments.filter(x => x.id !== p.id));
    toast.success("Payment deleted", `Receipt ${p.id} removed from ledger`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) { toast.error("Please fill all required fields"); return; }

    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) { toast.error("Select a valid invoice"); return; }

    const paymentAmount = parseFloat(amount) || 0;
    const targetCust = customers.find(c => c.id === targetInvoice.customerId);

    if (modalMode === "add") {
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        invoiceId,
        invoiceNumber: targetInvoice.invoiceNumber,
        companyName: targetCust ? targetCust.name : "Unregistered Client",
        amount: paymentAmount,
        paymentDate,
        paymentMethod,
        referenceNo,
        notes,
        createdAt: new Date().toISOString().split("T")[0],
      };

      setInvoices(prev => prev.map(inv => {
        if (inv.id === invoiceId) {
          const remaining = inv.totalAmount - paymentAmount;
          return { ...inv, status: remaining <= 0 ? "paid" as const : "partially_paid" as const };
        }
        return inv;
      }));

      if (onPaymentRecorded) {
        onPaymentRecorded(invoiceId, paymentAmount, paymentMethod, targetInvoice.invoiceNumber, targetCust?.name ?? "Unknown");
      }

      savePayments([newPay, ...payments]);
      setModalMode(null);
      toast.success("Payment Recorded", `${formatINR(paymentAmount)} applied to ${targetInvoice.invoiceNumber}`);
    } else if (modalMode === "edit" && selectedPayment) {
      const updated = payments.map(p => p.id === selectedPayment.id
        ? {
            ...p,
            invoiceId,
            invoiceNumber: targetInvoice.invoiceNumber,
            companyName: targetCust ? targetCust.name : "Unregistered Client",
            amount: paymentAmount,
            paymentDate,
            paymentMethod,
            referenceNo,
            notes,
          }
        : p
      );
      savePayments(updated);
      setModalMode(null);
      toast.success("Payment Updated", `Receipt ${selectedPayment.id} saved`);
    }
  };

  const filteredPayments = payments.filter(p =>
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.referenceNo || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Collected Collections</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">{formatINR(totalCollected)}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search payments ledger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Receipt No.</th>
              <th className="px-4 py-3">Invoice No.</th>
              <th className="px-4 py-3">Client Name</th>
              <th className="px-4 py-3 font-mono">Amount Collected</th>
              <th className="px-4 py-3">Payment Date</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3 font-mono">UTR / Reference No.</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No payment receipts recorded.
                </td>
              </tr>
            ) : (
              filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400">{p.id}</td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{p.invoiceNumber}</td>
                  <td className="px-4 py-3 font-bold text-slate-200">{p.companyName}</td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{p.paymentDate}</td>
                  <td className="px-4 py-3 font-semibold text-slate-300">{p.paymentMethod}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{p.referenceNo || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openView(p)}
                        title="View"
                        className="h-6 w-6 flex items-center justify-center rounded bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit"
                        className="h-6 w-6 flex items-center justify-center rounded bg-slate-800 hover:bg-amber-600/20 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        title="Delete"
                        className="h-6 w-6 flex items-center justify-center rounded bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW Modal */}
      {modalMode === "view" && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono block">Payment Receipt</span>
                <h3 className="text-sm font-bold text-white font-mono">{selectedPayment.id}</h3>
              </div>
              <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              {[
                ["Invoice No.", selectedPayment.invoiceNumber],
                ["Client", selectedPayment.companyName],
                ["Amount", formatINR(selectedPayment.amount)],
                ["Payment Date", selectedPayment.paymentDate],
                ["Method", selectedPayment.paymentMethod],
                ["UTR / Reference", selectedPayment.referenceNo || "—"],
                ["Notes", selectedPayment.notes || "—"],
                ["Recorded On", selectedPayment.createdAt],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-800/40 pb-2">
                  <span className="text-slate-500 font-mono uppercase text-[10px] tracking-wider shrink-0">{label}</span>
                  <span className="text-slate-200 font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => openEdit(selectedPayment)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => setModalMode(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT Modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {modalMode === "add" ? "Record Payment" : "Edit Payment"}
              </h3>
              <button type="button" onClick={() => setModalMode(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Invoice *</label>
                <select
                  required
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                >
                  <option value="">— Select Invoice —</option>
                  {invoices.map(inv => {
                    const cust = customers.find(c => c.id === inv.customerId);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — {cust?.name} ({formatINR(inv.totalAmount)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>UPI</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Reference / UTR No.</label>
                  <input
                    type="text"
                    placeholder="TXN ID, Cheque No."
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bank / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, cleared on 15 Jun"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Check className="h-3 w-3" />
                {modalMode === "add" ? "Record Payment" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

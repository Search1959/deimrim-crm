import React, { useState, useEffect } from "react";
import { Plus, Search, CreditCard, Check } from "lucide-react";
import { Payment, Invoice, Customer, formatINR } from "../../types";

interface PaymentsPanelProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  companyId: string;
}

export default function PaymentsPanel({ invoices, setInvoices, customers, companyId }: PaymentsPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  const storageKey = `deinrim_payments_${companyId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { setPayments(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultP: Payment[] = [
        {
          id: "pay-1",
          invoiceId: invoices[0]?.id || "inv-1",
          invoiceNumber: invoices[0]?.invoiceNumber || "INV-2026-0001",
          companyName: "Tata Motors Ltd",
          amount: 450000,
          paymentDate: "2026-06-26",
          paymentMethod: "Bank Transfer",
          referenceNo: "UTR98374291038",
          notes: "Settled full invoice amount.",
          createdAt: "2026-06-26"
        }
      ];
      setPayments(defaultP);
      localStorage.setItem(storageKey, JSON.stringify(defaultP));
    }
  }, [companyId, invoices]);

  const savePayments = (updated: Payment[]) => {
    setPayments(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setInvoiceId("");
    setAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Bank Transfer");
    setReferenceNo("");
    setNotes("");
    setShowAddModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || !amount) return alert("Please fill required fields");

    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return alert("Select a valid invoice");

    const paymentAmount = parseFloat(amount) || 0;
    const targetCust = customers.find(c => c.id === targetInvoice.customerId);

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
      createdAt: new Date().toISOString().split("T")[0]
    };

    // Update parent invoice status!
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        const remaining = inv.totalAmount - paymentAmount;
        const status = remaining <= 0 ? "paid" as const : "partially_paid" as const;
        return { ...inv, status };
      }
      return inv;
    }));

    const updated = [newPay, ...payments];
    savePayments(updated);
    setShowAddModal(false);
    alert(`Payment of ${formatINR(paymentAmount)} recorded against Invoice ${targetInvoice.invoiceNumber}!`);
  };

  const filteredPayments = payments.filter(p =>
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner metrics */}
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
          onClick={handleOpenAdd}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form 
            onSubmit={handleRecordPayment}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Record Payment</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">×</button>
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
                  {invoices.filter(inv => inv.status !== "paid").map(inv => {
                    const cust = customers.find(c => c.id === inv.customerId);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {cust?.name} ({formatINR(inv.totalAmount)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Reference / UTR No.</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN ID, Cheque No."
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Bank / Notes</label>
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
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

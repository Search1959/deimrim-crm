import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, FileText, CheckCircle, Landmark, Sparkles, FileUp } from "lucide-react";
import { VendorPayment, VendorInvoice, formatINR } from "../../types";

interface VendorPaymentsPanelProps {
  bills: VendorInvoice[];
}

export default function VendorPaymentsPanel({ bills }: VendorPaymentsPanelProps) {
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [activeBills, setActiveBills] = useState<VendorInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Image 7
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("NEFT/RTGS Bank Transfer");
  const [payingFrom, setPayingFrom] = useState("HDFC Main Operating A/c (...8901)");
  const [referenceNo, setReferenceNo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [tdsDeducted, setTdsDeducted] = useState(0); // e.g., 2% standard corporate contract TDS
  const [attachmentName, setAttachmentName] = useState("");

  const payingAccounts = [
    "HDFC Main Operating A/c (...8901)",
    "ICICI Corporate Escrow Node (...5541)",
    "SBI Kolkata Logistics Node (...3092)",
    "Petty Cash Vault"
  ];

  const paymentMethods = [
    "NEFT/RTGS Bank Transfer",
    "IMPS Corporate Clearing",
    "UPI Business Handle",
    "Corporate Credit Card",
    "Direct Demand Draft",
    "Cash Voucher"
  ];

  useEffect(() => {
    const stored = localStorage.getItem("deinrim_vendor_payments");
    if (stored) {
      try { setPayments(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultPayments: VendorPayment[] = [
        {
          id: "pay-1",
          invoiceId: "bill-1",
          invoiceNumber: "BILL-2026-0001",
          supplierName: "PowerCell Systems India",
          amount: 75000,
          paymentDate: "2026-06-22",
          paymentMethod: "NEFT/RTGS Bank Transfer",
          payingFrom: "HDFC Main Operating A/c (...8901)",
          referenceNo: "TXN-9023847291B",
          isPartial: false,
          tdsDeducted: 2,
          attachmentName: "receipt_powercell_75k.pdf",
          createdAt: "2026-06-22"
        }
      ];
      setPayments(defaultPayments);
      localStorage.setItem("deinrim_vendor_payments", JSON.stringify(defaultPayments));
    }

    // Refresh active bills
    const storedBills = localStorage.getItem("deinrim_vendor_bills");
    if (storedBills) {
      try {
        const parsed: VendorInvoice[] = JSON.parse(storedBills);
        setActiveBills(parsed.filter(b => b.status !== "Paid"));
      } catch (e) {}
    }
  }, [showAddModal]);

  const savePayments = (updated: VendorPayment[]) => {
    setPayments(updated);
    localStorage.setItem("deinrim_vendor_payments", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setInvoiceId("");
    setAmount(0);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("NEFT/RTGS Bank Transfer");
    setPayingFrom("HDFC Main Operating A/c (...8901)");
    setReferenceNo("");
    setRemarks("");
    setIsPartial(false);
    setTdsDeducted(0);
    setAttachmentName("");
    setShowAddModal(true);
  };

  const handleInvoiceChange = (selectedBillId: string) => {
    setInvoiceId(selectedBillId);
    if (!selectedBillId) return;

    // Pull bill and look for total
    const storedBills = localStorage.getItem("deinrim_vendor_bills");
    if (storedBills) {
      try {
        const parsed: VendorInvoice[] = JSON.parse(storedBills);
        const bill = parsed.find(b => b.id === selectedBillId);
        if (bill) {
          setAmount(bill.totalAmount);
        }
      } catch (e) {}
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId || amount <= 0 || !referenceNo) {
      alert("Please ensure Invoice reference, Amount, and Transaction Reference are specified!");
      return;
    }

    // Load and update the specific Vendor Invoice status
    const storedBills = localStorage.getItem("deinrim_vendor_bills");
    let matchedBillNumber = "BILL-DIRECT";
    let matchedVendorName = "Direct Vendor Clearing";
    let vendorId = "direct";

    if (storedBills) {
      try {
        const parsedBills: VendorInvoice[] = JSON.parse(storedBills);
        const updatedBills = parsedBills.map(b => {
          if (b.id === invoiceId) {
            matchedBillNumber = b.billNumber;
            matchedVendorName = b.supplierName;
            vendorId = b.supplierId;
            return {
              ...b,
              status: isPartial ? "Partially Paid" as const : "Paid" as const
            };
          }
          return b;
        });
        localStorage.setItem("deinrim_vendor_bills", JSON.stringify(updatedBills));
      } catch (err) {}
    }

    const newPayment: VendorPayment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      invoiceNumber: matchedBillNumber,
      supplierName: matchedVendorName,
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      payingFrom,
      referenceNo,
      remarks: remarks || `TDS Deducted: ${tdsDeducted}%.`,
      isPartial,
      tdsDeducted,
      attachmentName: attachmentName || undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [newPayment, ...payments];
    savePayments(updated);
    setShowAddModal(false);

    // Save supplier ledger impact
    const storedLedgers = localStorage.getItem("deinrim_supplier_ledgers");
    const currentLedgers = storedLedgers ? JSON.parse(storedLedgers) : [];
    const newLedgerEntry = {
      id: `ledger-${Date.now()}`,
      supplierId: vendorId,
      type: "PAYMENT",
      referenceId: newPayment.referenceNo,
      amount: -Number(amount), // negative on ledger credit
      balance: 0,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem("deinrim_supplier_ledgers", JSON.stringify([newLedgerEntry, ...currentLedgers]));
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this payment log record?")) {
      const updated = payments.filter(p => p.id !== id);
      savePayments(updated);
    }
  };

  const filtered = payments.filter(p => {
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Outward Payments (by txn, supplier)..."
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
          <span>Record Outward Payment</span>
        </button>
      </div>

      {/* Outward Payments Table Grid */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Transaction ID</th>
                <th className="px-5 py-3 text-left">Recipient Vendor</th>
                <th className="px-5 py-3 text-left">Settled Invoice</th>
                <th className="px-5 py-3 text-left">Paid From</th>
                <th className="px-5 py-3 text-left">Method</th>
                <th className="px-5 py-3 text-left">TDS (%)</th>
                <th className="px-5 py-3 text-left">Paid Date</th>
                <th className="px-5 py-3 text-left">Amount Paid</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-emerald-400 font-bold">{p.referenceNo}</td>
                  <td className="px-5 py-4 font-bold text-slate-200">{p.supplierName}</td>
                  <td className="px-5 py-4 font-mono font-bold text-indigo-400">{p.invoiceNumber}</td>
                  <td className="px-5 py-4 text-slate-400">{p.payingFrom}</td>
                  <td className="px-5 py-4 text-slate-400">{p.paymentMethod}</td>
                  <td className="px-5 py-4 font-mono text-slate-400 text-center">{p.tdsDeducted > 0 ? `${p.tdsDeducted}%` : "—"}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{p.paymentDate}</td>
                  <td className="px-5 py-4 font-bold font-mono text-emerald-400 text-xs">{formatINR(p.amount)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
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

      {/* Record Payment Modal matching Image 7 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleRecordPayment}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Landmark className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Record Outward Payment
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Select Vendor Invoice *</label>
                <select
                  required
                  value={invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="">-- Select Bill (Invoice) --</option>
                  {activeBills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} - {b.supplierName} (Total: {formatINR(b.totalAmount)})
                    </option>
                  ))}
                  {activeBills.length === 0 && (
                    <option disabled value="">No unpaid bills available</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount Paid (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono font-bold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  >
                    {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Paying From Account</label>
                  <select
                    value={payingFrom}
                    onChange={(e) => setPayingFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-bold"
                  >
                    {payingAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold font-bold">Ref No. / Transaction ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN-102947B"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">TDS Deducted (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    placeholder="e.g., 2"
                    value={tdsDeducted}
                    onChange={(e) => setTdsDeducted(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="partial"
                  checked={isPartial}
                  onChange={(e) => setIsPartial(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="partial" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer">This is a partial payment</label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Remarks / Description</label>
                <textarea
                  rows={2}
                  placeholder="Memo, clearance references..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Upload Payment Receipt Proof</label>
                <div className="border border-dashed border-slate-800 rounded-lg p-2 text-center bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAttachmentName(file.name);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileUp className="h-5 w-5 mx-auto text-slate-500 mb-0.5" />
                  <span className="text-[10px] text-slate-400 block font-bold truncate">
                    {attachmentName ? `Selected: ${attachmentName}` : "Choose file or drag & drop"}
                  </span>
                </div>
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Confirm Outward Payment</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

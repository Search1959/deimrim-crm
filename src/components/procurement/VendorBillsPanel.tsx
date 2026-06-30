import React from "react";
import { FileCheck } from "lucide-react";
import { Supplier, PurchaseOrder, formatINR } from "../../types";

interface Props {
  suppliers: Supplier[];
  orders: PurchaseOrder[];
}

export default function VendorBillsPanel({ suppliers, orders }: Props) {
  const billable = orders.filter(po => po.status === "completed" || po.status === "approved");

  return (
    <div className="space-y-4">
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileCheck className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white font-mono">Vendor Bills</h3>
        </div>
        <p className="text-xs text-slate-400">Bills generated from completed or approved purchase orders.</p>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
            <tr>
              <th className="px-5 py-3 text-left">PO Number</th>
              <th className="px-5 py-3 text-left">Vendor</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-right">Amount</th>
              <th className="px-5 py-3 text-left">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {billable.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No bills yet. Bills appear here when POs are approved or completed.
                </td>
              </tr>
            ) : billable.map(po => {
              const sup = suppliers.find(s => s.id === po.supplierId);
              return (
                <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 font-bold text-indigo-400 font-mono">{po.poNumber}</td>
                  <td className="px-5 py-4 font-semibold text-slate-100">{sup?.name ?? "—"}</td>
                  <td className="px-5 py-4 font-mono text-slate-400">{po.deliveryDate ?? new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-right font-bold font-mono text-slate-200">{formatINR(po.totalAmount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      po.paymentStatus === "paid"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}>
                      {po.paymentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

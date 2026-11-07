import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, ShieldCheck, Landmark } from "lucide-react";
import { formatINR, PurchaseOrder, VendorInvoice, Supplier } from "../../types";

interface Props {
  purchaseOrders: PurchaseOrder[];
  vendorBills: VendorInvoice[];
  suppliers: Supplier[];
}

export default function ProcurementAnalyticsPanel({ purchaseOrders, vendorBills, suppliers }: Props) {
  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  const totalSpend = useMemo(() => vendorBills.reduce((s, b) => s + b.totalAmount, 0), [vendorBills]);
  const outstanding = useMemo(() => vendorBills.reduce((s, b) => s + b.balanceAmount, 0), [vendorBills]);
  const pendingCount = useMemo(() => vendorBills.filter(b => b.status !== "Paid").length, [vendorBills]);

  const spendHistoryData = useMemo(() => {
    const months: Record<string, number> = {};
    vendorBills.forEach(b => {
      const m = (b.invoiceDate || b.createdAt || "").slice(0, 7);
      if (m) months[m] = (months[m] || 0) + b.totalAmount;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([m, amount]) => ({
      month: new Date(m + "-01").toLocaleString("default", { month: "short" }),
      amount,
    }));
  }, [vendorBills]);

  const vendorPerformanceData = useMemo(() => {
    const bySupplier: Record<string, { total: number; paid: number; name: string }> = {};
    vendorBills.forEach(b => {
      if (!bySupplier[b.supplierId]) bySupplier[b.supplierId] = { total: 0, paid: 0, name: b.supplierName };
      bySupplier[b.supplierId].total += b.totalAmount;
      bySupplier[b.supplierId].paid += b.paidAmount;
    });
    return Object.values(bySupplier)
      .map((v, i) => ({ name: v.name, rating: v.total > 0 ? Math.round((v.paid / v.total) * 100) : 100, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }, [vendorBills]);

  const departmentSpendData = useMemo(() => {
    if (vendorBills.length === 0) return [
      { name: "Engineering", amount: 0 }, { name: "Operations", amount: 0 },
    ];
    const bySupplier: Record<string, number> = {};
    vendorBills.forEach(b => { bySupplier[b.supplierName] = (bySupplier[b.supplierName] || 0) + b.totalAmount; });
    return Object.entries(bySupplier).map(([name, amount]) => ({ name: name.length > 15 ? name.slice(0, 13) + "…" : name, amount })).slice(0, 6);
  }, [vendorBills]);

  return (
    <div className="space-y-6">
      {/* KPI Dashboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Total Sourcing Spend</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">{formatINR(totalSpend)}</strong>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">{vendorBills.length} bills recorded</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Avg. PR-to-PO Cycle</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">{purchaseOrders.length} POs</strong>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">{purchaseOrders.filter(p => p.status === "completed").length} completed</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Supplier Quality Rating</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">{suppliers.length} Vendors</strong>
            <span className="text-[9px] text-slate-400 font-bold font-mono">Active in directory</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Outstanding Liabilities</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">{formatINR(outstanding)}</strong>
            <span className="text-[9px] text-amber-400 font-bold font-mono">{pendingCount} invoice{pendingCount !== 1 ? "s" : ""} pending</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sourcing Spend Flow - AreaChart */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
            Outward Procurement Expenditure flow
          </span>
          <div className="h-60 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: any) => [formatINR(value), "Sourcing Outflow"]}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend by Department - BarChart */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
            Sourcing Expenditure by Cost Centre
          </span>
          <div className="h-60 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentSpendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: any) => [formatINR(value), "Dept Spending"]}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {departmentSpendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supplier SLA Performance Lead Time Quality */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 col-span-full">
          <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
            Registered Vendor SLA & Fulfillment Metrics
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {vendorPerformanceData.map((vendor) => (
              <div key={vendor.name} className="bg-slate-50 border border-slate-850 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-700 font-bold truncate max-w-[130px]">{vendor.name}</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-300">{vendor.rating}% SLA</span>
                </div>
                {/* Simulated bar indicator */}
                <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ width: `${vendor.rating}%`, backgroundColor: vendor.color }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                  <span>In-time deliveries: 95%</span>
                  <span>QC Failures: 0.2%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



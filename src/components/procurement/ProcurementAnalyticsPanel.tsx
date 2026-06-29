import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, ShieldCheck, Landmark } from "lucide-react";
import { formatINR } from "../../types";

export default function ProcurementAnalyticsPanel() {
  const departmentSpendData = [
    { name: "Engineering", amount: 480000 },
    { name: "Operations", amount: 290000 },
    { name: "Administration", amount: 110000 },
    { name: "Logistics", amount: 185000 },
    { name: "Marketing", amount: 45000 }
  ];

  const spendHistoryData = [
    { month: "Jan", amount: 320000 },
    { month: "Feb", amount: 410000 },
    { month: "Mar", amount: 380000 },
    { month: "Apr", amount: 590000 },
    { month: "May", amount: 620000 },
    { month: "Jun", amount: 840000 }
  ];

  const vendorPerformanceData = [
    { name: "PowerCell Systems", rating: 98, color: "#6366f1" },
    { name: "Global Hardware", rating: 92, color: "#3b82f6" },
    { name: "Tata Solar Grid", rating: 95, color: "#10b981" },
    { name: "Sharma Stationery", rating: 88, color: "#f59e0b" }
  ];

  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="space-y-6">
      {/* KPI Dashboard Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Total Sourcing Spend</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">{formatINR(1110000)}</strong>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">↑ 14.2% Month-over-Month</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Avg. PR-to-PO Cycle</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">1.7 Days</strong>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">↓ 0.4 days improvement</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Supplier Quality Rating</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">93.2% Passed</strong>
            <span className="text-[9px] text-slate-400 font-bold font-mono">Over 48 items processed</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Outstanding Liabilities</span>
            <strong className="text-sm font-bold text-white font-mono block mt-0.5">{formatINR(85000)}</strong>
            <span className="text-[9px] text-amber-400 font-bold font-mono">1 invoice pending payment</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sourcing Spend Flow - AreaChart */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
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
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
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
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3 col-span-full">
          <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
            Registered Vendor SLA & Fulfillment Metrics
          </span>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {vendorPerformanceData.map((vendor) => (
              <div key={vendor.name} className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-200 font-bold truncate max-w-[130px]">{vendor.name}</span>
                  <span className="text-[10px] font-mono font-bold text-indigo-300">{vendor.rating}% SLA</span>
                </div>
                {/* Simulated bar indicator */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
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

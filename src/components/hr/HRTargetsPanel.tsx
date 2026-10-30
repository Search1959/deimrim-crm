import React, { useState } from "react";
import { Target, TrendingUp, Plus, Trophy, DollarSign, CheckCircle, Clock, X } from "lucide-react";
import { Employee, formatINR } from "../../types";

interface Props { employees: Employee[]; }

interface EmployeeTarget {
  id: string;
  employeeId: string;
  employeeName: string;
  targetType: "sales" | "calls" | "leads" | "collections" | "custom";
  description: string;
  targetValue: number;
  achievedValue: number;
  incentiveAmount: number;
  period: string;
  status: "active" | "achieved" | "missed";
}

const SEED_TARGETS: EmployeeTarget[] = [
  { id: "t1", employeeId: "emp-1", employeeName: "Rahul Sharma", targetType: "sales", description: "Monthly Sales Target", targetValue: 500000, achievedValue: 420000, incentiveAmount: 8400, period: "Oct 2026", status: "active" },
  { id: "t2", employeeId: "emp-2", employeeName: "Priya Mehta", targetType: "leads", description: "New Leads Conversion", targetValue: 20, achievedValue: 22, incentiveAmount: 5000, period: "Oct 2026", status: "achieved" },
  { id: "t3", employeeId: "emp-3", employeeName: "Amit Singh", targetType: "calls", description: "Customer Calls per Month", targetValue: 150, achievedValue: 130, incentiveAmount: 2000, period: "Oct 2026", status: "active" },
  { id: "t4", employeeId: "emp-4", employeeName: "Sneha Roy", targetType: "collections", description: "Receivables Collection", targetValue: 300000, achievedValue: 280000, incentiveAmount: 5600, period: "Sep 2026", status: "missed" },
];

const TYPE_COLORS: Record<string, string> = {
  sales: "bg-indigo-100 text-indigo-700",
  calls: "bg-sky-100 text-sky-700",
  leads: "bg-emerald-100 text-emerald-700",
  collections: "bg-amber-100 text-amber-700",
  custom: "bg-slate-100 text-slate-700",
};

export default function HRTargetsPanel({ employees }: Props) {
  const [targets, setTargets] = useState<EmployeeTarget[]>(SEED_TARGETS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", targetType: "sales" as EmployeeTarget["targetType"], description: "", targetValue: "", achievedValue: "0", incentiveAmount: "", period: "Oct 2026" });

  const totalIncentives = targets.filter(t => t.status === "achieved").reduce((s, t) => s + t.incentiveAmount, 0);
  const achievedCount = targets.filter(t => t.status === "achieved").length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === form.employeeId);
    const newT: EmployeeTarget = {
      id: `t-${Date.now()}`, employeeId: form.employeeId,
      employeeName: emp?.name || "Unknown", targetType: form.targetType,
      description: form.description, targetValue: Number(form.targetValue),
      achievedValue: Number(form.achievedValue), incentiveAmount: Number(form.incentiveAmount),
      period: form.period, status: "active",
    };
    setTargets(prev => [newT, ...prev]);
    setShowForm(false);
    setForm({ employeeId: "", targetType: "sales", description: "", targetValue: "", achievedValue: "0", incentiveAmount: "", period: "Oct 2026" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Targets & Incentives</h2>
          <p className="text-xs text-slate-500 mt-0.5">Set employee performance targets and track incentive payouts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Target
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Targets", value: targets.length, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Achieved", value: achievedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "In Progress", value: targets.filter(t => t.status === "active").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Incentives Earned", value: formatINR(totalIncentives), icon: DollarSign, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`${c.bg} p-2.5 rounded-lg`}><c.icon className={`h-5 w-5 ${c.color}`} /></div>
            <div><p className="text-xs text-slate-500 font-medium">{c.label}</p><p className="text-base font-bold text-slate-900">{c.value}</p></div>
          </div>
        ))}
      </div>

      {/* Targets table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Employee", "Target", "Type", "Progress", "Incentive", "Period", "Status"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {targets.map(t => {
              const pct = Math.min(100, Math.round((t.achievedValue / t.targetValue) * 100));
              return (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-800">{t.employeeName}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{t.description}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${TYPE_COLORS[t.targetType]}`}>{t.targetType}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 min-w-[60px]">
                        <div className={`h-1.5 rounded-full ${pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-indigo-500" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 shrink-0">{pct}%</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">{t.achievedValue.toLocaleString()} / {t.targetValue.toLocaleString()}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{formatINR(t.incentiveAmount)}</td>
                  <td className="px-4 py-3 text-slate-500">{t.period}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === "achieved" ? "bg-emerald-100 text-emerald-700" : t.status === "missed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {t.status === "achieved" ? "Achieved" : t.status === "missed" ? "Missed" : "Active"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add target modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Employee Target</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee</label>
                <select required value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Select employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Type</label>
                  <select value={form.targetType} onChange={e => setForm(p => ({ ...p, targetType: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option value="sales">Sales</option><option value="calls">Calls</option><option value="leads">Leads</option><option value="collections">Collections</option><option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Period</label>
                  <input required value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Oct 2026" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <input required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. Monthly Sales Target" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Value</label>
                  <input required type="number" value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Achieved</label>
                  <input type="number" value={form.achievedValue} onChange={e => setForm(p => ({ ...p, achievedValue: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Incentive (₹)</label>
                  <input required type="number" value={form.incentiveAmount} onChange={e => setForm(p => ({ ...p, incentiveAmount: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="5000" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Save Target</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

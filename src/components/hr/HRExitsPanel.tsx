import React, { useState } from "react";
import { LogOut, Plus, X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Employee } from "../../types";

interface Props { employees: Employee[]; }

interface ExitRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  exitType: "resignation" | "termination" | "retirement" | "contract-end";
  noticeDate: string;
  lastWorkingDay: string;
  reason: string;
  status: "notice-period" | "clearance-pending" | "completed";
  fnfAmount: number;
  feedback: string;
}

const SEED_EXITS: ExitRecord[] = [
  { id: "e1", employeeId: "emp-5", employeeName: "Kiran Verma", department: "Sales", exitType: "resignation", noticeDate: "2026-10-01", lastWorkingDay: "2026-10-31", reason: "Better opportunity", status: "notice-period", fnfAmount: 45000, feedback: "Good performer, will be missed" },
  { id: "e2", employeeId: "emp-6", employeeName: "Suresh Nair", department: "Finance", exitType: "contract-end", noticeDate: "2026-09-15", lastWorkingDay: "2026-10-15", reason: "Contract term completed", status: "clearance-pending", fnfAmount: 12000, feedback: "Reliable contractor" },
  { id: "e3", employeeId: "emp-7", employeeName: "Anjali Bose", department: "HR", exitType: "retirement", noticeDate: "2026-08-01", lastWorkingDay: "2026-09-30", reason: "Superannuation at 60", status: "completed", fnfAmount: 180000, feedback: "25 years of dedicated service" },
];

const EXIT_TYPE_COLORS: Record<string, string> = {
  resignation: "bg-amber-100 text-amber-700",
  termination: "bg-red-100 text-red-700",
  retirement: "bg-indigo-100 text-indigo-700",
  "contract-end": "bg-slate-100 text-slate-700",
};

export default function HRExitsPanel({ employees }: Props) {
  const [exits, setExits] = useState<ExitRecord[]>(SEED_EXITS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", exitType: "resignation" as ExitRecord["exitType"], noticeDate: "", lastWorkingDay: "", reason: "", fnfAmount: "", feedback: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(x => x.id === form.employeeId);
    setExits(prev => [{
      id: `exit-${Date.now()}`, employeeId: form.employeeId, employeeName: emp?.name || "Unknown",
      department: emp?.department || "—", exitType: form.exitType, noticeDate: form.noticeDate,
      lastWorkingDay: form.lastWorkingDay, reason: form.reason, status: "notice-period",
      fnfAmount: Number(form.fnfAmount), feedback: form.feedback,
    }, ...prev]);
    setShowForm(false);
    setForm({ employeeId: "", exitType: "resignation", noticeDate: "", lastWorkingDay: "", reason: "", fnfAmount: "", feedback: "" });
  };

  const updateStatus = (id: string, status: ExitRecord["status"]) => {
    setExits(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Employee Exits</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track resignations, terminations, retirements and full & final settlements</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          <Plus className="h-3.5 w-3.5" /> Record Exit
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "In Notice Period", value: exits.filter(e => e.status === "notice-period").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Clearance Pending", value: exits.filter(e => e.status === "clearance-pending").length, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Completed", value: exits.filter(e => e.status === "completed").length, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-white flex items-center gap-3`}>
            <c.icon className={`h-5 w-5 ${c.color} shrink-0`} />
            <div><p className="text-xs font-semibold text-slate-600">{c.label}</p><p className={`text-xl font-bold ${c.color}`}>{c.value}</p></div>
          </div>
        ))}
      </div>

      {/* Exit records */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Employee", "Dept", "Exit Type", "Notice Date", "Last Day", "FnF Amount", "Status", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {exits.map(ex => (
              <tr key={ex.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{ex.employeeName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 italic">{ex.reason}</p>
                </td>
                <td className="px-4 py-3 text-slate-500">{ex.department}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${EXIT_TYPE_COLORS[ex.exitType]}`}>{ex.exitType.replace("-", " ")}</span></td>
                <td className="px-4 py-3 text-slate-600">{ex.noticeDate}</td>
                <td className="px-4 py-3 text-slate-600">{ex.lastWorkingDay}</td>
                <td className="px-4 py-3 font-semibold text-slate-700">₹{ex.fnfAmount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ex.status === "completed" ? "bg-emerald-100 text-emerald-700" : ex.status === "clearance-pending" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {ex.status.replace("-", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {ex.status === "notice-period" && <button onClick={() => updateStatus(ex.id, "clearance-pending")} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold">→ Clearance</button>}
                  {ex.status === "clearance-pending" && <button onClick={() => updateStatus(ex.id, "completed")} className="text-[10px] text-emerald-600 hover:text-emerald-800 font-semibold">→ Complete</button>}
                  {ex.status === "completed" && <span className="text-[10px] text-slate-400">Done</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Exit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Record Employee Exit</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Exit Type</label>
                  <select value={form.exitType} onChange={e => setForm(p => ({ ...p, exitType: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option value="resignation">Resignation</option><option value="termination">Termination</option><option value="retirement">Retirement</option><option value="contract-end">Contract End</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">FnF Amount (₹)</label>
                  <input type="number" required value={form.fnfAmount} onChange={e => setForm(p => ({ ...p, fnfAmount: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Notice Date</label>
                  <input type="date" required value={form.noticeDate} onChange={e => setForm(p => ({ ...p, noticeDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Working Day</label>
                  <input type="date" required value={form.lastWorkingDay} onChange={e => setForm(p => ({ ...p, lastWorkingDay: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason</label>
                <input required value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Exit Feedback</label>
                <textarea rows={2} value={form.feedback} onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

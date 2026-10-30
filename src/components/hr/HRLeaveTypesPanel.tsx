import React, { useState } from "react";
import { List, Plus, X, Edit2, Trash2 } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  code: string;
  daysAllowed: number;
  carryForward: boolean;
  paidLeave: boolean;
  applicableTo: "all" | "male" | "female" | "permanent" | "contractual";
  description: string;
}

const SEED_LEAVE_TYPES: LeaveType[] = [
  { id: "lt1", name: "Annual Leave", code: "AL", daysAllowed: 18, carryForward: true, paidLeave: true, applicableTo: "all", description: "Earned leave for rest and recreation" },
  { id: "lt2", name: "Sick Leave", code: "SL", daysAllowed: 12, carryForward: false, paidLeave: true, applicableTo: "all", description: "Medical illness or injury" },
  { id: "lt3", name: "Casual Leave", code: "CL", daysAllowed: 6, carryForward: false, paidLeave: true, applicableTo: "all", description: "Urgent personal matters" },
  { id: "lt4", name: "Maternity Leave", code: "ML", daysAllowed: 182, carryForward: false, paidLeave: true, applicableTo: "female", description: "As per Maternity Benefit Act 1961" },
  { id: "lt5", name: "Paternity Leave", code: "PL", daysAllowed: 15, carryForward: false, paidLeave: true, applicableTo: "male", description: "For new fathers" },
  { id: "lt6", name: "Loss of Pay", code: "LOP", daysAllowed: 999, carryForward: false, paidLeave: false, applicableTo: "all", description: "Unpaid leave beyond quota" },
  { id: "lt7", name: "Compensatory Off", code: "CO", daysAllowed: 12, carryForward: false, paidLeave: true, applicableTo: "all", description: "Comp-off for working on holidays" },
];

const APPLICABLE_LABELS: Record<string, string> = { all: "All Employees", male: "Male Only", female: "Female Only", permanent: "Permanent", contractual: "Contractual" };

export default function HRLeaveTypesPanel() {
  const [types, setTypes] = useState<LeaveType[]>(SEED_LEAVE_TYPES);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [form, setForm] = useState<Omit<LeaveType, "id">>({ name: "", code: "", daysAllowed: 12, carryForward: false, paidLeave: true, applicableTo: "all", description: "" });

  const openAdd = () => { setEditing(null); setForm({ name: "", code: "", daysAllowed: 12, carryForward: false, paidLeave: true, applicableTo: "all", description: "" }); setShowForm(true); };
  const openEdit = (lt: LeaveType) => { setEditing(lt); setForm({ name: lt.name, code: lt.code, daysAllowed: lt.daysAllowed, carryForward: lt.carryForward, paidLeave: lt.paidLeave, applicableTo: lt.applicableTo, description: lt.description }); setShowForm(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setTypes(prev => prev.map(t => t.id === editing.id ? { ...editing, ...form } : t));
    } else {
      setTypes(prev => [{ id: `lt-${Date.now()}`, ...form }, ...prev]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => setTypes(prev => prev.filter(t => t.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Leave Types</h2>
          <p className="text-xs text-slate-500 mt-0.5">Configure leave categories, entitlements and carry-forward rules</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Leave Type
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4 border border-white">
          <p className="text-xs font-semibold text-slate-600">Total Types</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{types.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-white">
          <p className="text-xs font-semibold text-slate-600">Paid Leave Types</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{types.filter(t => t.paidLeave).length}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-white">
          <p className="text-xs font-semibold text-slate-600">Carry Forward Allowed</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{types.filter(t => t.carryForward).length}</p>
        </div>
      </div>

      {/* Leave type cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map(lt => (
          <div key={lt.id} className="bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-100 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">{lt.code}</span>
                <div>
                  <p className="text-sm font-bold text-slate-800">{lt.name}</p>
                  <p className="text-[10px] text-slate-400">{APPLICABLE_LABELS[lt.applicableTo]}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(lt)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(lt.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">{lt.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
              <div className="text-center">
                <p className="text-[10px] text-slate-400">Days/Year</p>
                <p className="text-sm font-bold text-slate-700">{lt.daysAllowed === 999 ? "Unlimited" : lt.daysAllowed}</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${lt.paidLeave ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{lt.paidLeave ? "Paid" : "Unpaid"}</span>
                {lt.carryForward && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700">Carry Forward</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">{editing ? "Edit" : "Add"} Leave Type</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Code</label>
                  <input required maxLength={4} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Days Per Year</label>
                  <input required type="number" value={form.daysAllowed} onChange={e => setForm(p => ({ ...p, daysAllowed: Number(e.target.value) }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Applicable To</label>
                  <select value={form.applicableTo} onChange={e => setForm(p => ({ ...p, applicableTo: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <option value="all">All</option><option value="male">Male</option><option value="female">Female</option><option value="permanent">Permanent</option><option value="contractual">Contractual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.paidLeave} onChange={e => setForm(p => ({ ...p, paidLeave: e.target.checked }))} className="rounded" />
                  Paid Leave
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={form.carryForward} onChange={e => setForm(p => ({ ...p, carryForward: e.target.checked }))} className="rounded" />
                  Carry Forward
                </label>
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



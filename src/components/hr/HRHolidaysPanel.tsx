import React, { useState } from "react";
import { CalendarDays, Plus, X, Trash2, Star } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: "national" | "regional" | "optional" | "company";
  restricted: boolean;
}

const SEED_HOLIDAYS: Holiday[] = [
  { id: "h1", name: "Republic Day", date: "2026-01-26", day: "Monday", type: "national", restricted: false },
  { id: "h2", name: "Holi", date: "2026-03-20", day: "Friday", type: "national", restricted: false },
  { id: "h3", name: "Good Friday", date: "2026-04-03", day: "Friday", type: "national", restricted: false },
  { id: "h4", name: "Rabindra Jayanti", date: "2026-05-09", day: "Saturday", type: "regional", restricted: false },
  { id: "h5", name: "Independence Day", date: "2026-08-15", day: "Saturday", type: "national", restricted: false },
  { id: "h6", name: "Eid ul-Adha", date: "2026-06-17", day: "Wednesday", type: "national", restricted: true },
  { id: "h7", name: "Durga Puja (Saptami)", date: "2026-10-08", day: "Thursday", type: "regional", restricted: false },
  { id: "h8", name: "Durga Puja (Ashtami)", date: "2026-10-09", day: "Friday", type: "regional", restricted: false },
  { id: "h9", name: "Durga Puja (Navami)", date: "2026-10-10", day: "Saturday", type: "regional", restricted: false },
  { id: "h10", name: "Diwali", date: "2026-10-27", day: "Tuesday", type: "national", restricted: false },
  { id: "h11", name: "Christmas", date: "2026-12-25", day: "Friday", type: "national", restricted: false },
  { id: "h12", name: "Company Foundation Day", date: "2026-09-15", day: "Tuesday", type: "company", restricted: false },
];

const TYPE_COLORS: Record<string, string> = {
  national: "bg-indigo-100 text-indigo-700",
  regional: "bg-violet-100 text-violet-700",
  optional: "bg-amber-100 text-amber-700",
  company: "bg-emerald-100 text-emerald-700",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function HRHolidaysPanel() {
  const [holidays, setHolidays] = useState<Holiday[]>(SEED_HOLIDAYS);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ name: "", date: "", type: "national" as Holiday["type"], restricted: false });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const d = new Date(form.date);
    const day = d.toLocaleDateString("en-US", { weekday: "long" });
    setHolidays(prev => [...prev, { id: `h-${Date.now()}`, ...form, day }].sort((a, b) => a.date.localeCompare(b.date)));
    setShowForm(false);
    setForm({ name: "", date: "", type: "national", restricted: false });
  };

  const filtered = filter === "all" ? holidays : holidays.filter(h => h.type === filter);

  const grouped = MONTHS.reduce((acc, m, i) => {
    const month = String(i + 1).padStart(2, "0");
    const items = filtered.filter(h => h.date.slice(5, 7) === month);
    if (items.length) acc[m] = items;
    return acc;
  }, {} as Record<string, Holiday[]>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Holiday Calendar 2026</h2>
          <p className="text-xs text-slate-500 mt-0.5">Company-wide holidays, regional observances and optional restricted holidays</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Holiday
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Holidays", value: holidays.length, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "National", value: holidays.filter(h => h.type === "national").length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Regional", value: holidays.filter(h => h.type === "regional").length, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Restricted", value: holidays.filter(h => h.restricted).length, color: "text-amber-600", bg: "bg-amber-50" },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-3 border border-white text-center`}>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "national", "regional", "optional", "company"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter === f ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{f}</button>
        ))}
      </div>

      {/* Calendar grouped by month */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{month} 2026</span>
            </div>
            <div className="divide-y divide-slate-50">
              {items.map(h => (
                <div key={h.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center">
                      <p className="text-base font-black text-slate-800">{h.date.slice(8)}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase">{h.day.slice(0, 3)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{h.name}</p>
                        {h.restricted && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">Restricted</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${TYPE_COLORS[h.type]}`}>{h.type}</span>
                    <button onClick={() => setHolidays(prev => prev.filter(x => x.id !== h.id))} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-sm text-slate-400">No holidays for this filter</div>
        )}
      </div>

      {/* Add Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Holiday</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Holiday Name</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Date</label><input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="national">National</option><option value="regional">Regional</option><option value="optional">Optional</option><option value="company">Company</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer pt-1">
                <input type="checkbox" checked={form.restricted} onChange={e => setForm(p => ({ ...p, restricted: e.target.checked }))} className="rounded" />
                Restricted Holiday (employee may choose)
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

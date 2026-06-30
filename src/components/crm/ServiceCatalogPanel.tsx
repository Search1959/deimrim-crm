import React, { useState } from "react";
import { Plus, Trash2, Edit, Wrench, Check } from "lucide-react";
import { ServiceCatalogItem, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  serviceCatalog: ServiceCatalogItem[];
  setServiceCatalog: React.Dispatch<React.SetStateAction<ServiceCatalogItem[]>>;
}

const BLANK = (): Omit<ServiceCatalogItem, "id"> => ({
  name: "",
  sacCode: "",
  unit: "Job",
  defaultRate: 0,
  description: "",
});

const UNITS = ["Hour", "Day", "Month", "Year", "Job", "Visit", "Project", "Unit", "License"];

export default function ServiceCatalogPanel({ serviceCatalog, setServiceCatalog }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceCatalogItem | null>(null);
  const [form, setForm] = useState(BLANK());

  const openAdd = () => { setForm(BLANK()); setEditing(null); setShowModal(true); };
  const openEdit = (svc: ServiceCatalogItem) => {
    setEditing(svc);
    setForm({ name: svc.name, sacCode: svc.sacCode, unit: svc.unit, defaultRate: svc.defaultRate, description: svc.description ?? "" });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.defaultRate <= 0) { toast.error("Name and rate are required"); return; }
    if (editing) {
      setServiceCatalog(prev => prev.map(s => s.id === editing.id ? { ...editing, ...form } : s));
      toast.success("Service Updated", form.name);
    } else {
      setServiceCatalog(prev => [...prev, { id: `svc-${Date.now()}`, ...form }]);
      toast.success("Service Added", `${form.name} added to catalog`);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Remove this service from catalog?")) return;
    setServiceCatalog(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Wrench className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white font-mono">Service Catalog</h3>
          </div>
          <p className="text-[11px] text-slate-400">Pre-saved services you can add to any invoice — no stock deducted, only Finance revenue posted.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Service
        </button>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {serviceCatalog.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No services yet. Click "Add Service" to create your first.
          </div>
        ) : serviceCatalog.map(svc => (
          <div key={svc.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 hover:border-violet-500/30 transition-all group">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-xs leading-snug">{svc.name}</div>
                {svc.description && (
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{svc.description}</div>
                )}
              </div>
              <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => openEdit(svc)} className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer">
                  <Edit className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(svc.id)} className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded cursor-pointer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex items-end justify-between mt-3 pt-3 border-t border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-[10px] text-slate-500 font-mono">
                  SAC: <span className="text-slate-300 font-semibold">{svc.sacCode || "—"}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Unit: <span className="text-slate-300">{svc.unit}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">Default Rate</div>
                <div className="font-bold text-violet-400 font-mono text-sm">{formatINR(svc.defaultRate)}</div>
                <div className="text-[9px] text-slate-500">per {svc.unit}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white font-mono">{editing ? "Edit Service" : "New Service"}</h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg leading-none">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Service Name *</label>
                <input
                  required type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Annual Maintenance Contract"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">SAC Code</label>
                  <input
                    type="text"
                    value={form.sacCode}
                    onChange={e => setForm(f => ({ ...f, sacCode: e.target.value }))}
                    placeholder="998311"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Billing Unit</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Default Rate (₹) *</label>
                <input
                  required type="number" min={1}
                  value={form.defaultRate}
                  onChange={e => setForm(f => ({ ...f, defaultRate: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Description <span className="text-slate-600 font-normal lowercase">(shown on invoice)</span></label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the service..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                <Check className="h-3.5 w-3.5" />
                {editing ? "Save Changes" : "Add Service"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

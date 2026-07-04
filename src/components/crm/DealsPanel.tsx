import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, ShieldAlert, Award, Eye } from "lucide-react";
import { Deal, Lead, formatINR } from "../../types";

interface DealsPanelProps {
  leads: Lead[];
  companyId: string;
  isDemo?: boolean;
}

export default function DealsPanel({ leads, companyId, isDemo }: DealsPanelProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [viewingDeal, setViewingDeal] = useState<Deal | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [leadId, setLeadId] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<Deal["stage"]>("Proposal");
  const [probability, setProbability] = useState(50);
  const [closeDate, setCloseDate] = useState("");
  const [notes, setNotes] = useState("");

  // Load from localStorage
  useEffect(() => {
    const key = `deinrim_deals_${companyId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setDeals(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse deals", e);
      }
    } else {
      // Seed default deals if they are on comp-1 (default demo company)
      const initialDeals: Deal[] = isDemo === true ? [
        {
          id: "deal-1",
          title: "SLA Office Automation Network Setup",
          leadId: leads[0]?.id || "",
          leadTitle: leads[0]?.name || "Tata Motors Requisition",
          value: 850000,
          stage: "Negotiation",
          probability: 80,
          expectedCloseDate: "2026-07-28",
          notes: "Awaiting legal agreement review from Kolkata center.",
          createdAt: "2026-06-20"
        },
        {
          id: "deal-2",
          title: "ERP Custom Node Rollout",
          leadId: leads[1]?.id || "",
          leadTitle: leads[1]?.name || "Wipro Workspace Upgrade",
          value: 1200000,
          stage: "Proposal",
          probability: 60,
          expectedCloseDate: "2026-08-15",
          notes: "Demo delivered. Client liked the whitelabel sub-accounts system.",
          createdAt: "2026-06-25"
        }
      ] : [];
      setDeals(initialDeals);
      localStorage.setItem(key, JSON.stringify(initialDeals));
    }
  }, [leads, companyId]);

  const saveDealsToStorage = (updated: Deal[]) => {
    setDeals(updated);
    localStorage.setItem(`deinrim_deals_${companyId}`, JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setTitle("");
    setLeadId("");
    setValue("");
    setStage("Proposal");
    setProbability(50);
    setCloseDate("");
    setNotes("");
    setShowAddModal(true);
  };

  const handleSaveDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !value) return;

    const linked = leads.find(l => l.id === leadId);
    const newDealItem: Deal = {
      id: `deal-${Date.now()}`,
      title,
      leadId,
      leadTitle: linked ? linked.name : "Unlinked Lead",
      value: parseFloat(value) || 0,
      stage,
      probability: Number(probability) || 50,
      expectedCloseDate: closeDate,
      notes,
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newDealItem, ...deals];
    saveDealsToStorage(updated);
    setShowAddModal(false);
  };

  const handleOpenEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setTitle(deal.title);
    setLeadId(deal.leadId || "");
    setValue(deal.value.toString());
    setStage(deal.stage);
    setProbability(deal.probability);
    setCloseDate(deal.expectedCloseDate);
    setNotes(deal.notes || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal || !title || !value) return;

    const linked = leads.find(l => l.id === leadId);
    const updated = deals.map(d => {
      if (d.id === editingDeal.id) {
        return {
          ...d,
          title,
          leadId,
          leadTitle: linked ? linked.name : "Unlinked Lead",
          value: parseFloat(value) || 0,
          stage,
          probability: Number(probability) || 50,
          expectedCloseDate: closeDate,
          notes
        };
      }
      return d;
    });

    saveDealsToStorage(updated);
    setEditingDeal(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      const updated = deals.filter(d => d.id !== id);
      saveDealsToStorage(updated);
    }
  };

  // Metrics
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const activeDeals = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").length;

  const filteredDeals = deals.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.leadTitle && d.leadTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = stageFilter === "All" || d.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Active Deals Pipeline</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5 block">{activeDeals} deals</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Cumulative Value</span>
            <span className="text-2xl font-bold text-indigo-400 font-mono mt-0.5 block">{formatINR(totalValue)}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Deal</span>
        </button>
      </div>

      {/* Stage Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "Proposal", "Negotiation", "Contract Sent", "Won", "Lost"].map(st => (
          <button
            key={st}
            onClick={() => setStageFilter(st)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              stageFilter === st
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Deal Title</th>
              <th className="px-4 py-3">Linked Lead</th>
              <th className="px-4 py-3">Deal Value</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Win Probability</th>
              <th className="px-4 py-3">Expected Close</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No active deals found.
                </td>
              </tr>
            ) : (
              filteredDeals.map(d => (
                <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white leading-snug">{d.title}</div>
                    {d.notes && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{d.notes}</div>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-300">{d.leadTitle || "—"}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-400">{formatINR(d.value)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      d.stage === "Won" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      d.stage === "Lost" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {d.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-slate-800 rounded-full h-1.5">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full" 
                          style={{ width: `${d.probability}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-300">{d.probability}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{d.expectedCloseDate || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingDeal(d)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all cursor-pointer"
                        title="View Deal"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(d)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all cursor-pointer"
                        title="Edit Deal"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                        title="Delete Deal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Deal Modal */}
      {(showAddModal || editingDeal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={editingDeal ? handleSaveEdit : handleSaveDeal}
            className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingDeal ? "Edit Deal" : "Add Deal"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingDeal(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise SLA Software Integration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Linked Lead</label>
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="">— None —</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Deal Value (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Stage</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as Deal["stage"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Contract Sent">Contract Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Win Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probability}
                    onChange={(e) => setProbability(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Expected Close</label>
                <input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Key timeline milestones, client feedback, next demo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingDeal(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingDeal ? "Save Changes" : "Save Deal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Viewing Deal Details Modal */}
      {viewingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-indigo-400">Deal Details</span>
              <button type="button" onClick={() => setViewingDeal(null)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-wider font-mono text-slate-400">Deal Title</span>
                <strong className="text-slate-200 text-sm">{viewingDeal.title}</strong>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 border-b border-slate-900 pb-2 font-semibold">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Linked Lead</span>
                  <strong className="text-slate-200">{viewingDeal.leadTitle || "—"}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Deal Value</span>
                  <strong className="text-emerald-400 font-mono font-bold text-sm">{formatINR(viewingDeal.value)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 border-b border-slate-900 pb-2 font-semibold">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Sales Stage</span>
                  <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {viewingDeal.stage}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Win Probability</span>
                  <strong className="text-indigo-400 font-mono font-bold">{viewingDeal.probability}%</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-400 border-b border-slate-900 pb-2 font-semibold">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Expected Close Date</span>
                  <strong className="text-slate-200">{viewingDeal.expectedCloseDate || "—"}</strong>
                </div>
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider font-mono">Created On</span>
                  <strong className="text-slate-200">{viewingDeal.createdAt || "—"}</strong>
                </div>
              </div>

              {viewingDeal.notes && (
                <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-850 text-slate-400 text-[10px] space-y-1">
                  <strong className="text-slate-300">Timeline & Operational Notes:</strong>
                  <p>{viewingDeal.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setViewingDeal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

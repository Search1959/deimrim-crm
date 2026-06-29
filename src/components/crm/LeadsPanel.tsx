import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, ArrowUpRight, Award, MessageSquare } from "lucide-react";
import { Lead, Customer, formatINR } from "../../types";

interface LeadsPanelProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  customers: Customer[];
}

export default function LeadsPanel({ leads, setLeads, customers }: LeadsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [source, setSource] = useState("Website");
  const [status, setStatus] = useState<Lead["status"]>("New");
  const [value, setValue] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenAdd = () => {
    setTitle("");
    setCompanyName("");
    setContactPerson("");
    setSource("Website");
    setStatus("New");
    setValue("");
    setCloseDate("");
    setNotes("");
    setShowAddModal(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newLeadItem: Lead & { title?: string; value?: number; closeDate?: string } = {
      id: `lead-${Date.now()}`,
      companyId: "comp-1",
      name: title, // Use title for name
      companyName: companyName,
      email: contactPerson ? `${contactPerson.toLowerCase().replace(/\s+/g, "")}@example.com` : "contact@example.com",
      phone: "+91 98300 00000",
      status: status,
      source: source,
      assignedTo: "Kolkata Sales Node",
      notes: notes,
      lastContacted: new Date().toISOString().split("T")[0],
    };

    // Stashing estimated value & closeDate in notes or custom format
    if (value || closeDate) {
      newLeadItem.notes = `${notes ? notes + " | " : ""}Est. Value: ₹${value} | Expected Close: ${closeDate}`;
    }

    setLeads(prev => [newLeadItem as Lead, ...prev]);
    setShowAddModal(false);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setTitle(lead.name);
    setCompanyName(lead.companyName || "");
    setContactPerson(lead.email.split("@")[0]);
    setSource(lead.source || "Website");
    setStatus(lead.status);
    
    // Parse value & closeDate from notes if exists
    const valueMatch = lead.notes?.match(/Est\. Value: ₹([\d.]+)/);
    const dateMatch = lead.notes?.match(/Expected Close: ([\d-]+)/);
    setValue(valueMatch ? valueMatch[1] : "");
    setCloseDate(dateMatch ? dateMatch[1] : "");
    setNotes(lead.notes?.split(" | Est. Value:")[0] || lead.notes || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    setLeads(prev => prev.map(l => {
      if (l.id === editingLead.id) {
        let finalNotes = notes;
        if (value || closeDate) {
          finalNotes = `${notes ? notes + " | " : ""}Est. Value: ₹${value} | Expected Close: ${closeDate}`;
        }
        return {
          ...l,
          name: title,
          companyName: companyName,
          status: status,
          source: source,
          notes: finalNotes,
        };
      }
      return l;
    }));
    setEditingLead(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  // Calculations
  const totalLeads = leads.length;
  const pipelineValue = leads.reduce((acc, l) => {
    const valMatch = l.notes?.match(/Est\. Value: ₹([\d.]+)/);
    return acc + (valMatch ? parseFloat(valMatch[1]) : 0);
  }, 0);

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (l.companyName && l.companyName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Leads</span>
            <span className="text-2xl font-bold text-white font-mono mt-0.5 block">{totalLeads}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Total Pipeline Value</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">{formatINR(pipelineValue)}</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              statusFilter === st
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table / List */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold text-left">
            <tr>
              <th className="px-4 py-3">Lead Title</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Est. Value (₹)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono">
                  No registered leads found.
                </td>
              </tr>
            ) : (
              filteredLeads.map(l => {
                const valMatch = l.notes?.match(/Est\. Value: ₹([\d.]+)/);
                const estValue = valMatch ? parseFloat(valMatch[1]) : 0;
                return (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{l.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{l.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">{l.companyName || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 font-medium">{l.source}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        l.status === "Won" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        l.status === "Lost" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">{estValue > 0 ? formatINR(estValue) : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-all"
                          title="Edit Lead"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Lead Modal */}
      {(showAddModal || editingLead) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={editingLead ? handleSaveEdit : handleSaveLead}
            className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingLead ? "Edit Lead" : "Add Lead"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingLead(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Lead Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website redesign for ABC Corp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Company</label>
                  <select
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="">— Select Company —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Amit Sen"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Lead["status"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Estimated Value (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Expected Close Date</label>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Client requirements, budget discussed, next steps..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingLead(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingLead ? "Save Changes" : "Save Lead"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

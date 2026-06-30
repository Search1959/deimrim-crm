import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, AlertCircle } from "lucide-react";
import { ServiceTicket, Customer } from "../../types";

interface TicketsPanelProps {
  customers: Customer[];
  companyId: string;
}

export default function TicketsPanel({ customers, companyId }: TicketsPanelProps) {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ServiceTicket | null>(null);

  // Form states
  const [subject, setSubject] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [priority, setPriority] = useState<ServiceTicket["priority"]>("Medium");
  const [status, setStatus] = useState<ServiceTicket["status"]>("Open");
  const [assignedTo, setAssignedTo] = useState("");
  const [description, setDescription] = useState("");

  const storageKey = `deinrim_service_tickets_${companyId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { setTickets(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultT: ServiceTicket[] = [
        {
          id: "tkt-1",
          ticketNumber: "ST-2026-0901",
          subject: "Whitelabel portal domain redirection issue",
          companyName: "Tata Motors Ltd",
          contactName: "Rohan Sen",
          priority: "High",
          status: "In Progress",
          assignedTo: "Kolkata DevOps Node",
          description: "CNAME configuration failing on whitelabel subdomain mapping.",
          createdAt: "2026-06-25"
        },
        {
          id: "tkt-2",
          ticketNumber: "ST-2026-0902",
          subject: "Duplicate billing items on invoice INV-2026-0001",
          companyName: "Wipro Technologies",
          contactName: "Aditi Roy",
          priority: "Medium",
          status: "Resolved",
          assignedTo: "Finance Audit Team",
          description: "System duplicated HSN line item on server reboot. Fixed immediately.",
          createdAt: "2026-06-26"
        }
      ];
      setTickets(defaultT);
      localStorage.setItem(storageKey, JSON.stringify(defaultT));
    }
  }, [companyId]);

  const saveTickets = (updated: ServiceTicket[]) => {
    setTickets(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setSubject("");
    setCompanyName("");
    setContactName("");
    setPriority("Medium");
    setStatus("Open");
    setAssignedTo("");
    setDescription("");
    setShowAddModal(true);
  };

  const handleSaveTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !companyName) return;

    const newTicket: ServiceTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `ST-2026-090${tickets.length + 1}`,
      subject,
      companyName,
      contactName,
      priority,
      status,
      assignedTo,
      description,
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newTicket, ...tickets];
    saveTickets(updated);
    setShowAddModal(false);
  };

  const handleOpenEdit = (t: ServiceTicket) => {
    setEditingTicket(t);
    setSubject(t.subject);
    setCompanyName(t.companyName);
    setContactName(t.contactName || "");
    setPriority(t.priority);
    setStatus(t.status);
    setAssignedTo(t.assignedTo || "");
    setDescription(t.description || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket || !subject || !companyName) return;

    const updated = tickets.map(t => {
      if (t.id === editingTicket.id) {
        return {
          ...t,
          subject,
          companyName,
          contactName,
          priority,
          status,
          assignedTo,
          description
        };
      }
      return t;
    });

    saveTickets(updated);
    setEditingTicket(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to close/delete this ticket?")) {
      const updated = tickets.filter(t => t.id !== id);
      saveTickets(updated);
    }
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Ticket</span>
        </button>
      </div>

      {/* Priority filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "Low", "Medium", "High", "Urgent"].map(pr => (
          <button
            key={pr}
            onClick={() => setPriorityFilter(pr)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              priorityFilter === pr
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {pr}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No active support tickets found.
          </div>
        ) : (
          filtered.map(t => (
            <div key={t.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-indigo-400 font-bold">{t.ticketNumber}</span>
                  <strong className="text-white text-xs block leading-snug">{t.subject}</strong>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${
                  t.priority === "Urgent" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  t.priority === "High" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {t.priority}
                </span>
              </div>

              {t.description && (
                <p className="text-[10px] text-slate-400 leading-relaxed truncate max-w-sm">{t.description}</p>
              )}

              <div className="space-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
                <div>Client: <span className="text-slate-200">{t.companyName} ({t.contactName || "—"})</span></div>
                <div>Status: <span className="text-slate-300 font-bold uppercase">{t.status}</span></div>
                <div>Assignee: <span className="text-slate-300">{t.assignedTo || "Unassigned"}</span></div>
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-slate-800/60 pt-2 mt-1">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  Edit Ticket
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Ticket Modal */}
      {(showAddModal || editingTicket) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form 
            onSubmit={editingTicket ? handleSaveEdit : handleSaveTicket}
            className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingTicket ? "Edit Ticket" : "Add Ticket"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingTicket(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Subject / Issue *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server response latency spike"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold font-bold">Company *</label>
                  <select
                    required
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
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ServiceTicket["priority"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceTicket["status"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Assigned Engineer / Team</label>
                <input
                  type="text"
                  placeholder="e.g. Kolkata Regional Technical Node"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Issue Description</label>
                <textarea
                  rows={2.5}
                  placeholder="Elaborate support issue context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingTicket(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingTicket ? "Save Changes" : "Save Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

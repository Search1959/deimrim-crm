import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Building2 } from "lucide-react";
import { Customer } from "../../types";

interface CompaniesPanelProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  companyId: string;
}

export default function CompaniesPanel({ customers, setCustomers, companyId }: CompaniesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setGstin("19AABCT1234D1Z5"); // Kolkata GST default
    setShowAddModal(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCompany: Customer = {
      id: `cust-${Date.now()}`,
      companyId: companyId,
      name,
      code: `CUST-${Date.now().toString().slice(-4)}`,
      email: email || "contact@business.com",
      phone: phone || "+91 98300 12345",
      address,
      outstandingBalance: 0,
      gstin: gstin || "19AABCT1234D1Z5"
    };

    setCustomers(prev => [newCompany, ...prev]);
    setShowAddModal(false);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setEmail(cust.email);
    setPhone(cust.phone || "");
    setAddress(cust.address || "");
    setGstin(cust.gstin || "19AABCT1234D1Z5");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !name) return;

    setCustomers(prev => prev.map(c => {
      if (c.id === editingCustomer.id) {
        return {
          ...c,
          name,
          email,
          phone,
          address,
          gstin
        };
      }
      return c;
    }));
    setEditingCustomer(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company profile? All linked CRM invoices and quotes will be preserved.")) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search business accounts..."
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
          <span>Add Company</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No registered business accounts found.
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-white text-xs block leading-tight">{c.name}</strong>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{c.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
                <div>GSTIN: <span className="font-mono text-slate-200">{c.gstin || "—"}</span></div>
                <div className="truncate">Addr: <span className="text-slate-300">{c.address || "—"}</span></div>
                <div>Phone: <span className="font-mono text-slate-300">{c.phone || "—"}</span></div>
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-slate-800/60 pt-2 mt-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  Edit Account
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Company Modal */}
      {(showAddModal || editingCustomer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form 
            onSubmit={editingCustomer ? handleSaveEdit : handleSaveCompany}
            className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingCustomer ? "Edit Company" : "Add Company"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingCustomer(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ITC Corporate Headquarters"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Contact</label>
                  <input
                    type="email"
                    placeholder="corp@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98300"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GSTIN ID</label>
                <input
                  type="text"
                  placeholder="19AABCT1234D1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Billing Address</label>
                <textarea
                  rows={2}
                  placeholder="Street details, state PIN code..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingCustomer(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingCustomer ? "Save Changes" : "Save Company"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

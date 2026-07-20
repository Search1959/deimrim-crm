import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Users, Upload, Download } from "lucide-react";
import { Contact, Customer } from "../../types";
import { toast } from "../../utils/toast";

interface ContactsPanelProps {
  customers: Customer[];
  companyId: string;
}

export default function ContactsPanel({ customers, companyId }: ContactsPanelProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");

  const storageKey = `deinrim_contacts_${companyId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { setContacts(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultC: Contact[] = [
        {
          id: "cont-1",
          name: "Rohan Sen",
          companyName: "Tata Motors Ltd",
          email: "rohan.sen@tatamotors.com",
          phone: "+91 98300 12345",
          designation: "Procurement Manager",
          createdAt: "2026-06-25"
        },
        {
          id: "cont-2",
          name: "Aditi Roy",
          companyName: "Wipro Technologies",
          email: "aditi.roy@wipro.com",
          phone: "+91 98311 54321",
          designation: "IT Operations Head",
          createdAt: "2026-06-26"
        }
      ];
      setContacts(defaultC);
      localStorage.setItem(storageKey, JSON.stringify(defaultC));
    }
  }, [companyId]);

  const saveContacts = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = contacts.map(c => ({
      "Name": c.name, "Company": c.companyName,
      "Email": c.email, "Phone": c.phone,
      "Designation": c.designation || "", "Created": c.createdAt,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "Contacts_Export.xlsx");
    toast.success("Exported", `${rows.length} contacts downloaded`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const XLSX = await import("xlsx");
    const data: any[] = XLSX.utils.sheet_to_json(XLSX.read(await file.arrayBuffer()).Sheets[XLSX.read(await file.arrayBuffer()).SheetNames[0]]);
    const ab = await file.arrayBuffer();
    const parsed: any[] = XLSX.utils.sheet_to_json(XLSX.read(ab).Sheets[XLSX.read(ab).SheetNames[0]]);
    const newContacts: Contact[] = [];
    parsed.forEach((row, i) => {
      const n = row["Name"] || row["name"] || ""; if (!n) return;
      newContacts.push({
        id: `cont-imp-${Date.now()}-${i}`,
        name: n, companyName: row["Company"] || row["companyName"] || "",
        email: row["Email"] || row["email"] || "",
        phone: row["Phone"] || row["phone"] || "",
        designation: row["Designation"] || row["designation"] || "",
        createdAt: new Date().toISOString().slice(0, 10),
      });
    });
    saveContacts([...newContacts, ...contacts]);
    toast.success("Import Complete", `${newContacts.length} contacts added`);
    e.target.value = "";
  };

  const handleOpenAdd = () => {
    setName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setDesignation("");
    setShowAddModal(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !companyName) return;

    const newContact: Contact = {
      id: `cont-${Date.now()}`,
      name,
      companyName,
      email: email || `${name.toLowerCase().replace(/\s+/g, "")}@example.com`,
      phone: phone || "+91 98300 00000",
      designation,
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newContact, ...contacts];
    saveContacts(updated);
    setShowAddModal(false);
  };

  const handleOpenEdit = (c: Contact) => {
    setEditingContact(c);
    setName(c.name);
    setCompanyName(c.companyName);
    setEmail(c.email);
    setPhone(c.phone);
    setDesignation(c.designation || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !name || !companyName) return;

    const updated = contacts.map(c => {
      if (c.id === editingContact.id) {
        return {
          ...c,
          name,
          companyName,
          email,
          phone,
          designation
        };
      }
      return c;
    });

    saveContacts(updated);
    setEditingContact(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      const updated = contacts.filter(c => c.id !== id);
      saveContacts(updated);
    }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search corporate contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border border-slate-700">
            <Download className="h-3.5 w-3.5" /><span>Export</span>
          </button>
          <label className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border border-slate-700">
            <Upload className="h-3.5 w-3.5" /><span>Import</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleOpenAdd} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer">
            <Plus className="h-3.5 w-3.5" /><span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No contacts recorded.
          </div>
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-white text-xs block leading-tight">{c.name}</strong>
                    <span className="text-[10px] text-indigo-400 font-bold mt-0.5 block">{c.designation || "Executive"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
                <div>Company: <span className="text-slate-200">{c.companyName}</span></div>
                <div>Email: <span className="font-mono text-slate-300">{c.email}</span></div>
                <div>Phone: <span className="font-mono text-slate-300">{c.phone}</span></div>
              </div>

              <div className="flex items-center justify-end gap-1 border-t border-slate-800/60 pt-2 mt-1">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  Edit Details
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

      {/* Add / Edit Contact Modal */}
      {(showAddModal || editingContact) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form 
            onSubmit={editingContact ? handleSaveEdit : handleSaveContact}
            className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {editingContact ? "Edit Contact" : "Add Contact"}
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); setEditingContact(null); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joydeep Banerjee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Company Name *</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                  <input
                    type="email"
                    placeholder="joydeep@corp.com"
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Chief Procurement Officer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingContact(null); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {editingContact ? "Save Changes" : "Save Contact"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

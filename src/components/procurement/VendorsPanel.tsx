import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, ShieldCheck, Mail, Phone, MapPin, Landmark, CreditCard, Sparkles } from "lucide-react";
import { Supplier } from "../../types";

interface VendorsPanelProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, "id">) => void;
  onDeleteSupplier: (id: string) => void;
  companyId: string;
}

export default function VendorsPanel({ suppliers, onAddSupplier, onDeleteSupplier, companyId }: VendorsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Image 8
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creditDays, setCreditDays] = useState(30);
  
  // Compliance info
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");

  // Bank transfer info
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankNameBranch, setBankNameBranch] = useState("");

  const handleOpenAdd = () => {
    setName("");
    setCode(`SUP-${2026000 + suppliers.length + 1}`);
    setEmail("");
    setContactPerson("");
    setPhone("");
    setAddress("");
    setCreditDays(30);
    setGstin("");
    setPan("");
    setAccountName("");
    setAccountNumber("");
    setIfsc("");
    setBankNameBranch("");
    setShowAddModal(true);
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !email || !contactPerson) {
      toast.error("Name, Code, Email and Contact Person required")
      return;
    }

    const newVendor = {
      companyId: companyId,
      name,
      code,
      email,
      contactPerson,
      phone,
      address,
      creditDays: Number(creditDays),
      taxId: gstin || undefined, // mapping to taxId
      // Store compliance + bank details inside supplementary fields in local Storage
      pan,
      accountName,
      accountNumber,
      ifsc,
      bankNameBranch
    };

    onAddSupplier(newVendor);
    setShowAddModal(false);
  };

  const filtered = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Vendor directory..."
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
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Vendors Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(sup => (
          <div key={sup.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[9px] text-indigo-400 font-bold">{sup.code}</span>
                <strong className="text-white text-xs block font-bold leading-tight">{sup.name}</strong>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded font-mono">
                {sup.creditDays} CREDIT DAYS
              </span>
            </div>

            <div className="space-y-1 text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 font-semibold">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-indigo-400" />
                <span>{sup.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-indigo-400" />
                <span>{sup.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-indigo-400 shrink-0" />
                <span className="truncate">{sup.address || "No address listed"}</span>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-2 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-slate-500">
                <span>Compliance:</span>
                <span className="text-slate-300 font-bold font-mono">GSTIN: {sup.taxId || "Pending Verification"}</span>
              </div>
              {/* Optional dynamic details */}
              <div className="flex justify-between items-center text-[9px] text-slate-500">
                <span>Contact Officer:</span>
                <span className="text-indigo-300 font-bold">{sup.contactPerson}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-800/60 pt-2">
              <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-bold uppercase font-mono">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Vendor</span>
              </div>
              <button
                onClick={() => onDeleteSupplier(sup.id)}
                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No registered vendors found matching directory search.
          </div>
        )}
      </div>

      {/* Add New Vendor Modal matching Image 8 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreateVendor}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Add New Vendor Profile
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowAddModal(false); }} 
                className="text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Legal Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Company Legal Entity"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vendor Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUP-1002"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Primary Contact Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="sales@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Primary Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Name of SPOC"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Credit Days Offered</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="30"
                    value={creditDays}
                    onChange={(e) => setCreditDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Registered Office Address</label>
                <textarea
                  rows={1.5}
                  placeholder="Street, State, PIN..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              {/* Compliance Segment */}
              <div className="border-t border-slate-800/80 pt-2">
                <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono mb-2">Compliance Verification</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GSTIN / Tax ID</label>
                    <input
                      type="text"
                      placeholder="15-character GSTIN"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">PAN Number</label>
                    <input
                      type="text"
                      placeholder="10-character PAN"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono font-bold uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Transfers */}
              <div className="border-t border-slate-800/80 pt-2">
                <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono mb-2">Bank Remittance Accounts</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Beneficiary Name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="A/c No."
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="11-digit IFSC"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bank Name & Branch</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank, Salt Lake"
                      value={bankNameBranch}
                      onChange={(e) => setBankNameBranch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Save Vendor Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

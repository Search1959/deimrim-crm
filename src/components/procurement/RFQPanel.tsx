import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, Send, FileUp, ShieldAlert, BadgeInfo, CheckCircle, Users } from "lucide-react";
import { RequestForQuotation, Supplier, PurchaseRequisition } from "../../types";

interface RFQPanelProps {
  suppliers: Supplier[];
}

export default function RFQPanel({ suppliers }: RFQPanelProps) {
  const [rfqs, setRfqs] = useState<RequestForQuotation[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Image 4
  const [rfqTitle, setRfqTitle] = useState("");
  const [linkedPrId, setLinkedPrId] = useState("");
  const [description, setDescription] = useState("");
  const [itemName, setItemName] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [uom, setUom] = useState("Nos");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [currency, setCurrency] = useState("IN INR (₹)");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [attachmentName, setAttachmentName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("deinrim_rfqs");
    if (stored) {
      try { setRfqs(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultRFQs: RequestForQuotation[] = [
        {
          id: "rfq-1",
          rfqNumber: "RFQ-2026-0001",
          title: "Request for high-capacity SSD nodes",
          linkedPrNumber: "PR-2026-0001",
          description: "Quotation request for enterprise server memory and SSD flash components.",
          itemName: "Enterprise SSD 3.84TB SAS",
          responseDeadline: "2026-07-05",
          quantity: 24,
          uom: "Nos",
          deliveryLocation: "HQ Operations Block, Salt Lake Sector V, Kolkata",
          currency: "IN INR (₹)",
          invitedVendors: ["Global Hardware Distributors", "MicroSemiconductors Co."],
          status: "Published",
          createdAt: "2026-06-26"
        }
      ];
      setRfqs(defaultRFQs);
      localStorage.setItem("deinrim_rfqs", JSON.stringify(defaultRFQs));
    }

    // Load requisitions for linking
    const storedPRs = localStorage.getItem("deinrim_purchase_requisitions");
    if (storedPRs) {
      try {
        const prs: PurchaseRequisition[] = JSON.parse(storedPRs);
        setRequisitions(prs.filter(pr => pr.status === "Approved"));
      } catch (e) {}
    }
  }, []);

  const saveRfqs = (updated: RequestForQuotation[]) => {
    setRfqs(updated);
    localStorage.setItem("deinrim_rfqs", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setRfqTitle("");
    setLinkedPrId("");
    setDescription("");
    setItemName("");
    setResponseDeadline("");
    setQuantity(1);
    setUom("Nos");
    setDeliveryLocation("HQ Central Hub, Kolkata");
    setCurrency("IN INR (₹)");
    setSelectedVendors([]);
    setAttachmentName("");
    setShowAddModal(true);
  };

  const handleLinkPRChange = (prId: string) => {
    setLinkedPrId(prId);
    if (!prId) return;

    const pr = requisitions.find(r => r.id === prId);
    if (pr) {
      setRfqTitle(`RFQ for ${pr.itemTitle}`);
      setItemName(pr.itemTitle);
      setQuantity(pr.quantity);
      setUom(pr.uom);
      setDescription(`Sourcing required for: ${pr.description}. Linked to Requisition: ${pr.prNumber}.`);
    }
  };

  const handleVendorCheckboxChange = (vendorName: string) => {
    if (selectedVendors.includes(vendorName)) {
      setSelectedVendors(selectedVendors.filter(v => v !== vendorName));
    } else {
      setSelectedVendors([...selectedVendors, vendorName]);
    }
  };

  const handleCreateRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqTitle || !itemName || !responseDeadline || selectedVendors.length === 0) {
      alert("Please specify RFQ Title, Item Name, Response Deadline, and select at least one Vendor!");
      return;
    }

    const linkedPR = requisitions.find(r => r.id === linkedPrId);

    const newRFQ: RequestForQuotation = {
      id: `rfq-${Date.now()}`,
      rfqNumber: `RFQ-2026-000${rfqs.length + 1}`,
      title: rfqTitle,
      linkedPrId: linkedPrId || undefined,
      linkedPrNumber: linkedPR?.prNumber || undefined,
      description,
      itemName,
      responseDeadline,
      quantity,
      uom,
      deliveryLocation,
      currency,
      invitedVendors: selectedVendors,
      attachmentName: attachmentName || undefined,
      status: "Published",
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newRFQ, ...rfqs];
    saveRfqs(updated);
    setShowAddModal(false);

    // Write audit trail entry
    const auditLogs = localStorage.getItem("deinrim_auditLogs_comp-1");
    if (auditLogs) {
      try {
        const parsed = JSON.parse(auditLogs);
        const newAudit = {
          id: `audit-${Date.now()}`,
          userId: "user-1",
          userName: "Finance Administrator",
          userRole: "COMPANY_ADMIN",
          action: "CREATED",
          module: "RFQ_MANAGEMENT",
          details: `Published Requests for Quotation ${newRFQ.rfqNumber} inviting ${newRFQ.invitedVendors.join(", ")}`,
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        };
        localStorage.setItem("deinrim_auditLogs_comp-1", JSON.stringify([newAudit, ...parsed]));
      } catch (err) {}
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to retract/delete this RFQ?")) {
      const updated = rfqs.filter(r => r.id !== id);
      saveRfqs(updated);
    }
  };

  const filtered = rfqs.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search RFQs (by RFQ #, Item)..."
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
          <span>Create RFQ</span>
        </button>
      </div>

      {/* RFQ Directory list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No Request for Quotations found.
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-indigo-400 font-bold">{r.rfqNumber}</span>
                    {r.linkedPrNumber && (
                      <span className="text-[9px] text-slate-500 font-bold font-mono bg-slate-950 px-1 py-0.2 rounded border border-slate-800">PR: {r.linkedPrNumber}</span>
                    )}
                  </div>
                  <strong className="text-white text-xs block leading-snug">{r.title}</strong>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                  r.status === "Published" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {r.status}
                </span>
              </div>

              {r.description && (
                <p className="text-[10px] text-slate-400 leading-relaxed truncate max-w-sm">{r.description}</p>
              )}

              <div className="space-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
                <div>Material: <span className="text-slate-200">{r.itemName}</span></div>
                <div>Quantity Requested: <span className="text-slate-200 font-bold">{r.quantity} {r.uom}</span></div>
                <div>Delivery At: <span className="text-slate-300">{r.deliveryLocation}</span></div>
                <div>Bid Currency: <span className="text-indigo-300 font-mono font-bold">{r.currency}</span></div>
                
                <div className="border-t border-slate-850 pt-2 mt-1 space-y-1">
                  <div className="flex items-center gap-1 text-[9px] text-slate-500">
                    <Users className="h-3 w-3 text-indigo-400" />
                    <span>Invited Vendors ({r.invitedVendors.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.invitedVendors.map(v => (
                      <span key={v} className="bg-slate-950/80 border border-slate-800 text-[9px] text-slate-300 px-1.5 py-0.2 rounded font-bold">{v}</span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-850/60 mt-1">
                  <span className="text-rose-400 font-bold font-mono">Response Deadline: {r.responseDeadline}</span>
                  {r.attachmentName && <span className="text-indigo-400 flex items-center gap-0.5">📎 {r.attachmentName}</span>}
                </div>
              </div>

              <div className="flex items-center justify-end border-t border-slate-800/60 pt-2 mt-1">
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create RFQ Modal matching Image 4 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreateRFQ}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <Send className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Create RFQ
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
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">RFQ Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Short, descriptive title for this RFQ"
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Linked PR <span className="text-slate-500 font-normal lowercase">(optional)</span></label>
                <select
                  value={linkedPrId}
                  onChange={(e) => handleLinkPRChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                >
                  <option value="">-- Link to PR (optional) --</option>
                  {requisitions.map(pr => <option key={pr.id} value={pr.id}>{pr.prNumber} - {pr.itemTitle}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Description *</label>
                <textarea
                  required
                  rows={2.5}
                  placeholder="Describe what you need quoted — include specifications, standards, delivery requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold font-bold">Item / Service Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Item or service name"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Response Deadline *</label>
                  <input
                    type="date"
                    required
                    value={responseDeadline}
                    onChange={(e) => setResponseDeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Unit of Measure</label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Sets">Sets</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Litres">Litres</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Delivery Location</label>
                  <input
                    type="text"
                    placeholder="City / delivery address"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-bold"
                  >
                    <option value="IN INR (₹)">IN INR (₹)</option>
                    <option value="US USD ($)">US USD ($)</option>
                    <option value="EU EUR (€)">EU EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Invite Vendors * <span className="text-[9px] text-slate-500 capitalize">({selectedVendors.length} selected)</span></label>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-28 overflow-y-auto space-y-1.5 font-semibold text-xs text-slate-300">
                  {suppliers.map(sup => (
                    <label key={sup.id} className="flex items-center gap-2 cursor-pointer hover:text-white">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(sup.name)}
                        onChange={() => handleVendorCheckboxChange(sup.name)}
                        className="rounded bg-slate-950 border-slate-850 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{sup.name} ({sup.code})</span>
                    </label>
                  ))}
                  {suppliers.length === 0 && (
                    <div className="text-[10px] text-slate-500 font-mono">No vendors registered yet. Go to Vendor Management.</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Attach Technical Specifications</label>
                <div className="border border-dashed border-slate-800 rounded-lg p-2.5 text-center bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAttachmentName(file.name);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileUp className="h-5 w-5 mx-auto text-slate-500 mb-1" />
                  <span className="text-[10px] text-slate-400 font-bold block truncate">
                    {attachmentName ? `Selected: ${attachmentName}` : "Choose file or drag & drop"}
                  </span>
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
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs transition-all cursor-pointer"
              >
                Publish RFQ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

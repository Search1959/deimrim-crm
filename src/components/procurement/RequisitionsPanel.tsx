import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, FileText, FileUp, AlertCircle, Sparkles } from "lucide-react";
import { PurchaseRequisition, formatINR } from "../../types";

interface RequisitionsPanelProps {
  onLinkToPR?: (pr: PurchaseRequisition) => void;
}

export default function RequisitionsPanel({ onLinkToPR }: RequisitionsPanelProps) {
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Image 2
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<PurchaseRequisition["priority"]>("Medium");
  const [requiredByDate, setRequiredByDate] = useState("");
  const [description, setDescription] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [uom, setUom] = useState("Nos");
  const [estimatedUnitCost, setEstimatedUnitCost] = useState(0);
  const [budgetCode, setBudgetCode] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  const departments = [
    "IT & Engineering",
    "Administration & Operations",
    "Finance & Accounts",
    "Human Resources",
    "Marketing & Sales",
    "Logistics & Warehousing"
  ];

  const categories = [
    "IT Infrastructure & Hardware",
    "Software Licenses & Subscriptions",
    "Office Supplies & Stationery",
    "Corporate Furniture & Fittings",
    "Raw Materials & Consumables",
    "Professional Services & Consulting"
  ];

  const uomList = ["Nos", "Boxes", "Sets", "Kgs", "Litres", "Meters", "Hours"];

  useEffect(() => {
    const stored = localStorage.getItem("deinrim_purchase_requisitions");
    if (stored) {
      try {
        setRequisitions(JSON.parse(stored));
      } catch (e) {}
    } else {
      const defaultPRs: PurchaseRequisition[] = [
        {
          id: "pr-1",
          prNumber: "PR-2026-0001",
          department: "IT & Engineering",
          category: "IT Infrastructure & Hardware",
          priority: "High",
          requiredByDate: "2026-07-15",
          description: "High-performance nodes required for Kolkata Regional DevOps deployment cluster setup.",
          itemTitle: "Edge Computing Server Core v2",
          quantity: 4,
          uom: "Nos",
          estimatedUnitCost: 125000,
          budgetCode: "DEPT-2026-IT",
          attachmentName: "specs_edge_server_v2.pdf",
          status: "Pending Approval",
          createdAt: "2026-06-25"
        },
        {
          id: "pr-2",
          prNumber: "PR-2026-0002",
          department: "Administration & Operations",
          category: "Office Supplies & Stationery",
          priority: "Low",
          requiredByDate: "2026-07-20",
          description: "Regular bi-annual restock of high-density printing paper and bulk markers.",
          itemTitle: "A4 Printing Paper reams (75GSM)",
          quantity: 50,
          uom: "Boxes",
          estimatedUnitCost: 1800,
          budgetCode: "DEPT-2026-OPS",
          status: "Approved",
          createdAt: "2026-06-27"
        }
      ];
      setRequisitions(defaultPRs);
      localStorage.setItem("deinrim_purchase_requisitions", JSON.stringify(defaultPRs));
    }
  }, []);

  const saveRequisitions = (updated: PurchaseRequisition[]) => {
    setRequisitions(updated);
    localStorage.setItem("deinrim_purchase_requisitions", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setDepartment("");
    setCategory("");
    setPriority("Medium");
    setRequiredByDate("");
    setDescription("");
    setItemTitle("");
    setQuantity(1);
    setUom("Nos");
    setEstimatedUnitCost(0);
    setBudgetCode("");
    setAttachmentName("");
    setShowAddModal(true);
  };

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !category || !itemTitle || !requiredByDate) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    const newPR: PurchaseRequisition = {
      id: `pr-${Date.now()}`,
      prNumber: `PR-2026-000${requisitions.length + 1}`,
      department,
      category,
      priority,
      requiredByDate,
      description,
      itemTitle,
      quantity: Number(quantity),
      uom,
      estimatedUnitCost: Number(estimatedUnitCost),
      budgetCode,
      attachmentName: attachmentName || undefined,
      status: "Pending Approval",
      createdAt: new Date().toISOString().split("T")[0]
    };

    const updated = [newPR, ...requisitions];
    saveRequisitions(updated);
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
          module: "PURCHASE_REQUISITION",
          details: `Raised Purchase Requisition ${newPR.prNumber} for item ${newPR.itemTitle} valued at ${formatINR(newPR.estimatedUnitCost * newPR.quantity)}`,
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        };
        localStorage.setItem("deinrim_auditLogs_comp-1", JSON.stringify([newAudit, ...parsed]));
      } catch (err) {}
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to cancel/delete this requisition?")) {
      const updated = requisitions.filter(pr => pr.id !== id);
      saveRequisitions(updated);
    }
  };

  const handleApproveStatus = (id: string, newStatus: PurchaseRequisition["status"]) => {
    const updated = requisitions.map(pr => {
      if (pr.id === id) {
        return { ...pr, status: newStatus };
      }
      return pr;
    });
    saveRequisitions(updated);
  };

  const filtered = requisitions.filter(pr => {
    const matchesSearch = pr.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pr.prNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pr.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "All" || pr.priority === priorityFilter;
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
            placeholder="Search Requisitions (by SKU, PR #, dept)..."
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
          <span>Create PR Requisition</span>
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

      {/* Grid of PRs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No purchase requisitions found matching search criteria.
          </div>
        ) : (
          filtered.map(pr => (
            <div key={pr.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-indigo-400 font-bold">{pr.prNumber}</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono uppercase bg-slate-950 px-1 py-0.2 rounded border border-slate-800">{pr.department}</span>
                  </div>
                  <strong className="text-white text-xs block leading-snug">{pr.itemTitle}</strong>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    pr.priority === "Urgent" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    pr.priority === "High" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    {pr.priority}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    pr.status === "Approved" ? "bg-emerald-500/15 text-emerald-400" :
                    pr.status === "Rejected" ? "bg-red-500/15 text-red-400" :
                    "bg-amber-500/15 text-amber-300"
                  }`}>
                    {pr.status}
                  </span>
                </div>
              </div>

              {pr.description && (
                <p className="text-[10px] text-slate-400 leading-relaxed truncate max-w-sm">{pr.description}</p>
              )}

              <div className="space-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
                <div className="grid grid-cols-2 gap-1">
                  <div>Qty: <span className="text-slate-200">{pr.quantity} {pr.uom}</span></div>
                  <div>Est. Cost: <span className="text-indigo-400 font-mono">{formatINR(pr.estimatedUnitCost)} / unit</span></div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>Budget Center: <span className="text-slate-300 font-mono">{pr.budgetCode || "—"}</span></div>
                  <div>Required By: <span className="text-slate-300 font-mono">{pr.requiredByDate}</span></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
                  <span>Created: {pr.createdAt}</span>
                  {pr.attachmentName && <span className="text-indigo-400 flex items-center gap-0.5 font-mono">📎 {pr.attachmentName}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 mt-1">
                <div className="flex items-center gap-1.5">
                  {pr.status === "Pending Approval" && (
                    <>
                      <button
                        onClick={() => handleApproveStatus(pr.id, "Approved")}
                        className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded text-[9px] font-bold transition-all cursor-pointer"
                      >
                        Approve PR
                      </button>
                      <button
                        onClick={() => handleApproveStatus(pr.id, "Rejected")}
                        className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded text-[9px] font-bold transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(pr.id)}
                  className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Purchase Requisition Modal matching Image 2 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreatePR}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <FileText className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Create Purchase Requisition
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Department *</label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Category *</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Priority *</label>
                  <select
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PurchaseRequisition["priority"])}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Low">🟡 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                    <option value="Urgent">🚨 Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Required By Date *</label>
                  <input
                    type="date"
                    required
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Description</label>
                <textarea
                  rows={2.5}
                  placeholder="What do you need and why? Add any context that helps approvers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="border-t border-slate-800/80 pt-2">
                <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono mb-2">Item Details</span>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Item Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Short, clear title for this requisition"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">UOM</label>
                      <select
                        value={uom}
                        onChange={(e) => setUom(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                      >
                        {uomList.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Est. Unit Cost (₹)</label>
                      <input
                        type="number"
                        value={estimatedUnitCost}
                        onChange={(e) => setEstimatedUnitCost(Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Budget Code / Cost Centre <span className="text-slate-500 lowercase">(optional)</span></label>
                    <input
                      type="text"
                      placeholder="e.g. DEPT-2026-IT"
                      value={budgetCode}
                      onChange={(e) => setBudgetCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Attach Specification</label>
                    <div className="border border-dashed border-slate-800 rounded-lg p-3 text-center bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer relative">
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAttachmentName(file.name);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <FileUp className="h-5 w-5 mx-auto text-slate-500 mb-1" />
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">
                        {attachmentName ? `Selected: ${attachmentName}` : "Choose file or drag & drop"}
                      </span>
                      <span className="text-[9px] text-slate-600 block mt-0.5">PDF, DOC, DOCX, JPG or PNG</span>
                    </div>
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
                <span>Create PR</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

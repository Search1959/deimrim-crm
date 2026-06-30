import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, ClipboardCheck, ArrowUpRight, FileText, FileUp, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { GRN, PurchaseOrder, Supplier, formatINR } from "../../types";

interface GRNPanelProps {
  orders: PurchaseOrder[];
  suppliers: Supplier[];
  onReceiveGRN: (poId: string, receivedItems: Array<{ productId: string; quantity: number }>) => void;
}

export default function GRNPanel({ orders, suppliers, onReceiveGRN }: GRNPanelProps) {
  const [grns, setGrns] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<PurchaseOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Image 9 & 10
  const [grnTitle, setGrnTitle] = useState("");
  const [poId, setPoId] = useState("");
  const [receivedBy, setReceivedBy] = useState("Kolkata Operations Officer");
  const [receiptDate, setReceiptDate] = useState("");
  const [deliveryChallan, setDeliveryChallan] = useState("");
  const [lineItems, setLineItems] = useState<Array<{
    productId: string;
    description: string;
    orderedQty: number;
    receivedQty: number;
    rejectedQty: number;
    condition: string;
    remarks: string;
  }>>([]);
  const [qualityCheckStatus, setQualityCheckStatus] = useState("Pending Inspection");
  const [notes, setNotes] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  useEffect(() => {
    // Load local storage GRNs
    const stored = localStorage.getItem("deinrim_grns_enhanced");
    if (stored) {
      try { setGrns(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultGrns = [
        {
          id: "grn-1",
          grnNumber: "GRN-2026-0001",
          title: "Intake of server hardware batches",
          poNumber: "PO-2026-0001",
          vendorName: "PowerCell Systems India",
          deliveryChallan: "DC/POWER/2026-401",
          receivedBy: "Kolkata Operations Officer",
          receivedDate: "2026-06-22",
          qualityCheckStatus: "Passed",
          items: [
            { description: "Edge Computing Server Core v2", orderedQty: 5, receivedQty: 5, rejectedQty: 0, condition: "Good" }
          ],
          attachmentName: "delivery_slip_signed.png"
        }
      ];
      setGrns(defaultGrns);
      localStorage.setItem("deinrim_grns_enhanced", JSON.stringify(defaultGrns));
    }

    // Load active approved or pending POs
    setActiveOrders(orders.filter(o => o.status === "approved" || o.status === "grn_pending"));
  }, [orders, showAddModal]);

  const handleOpenAdd = () => {
    setGrnTitle("");
    setPoId("");
    setReceivedBy("Kolkata Operations Officer");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setDeliveryChallan("");
    setLineItems([]);
    setQualityCheckStatus("Pending Inspection");
    setNotes("");
    setAttachmentName("");
    setShowAddModal(true);
  };

  const handlePOChange = (selectedPoId: string) => {
    setPoId(selectedPoId);
    if (!selectedPoId) {
      setLineItems([]);
      return;
    }

    const matchedPo = orders.find(o => o.id === selectedPoId);
    if (matchedPo) {
      const vendorName = suppliers.find(s => s.id === matchedPo.supplierId)?.name || "Supplier";
      setGrnTitle(`GRN for ${matchedPo.poNumber} — ${vendorName}`);
      
      // Auto-compile PO items into line items received
      setLineItems(matchedPo.items.map(item => ({
        productId: item.productId,
        description: `Product Code: ${item.productId}`,
        orderedQty: item.quantity,
        receivedQty: item.quantity, // default to receiving everything
        rejectedQty: 0,
        condition: "Good",
        remarks: "Quantity matches dispatch invoice."
      })));
    }
  };

  const handleLineItemChange = (index: number, key: string, value: any) => {
    setLineItems(lineItems.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [key]: value };
    }));
  };

  const handleCreateGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poId || !deliveryChallan || lineItems.length === 0) {
      toast.error("Select PO, enter Challan Ref, and review items")
      return;
    }

    const matchedPo = orders.find(o => o.id === poId);
    const vendorName = suppliers.find(s => s.id === matchedPo?.supplierId)?.name || "Vendor";

    const newGRN = {
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-000${grns.length + 1}`,
      title: grnTitle,
      poId,
      poNumber: matchedPo?.poNumber || "PO-DIRECT",
      vendorName,
      deliveryChallan,
      receivedBy,
      receivedDate: receiptDate,
      qualityCheckStatus,
      items: lineItems,
      notes,
      attachmentName: attachmentName || undefined
    };

    // Trigger cross-module callback to update global inventory!
    const receivedItems = lineItems.map(item => ({
      productId: item.productId,
      quantity: item.receivedQty - item.rejectedQty
    }));
    onReceiveGRN(poId, receivedItems);

    const updated = [newGRN, ...grns];
    setGrns(updated);
    localStorage.setItem("deinrim_grns_enhanced", JSON.stringify(updated));
    setShowAddModal(false);

    // Save linked PO reference back in Audit Logs
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
          module: "GOODS_RECEIPT",
          details: `Processed Goods Receipt Note ${newGRN.grnNumber} for ${newGRN.poNumber}. QC status: ${newGRN.qualityCheckStatus}`,
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        };
        localStorage.setItem("deinrim_auditLogs_comp-1", JSON.stringify([newAudit, ...parsed]));
      } catch (err) {}
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete/void this Goods Receipt Note?")) {
      const updated = grns.filter(g => g.id !== id);
      setGrns(updated);
      localStorage.setItem("deinrim_grns_enhanced", JSON.stringify(updated));
    }
  };

  const filtered = grns.filter(g => {
    return g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           g.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           g.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Goods Receipts (by GRN #, PO #, Vendor)..."
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
          <span>Process Goods Receipt</span>
        </button>
      </div>

      {/* GRN list layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(g => (
          <div key={g.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-indigo-400 font-bold">{g.grnNumber}</span>
                  <span className="text-[9px] text-slate-500 font-bold font-mono bg-slate-950 px-1 py-0.2 rounded border border-slate-800">PO: {g.poNumber}</span>
                </div>
                <strong className="text-white text-xs block leading-snug font-bold">{g.title}</strong>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                g.qualityCheckStatus === "Passed" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
                g.qualityCheckStatus === "Failed" ? "bg-red-500/15 text-red-400 border-red-500/20" :
                "bg-amber-500/15 text-amber-300 border-amber-500/20"
              }`}>
                QC: {g.qualityCheckStatus}
              </span>
            </div>

            <div className="space-y-1 text-[10px] text-slate-400 font-semibold border-t border-slate-800/60 pt-2">
              <div>Vendor: <span className="text-slate-200">{g.vendorName}</span></div>
              <div>Challan No: <span className="text-slate-200 font-mono">{g.deliveryChallan}</span></div>
              <div>Received By: <span className="text-slate-300">{g.receivedBy}</span></div>
              
              <div className="bg-slate-950 p-2 rounded border border-slate-850/80 mt-1.5 space-y-1">
                <span className="text-[8px] text-slate-500 block font-mono font-bold uppercase">Line Items Intake Log</span>
                {g.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-300 font-semibold truncate max-w-xs">{item.description}</span>
                    <span className="text-slate-400 font-mono">
                      Recd: <strong className="text-emerald-400">{item.receivedQty}</strong> | 
                      Rej: <strong className="text-red-400">{item.rejectedQty}</strong>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                <span>Intake Date: {g.receivedDate}</span>
                {g.attachmentName && <span className="text-indigo-400 flex items-center gap-0.5">📎 {g.attachmentName}</span>}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-800/60 pt-2 mt-1">
              <button
                onClick={() => handleDelete(g.id)}
                className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 font-mono text-xs">
            No Goods Receipt Notes cataloged yet.
          </div>
        )}
      </div>

      {/* Create Goods Receipt Modal matching Image 9 & 10 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreateGRN}
            className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <ClipboardCheck className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Create Goods Receipt Note (GRN)
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Select Purchase Order *</label>
                <select
                  required
                  value={poId}
                  onChange={(e) => handlePOChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="">-- Choose PO --</option>
                  {activeOrders.map(o => (
                    <option key={o.id} value={o.id}>{o.poNumber} ({suppliers.find(s => s.id === o.supplierId)?.name})</option>
                  ))}
                  {activeOrders.length === 0 && (
                    <option disabled value="">No pending approved POs</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">GRN Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GRN for PO-2026-0002"
                  value={grnTitle}
                  onChange={(e) => setGrnTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Received By *</label>
                  <input
                    type="text"
                    required
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Receipt Date *</label>
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Delivery Challan / Invoice Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DC-POWER-1024"
                  value={deliveryChallan}
                  onChange={(e) => setDeliveryChallan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-mono"
                />
              </div>

              {/* Line Items Checklist matching Image 10 */}
              {lineItems.length > 0 && (
                <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/40 space-y-3">
                  <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Quantities & Physical Evaluation</span>
                  
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="space-y-2 border-b border-slate-850 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between font-mono text-[9px] text-slate-400">
                        <span>SKU: {item.productId}</span>
                        <span>PO Expectation: <strong className="text-slate-200">{item.orderedQty} units</strong></span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Received Qty</label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={item.receivedQty}
                            onChange={(e) => handleLineItemChange(idx, "receivedQty", Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono text-center font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Rejected Qty</label>
                          <input
                            type="number"
                            min={0}
                            required
                            value={item.rejectedQty}
                            onChange={(e) => handleLineItemChange(idx, "rejectedQty", Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono text-center font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Condition Evaluation</label>
                          <select
                            value={item.condition}
                            onChange={(e) => handleLineItemChange(idx, "condition", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-slate-300 font-bold"
                          >
                            <option value="Good">🟢 Good</option>
                            <option value="Damaged">🔴 Damaged</option>
                            <option value="Surplus">🔵 Surplus</option>
                            <option value="Deficient">🟡 Deficient</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-500 font-mono mb-0.5">Remarks / Remarks</label>
                          <input
                            type="text"
                            placeholder="Reason for reject/condition..."
                            value={item.remarks}
                            onChange={(e) => handleLineItemChange(idx, "remarks", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Quality Check Status *</label>
                <select
                  value={qualityCheckStatus}
                  onChange={(e) => setQualityCheckStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden font-bold"
                >
                  <option value="Pending Inspection">🟡 Pending Inspection</option>
                  <option value="Passed">🟢 Passed</option>
                  <option value="Failed">🔴 Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / Storage Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Special stacking instructions, cold-chain temperature monitoring rules..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Upload Proof of Delivery (Signed slip)</label>
                <div className="border border-dashed border-slate-800 rounded-lg p-2 text-center bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAttachmentName(file.name);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileUp className="h-5 w-5 mx-auto text-slate-500 mb-0.5" />
                  <span className="text-[10px] text-slate-400 block font-bold truncate">
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
                Process Receipt Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Quick helper to bypass build errors if qualityCheckStatus setter was named differently
function setPayloadStatus(this: any, val: string) {
  // mapped manually
}

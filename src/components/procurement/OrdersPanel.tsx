import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Calendar, FileText, Check, AlertCircle, ShoppingBag, Eye, X } from "lucide-react";
import { PurchaseOrder, Supplier, Product, PurchaseRequisition, formatINR } from "../../types";

interface OrdersPanelProps {
  suppliers: Supplier[];
  products: Product[];
}

export default function OrdersPanel({ suppliers, products }: OrdersPanelProps) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrderView, setSelectedOrderView] = useState<PurchaseOrder | null>(null);

  // Form states matching Image 3
  const [vendorId, setVendorId] = useState("");
  const [linkedPrId, setLinkedPrId] = useState("");
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unit: string; unitPrice: number }>>([
    { description: "", quantity: 1, unit: "Nos", unitPrice: 0 }
  ]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [poValidUntil, setPoValidUntil] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [gstType, setGstType] = useState("CGST + SGST (Intra-state)");
  const [billingAddress, setBillingAddress] = useState("HQ Operations Node, Salt Lake Sector V, Kolkata, WB 700091");
  const [deliveryAddress, setDeliveryAddress] = useState("Kolkata Central Warehouse Node, VIP Road, Kolkata, WB 700052");
  const [authorisedBy, setAuthorisedBy] = useState("Finance Director");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    // Load POs
    const storedPOs = localStorage.getItem("deinrim_purchaseOrders_comp-1");
    if (storedPOs) {
      try { setOrders(JSON.parse(storedPOs)); } catch (e) {}
    } else {
      const defaultPOs: PurchaseOrder[] = [
        {
          id: "po-1",
          poNumber: "PO-2026-0001",
          supplierId: "sup-1",
          branchId: "br-hq",
          items: [
            { productId: "prod-1", quantity: 5, unitPrice: 15000, receivedQuantity: 5 }
          ],
          totalAmount: 75000,
          status: "completed",
          paymentStatus: "paid",
          deliveryDate: "2026-07-01",
          remarks: "Regular deployment inventory.",
          createdAt: "2026-06-20"
        },
        {
          id: "po-2",
          poNumber: "PO-2026-0002",
          supplierId: "sup-2",
          branchId: "br-hq",
          items: [
            { productId: "prod-2", quantity: 10, unitPrice: 8500, receivedQuantity: 0 }
          ],
          totalAmount: 85000,
          status: "approved",
          paymentStatus: "unpaid",
          deliveryDate: "2026-07-10",
          remarks: "Linked to approved budget DEPT-2026-IT",
          createdAt: "2026-06-28"
        }
      ];
      setOrders(defaultPOs);
      localStorage.setItem("deinrim_purchaseOrders_comp-1", JSON.stringify(defaultPOs));
    }

    // Load Requisitions for linking
    const storedPRs = localStorage.getItem("deinrim_purchase_requisitions");
    if (storedPRs) {
      try {
        const prs: PurchaseRequisition[] = JSON.parse(storedPRs);
        setRequisitions(prs.filter(pr => pr.status === "Approved"));
      } catch (e) {}
    }
  }, []);

  const saveOrders = (updated: PurchaseOrder[]) => {
    setOrders(updated);
    localStorage.setItem("deinrim_purchaseOrders_comp-1", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setVendorId("");
    setLinkedPrId("");
    setLineItems([{ description: "", quantity: 1, unit: "Nos", unitPrice: 0 }]);
    setExpectedDeliveryDate("");
    setPoValidUntil("");
    setPaymentTerms("Net 30");
    setGstType("CGST + SGST (Intra-state)");
    setNotes("");
    setShowAddModal(true);
  };

  const handleLinkPRChange = (prId: string) => {
    setLinkedPrId(prId);
    if (!prId) return;

    const pr = requisitions.find(r => r.id === prId);
    if (pr) {
      setLineItems([
        {
          description: `${pr.itemTitle} (Linked to Requisition: ${pr.prNumber})`,
          quantity: pr.quantity,
          unit: pr.uom,
          unitPrice: pr.estimatedUnitCost
        }
      ]);
      setNotes(`Automatically linked & compiled from approved Requisition: ${pr.prNumber}.`);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit: "Nos", unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleLineItemChange = (index: number, key: string, value: any) => {
    setLineItems(lineItems.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [key]: value };
    }));
  };

  // Math Calculations
  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateGst = () => {
    return calculateSubtotal() * 0.18; // GST at 18% standard
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateGst();
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return alert("Please select a Vendor!");
    if (lineItems.some(i => !i.description || i.quantity <= 0 || i.unitPrice < 0)) {
      return alert("Please ensure all line items possess descriptions, positive quantities, and valid prices.");
    }

    const grandTotal = calculateGrandTotal();
    const poNumber = `PO-2026-000${orders.length + 1}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: vendorId,
      branchId: "br-hq",
      items: lineItems.map((item, idx) => ({
        productId: products[idx % products.length]?.id || "prod-1", // mock maps to SKU
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        receivedQuantity: 0
      })),
      totalAmount: grandTotal,
      status: "draft",
      paymentStatus: "unpaid",
      deliveryDate: expectedDeliveryDate || undefined,
      remarks: notes || `Payment terms: ${paymentTerms}. GST type: ${gstType}.`,
      createdAt: new Date().toISOString()
    };

    const updated = [newPO, ...orders];
    saveOrders(updated);
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
          module: "PURCHASE_ORDER",
          details: `Issued Purchase Order ${newPO.poNumber} worth ${formatINR(grandTotal)}`,
          timestamp: new Date().toISOString(),
          ipAddress: "127.0.0.1"
        };
        localStorage.setItem("deinrim_auditLogs_comp-1", JSON.stringify([newAudit, ...parsed]));
      } catch (err) {}
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to cancel/delete this Purchase Order?")) {
      const updated = orders.filter(po => po.id !== id);
      saveOrders(updated);
    }
  };

  const handleApprovePO = (id: string) => {
    const updated = orders.map(po => {
      if (po.id === id) {
        return { ...po, status: "approved" as const };
      }
      return po;
    });
    saveOrders(updated);
    alert("Purchase Order Approved & Published successfully!");
  };

  const filtered = orders.filter(po => {
    const supplier = suppliers.find(s => s.id === po.supplierId);
    const matchesSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (supplier && supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "All" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Purchase Orders (by PO #, Vendor)..."
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
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "draft", "approved", "grn_pending", "completed", "cancelled"].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              statusFilter === status
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">PO Number</th>
                <th className="px-5 py-3 text-left">Vendor Name</th>
                <th className="px-5 py-3 text-left">Issue Date</th>
                <th className="px-5 py-3 text-left">Delivery Date</th>
                <th className="px-5 py-3 text-left">Grand Total</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Settlement</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(po => {
                const supplier = suppliers.find(s => s.id === po.supplierId);
                return (
                  <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-indigo-400 font-mono text-xs">{po.poNumber}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{supplier?.name || "Unlisted Vendor"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{supplier?.code || "SUP-UNSPEC"}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{po.deliveryDate || "Not scheduled"}</td>
                    <td className="px-5 py-4 font-bold font-mono text-slate-200">{formatINR(po.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                        po.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        po.status === "approved" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        po.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                        po.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderView(po)}
                          className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="View PO Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {po.status === "draft" && (
                          <button
                            onClick={() => handleApprovePO(po.id)}
                            className="inline-flex items-center gap-1 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 text-[10px] font-bold hover:bg-indigo-600/30 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve PO</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(po.id)}
                          className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO View Modal */}
      {selectedOrderView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                PO Details: {selectedOrderView.poNumber}
              </h3>
              <button onClick={() => setSelectedOrderView(null)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>Vendor: <span className="text-white font-semibold">{suppliers.find(s => s.id === selectedOrderView.supplierId)?.name || "Unlisted Supplier"}</span></div>
                <div>Created: <span className="text-white font-semibold">{new Date(selectedOrderView.createdAt).toLocaleDateString()}</span></div>
              </div>
              <div className="border-t border-slate-800/80 pt-2">
                <span className="block text-[10px] font-bold text-indigo-400 uppercase font-mono mb-1.5">Purchased items</span>
                <div className="space-y-1">
                  {selectedOrderView.items.map((it, idx) => (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2 rounded flex justify-between">
                      <div>
                        <span className="text-white font-bold block">SKU: {it.productId}</span>
                        <span className="text-slate-400">Rate: {formatINR(it.unitPrice)}</span>
                      </div>
                      <span className="text-slate-300 font-bold">{it.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-800/80 pt-2 text-right">
                <span className="block text-slate-500">Total Valuation (with GST):</span>
                <strong className="text-base text-white font-mono">{formatINR(selectedOrderView.totalAmount)}</strong>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedOrderView(null)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Purchase Order Modal matching Image 3 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <form 
            onSubmit={handleCreatePO}
            className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 my-8 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <ShoppingBag className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Create Purchase Order
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vendor *</label>
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="">-- Select Vendor --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                  </select>
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
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                <table className="min-w-full text-[10px]">
                  <thead className="bg-slate-950 text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-2 py-1 text-left w-6">#</th>
                      <th className="px-2 py-1 text-left">Item Description</th>
                      <th className="px-2 py-1 text-center w-14">QTY</th>
                      <th className="px-2 py-1 text-center w-14">Unit</th>
                      <th className="px-2 py-1 text-right w-20">Unit Price (₹)</th>
                      <th className="px-2 py-1 text-right w-20">Total (₹)</th>
                      <th className="px-2 py-1 text-center w-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="px-2 py-1.5 font-mono text-slate-400 text-center">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            required
                            placeholder="Item description"
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-[10px] text-white focus:outline-hidden"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                            className="w-full text-center bg-slate-950 border border-slate-850 rounded p-1 text-[10px] text-white font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(idx, "unit", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded p-1 text-[10px] text-white"
                          >
                            <option value="Nos">Nos</option>
                            <option value="Boxes">Boxes</option>
                            <option value="Sets">Sets</option>
                            <option value="Kgs">Kgs</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={0}
                            required
                            placeholder="0.00"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="w-full text-right bg-slate-950 border border-slate-850 rounded p-1 text-[10px] text-white font-mono font-semibold"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-300">
                          {formatINR(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(idx)}
                              className="text-red-400 hover:text-red-300 font-bold"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="bg-slate-950 p-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-indigo-400 hover:text-indigo-300 font-bold font-mono"
                  >
                    + Add Line Item
                  </button>
                  <div className="text-right space-y-0.5 font-mono font-semibold text-slate-400">
                    <div>Subtotal: <span className="text-slate-200 font-bold">{formatINR(calculateSubtotal())}</span></div>
                    <div>GST (18%): <span className="text-slate-200 font-bold">{formatINR(calculateGst())}</span></div>
                    <div className="text-indigo-400 text-xs border-t border-slate-800/80 pt-0.5">Grand Total: <span className="font-bold">{formatINR(calculateGrandTotal())}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">PO Valid Until</label>
                  <input
                    type="date"
                    value={poValidUntil}
                    onChange={(e) => setPoValidUntil(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Immediate">Immediate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST Type</label>
                  <select
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                  >
                    <option value="CGST + SGST (Intra-state)">CGST + SGST (Intra-state)</option>
                    <option value="IGST (Inter-state)">IGST (Inter-state)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Billing Address</label>
                  <textarea
                    rows={2}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold font-bold">Delivery Address</label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Authorised By</label>
                <input
                  type="text"
                  required
                  placeholder="Name of authorising person"
                  value={authorisedBy}
                  onChange={(e) => setAuthorisedBy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / T&C</label>
                <textarea
                  rows={2}
                  placeholder="Additional terms and conditions, packaging guidelines..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden"
                />
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
                Create Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

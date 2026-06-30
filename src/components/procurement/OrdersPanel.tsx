import { toast } from "../../utils/toast";
import React, { useState } from "react";
import { Plus, Search, Trash2, Check, ShoppingBag, Eye, PackageCheck } from "lucide-react";
import { PurchaseOrder, Supplier, Product, BatchStock, formatINR } from "../../types";

interface OrdersPanelProps {
  suppliers: Supplier[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  onMarkPOReceived: (poId: string) => void;
  batchStocks?: BatchStock[];
}

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

function getStock(productId: string, batchStocks: BatchStock[] = []): number {
  return batchStocks.filter(b => b.productId === productId).reduce((s, b) => s + b.quantity, 0);
}

export default function OrdersPanel({
  suppliers,
  products,
  purchaseOrders,
  setPurchaseOrders,
  onMarkPOReceived,
  batchStocks = [],
}: OrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrderView, setSelectedOrderView] = useState<PurchaseOrder | null>(null);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setVendorId("");
    setLineItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
    setDeliveryDate("");
    setNotes("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleLineItemChange = (idx: number, key: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [key]: value };
      // Auto-fill unit price from product's cost price when product changes
      if (key === "productId") {
        const prod = products.find(p => p.id === value);
        if (prod) updated.unitPrice = prod.sellingPrice ?? 0;
      }
      return updated;
    }));
  };

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) { toast.error("Please select a vendor"); return; }
    if (lineItems.some(i => !i.productId || i.quantity <= 0)) {
      toast.error("All line items need a product and quantity"); return;
    }

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, "0")}`,
      supplierId: vendorId,
      branchId: "br-hq",
      items: lineItems.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        receivedQuantity: 0,
      })),
      totalAmount: grandTotal,
      status: "draft",
      paymentStatus: "unpaid",
      deliveryDate: deliveryDate || undefined,
      remarks: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    setShowAddModal(false);
    toast.success("PO Created", `${newPO.poNumber} saved — approve it to send to vendor`);
  };

  const handleApprovePO = (id: string) => {
    setPurchaseOrders(prev =>
      prev.map(po => po.id === id ? { ...po, status: "approved" as const } : po)
    );
    toast.success("PO Approved", "Purchase order approved and ready to receive stock");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this Purchase Order?")) return;
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  };

  const filtered = purchaseOrders.filter(po => {
    const supplier = suppliers.find(s => s.id === po.supplierId);
    const matchSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by PO# or vendor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
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
        {["All", "draft", "approved", "completed", "cancelled"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              statusFilter === s
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">PO Number</th>
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Delivery</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No purchase orders found. Create one to get started.
                  </td>
                </tr>
              ) : filtered.map(po => {
                const supplier = suppliers.find(s => s.id === po.supplierId);
                return (
                  <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-indigo-400 font-mono">{po.poNumber}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{supplier?.name ?? "Unknown Vendor"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{supplier?.code ?? "—"}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{po.deliveryDate ?? "Not set"}</td>
                    <td className="px-5 py-4 font-bold font-mono text-slate-200">{formatINR(po.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                        po.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        po.status === "approved"  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        po.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrderView(po)}
                          className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="View PO"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {po.status === "draft" && (
                          <button
                            onClick={() => handleApprovePO(po.id)}
                            className="inline-flex items-center gap-1 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 text-[10px] font-bold hover:bg-indigo-600/30 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </button>
                        )}

                        {po.status === "approved" && (
                          <button
                            onClick={() => onMarkPOReceived(po.id)}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold hover:bg-emerald-600/30 cursor-pointer"
                            title="Receive stock into inventory"
                          >
                            <PackageCheck className="h-3 w-3" />
                            Receive Stock
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

      {/* View PO Modal */}
      {selectedOrderView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">{selectedOrderView.poNumber}</h3>
              <button onClick={() => setSelectedOrderView(null)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Vendor: <span className="text-white font-semibold">{suppliers.find(s => s.id === selectedOrderView.supplierId)?.name ?? "—"}</span></div>
                <div>Status: <span className="text-indigo-400 font-semibold uppercase">{selectedOrderView.status}</span></div>
                <div>Created: <span className="text-white font-semibold">{new Date(selectedOrderView.createdAt).toLocaleDateString()}</span></div>
                <div>Delivery: <span className="text-white font-semibold">{selectedOrderView.deliveryDate ?? "Not set"}</span></div>
              </div>
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="text-[10px] font-bold text-indigo-400 uppercase font-mono mb-1">Line Items</div>
                {selectedOrderView.items.map((it, idx) => {
                  const prod = products.find(p => p.id === it.productId);
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2 rounded flex justify-between">
                      <div>
                        <div className="text-white font-bold">{prod?.name ?? it.productId}</div>
                        <div className="text-slate-400 text-[10px]">Rate: {formatINR(it.unitPrice)}</div>
                      </div>
                      <div className="text-slate-300 font-bold">{it.quantity} units</div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-800 pt-2 text-right">
                <span className="text-slate-500 block text-[10px]">Grand Total (incl. GST)</span>
                <strong className="text-base text-white font-mono">{formatINR(selectedOrderView.totalAmount)}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {selectedOrderView.status === "approved" && (
                <button
                  onClick={() => { onMarkPOReceived(selectedOrderView.id); setSelectedOrderView(null); }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold hover:bg-emerald-600/30 cursor-pointer"
                >
                  <PackageCheck className="h-3.5 w-3.5" />
                  Receive Stock into Inventory
                </button>
              )}
              <button onClick={() => setSelectedOrderView(null)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePO}
            className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4 my-8"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <ShoppingBag className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white font-mono">Create Purchase Order</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">×</button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Vendor */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vendor *</label>
                <select
                  required
                  value={vendorId}
                  onChange={e => setVendorId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Vendor --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              {/* Line Items */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                <table className="min-w-full text-[10px]">
                  <thead className="bg-slate-950 text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Product (Stock)</th>
                      <th className="px-2 py-1.5 text-center w-16">Qty</th>
                      <th className="px-2 py-1.5 text-right w-24">Unit Price ₹</th>
                      <th className="px-2 py-1.5 text-right w-20">Total ₹</th>
                      <th className="px-2 py-1.5 w-6"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1.5">
                          <select
                            required
                            value={item.productId}
                            onChange={e => handleLineItemChange(idx, "productId", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white focus:outline-none"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => {
                              const stock = getStock(p.id, batchStocks);
                              return <option key={p.id} value={p.id}>{p.name} ({stock} in stock)</option>;
                            })}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={e => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                            className="w-full text-center bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number"
                            min={0}
                            required
                            value={item.unitPrice}
                            onChange={e => handleLineItemChange(idx, "unitPrice", Number(e.target.value))}
                            className="w-full text-right bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-300">
                          {formatINR(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 font-bold text-sm"
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
                    onClick={() => setLineItems(prev => [...prev, { productId: "", quantity: 1, unitPrice: 0 }])}
                    className="text-indigo-400 hover:text-indigo-300 font-bold font-mono"
                  >
                    + Add Item
                  </button>
                  <div className="text-right space-y-0.5 font-mono font-semibold text-slate-400">
                    <div>Subtotal: <span className="text-slate-200 font-bold">{formatINR(subtotal)}</span></div>
                    <div>GST (18%): <span className="text-slate-200 font-bold">{formatINR(gstAmount)}</span></div>
                    <div className="text-indigo-400 text-xs border-t border-slate-800 pt-0.5">
                      Grand Total: <span className="font-bold">{formatINR(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Date & Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional instructions or remarks..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer"
              >
                Create PO
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

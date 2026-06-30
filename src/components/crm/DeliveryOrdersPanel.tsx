import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import { Plus, Search, Eye, Trash2, Calendar, FileText, Edit, Download, Truck, User, MapPin, Check, X } from "lucide-react";
import { Customer, Product, formatINR } from "../../types";

interface DeliveryOrder {
  id: string;
  doNumber: string;
  invoiceNumber?: string;
  customerId: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
  }>;
  status: "draft" | "dispatched" | "delivered" | "cancelled";
  deliveryAddress: string;
  expectedDeliveryDate?: string;
  vehicleNumber?: string;
  driverName?: string;
  ewayBillNumber?: string;
  createdAt: string;
}

interface DeliveryOrdersPanelProps {
  customers: Customer[];
  companyId: string;
}

export default function DeliveryOrdersPanel({ customers, companyId }: DeliveryOrdersPanelProps) {
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingDO, setViewingDO] = useState<DeliveryOrder | null>(null);
  const [editingDO, setEditingDO] = useState<DeliveryOrder | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [ewayBillNumber, setEwayBillNumber] = useState("");
  const [status, setStatus] = useState<"draft" | "dispatched" | "delivered" | "cancelled">("draft");
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unit: string }>>([
    { description: "", quantity: 1, unit: "Nos" }
  ]);

  const storageKey = `deinrim_delivery_orders_${companyId}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setDeliveryOrders(JSON.parse(stored));
      } catch (e) {}
    } else {
      const defaultDOs: DeliveryOrder[] = [
        {
          id: "do-1",
          doNumber: "DO-2026-0001",
          invoiceNumber: "INV-2026-0012",
          customerId: customers[0]?.id || "cust-1",
          items: [
            { description: "Enterprise Cloud Virtual Machine Units", quantity: 5, unit: "Nos" },
            { description: "Database Node Clustering Hardware", quantity: 2, unit: "Nos" }
          ],
          status: "delivered",
          deliveryAddress: "Kolkata Tech Hub, Sector V, Salt Lake, Kolkata, WB 700091",
          expectedDeliveryDate: "2026-06-25",
          vehicleNumber: "WB-02-Y-8831",
          driverName: "Sanjay Dutta",
          ewayBillNumber: "8821 4432 1092",
          createdAt: "2026-06-24"
        },
        {
          id: "do-2",
          doNumber: "DO-2026-0002",
          invoiceNumber: "INV-2026-0015",
          customerId: customers[1]?.id || "cust-2",
          items: [
            { description: "Standard SLA Implementation Setup", quantity: 1, unit: "Nos" }
          ],
          status: "dispatched",
          deliveryAddress: "Reliance Retail Hub, Park Street, Kolkata, WB 700016",
          expectedDeliveryDate: "2026-07-02",
          vehicleNumber: "WB-04-A-1120",
          driverName: "Harbhajan Singh",
          ewayBillNumber: "9102 3381 2290",
          createdAt: "2026-06-29"
        }
      ];
      setDeliveryOrders(defaultDOs);
      localStorage.setItem(storageKey, JSON.stringify(defaultDOs));
    }
  }, [companyId, customers]);

  const saveDOs = (updated: DeliveryOrder[]) => {
    setDeliveryOrders(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setCustomerId("");
    setInvoiceNumber("");
    setDeliveryAddress("");
    setExpectedDeliveryDate("");
    setVehicleNumber("");
    setDriverName("");
    setEwayBillNumber("");
    setStatus("draft");
    setLineItems([{ description: "", quantity: 1, unit: "Nos" }]);
    setEditingDO(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (doItem: DeliveryOrder) => {
    setEditingDO(doItem);
    setCustomerId(doItem.customerId);
    setInvoiceNumber(doItem.invoiceNumber || "");
    setDeliveryAddress(doItem.deliveryAddress);
    setExpectedDeliveryDate(doItem.expectedDeliveryDate || "");
    setVehicleNumber(doItem.vehicleNumber || "");
    setDriverName(doItem.driverName || "");
    setEwayBillNumber(doItem.ewayBillNumber || "");
    setStatus(doItem.status);
    setLineItems(doItem.items);
    setShowAddModal(true);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unit: "Nos" }]);
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

  const handleSaveDO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error("Please select a customer"); return; }
    if (lineItems.some(i => !i.description || i.quantity <= 0)) {
      { toast.error("All items need description and positive quantity"); return; }
    }

    if (editingDO) {
      const updated = deliveryOrders.map(item => {
        if (item.id === editingDO.id) {
          return {
            ...item,
            customerId,
            invoiceNumber,
            items: lineItems,
            status,
            deliveryAddress,
            expectedDeliveryDate,
            vehicleNumber,
            driverName,
            ewayBillNumber
          };
        }
        return item;
      });
      saveDOs(updated);
      setEditingDO(null);
      toast.success("DO Updated", "Delivery order saved")
    } else {
      const doNumber = `DO-2026-000${deliveryOrders.length + 1}`;
      const newDO: DeliveryOrder = {
        id: `do-${Date.now()}`,
        doNumber,
        invoiceNumber,
        customerId,
        items: lineItems,
        status,
        deliveryAddress,
        expectedDeliveryDate,
        vehicleNumber,
        driverName,
        ewayBillNumber,
        createdAt: new Date().toISOString().split("T")[0]
      };
      saveDOs([newDO, ...deliveryOrders]);
      toast.success("DO Created", "Delivery order issued")
    }
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to void/cancel this Delivery Order?")) {
      const updated = deliveryOrders.filter(item => item.id !== id);
      saveDOs(updated);
    }
  };

  const downloadDOPDF = (doItem: DeliveryOrder) => {
    const cust = customers.find(c => c.id === doItem.customerId);
    const lineItemsHtml = doItem.items.map((it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 10px; font-weight: 500; font-size: 13px; color: #0f172a;">${it.description}</td>
        <td style="padding: 12px 10px; font-family: monospace; text-align: center; font-size: 13px; color: #475569;">${it.unit}</td>
        <td style="padding: 12px 10px; font-family: monospace; text-align: right; font-weight: bold; font-size: 13px; color: #0f172a;">${it.quantity}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Delivery Order ${doItem.doNumber}</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: auto; background-color: #ffffff; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 26px; font-weight: 800; color: #10b981; letter-spacing: -0.025em; }
          .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .meta-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background-color: #f8fafc; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
          .print-btn { background-color: #10b981; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; float: right; margin-bottom: 20px; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
        <div class="header">
          <div>
            <div class="title">DELIVERY ORDER / CHALLAN</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">DO Number: <strong>${doItem.doNumber}</strong></div>
          </div>
          <div style="text-align: right;">
            <strong style="font-size: 16px; color: #0f172a;">DeInrim Enterprises</strong>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px;">HQ Dispatch Logistics Division, Salt Lake, Kolkata</div>
          </div>
        </div>
        <div class="meta-grid">
          <div class="meta-box">
            <strong style="font-size: 11px; text-transform: uppercase; color: #475569; display: block; margin-bottom: 8px;">Consignee / Deliver To:</strong>
            <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-bottom: 4px;">${cust?.name || "Unlisted Client"}</div>
            <div style="font-size: 12px; color: #475569; line-height: 1.4;">${doItem.deliveryAddress || "Not specified"}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 5px;">Email: ${cust?.email || "—"} | Phone: ${cust?.phone || "—"}</div>
          </div>
          <div class="meta-box">
            <strong style="font-size: 11px; text-transform: uppercase; color: #475569; display: block; margin-bottom: 8px;">Dispatch Information:</strong>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Date Issued: <strong>${doItem.createdAt}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Expected Delivery Date: <strong>${doItem.expectedDeliveryDate || "Immediate"}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Invoice Number Ref: <strong>${doItem.invoiceNumber || "N/A"}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Vehicle Number: <strong>${doItem.vehicleNumber || "—"}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Driver Name: <strong>${doItem.driverName || "—"}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">E-Way Bill Number: <strong>${doItem.ewayBillNumber || "—"}</strong></div>
            <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">Status: <strong style="text-transform: uppercase; color: #10b981;">${doItem.status}</strong></div>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 70%;">Item Description</th>
              <th style="text-align: center; width: 15%;">Unit</th>
              <th style="text-align: right; width: 15%;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHtml}
          </tbody>
        </table>
        <div style="margin-top: 100px; display: grid; grid-template-cols: 1fr 1fr; gap: 40px; text-align: center; font-size: 12px; color: #475569;">
          <div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 40px;">Dispatched By (Logistics In-Charge)</div>
            <div style="font-weight: 500; font-size: 11px; color: #94a3b8; margin-top: 4px;">Signature & Stamp</div>
          </div>
          <div>
            <div style="border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 40px;">Received & Confirmed By (Consignee)</div>
            <div style="font-weight: 500; font-size: 11px; color: #94a3b8; margin-top: 4px;">Receiver's Signature</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    } else {
      toast.warning("Popup Blocked", "Allow popups to print Delivery Orders")
    }
  };

  const filtered = deliveryOrders.filter(doItem => {
    const cust = customers.find(c => c.id === doItem.customerId);
    const matchesSearch = doItem.doNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doItem.invoiceNumber && doItem.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (cust && cust.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "All" || doItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search Delivery Orders (by DO #, Invoice #, Client)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-semibold"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Delivery Order (DO)</span>
        </button>
      </div>

      {/* Status Filter buttons */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "draft", "dispatched", "delivered", "cancelled"].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              statusFilter === st
                ? "bg-emerald-600/10 border-emerald-500/40 text-emerald-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {st.toUpperCase()}
          </button>
        ))}
      </div>

      {/* DO Data List */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">DO Number</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Invoice Ref</th>
                <th className="px-5 py-3 text-left">Vehicle No</th>
                <th className="px-5 py-3 text-left">Expected Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500 font-mono">
                    No Delivery Orders found.
                  </td>
                </tr>
              ) : (
                filtered.map(doItem => {
                  const cust = customers.find(c => c.id === doItem.customerId);
                  return (
                    <tr key={doItem.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4 font-bold text-emerald-400 font-mono text-xs">{doItem.doNumber}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-100">{cust?.name || "Unlisted Client"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cust?.code || "CUST-UNSPEC"}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-300">{doItem.invoiceNumber || "—"}</td>
                      <td className="px-5 py-4 font-mono text-slate-400 flex items-center gap-1 mt-1">
                        <Truck className="h-3 w-3 text-emerald-500" />
                        <span>{doItem.vehicleNumber || "Not Assigned"}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-400">{doItem.expectedDeliveryDate || "Not scheduled"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                          doItem.status === "delivered" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          doItem.status === "dispatched" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                          doItem.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {doItem.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingDO(doItem)}
                            className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="View DO / Form Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(doItem)}
                            className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Edit Delivery Order"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => downloadDOPDF(doItem)}
                            className="rounded-lg p-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/10 transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doItem.id)}
                            className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                            title="Delete DO"
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
      </div>

      {/* VIEW DO DETAILS MODAL / GORGEOUS FORM PREVIEW */}
      {viewingDO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 text-left">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="border-b border-slate-800 p-5 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Delivery Challan / DO Preview: {viewingDO.doNumber}
                </h3>
              </div>
              <button onClick={() => setViewingDO(null)} className="text-slate-400 hover:text-white cursor-pointer font-bold">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Paper styled preview */}
              <div className="border border-slate-800 rounded-xl bg-slate-900/20 p-5 space-y-4">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">DeInrim Enterprises</h4>
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase font-mono tracking-wider mt-0.5">Logistics & Dispatch Division</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">{viewingDO.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Consignee</span>
                    <strong className="text-slate-200 block text-xs">{customers.find(c => c.id === viewingDO.customerId)?.name || "Unlisted Customer"}</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed flex gap-1 items-start mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{viewingDO.deliveryAddress}</span>
                    </p>
                  </div>
                  <div className="space-y-1 text-right font-semibold">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Details</span>
                    <div className="text-slate-300">Ref Invoice: <span className="text-slate-100 font-mono font-bold">{viewingDO.invoiceNumber || "N/A"}</span></div>
                    <div className="text-slate-300">Expected: <span className="text-slate-100 font-mono">{viewingDO.expectedDeliveryDate || "Immediate"}</span></div>
                    <div className="text-slate-300">Date Issued: <span className="text-slate-100 font-mono">{viewingDO.createdAt}</span></div>
                  </div>
                </div>

                {/* Transportation block */}
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 grid grid-cols-3 gap-2 text-xs font-semibold">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-mono">Vehicle Number</span>
                    <span className="text-slate-200 font-mono">{viewingDO.vehicleNumber || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-mono">Driver Name</span>
                    <span className="text-slate-200">{viewingDO.driverName || "Not assigned"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block font-mono">E-Way Bill No</span>
                    <span className="text-slate-200 font-mono">{viewingDO.ewayBillNumber || "None"}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
                  <table className="min-w-full text-left divide-y divide-slate-800 font-semibold">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[9px] tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Item Description</th>
                        <th className="px-3 py-2 text-center w-20">Unit</th>
                        <th className="px-3 py-2 text-right w-20">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300 bg-slate-950/20">
                      {viewingDO.items.map((it, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2.5 font-medium">{it.description}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-400">{it.unit}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-extrabold text-slate-200">{it.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center font-bold">
                  <div>
                    <div className="border-b border-slate-800/80 pb-1 mb-1 font-mono uppercase">Dispatched By</div>
                    <span>Logistics stamp & sign</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-800/80 pb-1 mb-1 font-mono uppercase">Consignee sign</div>
                    <span>Received in good condition</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 p-5 bg-slate-900/20 flex justify-end gap-3">
              <button
                onClick={() => setViewingDO(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => downloadDOPDF(viewingDO)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT DELIVERY ORDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 text-left overflow-y-auto">
          <form 
            onSubmit={handleSaveDO} 
            className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleUp my-8"
          >
            <div className="border-b border-slate-800 p-5 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {editingDO ? "Edit Delivery Order" : "Create Delivery Order"}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Consignee *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Ref Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-0012"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Full physical delivery address location details..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                  >
                    <option value="draft">Draft</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Transportation Details */}
              <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-3">
                <span className="block text-[10px] font-bold text-emerald-400 uppercase font-mono tracking-wider">Transportation & Logistics (E-Way)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase font-mono mb-1">Vehicle No</label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. WB-02-Y-8831"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase font-mono mb-1">Driver Name</label>
                    <input
                      type="text"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Sanjay Dutta"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase font-mono mb-1">E-Way Bill No</label>
                    <input
                      type="text"
                      value={ewayBillNumber}
                      onChange={(e) => setEwayBillNumber(e.target.value)}
                      placeholder="8821 4432 1092"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white font-mono focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Dynamic Table */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Goods Specifications List *</span>
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-900/20 text-xs">
                  <table className="min-w-full">
                    <thead className="bg-slate-950 text-slate-400 font-mono font-bold uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-3 py-2 text-left">Item Description</th>
                        <th className="px-3 py-2 text-center w-24">Quantity</th>
                        <th className="px-3 py-2 text-center w-20">Unit</th>
                        <th className="px-3 py-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Enterprise Cloud Units"
                              value={item.description}
                              onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-white font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              required
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(idx, "quantity", Number(e.target.value))}
                              className="w-full text-center bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-white font-mono font-extrabold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.unit}
                              onChange={(e) => handleLineItemChange(idx, "unit", e.target.value)}
                              className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-xs text-white"
                            >
                              <option value="Nos">Nos</option>
                              <option value="Boxes">Boxes</option>
                              <option value="Sets">Sets</option>
                              <option value="Kgs">Kgs</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
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
                  <div className="bg-slate-950 p-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="text-emerald-400 hover:text-emerald-300 font-bold font-mono text-[10px]"
                    >
                      + Add Item Row
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 p-5 bg-slate-900/20 flex justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition-all cursor-pointer"
              >
                {editingDO ? "Save Updates" : "Issue Delivery Order"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

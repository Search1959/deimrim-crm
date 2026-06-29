/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShoppingBag, 
  Truck, 
  Users, 
  Plus, 
  Check, 
  AlertCircle,
  FileSpreadsheet,
  FileCheck,
  Send,
  X,
  CreditCard,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload
} from "lucide-react";
import { Supplier, PurchaseOrder, Product, Warehouse, UserRole, formatINR } from "../types";

interface PurchaseViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  products: Product[];
  warehouses: Warehouse[];
  userRole: UserRole;
  onReceiveGRN: (poId: string, warehouseId: string, items: Array<{ productId: string; qty: number; batchNumber: string; expiryDate?: string; rack?: string }>) => void;
}

export default function PurchaseView({
  suppliers,
  setSuppliers,
  purchaseOrders,
  setPurchaseOrders,
  products,
  warehouses,
  userRole,
  onReceiveGRN,
}: PurchaseViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pos" | "suppliers" | "create-po" | "grn">("pos");
  
  // Create PO form states
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPoItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: "", quantity: 1, unitPrice: 0 }
  ]);
  const [poRemarks, setPoRemarks] = useState("");

  // GRN states
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);
  const [selectedWarehouseForGRN, setSelectedWarehouseForGRN] = useState("");
  const [grnItemsConfig, setGrnItemsConfig] = useState<Record<string, { receivedQty: number; batchCode: string; expiry: string; rack: string }>>({});

  // Add Supplier form states
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    creditDays: 30,
  });

  // Edit states
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [poToEdit, setPoToEdit] = useState<PurchaseOrder | null>(null);
  const [selectedPOView, setSelectedPOView] = useState<PurchaseOrder | null>(null);

  // CSV states
  const [showImportSuppliersModal, setShowImportSuppliersModal] = useState(false);
  const [showImportPOsModal, setShowImportPOsModal] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState("");
  const [importNotification, setImportNotification] = useState("");

  const isProcurementStaff = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.PURCHASE_MANAGER
  ].includes(userRole);

  const isWarehouseStaff = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.INVENTORY_MANAGER,
    UserRole.PURCHASE_MANAGER
  ].includes(userRole);

  // Handle PO Creation
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return alert("Please select a Supplier");
    
    const validItems = poItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) return alert("Please add at least one valid product");

    const totalAmount = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const poNumber = `PO-2026-000${purchaseOrders.length + 1}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: selectedSupplier,
      branchId: "br-hq",
      items: validItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        receivedQuantity: 0,
      })),
      totalAmount,
      status: "draft",
      paymentStatus: "unpaid",
      createdAt: new Date().toISOString(),
      remarks: poRemarks,
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    alert(`Purchase Order ${poNumber} created in Draft mode!`);
    
    // Reset Form
    setSelectedSupplier("");
    setPoItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
    setPoRemarks("");
    setActiveSubTab("pos");
  };

  const handleAddPoItem = () => {
    setPoItems(prev => [...prev, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdatePoItem = (index: number, key: "productId" | "quantity" | "unitPrice", value: any) => {
    setPoItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, [key]: value };
      
      if (key === "productId") {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated.unitPrice = prod.purchasePrice;
        }
      }
      return updated;
    }));
  };

  // Handle Supplier Creation
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      companyId: "comp-1",
      name: newSupplier.name,
      code: `SUP-${newSupplier.name.toUpperCase().slice(0, 4).replace(/\s+/g, "")}`,
      contactPerson: newSupplier.contactPerson,
      email: newSupplier.email,
      phone: newSupplier.phone,
      address: newSupplier.address,
      creditDays: Number(newSupplier.creditDays),
    };

    setSuppliers(prev => [...prev, supplier]);
    setNewSupplier({ name: "", contactPerson: "", email: "", phone: "", address: "", creditDays: 30 });
    setShowAddSupplier(false);
    alert("New supplier registered successfully!");
  };

  // Save Supplier edits
  const handleSaveSupplierEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierToEdit) return;

    setSuppliers(prev => prev.map(s => {
      if (s.id === supplierToEdit.id) {
        return {
          ...s,
          name: supplierToEdit.name,
          contactPerson: supplierToEdit.contactPerson,
          email: supplierToEdit.email,
          phone: supplierToEdit.phone,
          address: supplierToEdit.address,
          creditDays: Number(supplierToEdit.creditDays),
        };
      }
      return s;
    }));
    setSupplierToEdit(null);
    alert("Supplier profile updated successfully!");
  };

  // Delete Supplier
  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  // PO Action Approvals
  const handleApprovePO = (poId: string) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        return { ...po, status: "approved" };
      }
      return po;
    }));
  };

  // Delete Purchase Order
  const handleDeletePO = (id: string, poNumber: string) => {
    if (confirm(`Are you sure you want to delete Purchase Order "${poNumber}"?`)) {
      setPurchaseOrders(prev => prev.filter(po => po.id !== id));
      if (selectedPOView?.id === id) setSelectedPOView(null);
    }
  };

  // Initialize GRN modal workspace
  const handleOpenGRN = (po: PurchaseOrder) => {
    setSelectedPOForGRN(po);
    setSelectedWarehouseForGRN(warehouses[0]?.id || "wh-main");
    
    const configs: typeof grnItemsConfig = {};
    po.items.forEach(item => {
      configs[item.productId] = {
        receivedQty: item.quantity - item.receivedQuantity,
        batchCode: `B26-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        expiry: "2030-12-31",
        rack: "Rack A-01",
      };
    });
    setGrnItemsConfig(configs);
    setActiveSubTab("grn");
  };

  // Submit GRN
  const handleSubmitGRN = () => {
    if (!selectedPOForGRN || !selectedWarehouseForGRN) return;

    const grnItems = selectedPOForGRN.items.map(item => {
      const config = grnItemsConfig[item.productId] || { receivedQty: 0, batchCode: "", expiry: "", rack: "" };
      return {
        productId: item.productId,
        orderedQty: item.quantity,
        receivedQty: config.receivedQty,
        batchNumber: config.batchCode,
        expiryDate: config.expiry,
        rackLocation: config.rack,
      };
    });

    onReceiveGRN(selectedPOForGRN.id, selectedWarehouseForGRN, grnItems);
    alert("Goods Received Note successfully posted. On-hand inventory quantities increased.");
    setActiveSubTab("pos");
    setSelectedPOForGRN(null);
  };

  // Export Suppliers to CSV
  const handleExportSuppliersCSV = () => {
    const headers = ["ID", "Code", "Name", "Contact Person", "Email", "Phone", "Address", "Credit Days"];
    const csvRows = [headers.join(",")];
    suppliers.forEach(s => {
      const row = [s.id, s.code, s.name, s.contactPerson, s.email, s.phone, s.address, s.creditDays].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `vendor_registry_${Date.now()}.csv`);
  };

  // Export POs to CSV
  const handleExportPOsCSV = () => {
    const headers = ["PO Number", "Supplier Code", "Raised Date", "Total Cost", "Status", "Payment Status", "Remarks"];
    const csvRows = [headers.join(",")];
    purchaseOrders.forEach(po => {
      const supplier = suppliers.find(s => s.id === po.supplierId);
      const row = [po.poNumber, supplier?.code || "N/A", po.createdAt, po.totalAmount, po.status, po.paymentStatus, po.remarks || ""].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `purchase_orders_${Date.now()}.csv`);
  };

  const triggerCsvDownload = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load sample data for Suppliers import
  const handleLoadSampleSuppliersCSV = () => {
    const sample = `name,contactPerson,email,phone,address,creditDays
Global Hardware Distributors,Robert Stone,procurement@globalhardware.com,+1 (505) 555-0199,Shed 5 Industrial Blvd,45
MicroSemiconductors Co.,Nishant Patel,orders@microsemi.net,+1 (408) 555-2244,Building B Intel Dr,30
Schneider Logistics Depot,Marie Durand,ops@schneiderlogistics.fr,+33 1 4268 5300,Rue de la Gare,60`;
    setCsvTextInput(sample);
  };

  // Load sample data for POs import
  const handleLoadSamplePOsCSV = () => {
    const sample = `supplierCode,productId,quantity,unitPrice,remarks
SUP-HQ,prod-1,10,1200,Urgent stock refilling
SUP-HQ,prod-2,40,800,Regular quarterly logistics bulk purchase
SUP-HQ,prod-3,100,150,IoT Ambient Nodes batch order`;
    setCsvTextInput(sample);
  };

  // Parse Suppliers CSV
  const handleImportSuppliersCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return alert("Please enter CSV content");

    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return alert("CSV must contain a header row");

    let count = 0;
    const newSups: Supplier[] = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 1) {
        const [name, contact, email, phone, address, creditDays] = cols;
        newSups.push({
          id: `sup-imp-${Date.now()}-${count}`,
          companyId: "comp-1",
          name: name || "Imported Vendor",
          code: `SUP-${(name || "IMP").toUpperCase().slice(0, 4).replace(/\s+/g, "")}`,
          contactPerson: contact || "Direct Agent",
          email: email || "vendor@imported.com",
          phone: phone || "N/A",
          address: address || "System Imported Address",
          creditDays: parseInt(creditDays) || 30,
        });
        count++;
      }
    });

    if (newSups.length > 0) {
      setSuppliers(prev => [...newSups, ...prev]);
      setImportNotification(`Successfully parsed and added ${count} Suppliers into Approved Vendor Registry!`);
      setTimeout(() => {
        setImportNotification("");
        setShowImportSuppliersModal(false);
        setCsvTextInput("");
      }, 2500);
    }
  };

  // Parse POs CSV
  const handleImportPOsCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return alert("Please enter CSV content");

    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return alert("CSV must contain a header row");

    let count = 0;
    const newPOs: PurchaseOrder[] = [];
    
    // Group items by supplier code to create structured POs
    const supplierGrouped: Record<string, Array<{ productId: string; quantity: number; unitPrice: number }>> = {};
    const remarksGrouped: Record<string, string> = {};

    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 3) {
        const [supCode, prodId, qty, price, remarks] = cols;
        const targetSup = suppliers.find(s => s.code === supCode || s.name.toLowerCase().includes(supCode.toLowerCase())) || suppliers[0];
        if (targetSup) {
          if (!supplierGrouped[targetSup.id]) {
            supplierGrouped[targetSup.id] = [];
            remarksGrouped[targetSup.id] = remarks || "Bulk imported Purchase Order";
          }
          supplierGrouped[targetSup.id].push({
            productId: prodId || products[0]?.id || "prod-1",
            quantity: parseInt(qty) || 5,
            unitPrice: parseFloat(price) || 100,
          });
        }
      }
    });

    Object.keys(supplierGrouped).forEach((supId, idx) => {
      const items = supplierGrouped[supId];
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      newPOs.push({
        id: `po-imp-${Date.now()}-${idx}`,
        poNumber: `PO-IMP-${purchaseOrders.length + idx + 1}`,
        supplierId: supId,
        branchId: "br-hq",
        items: items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          receivedQuantity: 0,
        })),
        totalAmount,
        status: "draft",
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
        remarks: remarksGrouped[supId],
      });
      count++;
    });

    if (newPOs.length > 0) {
      setPurchaseOrders(prev => [...newPOs, ...prev]);
      setImportNotification(`Successfully compiled and created ${count} Purchase Orders!`);
      setTimeout(() => {
        setImportNotification("");
        setShowImportPOsModal(false);
        setCsvTextInput("");
      }, 2500);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Module Title & Navigation */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Purchase & Requisitions Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Raise electronic Purchase Orders, register suppliers, and process incoming warehouse goods receipt notes.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("pos")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeSubTab === "pos" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveSubTab("suppliers")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeSubTab === "suppliers" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Vendor Directory
          </button>
          {isProcurementStaff && (
            <button
              onClick={() => { setActiveSubTab("create-po"); setSelectedSupplier(""); setPoItems([{ productId: "", quantity: 1, unitPrice: 0 }]); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                activeSubTab === "create-po" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Raise Requisition PO
            </button>
          )}
        </div>
      </div>

      {/* PO SUB TAB CONTENT */}
      {activeSubTab === "pos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Registered Purchase Orders Ledger</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportPOsModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import POs</span>
              </button>
              <button
                onClick={handleExportPOsCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export POs</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-5 py-3">PO Number</th>
                    <th className="px-5 py-3">Vendor / Code</th>
                    <th className="px-5 py-3">Raised Date</th>
                    <th className="px-5 py-3">Grand Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Settlement</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {purchaseOrders.map((po) => {
                    const supplier = suppliers.find(s => s.id === po.supplierId);
                    return (
                      <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-indigo-400 font-mono text-xs">{po.poNumber}</td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-100">{supplier?.name || "Unknown Vendor"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{supplier?.code}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-bold font-mono text-slate-200">{formatINR(po.totalAmount)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            po.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            po.status === "approved" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            po.status === "grn_pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-slate-800 text-slate-400 border-slate-700"
                          }`}>
                            {po.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            po.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            po.paymentStatus === "partially_paid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {po.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedPOView(po)}
                              className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Items list"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {po.status === "draft" && isProcurementStaff && (
                              <button
                                onClick={() => handleApprovePO(po.id)}
                                className="inline-flex items-center gap-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 text-xs font-bold hover:bg-indigo-600/30"
                              >
                                <FileCheck className="h-3 w-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            {(po.status === "approved" || po.status === "grn_pending") && isWarehouseStaff && (
                              <button
                                onClick={() => handleOpenGRN(po)}
                                className="inline-flex items-center gap-0.5 rounded bg-amber-650/20 text-amber-400 border border-amber-500/20 px-2 py-1 text-xs font-bold hover:bg-amber-500/30"
                              >
                                <Truck className="h-3 w-3" />
                                <span>Receive</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDeletePO(po.id, po.poNumber)}
                              className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete Requisition"
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
        </div>
      )}

      {/* SUPPLIERS DIRECTORY TAB */}
      {activeSubTab === "suppliers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Approved Vendor Registry Directory</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddSupplier(!showAddSupplier)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Supplier</span>
              </button>
              <button
                onClick={() => setShowImportSuppliersModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExportSuppliersCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ADD SUPPLIER FORM */}
          {showAddSupplier && (
            <form onSubmit={handleCreateSupplier} className="bg-slate-950 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 border-b border-slate-800 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-white font-mono">Add New Registered Vendor Profile</h4>
                <button type="button" onClick={() => setShowAddSupplier(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Contact Person</label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Credit Period (Days)</label>
                <input
                  type="number"
                  value={newSupplier.creditDays}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, creditDays: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone Number</label>
                <input
                  type="text"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Mailing Address</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="md:col-span-3 text-right">
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Save Vendor Profile
                </button>
              </div>
            </form>
          )}

          {/* EDIT SUPPLIER FORM MODAL */}
          {supplierToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveSupplierEdit} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white font-mono">Edit Vendor Profile: {supplierToEdit.name}</h4>
                  <button type="button" onClick={() => setSupplierToEdit(null)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vendor Name</label>
                  <input
                    type="text"
                    required
                    value={supplierToEdit.name}
                    onChange={(e) => setSupplierToEdit({ ...supplierToEdit, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Contact Person</label>
                  <input
                    type="text"
                    value={supplierToEdit.contactPerson}
                    onChange={(e) => setSupplierToEdit({ ...supplierToEdit, contactPerson: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Credit Period (Days)</label>
                  <input
                    type="number"
                    value={supplierToEdit.creditDays}
                    onChange={(e) => setSupplierToEdit({ ...supplierToEdit, creditDays: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                  <input
                    type="email"
                    value={supplierToEdit.email}
                    onChange={(e) => setSupplierToEdit({ ...supplierToEdit, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone Number</label>
                  <input
                    type="text"
                    value={supplierToEdit.phone}
                    onChange={(e) => setSupplierToEdit({ ...supplierToEdit, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Mailing Address</label>
                  <input
                    type="text"
                    value={supplierToEdit.address}
                    onChange={(e) => setSupplierToEdit({ ...supplierToEdit, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSupplierToEdit(null)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VENDORS DIRECTORY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="font-bold text-slate-200 leading-tight">{s.name}</div>
                  <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-500/20">{s.code}</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div>Contact: <strong className="text-slate-300 font-semibold">{s.contactPerson}</strong></div>
                  <div>Phone: <span className="font-medium text-slate-300">{s.phone}</span></div>
                  <div>Email: <span className="font-medium text-slate-300">{s.email}</span></div>
                  <div>Credit Facility: <strong className="text-indigo-400">{s.creditDays} Net Days</strong></div>
                  <div className="truncate">Address: {s.address}</div>
                </div>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => setSupplierToEdit(s)}
                    className="rounded p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(s.id, s.name)}
                    className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete Vendor"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE PO SUB TAB */}
      {activeSubTab === "create-po" && (
        <form onSubmit={handleCreatePO} className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white font-mono">Raise New Purchase Requisition</h3>
            <p className="text-xs text-slate-400">Specify details to issue a legal Purchase Order. COGS valuations will update automatically on GRN receive.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Target Vendor/Supplier</label>
              <select
                required
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-semibold"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Procurement Department Remarks</label>
              <input
                type="text"
                value={poRemarks}
                onChange={(e) => setPoRemarks(e.target.value)}
                placeholder="Ex: Urgent topup of core catalog SKUs"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">PO Line Items list</span>
            
            {poItems.map((item, idx) => (
              <div key={idx} className="flex items-end gap-3 bg-slate-900 border border-slate-850 p-3 rounded-lg">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Product SKU</label>
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => handleUpdatePoItem(idx, "productId", e.target.value)}
                    className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-hidden font-semibold"
                  >
                    <option value="">-- Choose SKU --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Order Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleUpdatePoItem(idx, "quantity", Number(e.target.value))}
                    className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Contract Cost</label>
                  <input
                    type="number"
                    required
                    value={item.unitPrice}
                    onChange={(e) => handleUpdatePoItem(idx, "unitPrice", Number(e.target.value))}
                    className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-hidden font-mono"
                  />
                </div>
                {poItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePoItem(idx)}
                    className="rounded bg-red-500/10 text-red-400 p-2 hover:bg-red-500/20 mb-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddPoItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 font-mono"
            >
              <Plus className="h-4 w-4" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="text-right border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs text-slate-500 font-semibold uppercase block font-mono">Grand Total Estimation</span>
              <strong className="text-lg font-bold text-white font-mono">
                {formatINR(poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0))}
              </strong>
            </div>

            <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md">
              Generate Requisition PO
            </button>
          </div>
        </form>
      )}

      {/* GOODS RECEIVING WORKSPACE */}
      {activeSubTab === "grn" && selectedPOForGRN && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-mono">Goods Receipt Note (GRN) Desk</h3>
              <p className="text-xs text-slate-400">Processing incoming logistics for <strong className="text-indigo-400 font-mono">{selectedPOForGRN.poNumber}</strong>. Updates on-hand quantities immediately.</p>
            </div>
            <button onClick={() => setActiveSubTab("pos")} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Target Storage Warehouse</label>
              <select
                value={selectedWarehouseForGRN}
                onChange={(e) => setSelectedWarehouseForGRN(e.target.value)}
                className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-sm text-white focus:outline-hidden"
              >
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500 shrink-0" />
              <p className="text-xs text-slate-400">
                <strong>Warehouse Rule</strong>: Receipt of items generates standard expiry dates & automatic alphanumeric track batch logs. Stock Ledger counts will be updated.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Confirm Incoming Quantities & Batch Allocations</span>
            
            {selectedPOForGRN.items.map(item => {
              const product = products.find(p => p.id === item.productId);
              const config = grnItemsConfig[item.productId] || { receivedQty: 0, batchCode: "", expiry: "", rack: "" };

              return (
                <div key={item.productId} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-slate-900/60 rounded-lg border border-slate-800">
                  <div className="md:col-span-1">
                    <span className="text-xs font-bold text-white block truncate">{product?.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Order: {item.quantity} {product?.unit}</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Qty Received</label>
                    <input
                      type="number"
                      required
                      max={item.quantity - item.receivedQuantity}
                      value={config.receivedQty}
                      onChange={(e) => setGrnItemsConfig(prev => ({
                        ...prev,
                        [item.productId]: { ...prev[item.productId], receivedQty: Number(e.target.value) }
                      }))}
                      className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Batch Code</label>
                    <input
                      type="text"
                      required
                      value={config.batchCode}
                      onChange={(e) => setGrnItemsConfig(prev => ({
                        ...prev,
                        [item.productId]: { ...prev[item.productId], batchCode: e.target.value }
                      }))}
                      className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Expiry Date</label>
                    <input
                      type="date"
                      value={config.expiry}
                      onChange={(e) => setGrnItemsConfig(prev => ({
                        ...prev,
                        [item.productId]: { ...prev[item.productId], expiry: e.target.value }
                      }))}
                      className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Rack Location</label>
                    <input
                      type="text"
                      value={config.rack}
                      onChange={(e) => setGrnItemsConfig(prev => ({
                        ...prev,
                        [item.productId]: { ...prev[item.productId], rack: e.target.value }
                      }))}
                      placeholder="Rack A-03"
                      className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-right border-t border-slate-800 pt-4 flex gap-3 justify-end">
            <button
              onClick={() => setActiveSubTab("pos")}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitGRN}
              className="rounded-lg bg-amber-600 hover:bg-amber-500 px-5 py-2 text-xs font-bold text-white transition-colors"
            >
              Verify & Complete Receipt (GRN)
            </button>
          </div>
        </div>
      )}

      {/* PO VIEW MODAL */}
      {selectedPOView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">Items list: {selectedPOView.poNumber}</h3>
              <button onClick={() => setSelectedPOView(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {selectedPOView.items.map((it, i) => {
                const prod = products.find(p => p.id === it.productId);
                return (
                  <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="block text-xs font-bold text-white">{prod?.name || "Unknown SKU"}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">SKU: {prod?.sku}</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="block text-slate-200 font-semibold">{it.quantity} units</span>
                      <span className="block text-indigo-400">@ {formatINR(it.unitPrice)} ea</span>
                    </div>
                  </div>
                );
              })}
              {selectedPOView.remarks && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 mt-2">
                  <strong className="text-slate-300 block mb-0.5">Procurement Remarks:</strong>
                  {selectedPOView.remarks}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setSelectedPOView(null)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT VENDORS MODAL */}
      {showImportSuppliersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Approved Vendors</span>
              </h4>
              <button onClick={() => setShowImportSuppliersModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                name,contactPerson,email,phone,address,creditDays
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Vendor CSV</span>
              <button onClick={handleLoadSampleSuppliersCSV} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="name,contactPerson,email,phone,address,creditDays"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportSuppliersModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportSuppliersCSV} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Import Vendors
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT POS MODAL */}
      {showImportPOsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Purchase Requisitions</span>
              </h4>
              <button onClick={() => setShowImportPOsModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                supplierCode,productId,quantity,unitPrice,remarks
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste PO CSV</span>
              <button onClick={handleLoadSamplePOsCSV} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="supplierCode,productId,quantity,unitPrice,remarks"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportPOsModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportPOsCSV} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Compile & Import POs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

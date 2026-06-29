/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Plus, 
  Check, 
  Layers, 
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  DollarSign,
  ChevronRight,
  X,
  CreditCard,
  MessageSquare,
  Trash2,
  Edit,
  Eye,
  Download,
  Upload
} from "lucide-react";
import { Lead, Customer, Invoice, Product, BatchStock, UserRole, formatINR } from "../types";

interface SalesCRMViewProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  products: Product[];
  batchStocks: BatchStock[];
  userRole: UserRole;
  onGenerateInvoice: (invoiceId: string, customerId: string, items: Array<{ productId: string; qty: number }>) => void;
}

export default function SalesCRMView({
  leads,
  setLeads,
  customers,
  setCustomers,
  invoices,
  setInvoices,
  products,
  batchStocks,
  userRole,
  onGenerateInvoice,
}: SalesCRMViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"pipeline" | "customers" | "invoices" | "create-invoice">("pipeline");
  
  // Create Invoice states
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: "", quantity: 1, unitPrice: 0 }
  ]);
  const [dueDays, setDueDays] = useState(30);

  // Add customer states
  const [showAddCust, setShowAddCust] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", email: "", phone: "", address: "" });

  // Add Lead state
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", companyName: "", email: "", phone: "", source: "Website", notes: "" });

  // Edit states
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [invoiceToView, setInvoiceToView] = useState<Invoice | null>(null);

  // CSV States
  const [showImportLeadsModal, setShowImportLeadsModal] = useState(false);
  const [showImportCustomersModal, setShowImportCustomersModal] = useState(false);
  const [showImportInvoicesModal, setShowImportInvoicesModal] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState("");
  const [importNotification, setImportNotification] = useState("");

  const isSalesStaff = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.SALES_MANAGER,
    UserRole.CRM_EXECUTIVE
  ].includes(userRole);

  const productStockMap = products.reduce((acc, p) => {
    const qty = batchStocks
      .filter(bs => bs.productId === p.id)
      .reduce((s, bs) => s + bs.quantity, 0);
    acc[p.id] = qty;
    return acc;
  }, {} as Record<string, number>);

  // Advance Lead pipeline Stage
  const handleAdvanceLead = (leadId: string) => {
    const stages: Array<Lead["status"]> = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const currentIdx = stages.indexOf(l.status);
        const nextIdx = (currentIdx + 1) % stages.length;
        const status = stages[nextIdx];
        
        if (status === "Won") {
          const exists = customers.some(c => c.name.toLowerCase() === l.companyName?.toLowerCase());
          if (!exists && l.companyName) {
            const code = `CUST-${l.companyName.toUpperCase().slice(0, 4).replace(/\s+/g, "")}`;
            const newCustProfile: Customer = {
              id: `cust-${Date.now()}`,
              companyId: "comp-1",
              name: l.name,
              code,
              email: l.email,
              phone: l.phone,
              address: "Pending Address Input",
              outstandingBalance: 0,
            };
            setCustomers(cprev => [newCustProfile, ...cprev]);
            alert(`Lead won! Created CRM Customer Profile for ${l.companyName}`);
          }
        }
        return { ...l, status };
      }
      return l;
    }));
  };

  // Create Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;

    const lead: Lead = {
      id: `lead-${Date.now()}`,
      companyId: "comp-1",
      name: newLead.name,
      companyName: newLead.companyName,
      email: newLead.email,
      phone: newLead.phone,
      status: "New",
      source: newLead.source,
      assignedTo: "Alex Mercer",
      notes: newLead.notes,
    };

    setLeads(prev => [lead, ...prev]);
    setNewLead({ name: "", companyName: "", email: "", phone: "", source: "Website", notes: "" });
    setShowAddLead(false);
    alert("New sales pipeline lead registered!");
  };

  // Edit Lead
  const handleSaveLeadEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadToEdit) return;

    setLeads(prev => prev.map(l => {
      if (l.id === leadToEdit.id) {
        return {
          ...l,
          name: leadToEdit.name,
          companyName: leadToEdit.companyName,
          email: leadToEdit.email,
          phone: leadToEdit.phone,
          status: leadToEdit.status,
          source: leadToEdit.source,
          notes: leadToEdit.notes,
        };
      }
      return l;
    }));
    setLeadToEdit(null);
    alert("Lead record updated.");
  };

  // Delete Lead
  const handleDeleteLead = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead for "${name}"?`)) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  // Create Customer
  const handleCreateCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name) return;

    const code = `CUST-${newCust.name.toUpperCase().slice(0, 4).replace(/\s+/g, "")}`;
    const profile: Customer = {
      id: `cust-${Date.now()}`,
      companyId: "comp-1",
      name: newCust.name,
      code,
      email: newCust.email,
      phone: newCust.phone,
      address: newCust.address,
      outstandingBalance: 0,
    };

    setCustomers(prev => [profile, ...prev]);
    setNewCust({ name: "", email: "", phone: "", address: "" });
    setShowAddCust(false);
    alert("Customer Profile initialized!");
  };

  // Edit Customer
  const handleSaveCustomerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerToEdit) return;

    setCustomers(prev => prev.map(c => {
      if (c.id === customerToEdit.id) {
        return {
          ...c,
          name: customerToEdit.name,
          email: customerToEdit.email,
          phone: customerToEdit.phone,
          address: customerToEdit.address,
        };
      }
      return c;
    }));
    setCustomerToEdit(null);
    alert("Customer profile updated.");
  };

  // Delete Customer
  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  // Create Invoice
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return alert("Please select a Customer");

    const validItems = invoiceItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) return alert("Please add at least one valid billing item");

    // Stock constraint validation
    for (const item of validItems) {
      const avail = productStockMap[item.productId] || 0;
      if (item.quantity > avail) {
        alert(`Insufficient stock on hand for selected SKU! Required: ${item.quantity}, On-hand: ${avail}`);
        return;
      }
    }

    const subTotal = validItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subTotal * 0.18; // 18% GST (Indian standard)
    const grandTotal = subTotal + taxAmount;
    const invoiceNumber = `INV-2026-000${invoices.length + 1}`;
    const invId = `inv-${Date.now()}`;

    // Mutate Invoice state locally & globally via hook
    onGenerateInvoice(invId, selectedCustomer, validItems.map(vi => ({ productId: vi.productId, qty: vi.quantity })));

    alert(`Invoice ${invoiceNumber} successfully posted! Outbound stock cleared.`);
    
    // Reset Form
    setSelectedCustomer("");
    setInvoiceItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
    setActiveSubTab("invoices");
  };

  const handleAddInvoiceItem = () => {
    setInvoiceItems(prev => [...prev, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveInvoiceItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateInvoiceItem = (index: number, key: "productId" | "quantity" | "unitPrice", value: any) => {
    setInvoiceItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, [key]: value };
      
      if (key === "productId") {
        const prod = products.find(p => p.id === value);
        if (prod) {
          updated.unitPrice = prod.sellingPrice;
        }
      }
      return updated;
    }));
  };

  // Delete Invoice
  const handleDeleteInvoice = (id: string, invoiceNumber: string) => {
    if (confirm(`Are you sure you want to delete/void Invoice "${invoiceNumber}"?`)) {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  // CSV Exports
  const handleExportLeadsCSV = () => {
    const headers = ["ID", "Name", "Company Name", "Email", "Phone", "Status", "Source", "Notes"];
    const csvRows = [headers.join(",")];
    leads.forEach(l => {
      const row = [l.id, l.name, l.companyName || "", l.email, l.phone, l.status, l.source, l.notes || ""].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `leads_pipeline_${Date.now()}.csv`);
  };

  const handleExportCustomersCSV = () => {
    const headers = ["ID", "Code", "Name", "Email", "Phone", "Address", "Outstanding Balance"];
    const csvRows = [headers.join(",")];
    customers.forEach(c => {
      const row = [c.id, c.code, c.name, c.email, c.phone, c.address, c.outstandingBalance].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `customer_directory_${Date.now()}.csv`);
  };

  const handleExportInvoicesCSV = () => {
    const headers = ["Invoice Number", "Customer Name", "Issue Date", "Due Date", "Total Amount", "Status"];
    const csvRows = [headers.join(",")];
    invoices.forEach(inv => {
      const cust = customers.find(c => c.id === inv.customerId);
      const row = [inv.invoiceNumber, cust?.name || "Unknown", inv.createdAt, inv.dueDate, inv.totalAmount, inv.status].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `invoices_ledger_${Date.now()}.csv`);
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

  // Sample Loaders
  const handleLoadSampleLeads = () => {
    const sample = `name,companyName,email,phone,status,source,notes
Darnell Vance,Vance Refrigeration,darnell@vance.com,+1 555-0133,New,Referral,Looking for enterprise server stack
Phyllis Lapin,Dunder Mifflin Inc.,phyllis@dundermifflin.com,+1 555-0211,Contacted,Website,Urgent backup generators needed`;
    setCsvTextInput(sample);
  };

  const handleLoadSampleCustomers = () => {
    const sample = `name,email,phone,address,outstandingBalance
Acme Corp,orders@acme.org,+1 555-9000,100 RoadRunner Blvd,1450
Stark Industries,tony@stark.com,+1 555-3000,10880 Malibu Point,12000`;
    setCsvTextInput(sample);
  };

  const handleLoadSampleInvoices = () => {
    const sample = `customerCode,productId,quantity,unitPrice,remarks
CUST-HQ,prod-1,2,2450,Server room extension
CUST-HQ,prod-3,10,150,IoT sensors deployment`;
    setCsvTextInput(sample);
  };

  // Import Parsers
  const handleImportLeads = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return;
    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    let count = 0;
    const newLeads: Lead[] = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 1) {
        const [name, compName, email, phone, status, source, notes] = cols;
        newLeads.push({
          id: `lead-imp-${Date.now()}-${count}`,
          companyId: "comp-1",
          name: name || "Imported Lead",
          companyName: compName || "Unassigned",
          email: email || "lead@imported.org",
          phone: phone || "N/A",
          status: (status as Lead["status"]) || "New",
          source: source || "Import",
          assignedTo: "Alex Mercer",
          notes: notes || "System Bulk import.",
        });
        count++;
      }
    });
    if (newLeads.length > 0) {
      setLeads(prev => [...newLeads, ...prev]);
      setImportNotification(`Successfully parsed and added ${count} pipeline leads!`);
      setTimeout(() => { setImportNotification(""); setShowImportLeadsModal(false); setCsvTextInput(""); }, 2500);
    }
  };

  const handleImportCustomers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return;
    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    let count = 0;
    const newCusts: Customer[] = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 1) {
        const [name, email, phone, address, outstanding] = cols;
        const code = `CUST-${(name || "IMP").toUpperCase().slice(0, 4).replace(/\s+/g, "")}`;
        newCusts.push({
          id: `cust-imp-${Date.now()}-${count}`,
          companyId: "comp-1",
          name: name || "Imported CRM Profile",
          code,
          email: email || "customer@imported.com",
          phone: phone || "N/A",
          address: address || "System Imported Address",
          outstandingBalance: parseFloat(outstanding) || 0,
        });
        count++;
      }
    });
    if (newCusts.length > 0) {
      setCustomers(prev => [...newCusts, ...prev]);
      setImportNotification(`Successfully parsed and added ${count} Customer Profiles!`);
      setTimeout(() => { setImportNotification(""); setShowImportCustomersModal(false); setCsvTextInput(""); }, 2500);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Module Title & Sub-tabs switcher */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Pipeline & CRM Hub</h1>
          <p className="text-sm text-slate-400 mt-1">Nurture incoming corporate leads, manage active client directories, and issue outbound sales billing invoices.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("pipeline")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeSubTab === "pipeline" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Leads Pipeline
          </button>
          <button
            onClick={() => setActiveSubTab("customers")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeSubTab === "customers" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            CRM Customers
          </button>
          <button
            onClick={() => setActiveSubTab("invoices")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeSubTab === "invoices" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Invoices Ledger
          </button>
          {isSalesStaff && (
            <button
              onClick={() => { setActiveSubTab("create-invoice"); setSelectedCustomer(""); setInvoiceItems([{ productId: "", quantity: 1, unitPrice: 0 }]); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                activeSubTab === "create-invoice" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Issue Invoice
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB: LEADS PIPELINE */}
      {activeSubTab === "pipeline" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-300 font-mono">B2B Sales Requisition Pipeline</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddLead(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Lead</span>
              </button>
              <button
                onClick={() => setShowImportLeadsModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExportLeadsCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950 text-slate-300 font-semibold">
                <tr>
                  <th className="px-5 py-3">Lead Target</th>
                  <th className="px-5 py-3">Corporate Account</th>
                  <th className="px-5 py-3">Contact Email</th>
                  <th className="px-5 py-3">Sales Source</th>
                  <th className="px-5 py-3">Funnel Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white leading-tight">{l.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{l.phone}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-200">{l.companyName || "N/A"}</td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{l.email}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-400">{l.source}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        l.status === "Won" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        l.status === "Lost" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        l.status === "Negotiation" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isSalesStaff && l.status !== "Won" && l.status !== "Lost" && (
                          <button
                            onClick={() => handleAdvanceLead(l.id)}
                            className="inline-flex items-center gap-0.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 text-xs font-bold hover:bg-indigo-600/30"
                          >
                            <span>Progress</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => setLeadToEdit(l)}
                          className="rounded p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Edit Lead"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(l.id, l.name)}
                          className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: CRM CUSTOMERS */}
      {activeSubTab === "customers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Registered Corporate Clients</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddCust(!showAddCust)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Customer</span>
              </button>
              <button
                onClick={() => setShowImportCustomersModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExportCustomersCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ADD CUSTOMER FORM */}
          {showAddCust && (
            <form onSubmit={handleCreateCust} className="bg-slate-950 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 border-b border-slate-800 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-white font-mono">Create Registered Client Profile</h4>
                <button type="button" onClick={() => setShowAddCust(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Client/Company Name</label>
                <input
                  type="text"
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                <input
                  type="email"
                  value={newCust.email}
                  onChange={(e) => setNewCust(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Contact Phone</label>
                <input
                  type="text"
                  value={newCust.phone}
                  onChange={(e) => setNewCust(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Mailing/Billing Address</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={(e) => setNewCust(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="md:col-span-2 text-right">
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Save Customer Profile
                </button>
              </div>
            </form>
          )}

          {/* EDIT CUSTOMER MODAL */}
          {customerToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveCustomerEdit} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white font-mono">Edit Customer: {customerToEdit.name}</h4>
                  <button type="button" onClick={() => setCustomerToEdit(null)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={customerToEdit.name}
                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email</label>
                  <input
                    type="email"
                    value={customerToEdit.email}
                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                  <input
                    type="text"
                    value={customerToEdit.phone}
                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Address</label>
                  <input
                    type="text"
                    value={customerToEdit.address}
                    onChange={(e) => setCustomerToEdit({ ...customerToEdit, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCustomerToEdit(null)}
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

          {/* CUSTOMERS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customers.map(c => (
              <div key={c.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="font-bold text-slate-200 leading-tight">{c.name}</div>
                  <span className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-500/20">{c.code}</span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div>Email: <span className="font-medium text-slate-300">{c.email}</span></div>
                  <div>Phone: <span className="font-medium text-slate-300">{c.phone}</span></div>
                  <div>Address: <span className="font-medium text-slate-300">{c.address}</span></div>
                  <div>Receivables: <strong className="text-emerald-400">{formatINR(c.outstandingBalance)}</strong></div>
                </div>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => setCustomerToEdit(c)}
                    className="rounded p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(c.id, c.name)}
                    className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete Customer Profile"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB: INVOICES LEDGER */}
      {activeSubTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Consolidated Accounts Receivable Invoices</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportInvoicesCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export Invoices</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Invoice Code</th>
                    <th className="px-5 py-3">Client Name</th>
                    <th className="px-5 py-3">Billing Date</th>
                    <th className="px-5 py-3">Settlement due</th>
                    <th className="px-5 py-3">Invoice value</th>
                    <th className="px-5 py-3">Payment status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {invoices.map((inv) => {
                    const cust = customers.find(c => c.id === inv.customerId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-indigo-400 font-mono text-xs">{inv.invoiceNumber}</td>
                        <td className="px-5 py-4 font-bold text-slate-200">{cust?.name || "Unregistered Account"}</td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-xs font-mono text-slate-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                        <td className="px-5 py-4 font-bold font-mono text-slate-200">{formatINR(inv.totalAmount)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            inv.status === "partially_paid" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInvoiceToView(inv)}
                              className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Invoice specifications"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                              className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete/Void Invoice"
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

      {/* CREATE INVOICE FORM */}
      {activeSubTab === "create-invoice" && (
        <form onSubmit={handleCreateInvoice} className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white font-mono">Create Corporate Billing Invoice</h3>
            <p className="text-xs text-slate-400 font-sans">Verify stock allocations before submitting. Outbound billing invoices deduct on-hand quantities instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Billing Client Account</label>
              <select
                required
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-semibold"
              >
                <option value="">-- Choose Corporate Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Settlement Terms (Net Days)</label>
              <input
                type="number"
                required
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="space-y-3 text-left">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono font-bold">Billing Items Breakdown</span>
            
            {invoiceItems.map((item, idx) => (
              <div key={idx} className="flex items-end gap-3 bg-slate-900 border border-slate-850 p-3 rounded-lg flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Target SKU Item</label>
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => handleUpdateInvoiceItem(idx, "productId", e.target.value)}
                    className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-hidden font-semibold"
                  >
                    <option value="">-- Choose Stock Item --</option>
                    {products.map(p => {
                      const avail = productStockMap[p.id] || 0;
                      return (
                        <option key={p.id} value={p.id} disabled={avail === 0}>
                          {p.sku} - {p.name} (On-Hand: {avail})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Bill Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleUpdateInvoiceItem(idx, "quantity", Number(e.target.value))}
                    className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Sales Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateInvoiceItem(idx, "unitPrice", Number(e.target.value))}
                    className="w-full mt-1 rounded border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:outline-hidden font-mono"
                  />
                </div>
                {invoiceItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInvoiceItem(idx)}
                    className="rounded bg-red-500/10 text-red-400 p-2 hover:bg-red-500/20 mb-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddInvoiceItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 font-mono"
            >
              <Plus className="h-4 w-4" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="text-right border-t border-slate-800 pt-4 flex items-center justify-between">
            <div className="text-left space-y-1">
              {(() => {
                const sub = invoiceItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
                const tax = sub * 0.18;
                return (
                  <>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block font-mono">
                      Taxation: GST 18% (CGST 9%: {formatINR(tax / 2)} | SGST 9%: {formatINR(tax / 2)}) - {formatINR(tax)}
                    </span>
                    <strong className="text-lg font-bold text-white font-mono">Total committed bill: {formatINR(sub + tax)}</strong>
                  </>
                );
              })()}
            </div>

            <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors shadow-md">
              Confirm & Post Invoice (Deplete Stock)
            </button>
          </div>
        </form>
      )}

      {/* INVOICE VIEW MODAL */}
      {invoiceToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">Items list: {invoiceToView.invoiceNumber}</h3>
              <button onClick={() => setInvoiceToView(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {invoiceToView.items.map((it, i) => {
                const prod = products.find(p => p.id === it.productId);
                return (
                  <div key={i} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-800/80 font-sans">
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
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono text-right space-y-1">
                <div>Subtotal: {formatINR(invoiceToView.totalAmount / 1.18)}</div>
                <div>CGST (9%): {formatINR((invoiceToView.totalAmount - (invoiceToView.totalAmount / 1.18)) / 2)}</div>
                <div>SGST (9%): {formatINR((invoiceToView.totalAmount - (invoiceToView.totalAmount / 1.18)) / 2)}</div>
                <div>GST (18%): {formatINR(invoiceToView.totalAmount - (invoiceToView.totalAmount / 1.18))}</div>
                <div className="text-sm font-bold text-white pt-1 border-t border-slate-850">Grand Total: {formatINR(invoiceToView.totalAmount)}</div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setInvoiceToView(null)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">Add New Pipeline Lead</h3>
              <button onClick={() => setShowAddLead(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Lead Contact Name</label>
                <input
                  type="text"
                  required
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Company Account Name</label>
                <input
                  type="text"
                  required
                  value={newLead.companyName}
                  onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                  <input
                    type="text"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Acquisition Source</label>
                <select
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-semibold"
                >
                  <option value="Website">Website Form</option>
                  <option value="Cold Call">Cold Outbound</option>
                  <option value="Referral">Referral Code</option>
                  <option value="Event">Corporate Exhibition</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Acquisition Notes</label>
                <textarea
                  rows={2}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {leadToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">Edit Lead Profile: {leadToEdit.name}</h3>
              <button onClick={() => setLeadToEdit(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLeadEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Lead Name</label>
                <input
                  type="text"
                  required
                  value={leadToEdit.name}
                  onChange={(e) => setLeadToEdit({ ...leadToEdit, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Company Account</label>
                <input
                  type="text"
                  required
                  value={leadToEdit.companyName || ""}
                  onChange={(e) => setLeadToEdit({ ...leadToEdit, companyName: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email</label>
                  <input
                    type="email"
                    value={leadToEdit.email}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                  <input
                    type="text"
                    value={leadToEdit.phone}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Source</label>
                  <input
                    type="text"
                    value={leadToEdit.source}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, source: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Funnel Stage</label>
                  <select
                    value={leadToEdit.status}
                    onChange={(e) => setLeadToEdit({ ...leadToEdit, status: e.target.value as Lead["status"] })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes</label>
                <textarea
                  rows={2}
                  value={leadToEdit.notes || ""}
                  onChange={(e) => setLeadToEdit({ ...leadToEdit, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setLeadToEdit(null)}
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
        </div>
      )}

      {/* IMPORT LEADS MODAL */}
      {showImportLeadsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Leads Pipeline</span>
              </h4>
              <button onClick={() => setShowImportLeadsModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 font-mono">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                name,companyName,email,phone,status,source,notes
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Leads CSV</span>
              <button onClick={handleLoadSampleLeads} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="name,companyName,email,phone,status,source,notes"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportLeadsModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportLeads} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Import Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT CUSTOMERS MODAL */}
      {showImportCustomersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Customer Profiles</span>
              </h4>
              <button onClick={() => setShowImportCustomersModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 font-mono">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                name,email,phone,address,outstandingBalance
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Customers CSV</span>
              <button onClick={handleLoadSampleCustomers} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="name,email,phone,address,outstandingBalance"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportCustomersModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportCustomers} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Import Customers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

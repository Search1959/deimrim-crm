import React, { useState } from "react";
import { 
  MessageSquare, ShieldAlert, FileText, CreditCard, Award, 
  Building2, Users, AlertCircle, Calendar, Sparkles, LayoutGrid, ClipboardCheck 
} from "lucide-react";
import { Lead, Customer, Invoice, Product, BatchStock, UserRole } from "../types";

// Import modular CRM components
import LeadsPanel from "./crm/LeadsPanel";
import DealsPanel from "./crm/DealsPanel";
import QuotationsPanel from "./crm/QuotationsPanel";
import InvoicesPanel from "./crm/InvoicesPanel";
import PaymentsPanel from "./crm/PaymentsPanel";
import TargetsPanel from "./crm/TargetsPanel";
import CompaniesPanel from "./crm/CompaniesPanel";
import ContactsPanel from "./crm/ContactsPanel";
import TicketsPanel from "./crm/TicketsPanel";

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

type ActiveCRMTab = "leads" | "deals" | "quotations" | "invoices" | "payments" | "targets" | "companies" | "contacts" | "tickets";

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
  onGenerateInvoice
}: SalesCRMViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveCRMTab>("leads");

  // Sidebar layout specs
  const salesPipelineItems = [
    { id: "leads", label: "Leads & Enquiries", icon: MessageSquare },
    { id: "deals", label: "Deals", icon: ShieldAlert },
    { id: "quotations", label: "Quotations", icon: FileText },
    { id: "invoices", label: "Invoices", icon: ClipboardCheck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "targets", label: "Sales Targets", icon: Award },
  ] as const;

  const customersItems = [
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "tickets", label: "Service Tickets", icon: AlertCircle },
  ] as const;

  const renderActivePanel = () => {
    switch (activeTab) {
      case "leads":
        return <LeadsPanel leads={leads} setLeads={setLeads} customers={customers} />;
      case "deals":
        return <DealsPanel leads={leads} />;
      case "quotations":
        return <QuotationsPanel customers={customers} />;
      case "invoices":
        return (
          <InvoicesPanel 
            invoices={invoices} 
            setInvoices={setInvoices} 
            customers={customers} 
            products={products} 
            onGenerateInvoice={onGenerateInvoice} 
          />
        );
      case "payments":
        return <PaymentsPanel invoices={invoices} setInvoices={setInvoices} customers={customers} />;
      case "targets":
        return <TargetsPanel />;
      case "companies":
        return <CompaniesPanel customers={customers} setCustomers={setCustomers} />;
      case "contacts":
        return <ContactsPanel customers={customers} />;
      case "tickets":
        return <TicketsPanel customers={customers} />;
      default:
        return <LeadsPanel leads={leads} setLeads={setLeads} customers={customers} />;
    }
  };

  const getTabHeaderTitle = () => {
    const allItems = [...salesPipelineItems, ...customersItems];
    return allItems.find(item => item.id === activeTab)?.label || "Sales & CRM Node";
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full" id="sales-crm-container">
      {/* Sidebar Control Deck */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4 h-fit">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Sales Pipeline</span>
          <div className="space-y-1 mt-2">
            {salesPipelineItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive 
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300" 
                      : "border border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Customers</span>
          <div className="space-y-1 mt-2">
            {customersItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive 
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300" 
                      : "border border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 bg-slate-900/20 border border-slate-800 rounded-2xl p-5 min-h-[500px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                {getTabHeaderTitle()}
              </h2>
            </div>
          </div>

          <div className="mt-2">
            {renderActivePanel()}
          </div>
        </div>
      </div>
    </div>
  );
}

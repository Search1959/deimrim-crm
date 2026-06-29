/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building2, 
  ShieldAlert, 
  Key, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  BookOpen, 
  Search,
  Check,
  ChevronRight,
  ChevronDown,
  Lock,
  Mail,
  Workflow,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  FileText,
  X,
  Shield,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { User, UserRole } from "../types";

interface HomePageProps {
  onLogin: (user: User) => void;
  usersList: User[];
}

export default function HomePage({ onLogin, usersList }: HomePageProps) {
  // Authentication Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"credentials" | "simulation">("credentials");

  // Footer Regulatory Modals State
  const [activeFooterModal, setActiveFooterModal] = useState<"privacy" | "terms" | "support" | "deletion" | null>(null);
  
  // Support Form State
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Data Deletion Form State
  const [deletionEmail, setDeletionEmail] = useState("");
  const [deletionPhone, setDeletionPhone] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionSubmitted, setDeletionSubmitted] = useState(false);

  const closeFooterModal = () => {
    setActiveFooterModal(null);
    setSupportSubmitted(false);
    setSupportName("");
    setSupportEmail("");
    setSupportMessage("");
    setDeletionSubmitted(false);
    setDeletionEmail("");
    setDeletionPhone("");
    setDeletionReason("");
  };

  // Help Search State
  const [helpSearch, setHelpSearch] = useState("");
  const [expandedQa, setExpandedQa] = useState<number | null>(0);

  // Flow Diagram State
  const [activeFlowNode, setActiveFlowNode] = useState<string>("po");

  // Custom presets
  const presets = [
    {
      role: "System Administrator",
      email: "apex7tech@gmail.com",
      pass: "Search@1959...",
      desc: "Full root access, configures company branches, inspects audit logs",
      color: "bg-red-50 text-red-700 border-red-100"
    },
    {
      role: "Demo Read-Only User",
      email: "demo@deinrim.in",
      pass: "demo123....",
      desc: "Full read access across all screens, read-only dashboard exploration",
      color: "bg-amber-50 text-amber-700 border-amber-100"
    }
  ];

  // Q&A Help File dataset
  const qas = [
    {
      q: "What are the credentials for the pre-configured System Administrator account?",
      a: "You can log in as the System Administrator using Email: **apex7tech@gmail.com** and Password: **Search@1959...**. This account possesses complete administrative controls, enabling Docker specs inspection, company branding configuration, active employee list editing, and real-time security logs viewing."
    },
    {
      q: "How do I access the Read-Only Demo account?",
      a: "Use Email: **demo@deinrim.in** and Password: **demo123....**. This account utilizes the **Read Only User** role, allowing you to access, view, and inspect every single module area in the sidebar (Inventory, Sales, Purchase, HR, Finance, Documents) without restriction, but preventing you from saving new forms, deleting assets, or modifying system configurations."
    },
    {
      q: "How does the 'Enter Once' inventory-to-finance automation operate?",
      a: "Every transaction propagates automatically through the ledger. For instance, when a Purchase Order (PO) receives stock via a Goods Receipt Note (GRN), the system automatically increases physical batch levels inside the designated warehouse, registers a stock movement log, and submits an operational Cost of Goods Sold (COGS) expense to the Finance module ledger without manual re-entry."
    },
    {
      q: "What happens to the ledgers when a Sales Invoice is generated?",
      a: "When you issue an invoice in Sales & CRM, the system does three things simultaneously: (1) queries warehouse inventories to auto-deplete product stocks in FIFO order, (2) adds a 10% VAT tax invoice entry to the Customer's outstanding receivables, and (3) posts an incoming INCOME transaction to the Finance profit/loss database."
    },
    {
      q: "Can I simulate roles other than System Admin and Demo User?",
      a: "Yes! The platform supports native login or simulation for all main business roles: Company Admin (sarah.j@deinrim.com), Purchase Manager (marcus.v@deinrim.com), Sales Manager (theresa.w@deinrim.com), HR Manager (emma.w@deinrim.com), and Finance Manager (bessie.c@deinrim.com). Each workspace renders exactly the operational dashboards needed for that department."
    },
    {
      q: "How are employee leaves and attendances managed?",
      a: "The HR Management tab provides direct interfaces to track employee codes, record clock-in/clock-out attendance records, and review sick or annual leave requests. Changing a leave request's status to 'approved' logs the active manager's stamp and coordinates with active attendance charts."
    }
  ];

  // Flow Node details
  const flowNodeDetails: Record<string, { title: string; trigger: string; databaseEffect: string; nextStep: string; icon: any }> = {
    po: {
      title: "1. Purchase Department (PO Creation)",
      trigger: "A Purchase Manager creates a Purchase Order specifying supplier credit days, product specifications, and estimated unit rates.",
      databaseEffect: "Inserts a PO record in Draft / Sent state. No physical stock or finance logs are modified yet.",
      nextStep: "Triggers warehouse alert for incoming delivery matching the PO number.",
      icon: ShoppingBag
    },
    grn: {
      title: "2. Warehouse Goods Receipt (GRN)",
      trigger: "Warehouse staff issues a Goods Receipt Note (GRN) upon physical delivery. Batch numbers, rack locations, and expiry dates are registered.",
      databaseEffect: "Updates physical batch inventory quantities, writes a Stock Movement log (IN-PURCHASE), and triggers a GRN-expense entry.",
      nextStep: "Feeds ledger liabilities directly into the Accounts Payable system.",
      icon: Package
    },
    invoice: {
      title: "3. Sales Billing & Invoicing",
      trigger: "Sales representative registers a lead, upgrades them to a customer, and issues a standard tax invoice containing product lines.",
      databaseEffect: "Queries warehouse stocks to auto-deplete quantities (FIFO), increments customer's outstanding balance, and logs a Finance income.",
      nextStep: "Updates real-time margin calculations on the executive dashboard.",
      icon: TrendingUp
    },
    hr: {
      title: "4. Attendance & HR Resource Allocation",
      trigger: "Employees register attendance statuses, and managers approve leave requests.",
      databaseEffect: "Maintains corporate resource levels and updates operational employee rosters in real time.",
      nextStep: "Syncs monthly resource cost structures for administrative reference.",
      icon: Users
    },
    finance: {
      title: "5. Finance Ledger (Balance Sheets)",
      trigger: "Consolidates automatic streams from Goods receipts (COGS) and Sales invoices (Revenue). Handles custom ledger postings for utilities or payroll.",
      databaseEffect: "Updates the General Ledger. Live recalculation of Profit & Loss, Assets valuation, and cash flows.",
      nextStep: "Generates board-level financial reports and tax logs dynamically.",
      icon: DollarSign
    }
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanEmail = email.trim().toLowerCase();

    // Check pre-configured System Admin account
    if (cleanEmail === "apex7tech@gmail.com") {
      if (password === "Search@1959...") {
        const found = usersList.find(u => u.email === "apex7tech@gmail.com");
        if (found) {
          onLogin(found);
          return;
        }
      } else {
        setLoginError("Incorrect password for System Administrator.");
        return;
      }
    }

    // Check pre-configured Demo account
    if (cleanEmail === "demo@deinrim.in") {
      if (password === "demo123....") {
        const found = usersList.find(u => u.email === "demo@deinrim.in");
        if (found) {
          onLogin(found);
          return;
        }
      } else {
        setLoginError("Incorrect password for Demo User.");
        return;
      }
    }

    // Check any other mock users
    const matchedUser = usersList.find(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUser) {
      // Allow general simple password for local dev testing for other mock accounts
      if (password === "deinrim123" || password === "password" || password === "") {
        onLogin(matchedUser);
        return;
      } else {
        setLoginError("Please enter correct password (e.g., 'deinrim123' for standard mock users).");
        return;
      }
    }

    setLoginError("Account email not recognized in system database. Check credentials.");
  };

  const handlePresetFill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    setActiveTab("credentials");
    setLoginError("");
  };

  const filteredQas = qas.filter(
    item => 
      item.q.toLowerCase().includes(helpSearch.toLowerCase()) || 
      item.a.toLowerCase().includes(helpSearch.toLowerCase())
  );

  const CurrentFlowIcon = flowNodeDetails[activeFlowNode]?.icon || Workflow;

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* Top Brand Nav */}
      <header className="border-b border-slate-800 bg-slate-950/45 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-md font-bold text-white tracking-wider uppercase leading-none">DEINRIM</h1>
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-semibold">OMS ERP Enterprise</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-slate-400">Environment: <strong className="text-emerald-400">Live Sandboxed Container</strong></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Version: <strong className="text-indigo-400">v1.2</strong></span>
        </div>
      </header>

      {/* Main Content Split Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: System Specs & Interactive Flow Diagram (7 Cols) */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Hero Welcome */}
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              <Sparkles className="h-3.5 w-3.5" /> Unified Operations Architecture
            </span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Real-time Ledger ERP <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-sky-400">
                Inventory First Workflow
              </span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
              A comprehensive OMS & ERP environment linking procurement, warehousing batches, sales invoicing pipelines, employee attendance registers, and consolidated general ledger finance entries automatically.
            </p>
          </div>

          {/* SECTION: Interactive Working Method Flow Diagram */}
          <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-indigo-400" />
                <h3 className="text-md font-bold text-slate-100">Interactive Working Method Flow Diagram</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                Click nodes to trace
              </span>
            </div>

            {/* Visual Flow Mapper Nodes */}
            <div className="relative py-4">
              {/* Connecting background SVG line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block"></div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
                
                {/* PO Node */}
                <button
                  onClick={() => setActiveFlowNode("po")}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    activeFlowNode === "po"
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${activeFlowNode === "po" ? "bg-indigo-600 text-white" : "bg-slate-850"}`}>
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold font-mono">1. Purchase PO</span>
                  <span className="text-[9px] text-slate-500 mt-1 hidden sm:block">Procurement</span>
                </button>

                {/* GRN Node */}
                <button
                  onClick={() => setActiveFlowNode("grn")}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    activeFlowNode === "grn"
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${activeFlowNode === "grn" ? "bg-indigo-600 text-white" : "bg-slate-850"}`}>
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold font-mono">2. Inventory GRN</span>
                  <span className="text-[9px] text-slate-500 mt-1 hidden sm:block">Receipt Ledger</span>
                </button>

                {/* Sales Invoice Node */}
                <button
                  onClick={() => setActiveFlowNode("invoice")}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    activeFlowNode === "invoice"
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${activeFlowNode === "invoice" ? "bg-indigo-600 text-white" : "bg-slate-850"}`}>
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold font-mono">3. Sales Invoice</span>
                  <span className="text-[9px] text-slate-500 mt-1 hidden sm:block">CRM & Revenue</span>
                </button>

                {/* HR Node */}
                <button
                  onClick={() => setActiveFlowNode("hr")}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                    activeFlowNode === "hr"
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${activeFlowNode === "hr" ? "bg-indigo-600 text-white" : "bg-slate-850"}`}>
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold font-mono">4. HR & Payroll</span>
                  <span className="text-[9px] text-slate-500 mt-1 hidden sm:block">Rosters & Staff</span>
                </button>

                {/* Finance Node */}
                <button
                  onClick={() => setActiveFlowNode("finance")}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all col-span-2 sm:col-span-1 ${
                    activeFlowNode === "finance"
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                      : "bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg mb-2 ${activeFlowNode === "finance" ? "bg-indigo-600 text-white" : "bg-slate-850"}`}>
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold font-mono">5. Finance GL</span>
                  <span className="text-[9px] text-slate-500 mt-1 hidden sm:block">General Ledger</span>
                </button>

              </div>
            </div>

            {/* Selected Flow Step Explanation Panel */}
            {activeFlowNode && (
              <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5 border border-indigo-500/20">
                    <CurrentFlowIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-3 flex-1 text-sm">
                    <h4 className="text-base font-bold text-white">{flowNodeDetails[activeFlowNode].title}</h4>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Core Operational Trigger</span>
                      <p className="text-slate-300 mt-0.5">{flowNodeDetails[activeFlowNode].trigger}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">Database / Ledger Effect</span>
                        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{flowNodeDetails[activeFlowNode].databaseEffect}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block font-mono">Automated Downstream Step</span>
                        <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{flowNodeDetails[activeFlowNode].nextStep}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: Help Q&A Accordion */}
          <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <h3 className="text-md font-bold text-slate-100">Knowledge Base Q&A Help File</h3>
              </div>
              
              {/* Q&A Mini Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Q&A..."
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 w-full md:w-48 font-semibold"
                />
              </div>
            </div>

            {/* Q&A Accordion Items */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredQas.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No Q&A articles match your search criteria.
                </div>
              ) : (
                filteredQas.map((item, index) => {
                  const isExpanded = expandedQa === index;
                  return (
                    <div 
                      key={index} 
                      className={`rounded-xl border transition-all ${
                        isExpanded ? "bg-slate-900 border-indigo-500/40" : "bg-slate-900/45 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <button
                        onClick={() => setExpandedQa(isExpanded ? null : index)}
                        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 font-semibold"
                      >
                        <span className="text-xs text-slate-200">{item.q}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-indigo-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/40 text-xs text-slate-400 leading-relaxed font-normal">
                          <p 
                            className="whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: item.a
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-bold">$1</strong>')
                            }}
                          ></p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Login Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-950/80 rounded-2xl border border-indigo-500/20 shadow-2xl overflow-hidden text-left relative">
            {/* Top border ambient highlight */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500"></div>
            
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Access Operational Control Center</h3>
                <p className="text-xs text-slate-400 mt-1.5">Sign in to simulate customized workspace roles</p>
              </div>

              {/* Account Credential Highlighting Badges (Required in Prompt) */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold tracking-widest block">
                  Required Demo Credentials:
                </span>
                
                <div className="grid grid-cols-1 gap-2.5">
                  {presets.map((p, idx) => (
                    <div 
                      key={idx}
                      className="border border-slate-800 rounded-xl p-3 bg-slate-900/50 hover:bg-slate-900 transition-colors flex flex-col justify-between items-start gap-1"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-slate-100 font-sans">{p.role}</span>
                        <button
                          onClick={() => handlePresetFill(p.email, p.pass)}
                          className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-sm border border-indigo-500/10"
                        >
                          Auto Fill <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5 mt-1 w-full">
                        <div className="flex justify-between">
                          <span>Email: <strong className="text-slate-200">{p.email}</strong></span>
                        </div>
                        <div className="flex justify-between">
                          <span>Password: <strong className="text-slate-200 select-all">{p.pass}</strong></span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 italic leading-snug mt-1.5 border-t border-slate-800/60 pt-1 w-full">
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Login Method Tabs */}
              <div className="flex border-b border-slate-800/80 p-0.5 bg-slate-900/60 rounded-lg">
                <button
                  onClick={() => setActiveTab("credentials")}
                  className={`flex-1 text-center py-2 rounded-md text-xs font-bold transition-all ${
                    activeTab === "credentials" 
                      ? "bg-slate-800 text-white shadow-xs" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Credential Login
                </button>
                <button
                  onClick={() => setActiveTab("simulation")}
                  className={`flex-1 text-center py-2 rounded-md text-xs font-bold transition-all ${
                    activeTab === "simulation" 
                      ? "bg-slate-800 text-white shadow-xs" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Quick Role Simulator
                </button>
              </div>

              {/* Login Method Tab Content */}
              {activeTab === "credentials" ? (
                
                /* TAB 1: Credential Form */
                <form onSubmit={handleCredentialLogin} className="space-y-4">
                  
                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg text-xs flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Workplace Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="e.g., apex7tech@gmail.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300 font-mono">Account Password</label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-xs rounded-lg text-white shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    Authenticate credentials <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-[10px] text-slate-500">
                      Local secure verification against registered DBMS records.
                    </p>
                  </div>
                </form>

              ) : (

                /* TAB 2: Quick Role Simulation Grid (User-Requested roles: system admin, admin, purchase, sales, hr, finance, demo) */
                <div className="space-y-4">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-normal mb-2 flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
                    <span>Click any business function to bypass login and simulate that department's specific workspace.</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                    
                    {/* System Admin */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.SYSTEM_ADMIN) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">System Administrator</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">apex7tech@gmail.com</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Company Admin */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.COMPANY_ADMIN) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Company Administrator</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">sarah.j@deinrim.com</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Purchase Manager */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.PURCHASE_MANAGER) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Purchase Manager</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">marcus.v@deinrim.com</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Sales Manager */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.SALES_MANAGER) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Sales Manager</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">theresa.w@deinrim.com</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* HR Manager */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.HR_MANAGER) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">HR Manager</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">emma.w@deinrim.com</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Finance Manager */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.FINANCE_MANAGER) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">Finance Manager</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">bessie.c@deinrim.com</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {/* Read-Only Demo User */}
                    <button
                      onClick={() => onLogin(usersList.find(u => u.role === UserRole.READ_ONLY) || usersList[0])}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-indigo-600/10 hover:border-indigo-500/40 transition-all text-left group"
                    >
                      <div>
                        <span className="text-xs font-bold text-amber-300 block">Demo Read-Only User</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">demo@deinrim.in</span>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                    </button>

                  </div>
                </div>

              )}

            </div>
          </div>

          {/* Quick FAQ summary box */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 flex items-start gap-3 text-left">
            <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200">System Permission Policy</span>
              <p className="text-[11px] text-slate-400 leading-normal">
                All business actions (e.g., generating Purchase Orders, uploading files, changing tax schedules) validate user role parameters under the RBAC database matrix dynamically before committing.
              </p>
            </div>
          </div>

        </div>

      </main>

      {/* Global Compliance Footer */}
      <footer className="border-t border-slate-800 bg-[#030712] px-6 py-6 text-xs text-slate-400 select-none shrink-0 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto text-left">
          {/* Column 1: Operated & Developed By */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider font-mono">
              OPERATED & DEVELOPED BY
            </h4>
            <p className="text-slate-200 font-semibold text-sm">
              M/s Deinrim Solutionss (P) ltd.
            </p>
            <p className="text-slate-300">
              Kolkata, West Bengal (WB), India
            </p>
            <p className="text-white font-bold text-sm">
              Corporate Contact: +91 98361-30393
            </p>
            <p className="text-slate-500 text-[10px] leading-normal pt-2 border-t border-slate-900 mt-2">
              AutoAdz Secure Multi-Tenant Framework v3.1 • Dynamic telemetry data synced live with backend database nodes.
            </p>
          </div>

          {/* Column 2: Regulatory Compliance */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider font-mono">
              REGULATORY COMPLIANCE
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Important public links required to verify and publish the AutoAdz platform on the Google Play Console and Apple App Store Developer Tools:
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-indigo-400 font-bold mt-2 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveFooterModal("privacy")}
                className="hover:text-indigo-300 underline transition-all text-left cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setActiveFooterModal("terms")}
                className="hover:text-indigo-300 underline transition-all text-left cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setActiveFooterModal("support")}
                className="hover:text-indigo-300 underline transition-all text-left cursor-pointer"
              >
                App Support Page
              </button>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setActiveFooterModal("deletion")}
                className="text-rose-500 hover:text-rose-400 underline transition-all text-left cursor-pointer font-bold"
              >
                Data Deletion request
              </button>
            </div>
          </div>

          {/* Column 3: Platform Verifications */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider font-mono">
              PLATFORM VERIFICATIONS
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-slate-600 font-mono mt-0.5">•</span>
                <span>Background location is monitored exclusively during metered drives to secure accurate driver payout logs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-600 font-mono mt-0.5">•</span>
                <span>Camera permissions are strictly utilized for physical advertisement audit proof uploads. All data is processed via secure 256-bit TLS encryption.</span>
              </li>
            </ul>
          </div>
        </div>
      </footer>

      {/* FOOTER MODALS */}
      {activeFooterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                {activeFooterModal === "privacy" && <Shield className="h-5 w-5 text-indigo-400" />}
                {activeFooterModal === "terms" && <FileText className="h-5 w-5 text-indigo-400" />}
                {activeFooterModal === "support" && <HelpCircle className="h-5 w-5 text-indigo-400" />}
                {activeFooterModal === "deletion" && <AlertTriangle className="h-5 w-5 text-rose-500" />}
                <h3 className="text-base font-bold text-white tracking-wide">
                  {activeFooterModal === "privacy" && "AutoAdz Privacy Policy"}
                  {activeFooterModal === "terms" && "AutoAdz Terms of Service"}
                  {activeFooterModal === "support" && "Submit Support Query"}
                  {activeFooterModal === "deletion" && "Request Data Deletion"}
                </h3>
              </div>
              <button
                onClick={closeFooterModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content for Privacy */}
            {activeFooterModal === "privacy" && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2">
                <p className="font-semibold text-slate-200">Last Updated: June 28, 2026</p>
                <p>
                  Welcome to <strong>AutoAdz</strong>. We respect your privacy and are committed to protecting any personal data processed by our platform. This policy outlines our standards under regulatory compliance to verify and publish AutoAdz on major application marketplaces.
                </p>
                
                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">1. Background Location Tracking</h4>
                <p>
                  AutoAdz utilizes device background location tracking. This tracking is **strictly monitored and enabled exclusively during metered advertising drives**. This data is processed in real time to generate accurate driver payout logs, vehicle travel distances, and confirm ad impression counts. We do not track your location when you are not actively driving a metered campaign.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">2. Camera Access</h4>
                <p>
                  Our system requests access to your mobile camera. Camera permissions are utilized solely to snap and upload physical advertisement audits. These audit proof photographs confirm that the ad vinyl wrap or digital display remains intact and undamaged on the vehicle.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">3. Data Security & Encryption</h4>
                <p>
                  All telemetry streams, audit images, location routes, and personal identification are processed over secure channels with industry-standard 256-bit TLS encryption. Data is stored on partitioned multi-tenant database clusters guarded by robust security protocols.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">4. Contact Info</h4>
                <p>
                  For any privacy inquiries or localized regulatory complaints, contact M/s Deinrim Solutionss (P) Ltd. at Kolkata, West Bengal, India. Email: <strong>privacy@deinrim.com</strong> or phone +91 98361-30393.
                </p>
              </div>
            )}

            {/* Content for Terms */}
            {activeFooterModal === "terms" && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2">
                <p className="font-semibold text-slate-200">Last Updated: June 28, 2026</p>
                <p>
                  These Terms of Service govern your access to and use of the <strong>AutoAdz</strong> advertising, tracking, and telemetry platform operated by M/s Deinrim Solutionss (P) Ltd.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">1. Eligibility & Driver Accounts</h4>
                <p>
                  Drivers must register with verified personal coordinates and valid operator licenses. Accounts are individual and may not be shared across multiple vehicles or operators.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">2. Metered Advertising Drives</h4>
                <p>
                  Compensation calculations rely strictly on background location logs recorded during metered drives. Tampering with GPS records, mock location apps, or location spoofing constitutes an immediate breach of these terms, resulting in forfeit of payout and permanent account termination.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">3. Asset Auditing</h4>
                <p>
                  Operators are required to supply clear, authentic photo proofs of active advertisements via the on-device camera. Submitting computer-generated images, pre-saved gallery uploads, or tampered photographs is strictly forbidden and results in audit failure.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">4. Platform Integrity</h4>
                <p>
                  AutoAdz is built on secure multi-tenant cloud structures. Unauthorized access, structural reverse engineering, or scanning of the framework API endpoints is prohibited.
                </p>
              </div>
            )}

            {/* Form for Support */}
            {activeFooterModal === "support" && (
              <div>
                {!supportSubmitted ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSupportSubmitted(true);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <p className="text-slate-400 leading-normal">
                      Need help or have questions about the AutoAdz platform? Fill out this direct support ticket and our compliance desk will respond within 24 hours.
                    </p>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Full Name</label>
                      <input
                        type="text"
                        required
                        value={supportName}
                        onChange={(e) => setSupportName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Registered Email Address</label>
                      <input
                        type="email"
                        required
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Support Details / Query</label>
                      <textarea
                        required
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        rows={4}
                        placeholder="Describe your issue with the metered logs, audits, or payouts..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Submit Support Ticket
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Ticket Submitted Successfully!</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Thank you, {supportName}. Your support ticket reference <strong>#ADZ-{Math.floor(100000 + Math.random() * 900000)}</strong> is raised. Our compliance desk is reviewing your request.
                      </p>
                    </div>
                    <button
                      onClick={closeFooterModal}
                      className="mt-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-850 transition-all cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Form for Data Deletion */}
            {activeFooterModal === "deletion" && (
              <div>
                {!deletionSubmitted ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setDeletionSubmitted(true);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <p className="text-slate-400 leading-normal">
                      Request permanent deletion of your AutoAdz account profile, drive tracking logs, and uploaded audit proofs.
                    </p>
                    <div className="rounded-lg border border-rose-950/40 bg-rose-950/10 p-3 text-rose-400 leading-normal flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white mb-0.5">Warning: Irreversible Operation</strong>
                        This request deletes all payout logs, historical routes, and audit approvals. Once processed, it cannot be undone.
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Registered Email Address</label>
                      <input
                        type="email"
                        required
                        value={deletionEmail}
                        onChange={(e) => setDeletionEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Registered Mobile Phone</label>
                      <input
                        type="tel"
                        required
                        value={deletionPhone}
                        onChange={(e) => setDeletionPhone(e.target.value)}
                        placeholder="+91 XXXXX-XXXXX"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Reason for Account & Data Deletion</label>
                      <textarea
                        required
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        rows={3}
                        placeholder="Please briefly describe why you are requesting account and telemetry data erasure..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden resize-none"
                      />
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        required
                        id="confirmDeletion"
                        className="mt-1 rounded border-slate-800 bg-slate-900 text-rose-600 focus:ring-0"
                      />
                      <label htmlFor="confirmDeletion" className="text-[11px] text-slate-400 leading-normal cursor-pointer select-none">
                        I confirm that I want to schedule all my driver telemetry, payout logs, and profile records for absolute deletion under privacy regulations.
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Schedule Data Deletion
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                      <Trash2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Deletion Scheduled</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Your request for <strong>{deletionEmail}</strong> has been received. Our compliance team has scheduled your account data for total, irreversible purge within 14 business days. Ticket: <strong>#DEL-{Math.floor(100000 + Math.random() * 900000)}</strong>.
                      </p>
                    </div>
                    <button
                      onClick={closeFooterModal}
                      className="mt-2 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-850 transition-all cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

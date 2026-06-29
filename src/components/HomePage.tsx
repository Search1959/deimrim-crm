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
  Trash2,
  UserPlus,
  Server,
  Database,
  Code,
  HeartHandshake,
  History,
  Award,
  ExternalLink
} from "lucide-react";
import { User, UserRole } from "../types";

interface HomePageProps {
  onLogin: (user: User) => void;
  usersList: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function HomePage({ onLogin, usersList, setUsers }: HomePageProps) {
  // Authentication Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"credentials" | "demo">("credentials");
  const [portalType, setPortalType] = useState<"system" | "client" | "employee">("system");

  // Active Registry Search/Filter States
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState<"all" | "system" | "client" | "staff">("all");

  // Clear fields and reset errors when portalType changes
  React.useEffect(() => {
    setEmail("");
    setPassword("");
    setLoginError("");
  }, [portalType]);

  // Private Admin Panel State
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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

  // Review & Trust Exploration State
  const [activeReviewTab, setActiveReviewTab] = useState<"about" | "tech" | "reseller" | "templates">("about");

  // Custom presets
  const presets = [
    {
      role: "System Administrator",
      email: "apex7tech@gmail.com",
      pass: "Search@1959",
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
    },
    {
      q: "What is your backup frequency and data security protocol?",
      a: "DEINRIM OMS performs automated **encrypted PostgreSQL backup snapshots every 6 hours**, replicated across redundant physical availability zones. Transactions are secured under **AES-256 bank-grade rest encryption** and **256-bit SSL/TLS in-transit encryption** to maintain maximum compliance standards."
    },
    {
      q: "How do I map my own custom white-label domain?",
      a: "Agencies and reselling consultants can configure their own brand domain (e.g., *erp.youragency.com*) by mapping a standard **CNAME record** pointing to our routing proxy cluster. Once DNS propagates, our system auto-provisions and installs a renewal-free **SSL certificate** within 5 minutes."
    },
    {
      q: "Are there API endpoints to connect external CRMs or Shopify?",
      a: "Yes, DEINRIM OMS features **automated REST API endpoints** for all primary modules. Authorized Client Administrators can generate secure system API keys in the settings area to synchronize customers, inventory levels, sales invoices, or trigger outbound Webhooks on goods receipt."
    },
    {
      q: "How do I seed sample data if I don't want a clean slate start?",
      a: "When registering or provisioning a new corporate tenant, Company Admins can choose to **auto-apply industry-standard presets** (e.g., Manufacturing, wholesaling, or retail) with a single click in the Trust Hub. This instantly populates your isolated database with barcode layouts, standard products, tax codes, and typical chart of accounts, bypassing manual entry."
    },
    {
      q: "What is the Service Level Agreement (SLA) for platform uptime?",
      a: "We guarantee a **99.9% application uptime** under our service level agreement. Scheduled maintenance or platform optimization patches are handled during regional off-peak hours (GMT 20:00 to 22:00) with preceding dashboard alerts 24 hours in advance."
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
    if (cleanEmail === "apex7tech@gmail.com" && (password === "Search@1959" || password === "Search@1959...")) {
      const found = usersList.find(u => u.email === "apex7tech@gmail.com" && u.role === UserRole.SYSTEM_ADMIN);
      if (found) {
        onLogin(found);
        return;
      }
    }

    // Check pre-configured Demo account
    if (cleanEmail === "demo@deinrim.in" && password === "demo123....") {
      const found = usersList.find(u => u.email === "demo@deinrim.in" && u.role === UserRole.READ_ONLY);
      if (found) {
        onLogin(found);
        return;
      }
    }

    // Check any other mock or custom client users
    const matchedUsers = usersList.filter(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUsers.length > 0) {
      // 1. Try to find user that matches the exact custom password first
      const exactPasswordMatch = matchedUsers.find(u => u.password && u.password === password);
      if (exactPasswordMatch) {
        onLogin(exactPasswordMatch);
        return;
      }

      // 2. Try to find user with standard test passwords if they don't have a custom password
      if (password === "deinrim123" || password === "password" || password === "") {
        const standardMatch = matchedUsers.find(u => !u.password);
        if (standardMatch) {
          onLogin(standardMatch);
          return;
        }
      }

      // 3. Check for password errors for custom accounts with specific passwords
      const anyWithCustomPassword = matchedUsers.find(u => u.password);
      if (anyWithCustomPassword) {
        setLoginError("Incorrect password for this user account.");
        return;
      }

      setLoginError("Please enter correct password (e.g., 'deinrim123' for standard mock users).");
      return;
    }

    setLoginError("Account email not recognized in system database. Check credentials.");
  };

  const handlePresetFill = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
    // If the email is System Admin, select system portal, else select client portal
    if (emailVal === "apex7tech@gmail.com") {
      setPortalType("system");
    } else {
      setPortalType("client");
    }
    setActiveTab("credentials");
    setLoginError("");
  };

  const filteredQas = qas.filter(
    item => 
      item.q.toLowerCase().includes(helpSearch.toLowerCase()) || 
      item.a.toLowerCase().includes(helpSearch.toLowerCase())
  );

  // Filter users inside global directory
  const filteredDirectoryUsers = usersList.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
      user.email.toLowerCase().includes(directorySearch.toLowerCase()) ||
      user.role.toLowerCase().includes(directorySearch.toLowerCase()) ||
      (user.companyName && user.companyName.toLowerCase().includes(directorySearch.toLowerCase()));

    if (directoryFilter === "system") {
      return matchesSearch && user.role === UserRole.SYSTEM_ADMIN;
    }
    if (directoryFilter === "client") {
      return matchesSearch && user.role === UserRole.COMPANY_ADMIN;
    }
    if (directoryFilter === "staff") {
      return matchesSearch && 
        user.role !== UserRole.SYSTEM_ADMIN && 
        user.role !== UserRole.COMPANY_ADMIN && 
        user.role !== UserRole.READ_ONLY;
    }
    return matchesSearch;
  });

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

          {/* DEINRIM TRUST & SPECIFICATIONS HUB */}
          <div className="bg-slate-950/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Platform Trust & Specification Hub</span>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Enterprise Transparency Hub</h3>
              <p className="text-xs text-slate-400">
                Direct, transparent answers to corporate governance, technical infrastructure, reseller mechanics, and setup acceleration.
              </p>
            </div>

            {/* Hub Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveReviewTab("about")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReviewTab === "about"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <HeartHandshake className="h-3.5 w-3.5" /> Company & Trust
              </button>
              <button
                type="button"
                onClick={() => setActiveReviewTab("tech")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReviewTab === "tech"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Server className="h-3.5 w-3.5" /> Tech Specs
              </button>
              <button
                type="button"
                onClick={() => setActiveReviewTab("reseller")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReviewTab === "reseller"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Award className="h-3.5 w-3.5" /> Agency Resell
              </button>
              <button
                type="button"
                onClick={() => setActiveReviewTab("templates")}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeReviewTab === "templates"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Setup Presets
              </button>
            </div>

            {/* Tab content renders */}
            <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/80 leading-relaxed text-sm">
              
              {/* TAB: Company & Trust */}
              {activeReviewTab === "about" && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                    <History className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Corporate Heritage & High-Touch Support</h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Operated by <strong className="text-white">M/s Deinrim Solutionss (P) Ltd.</strong>, incorporated in Kolkata, WB, India, we have been crafting custom SaaS enterprise software since 2018. Over the last 8 years, our engineering team has scaled from a regional consultancy to managing high-performance multi-tenant platforms.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-850">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Priority Support SLA</span>
                      <p className="text-slate-300 mt-1">2-Hour response time for critical issues. Standard tickets resolved within 12-24 hours via dedicated email and callback channels.</p>
                    </div>
                    <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-850">
                      <span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">Active Customer Retention</span>
                      <p className="text-slate-300 mt-1">Serving 140+ active business tenants in South Asia with zero telemetry loss incidents since inception.</p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block mb-1">What our clients say:</span>
                    <p className="text-xs italic text-slate-400 border-l-2 border-indigo-500 pl-3">
                      "Moving from traditional spreadsheets to DEINRIM transformed our inventory workflow. The whitelabeling allowed us to give our retail franchisees their own branded procurement portal seamlessly." <span className="text-slate-300 font-semibold text-[10px] block mt-1">— CEO, Apex Distribution Group</span>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: Tech Specs */}
              {activeReviewTab === "tech" && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                    <Code className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Technical Specifications & Data Sovereignty</h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Engineered for high reliability, security-conscious IT officers, and demanding business operations.
                  </p>
                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 block font-bold">DATABASE LAYER</span>
                      <p className="text-slate-300 text-xs">Strictly partitioned schemas on high-performance relational PostgreSQL, preventing cross-tenant leakage.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 block font-bold">DATA EXPORTS & APIS</span>
                      <p className="text-slate-300 text-xs">1-Click JSON and CSV format table extracts on all modules. Automated REST endpoints for external CRM connections.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 block font-bold">SECURITY ENCRYPTION</span>
                      <p className="text-slate-300 text-xs">256-Bit SSL/TLS in-transit encryption and AES-256 rest encryption on cloud storage blocks.</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 block font-bold">DISASTER BACKUP</span>
                      <p className="text-slate-300 text-xs">Automated snapshots taken every 6 hours, replicated across redundant physical availability zones.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Reseller Agency */}
              {activeReviewTab === "reseller" && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                    <Building2 className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">White-Label Partner Program</h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Create a recurring high-margin SaaS revenue channel. We charge you a wholesale flat rate, letting you keep 100% of the customer margins.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1 text-left">
                      <span className="text-indigo-400 font-bold text-xs">1. Brand Customization</span>
                      <p className="text-[10px] text-slate-400 leading-normal">Upload your custom logo, configure brand hex colors, set support emails, and configure footer text.</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1 text-left">
                      <span className="text-indigo-400 font-bold text-xs">2. Custom Domain Mapping</span>
                      <p className="text-[10px] text-slate-400 leading-normal">Point your custom domain (e.g., erp.yourbrand.com) via standard CNAME records mapped instantly.</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850 space-y-1 text-left">
                      <span className="text-indigo-400 font-bold text-xs">3. Custom Pricing Margin</span>
                      <p className="text-[10px] text-slate-400 leading-normal">You pay the wholesale ₹500/tenant/month. Bill your end customers ₹2,000 to ₹5,000 per month.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Setup Presets */}
              {activeReviewTab === "templates" && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">One-Click Setup Industry Templates</h4>
                  </div>
                  <p className="text-xs text-slate-300">
                    Direct response to the "Clean Slate" database setup effort. When provisioning a new tenant, select an industry preset to seed standard master records instantly.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
                    <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-850 flex gap-2.5 items-start">
                      <span className="bg-indigo-500/10 text-indigo-400 p-1 rounded font-bold text-xs shrink-0">🏭</span>
                      <div>
                        <span className="text-white font-bold text-[11px] block">Manufacturing Preset</span>
                        <p className="text-slate-400 text-[10px] mt-0.5 font-sans leading-normal">Preloads raw materials, production warehouse racks, assembly employee codes, and depreciation ledger maps.</p>
                      </div>
                    </div>
                    <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-850 flex gap-2.5 items-start">
                      <span className="bg-indigo-500/10 text-indigo-400 p-1 rounded font-bold text-xs shrink-0">📦</span>
                      <div>
                        <span className="text-white font-bold text-[11px] block">Wholesaling & Retail Preset</span>
                        <p className="text-slate-400 text-[10px] mt-0.5 font-sans leading-normal">Preloads barcode formats, product batches, supplier categories (15-day/30-day payment term codes), and margin ledgers.</p>
                      </div>
                    </div>
                  </div>
                </div>
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
                <h3 className="text-xl font-extrabold text-white tracking-tight">Access Operational Portal</h3>
                <p className="text-xs text-slate-400 mt-1">Sign in to your designated workspace or preview the sandbox demo</p>
              </div>

              {/* Login Method Tabs */}
              <div className="flex border-b border-slate-800 p-0.5 bg-slate-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab("credentials")}
                  className={`flex-1 text-center py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "credentials" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  💻 Sign-In Portal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("demo")}
                  className={`flex-1 text-center py-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "demo" 
                      ? "bg-slate-800 text-white shadow-md border border-slate-700" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  ✨ Live Demo Sandbox
                </button>
              </div>

              {/* Login Method Tab Content */}
              {activeTab === "credentials" && (
                /* TAB 1: Credential Form */
                <form onSubmit={handleCredentialLogin} className="space-y-4">
                  
                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-3 rounded-lg text-xs flex items-start gap-2">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Portal Login Type</label>
                    <div className="relative">
                      <select
                        value={portalType}
                        onChange={(e) => setPortalType(e.target.value as "system" | "client" | "employee")}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white font-bold focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
                      >
                        <option value="system">🛡️ System Admin Login</option>
                        <option value="client">🏢 Client / Tenant Workspace Login</option>
                        <option value="employee">👥 Staff & Employee Workspace Login</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="bg-indigo-950/25 rounded-lg p-2.5 border border-indigo-900/20 text-[10px] text-slate-400 leading-relaxed font-sans">
                      {portalType === "system" ? (
                        <span><strong>System Admin Mode:</strong> Enter your authorized administrator email and security password to manage whitelabel tenant configurations and global node registers.</span>
                      ) : portalType === "client" ? (
                        <span><strong>Client Mode:</strong> Enter your designated corporate email and password assigned to your organization by the system administrator to open your isolated workspace.</span>
                      ) : (
                        <span><strong>Staff Mode:</strong> Enter your registered company email and employee password created by your Company Administrator to access your active team dashboard.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Workplace Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="e.g., mail@company.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Account Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                        className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 transition-all font-bold text-xs rounded-lg text-white shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    Authenticate credentials <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <p className="text-[10px] text-slate-500">
                      Local secure verification against registered multi-tenant records.
                    </p>
                  </div>
                </form>
              )}

              {activeTab === "demo" && (
                /* TAB 3: Direct Demo Sandbox Access */
                <div className="space-y-4">
                  <div className="bg-amber-500/5 p-3.5 rounded-lg border border-amber-500/10 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest block flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Reviewer Sandbox Database
                    </span>
                    <p className="text-xs text-slate-300 leading-normal font-sans">
                      Gain instant access to our **pre-populated** database environment containing simulated purchase orders, inventory stocks, client CRM pipelines, staff attendance records, and active finance sheets.
                    </p>
                    <div className="bg-slate-900/80 rounded-md p-2.5 font-mono text-[10px] text-slate-400 space-y-1 border border-slate-800">
                      <div>Login Email: <strong className="text-amber-300">demo@deinrim.in</strong></div>
                      <div>Login Password: <strong className="text-amber-300">demo123....</strong></div>
                      <div>Access Level: <strong className="text-slate-200">Full Read-Only Inspection</strong></div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onLogin(usersList.find(u => u.email === "demo@deinrim.in") || usersList[0])}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white transition-all font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/10"
                  >
                    ✨ Launch Demo Sandbox Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* SECTION: Subscription Pricing Plan */}
          <div className="bg-gradient-to-br from-slate-950 to-indigo-950/40 rounded-2xl p-6 border border-indigo-500/10 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 font-mono text-xs font-bold">₹</span>
              <h3 className="text-md font-bold text-slate-100">Deinrim OMS Tenant Subscription Plan</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3 text-left">
                <h4 className="text-sm font-bold text-indigo-400">Standard Whitelabel Tenant Workspace</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Ideal for small and medium enterprises needing robust inventory, finance ledgering, HR, and sales operations. 
                  Once configured, clients receive a <strong className="text-white">completely clean database (zero demo data)</strong>, 
                  allowing you to brand the web app with your custom company name, logo, contact details, and create individual staff accounts.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-semibold pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Zero Demo Data Base
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Whitelabel Brand Identity
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> 10 Custom Staff Logins
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Complete Ledger Integration
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 text-center space-y-3">
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">FLAT MONTHLY CHARGE</span>
                <div className="space-y-0.5">
                  <span className="text-3xl font-extrabold text-white font-sans">₹500 <span className="text-xs font-bold text-slate-400">INR</span></span>
                  <span className="text-xs text-slate-500 block">per tenant / month</span>
                </div>
                <div className="text-[10px] text-indigo-400 font-mono font-bold py-1 bg-indigo-500/5 rounded-md border border-indigo-500/10">
                  AUTO-SET FOR ROOT HOME PAGE
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* FULL WIDTH BOTTOM SECTION: Help Q&A & Support Hub */}
        <div className="lg:col-span-12 space-y-6 w-full mt-6">
          
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
                  className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 w-full md:w-64 font-semibold"
                />
              </div>
            </div>

            {/* Q&A Accordion Items */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
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

          {/* Quick FAQ summary box */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 flex items-start gap-3 text-left">
            <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-200">System Permission & Governance Policy</span>
              <p className="text-[11px] text-slate-400 leading-normal font-normal">
                All business actions (e.g., generating Purchase Orders, uploading files, changing tax schedules, approving leave requests, or ledgering transactions) validate user role parameters under the RBAC (Role-Based Access Control) matrix dynamically before committing to the database.
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
              DEINRIM OMS Secure ERP Framework v3.5 • Isolated high-performance relational structures with real-time replication.
            </p>
          </div>

          {/* Column 2: Regulatory Compliance */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-orange-500 uppercase tracking-wider font-mono">
              REGULATORY COMPLIANCE
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Public links and documentation confirming our data processing standards, tenant isolation parameters, and corporate operational standards:
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
              ENTERPRISE SECURITY & COMPLIANCE
            </h4>
            <ul className="space-y-2 text-slate-400 text-xs leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-slate-600 font-mono mt-0.5">•</span>
                <span><strong>Multi-Tenant Isolation:</strong> Customer company databases are isolated per unique tenant schema. No cross-tenant query execution is possible.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-600 font-mono mt-0.5">•</span>
                <span><strong>Data Sovereignty:</strong> Live transactions are encrypted using AES-256 standard and stored on highly available secure container databases backed up every 6 hours.</span>
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
                  {activeFooterModal === "privacy" && "DEINRIM OMS Privacy Policy"}
                  {activeFooterModal === "terms" && "DEINRIM OMS Terms of Service"}
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
                  Welcome to <strong>DEINRIM OMS & ERP Enterprise</strong>. We respect your privacy and are committed to protecting any business data processed by our platform. This policy outlines our standards under regulatory compliance to secure multi-tenant operational records.
                </p>
                
                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">1. Multi-Tenant Logical Partitioning</h4>
                <p>
                  Our software acts as a multi-tenant operational vault. We strictly partition customer and tenant databases by organizational identifiers (Tenant Codes), ensuring that no cross-tenant queries, index requests, or operational insights can ever leak between corporate workspaces.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">2. Staff Account & RBAC Security</h4>
                <p>
                  We store staff credentials and operational records created by your Company Administrators. Access control is strictly guarded by Role-Based Access Control (RBAC) schemas, verifying user authorization before allowing read or write execution on purchase orders, general ledgers, or employee directories.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">3. Data Security & Encryption</h4>
                <p>
                  All transactional streams, document uploads, and company profiles are processed over secure channels with industry-standard 256-bit TLS encryption. Data is stored on partitioned multi-tenant database clusters guarded by robust security protocols and backed up regularly.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">4. Contact Info</h4>
                <p>
                  For any privacy inquiries or localized regulatory complaints, contact M/s Deinrim Solutionss (P) Ltd. at Kolkata, West Bengal, India. Email: <strong>privacy@deinrim.in</strong> or phone +91 98361-30393.
                </p>
              </div>
            )}

            {/* Content for Terms */}
            {activeFooterModal === "terms" && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2">
                <p className="font-semibold text-slate-200">Last Updated: June 28, 2026</p>
                <p>
                  These Terms of Service govern your access to and use of the <strong>DEINRIM OMS & ERP</strong> platform operated by M/s Deinrim Solutionss (P) Ltd.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">1. Tenant Account Registration</h4>
                <p>
                  Tenants must register with valid corporate coordinates. All white-label reselling configurations, custom brand assets, and custom staff logins must comply with terms and must not infringe on third-party intellectual property.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">2. Operational Correctness</h4>
                <p>
                  Financial ledgers, tax schemas, and inventory records are calculated based on parameters configured by active managers. While the software provides automated calculations, tenants are ultimately responsible for checking accounting accuracy and legal tax declarations.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">3. Service Availability (SLA)</h4>
                <p>
                  DEINRIM OMS is committed to providing a 99.9% application uptime SLA. Scheduled database maintenance and system upgrades are performed during off-peak hours (GMT 20:00 to 22:00) with prior notifications.
                </p>

                <h4 className="font-bold text-indigo-400 font-mono uppercase tracking-wider text-[10px]">4. Platform Integrity</h4>
                <p>
                  DEINRIM OMS is built on secure multi-tenant cloud structures. Unauthorized access, structural reverse engineering, or scanning of the framework API endpoints is prohibited.
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
                      Need help or have questions about the DEINRIM OMS platform? Fill out this direct support ticket and our compliance desk will respond within 24 hours.
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
                        placeholder="Describe your issue with the tenant config, ledger integration, or white-labeling..."
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
                        Thank you, {supportName}. Your support ticket reference <strong>#OMS-{Math.floor(100000 + Math.random() * 900000)}</strong> is raised. Our corporate compliance desk is reviewing your request.
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
                      Request permanent deletion of your DEINRIM OMS account profile, tenant database instance, and uploaded documents.
                    </p>
                    <div className="rounded-lg border border-rose-950/40 bg-rose-950/10 p-3 text-rose-400 leading-normal flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white mb-0.5">Warning: Irreversible Operation</strong>
                        This request permanently deletes all sales invoicing, inventory records, purchase history, and employee payroll sheets. Once processed, it cannot be undone.
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Registered Corporate Email</label>
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Corporate Phone Coordinate</label>
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Reason for Database Deletion</label>
                      <textarea
                        required
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        rows={3}
                        placeholder="Please briefly describe why you are requesting full database instance and telemetry data erasure..."
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
                        I confirm that I want to schedule all my operational histories, general ledgers, and staff profiles for absolute deletion under privacy regulations.
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Schedule Instance Deletion
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                      <Trash2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Database Deletion Scheduled</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Your request for <strong>{deletionEmail}</strong> has been received. Our compliance team has scheduled your database schema for total, irreversible purge within 14 business days. Ticket: <strong>#OMS-DEL-{Math.floor(100000 + Math.random() * 900000)}</strong>.
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

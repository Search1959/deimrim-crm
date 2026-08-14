/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  ShieldAlert,
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
  Server,
  Database,
  Code,
  HeartHandshake,
  History,
  Award,
  ExternalLink,
  UserPlus,
  LogIn,
  Zap,
  LayoutDashboard,
  Wallet,
  FolderOpen,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import { User, UserRole } from "../types";

interface HomePageProps {
  onLogin: (user: User) => void;
  usersList: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export default function HomePage({ onLogin, usersList, setUsers }: HomePageProps) {
  // ── Modal state ───────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"login" | "register" | "admin-demo">("login");

  // Login tab
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Register tab
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Admin+Demo tab — admin uses same email/password fields (reuse login state)
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  // Footer modal state
  const [activeFooterModal, setActiveFooterModal] = useState<"privacy" | "terms" | "support" | "deletion" | null>(null);
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [deletionEmail, setDeletionEmail] = useState("");
  const [deletionPhone, setDeletionPhone] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionSubmitted, setDeletionSubmitted] = useState(false);

  // Help / Q&A state
  const [helpSearch, setHelpSearch] = useState("");
  const [expandedQa, setExpandedQa] = useState<number | null>(0);

  // Flow diagram state
  const [activeFlowNode, setActiveFlowNode] = useState<string>("po");

  // Trust hub tabs
  const [activeReviewTab, setActiveReviewTab] = useState<"about" | "tech" | "reseller" | "templates">("about");

  // Dashboard mockup tabs
  const [activeScreenshotTab, setActiveScreenshotTab] = useState<"admin" | "crm" | "inventory" | "hr" | "purchases">("admin");

  // Hero slideshow
  const heroSlides = [
    {
      id: "admin",
      label: "🛡️ Admin Control Room",
      accent: "sky",
      tag: "SYSTEM ADMIN",
      title: "Root Configuration & Tenant Management",
      kpis: [
        { label: "Active Tenants", val: "14", sub: "Companies", color: "text-white" },
        { label: "SSL Routing",    val: "100%", sub: "Active",  color: "text-emerald-400" },
        { label: "DB Schemas",     val: "14",   sub: "Isolated",color: "text-sky-400" },
        { label: "API Webhooks",   val: "2",    sub: "Active",  color: "text-violet-400" },
      ],
      rows: [
        ["🏢 Apex Distribution Group",  "erp.apexdist.com",        "Active"],
        ["🏥 Bengal Healthcare",         "portal.wbhealthcare.in",  "Active"],
        ["🏬 Kolkata Retail Corp",       "default.deinrim360.in",   "Pending"],
      ],
    },
    {
      id: "crm",
      label: "📈 CRM Pipeline",
      accent: "sky",
      tag: "CRM & SALES",
      title: "Lead Pipeline & Customer Revenue Tracker",
      kpis: [
        { label: "Pipeline Value",  val: "₹18.4L", sub: "Total",   color: "text-white" },
        { label: "Qualified Leads", val: "32",      sub: "Contacts",color: "text-sky-400" },
        { label: "Proposals Out",   val: "12",      sub: "Active",  color: "text-amber-400" },
        { label: "Closed-Won",      val: "15",      sub: "Deals",   color: "text-emerald-400" },
      ],
      rows: [
        ["Kolkata Medical Inc.",  "QUALIFIED", "₹4,20,000"],
        ["Bengal Steel Spares",   "PROPOSAL",  "₹2,80,000"],
        ["Starlight Edu Trust",   "PROSPECT",  "₹1,10,000"],
      ],
    },
    {
      id: "inventory",
      label: "📦 Inventory Ledger",
      accent: "sky",
      tag: "INVENTORY",
      title: "Batch Stocks, Rack Codes & FIFO Depletion",
      kpis: [
        { label: "Warehouses",   val: "4",       sub: "Yards",   color: "text-white" },
        { label: "Product SKUs", val: "140",     sub: "Items",   color: "text-sky-400" },
        { label: "Low Stock",    val: "2",       sub: "Alerts",  color: "text-red-400" },
        { label: "Batch Value",  val: "₹8.2L",  sub: "On Hand", color: "text-emerald-400" },
      ],
      rows: [
        ["Industrial Steel Coils",  "#ST-2026-09A  Rack A-2", "420 Units  ✅"],
        ["Copper Tubes 15mm",       "#CU-2026-11C  Rack B-12","12 Units   ⚠️"],
        ["High Tensile Bolts (100)","#BT-2026-04B  Rack D-4", "1,500 Pks ✅"],
      ],
    },
    {
      id: "hr",
      label: "👥 HR Workspace",
      accent: "sky",
      tag: "HR & ATTENDANCE",
      title: "Staff Rostering, Clock-In & Leave Approvals",
      kpis: [
        { label: "Total Staff",   val: "48",  sub: "Employees", color: "text-white" },
        { label: "Present Today", val: "92%", sub: "Clocked-In",color: "text-emerald-400" },
        { label: "On Leave",      val: "3",   sub: "Approved",  color: "text-sky-400" },
        { label: "Open Positions",val: "2",   sub: "Pending",   color: "text-amber-400" },
      ],
      rows: [
        ["Amit Sen (ID #002)",     "HR Administrator",   "CLOCKED IN 09:12"],
        ["Priyanka Roy (ID #014)", "Procurement Lead",   "CLOCKED IN 09:40"],
        ["Rahul Das (ID #005)",    "Sales Executive",    "ANNUAL LEAVE 2D"],
      ],
    },
    {
      id: "finance",
      label: "💰 Finance Ledger",
      accent: "sky",
      tag: "FINANCE & P&L",
      title: "Live Profit & Loss, AP/AR & Cash Flow",
      kpis: [
        { label: "Gross Revenue",  val: "₹24.6L", sub: "This Month", color: "text-emerald-400" },
        { label: "COGS",           val: "₹14.2L", sub: "Auto-posted", color: "text-red-400" },
        { label: "Net Profit",     val: "₹10.4L", sub: "Live",        color: "text-white" },
        { label: "Pending AP",     val: "₹3.8L",  sub: "Payable",     color: "text-amber-400" },
      ],
      rows: [
        ["Sales Invoice #INV-2026-047", "Revenue",    "+₹1,40,000"],
        ["GRN #GRN-2026-038",           "COGS",       "-₹82,000"],
        ["Payroll – July 2026",         "Operating",  "-₹3,20,000"],
      ],
    },
  ];
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroAnim, setHeroAnim] = useState(true);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToSlide = (idx: number) => {
    setHeroAnim(false);
    setTimeout(() => { setHeroSlide(idx); setHeroAnim(true); }, 150);
  };

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setHeroSlide(prev => {
        const next = (prev + 1) % heroSlides.length;
        setHeroAnim(false);
        setTimeout(() => setHeroAnim(true), 150);
        return next;
      });
    }, 3500);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, []);

  const openModal = (tab: "login" | "register" | "admin-demo" = "login") => {
    setModalTab(tab);
    setShowModal(true);
    setLoginError("");
    setRegError("");
    setAdminError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEmail(""); setPassword(""); setLoginError("");
    setRegCompany(""); setRegEmail(""); setRegPassword(""); setRegConfirm(""); setRegError("");
    setAdminEmail(""); setAdminPass(""); setAdminError("");
  };

  const closeFooterModal = () => {
    setActiveFooterModal(null);
    setSupportSubmitted(false); setSupportName(""); setSupportEmail(""); setSupportMessage("");
    setDeletionSubmitted(false); setDeletionEmail(""); setDeletionPhone(""); setDeletionReason("");
  };

  // ── Login handler ─────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent, overrideEmail?: string, overridePass?: string) => {
    e.preventDefault();
    const cleanEmail = (overrideEmail ?? email).trim().toLowerCase();
    const usePass = overridePass ?? password;
    setLoginError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: usePass }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); closeModal(); return; }
      if (res.status === 401) { setLoginError("Invalid email or password."); return; }
    } catch { /* fall through */ }

    // Fallback — built-in admin
    if (cleanEmail === "apex7tech@gmail.com" && (usePass === "Search@1959" || usePass === "Search@1959...")) {
      const found = usersList.find(u => u.email.toLowerCase() === "apex7tech@gmail.com") ?? {
        id: "u-apex", name: "Apex Tech Admin", email: "apex7tech@gmail.com",
        role: UserRole.SYSTEM_ADMIN, companyId: "comp-1", branchId: "br-hq",
        departmentId: "dept-it", status: "active" as const, password: "Search@1959",
      };
      onLogin(found); closeModal(); return;
    }

    // Other users
    const matchedUsers = usersList.filter(u => u.email.toLowerCase() === cleanEmail);
    if (matchedUsers.length > 0) {
      const exactMatch = matchedUsers.find(u => u.password && u.password === usePass);
      if (exactMatch) { onLogin(exactMatch); closeModal(); return; }
      if (usePass === "deinrim123" || usePass === "password" || usePass === "") {
        const stdMatch = matchedUsers.find(u => !u.password);
        if (stdMatch) { onLogin(stdMatch); closeModal(); return; }
      }
      setLoginError("Incorrect password for this account.");
      return;
    }
    setLoginError("Email not found in system database.");
  };

  // ── Admin login handler (Admin+Demo tab) ──────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    const clean = adminEmail.trim().toLowerCase();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, password: adminPass }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); closeModal(); return; }
      if (res.status === 401) { setAdminError("Invalid credentials."); return; }
    } catch { /* fall through */ }

    if (clean === "apex7tech@gmail.com" && (adminPass === "Search@1959" || adminPass === "Search@1959...")) {
      const found = usersList.find(u => u.email.toLowerCase() === "apex7tech@gmail.com") ?? {
        id: "u-apex", name: "Apex Tech Admin", email: "apex7tech@gmail.com",
        role: UserRole.SYSTEM_ADMIN, companyId: "comp-1", branchId: "br-hq",
        status: "active" as const, password: "Search@1959",
      };
      onLogin(found); closeModal(); return;
    }
    setAdminError("Admin credentials not recognised.");
  };

  // ── Demo quick-login ──────────────────────────────────────────────────────
  const handleDemoLogin = async (type: "admin" | "sales" | "readonly") => {
    const demoMap: Record<string, Partial<User>> = {
      admin:    { id: "u-demo-admin",  name: "Demo Company Admin",   email: "demo@deinrim.in",       role: UserRole.COMPANY_ADMIN,  companyId: "comp-1", branchId: "br-hq", status: "active" },
      sales:    { id: "u-demo-sales",  name: "Demo Sales Manager",   email: "demo.sales@deinrim.in", role: UserRole.SALES_MANAGER,  companyId: "comp-1", branchId: "br-hq", status: "active" },
      readonly: { id: "u-demo-ro",     name: "Demo Read-Only User",  email: "demo@deinrim.in",       role: UserRole.READ_ONLY,      companyId: "comp-1", branchId: "br-hq", status: "active" },
    };
    // Try server first
    try {
      const creds = type === "admin"
        ? { email: "demo@deinrim.in", password: "demo123...." }
        : type === "sales"
        ? { email: "demo.sales@deinrim.in", password: "demo123...." }
        : { email: "demo@deinrim.in", password: "demo123...." };
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); closeModal(); return; }
    } catch { /* fall through */ }
    // Fallback
    onLogin(demoMap[type] as User);
    closeModal();
  };

  // ── Register handler ──────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (regPassword !== regConfirm) { setRegError("Passwords do not match."); return; }
    if (regPassword.length < 6) { setRegError("Password must be at least 6 characters."); return; }
    setRegLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: regCompany.trim(), email: regEmail.trim().toLowerCase(), password: regPassword }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); closeModal(); return; }
      setRegError(data.error || "Registration failed. Please try again.");
    } catch {
      setRegError("Network error. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  // ── Q&A data ──────────────────────────────────────────────────────────────
  const qas = [
    { q: "What is DEINRIM 360?", a: "**DEINRIM 360** is a modern, multi-tenant Workspace & Office Management System designed to serve as a **Complete Business Operating System** for your entire organization. Instead of juggling fragmented systems, DEINRIM 360 centralizes CRM, Inventory, Procurement, HR, Office operations, Documents, and Executive Analytics under one unified, secure platform." },
    { q: "Can it work for multiple branches?", a: "Yes! **DEINRIM 360** is natively designed for **multi-branch, multi-tenant, and multi-location businesses**. Administrators can map distinct branch structures, assign branch-specific staff, and query isolated transaction tables while retaining high-level executive consolidation." },
    { q: "Can I customize modules?", a: "Absolutely. You can toggle specific operational modules, adjust permissions via the **Role-Based Access Control (RBAC) matrix**, configure brand assets, and whitelabel the client portals with your own company name, logo, and contact details." },
    { q: "Is cloud hosting available?", a: "Yes. The standard tier is **secure, fully-managed, high-speed Cloud hosting** with a 99.9% uptime SLA. Data is partitioned per tenant, encrypted with AES-256 standard, and backed up with automated database snapshots every 6 hours." },
    { q: "Is on-premise deployment available?", a: "Yes, for larger corporations with rigorous local compliance requirements, **M/s Deinrim Solutionss (P) Ltd.** offers on-premise deployments or dedicated private cloud setups with specialized SLA agreements." },
    { q: "How does the 'Enter Once' inventory-to-finance automation work?", a: "Every transaction propagates automatically through the ledger. When a Purchase Order (PO) receives stock via a Goods Receipt Note (GRN), the system automatically increases physical batch levels, registers a stock movement log, and submits an operational COGS expense to the Finance module without manual re-entry." },
    { q: "What happens to ledgers when a Sales Invoice is generated?", a: "When you issue an invoice in Sales & CRM, the system does three things simultaneously: (1) auto-depletes product stocks in FIFO order, (2) adds a tax invoice entry to Customer receivables, and (3) posts an INCOME transaction to the Finance profit/loss database." },
  ];

  // ── Flow diagram data ─────────────────────────────────────────────────────
  const flowNodeDetails: Record<string, { title: string; trigger: string; databaseEffect: string; nextStep: string; icon: any }> = {
    po: { title: "1. Purchase Department (PO Creation)", trigger: "A Purchase Manager creates a Purchase Order specifying supplier credit days, product specifications, and estimated unit rates.", databaseEffect: "Inserts a PO record in Draft / Sent state. No physical stock or finance logs are modified yet.", nextStep: "Triggers warehouse alert for incoming delivery matching the PO number.", icon: ShoppingBag },
    grn: { title: "2. Warehouse Goods Receipt (GRN)", trigger: "Warehouse staff issues a Goods Receipt Note (GRN) upon physical delivery. Batch numbers, rack locations, and expiry dates are registered.", databaseEffect: "Updates physical batch inventory quantities, writes a Stock Movement log (IN-PURCHASE), and triggers a GRN-expense entry.", nextStep: "Feeds ledger liabilities directly into the Accounts Payable system.", icon: Package },
    invoice: { title: "3. Sales Billing & Invoicing", trigger: "Sales representative registers a lead, upgrades them to a customer, and issues a standard tax invoice containing product lines.", databaseEffect: "Queries warehouse stocks to auto-deplete quantities (FIFO), increments customer's outstanding balance, and logs a Finance income.", nextStep: "Updates real-time margin calculations on the executive dashboard.", icon: TrendingUp },
    hr: { title: "4. Attendance & HR Resource Allocation", trigger: "Employees register attendance statuses, and managers approve leave requests.", databaseEffect: "Maintains corporate resource levels and updates operational employee rosters in real time.", nextStep: "Syncs monthly resource cost structures for administrative reference.", icon: Users },
    finance: { title: "5. Finance Ledger (Balance Sheets)", trigger: "Consolidates automatic streams from Goods receipts (COGS) and Sales invoices (Revenue). Handles custom ledger postings for utilities or payroll.", databaseEffect: "Updates the General Ledger. Live recalculation of Profit & Loss, Assets valuation, and cash flows.", nextStep: "Generates board-level financial reports and tax logs dynamically.", icon: DollarSign },
  };

  const filteredQas = qas.filter(item => item.q.toLowerCase().includes(helpSearch.toLowerCase()) || item.a.toLowerCase().includes(helpSearch.toLowerCase()));
  const CurrentFlowIcon = flowNodeDetails[activeFlowNode]?.icon || Workflow;

  // ── Sky-blue input / button class helpers ─────────────────────────────────
  const inputCls = "w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/20 font-mono";
  const btnSky = "w-full py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer font-mono tracking-wider uppercase transition-all shadow-lg shadow-sky-500/20";

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-slate-100 flex flex-col overflow-x-hidden font-sans">

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-sm px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-md shadow-sky-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wider uppercase leading-none font-mono">DEINRIM OMS</h1>
            <span className="text-[9px] text-sky-400 uppercase tracking-widest font-mono">Enterprise v2.0</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-semibold">
          <a href="#modules" className="hover:text-sky-400 transition-colors">Modules</a>
          <a href="#industries" className="hover:text-sky-400 transition-colors">Industries</a>
          <a href="#pricing" className="hover:text-sky-400 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-sky-400 transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => openModal("login")} className="px-4 py-2 border border-slate-700 hover:border-sky-500/40 text-slate-300 hover:text-sky-400 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5">
            <LogIn className="h-3.5 w-3.5" /> Login
          </button>
          <button onClick={() => openModal("register")} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/20">
            <UserPlus className="h-3.5 w-3.5" /> Create Account
          </button>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">

          {/* LEFT — copy */}
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono tracking-wide uppercase">
              <Sparkles className="h-3 w-3" /> Enterprise Business Operating System
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              One Platform to Run<br />
              <span className="text-sky-400">Your Entire Organization</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
              CRM · Inventory · Purchase · HR · Finance · GST — all linked under one secure, multi-tenant workspace. Built and supported from Kolkata by M/s Deinrim Solutionss (P) Ltd.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => openModal("register")} className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer">
                <UserPlus className="h-3.5 w-3.5" /> Create Free Account
              </button>
              <button onClick={() => openModal("admin-demo")} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                <Zap className="h-3.5 w-3.5 text-sky-400" /> Try Live Demo
              </button>
              <a href="https://wa.me/919836130393?text=I'm%20interested%20in%20a%20DEINRIM%20360%20demo" target="_blank" rel="noreferrer" className="px-6 py-3 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5">
                💬 WhatsApp <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[10px] font-mono text-slate-500 font-bold uppercase">
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" /> SSL Secure</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-sky-500" /> Cloud Hosted</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-violet-400" /> Mobile Ready</span>
              <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-amber-400" /> Zero Demo Data</span>
            </div>
          </div>

          {/* RIGHT — dashboard slideshow */}
          <div className="relative">
            {/* glow behind card */}
            <div className="absolute -inset-4 bg-sky-500/5 rounded-3xl blur-2xl pointer-events-none" />

            {/* slide card */}
            <div
              className="relative rounded-2xl border border-slate-700/80 bg-[#0d1829] overflow-hidden shadow-2xl shadow-sky-900/20"
              style={{ transition: "opacity 0.15s ease", opacity: heroAnim ? 1 : 0 }}
            >
              {/* top bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70"></span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70"></span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 tracking-widest uppercase">deinrim360.in</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">LIVE</span>
              </div>

              {/* module label strip */}
              <div className="flex gap-1 px-3 py-2 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto">
                {heroSlides.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { if (slideTimer.current) clearInterval(slideTimer.current); goToSlide(i); }}
                    className={`shrink-0 px-2.5 py-1 rounded text-[9px] font-bold font-mono transition-all cursor-pointer ${i === heroSlide ? "bg-sky-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* slide body */}
              <div className="p-4 space-y-3 min-h-[280px]">
                {/* header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-sky-400 font-mono font-bold tracking-widest uppercase">{heroSlides[heroSlide].tag}</span>
                    <h4 className="text-sm font-extrabold text-white mt-0.5 leading-tight">{heroSlides[heroSlide].title}</h4>
                  </div>
                  <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-mono font-bold shrink-0">MODULE ACTIVE</span>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-4 gap-2">
                  {heroSlides[heroSlide].kpis.map((kpi, i) => (
                    <div key={i} className="bg-slate-900/70 rounded-lg p-2 border border-slate-800/60 text-center">
                      <div className={`text-base font-black ${kpi.color} leading-none`}>{kpi.val}</div>
                      <div className="text-[8px] text-slate-500 font-mono mt-0.5 leading-tight">{kpi.label}</div>
                      <div className="text-[8px] text-slate-600 font-mono">{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                {/* data rows */}
                <div className="space-y-1.5">
                  <div className="text-[8px] text-slate-600 font-mono font-bold uppercase tracking-wider">Recent Entries</div>
                  {heroSlides[heroSlide].rows.map((row, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800/50">
                      <span className="text-[10px] font-bold text-slate-200 truncate max-w-[45%]">{row[0]}</span>
                      <span className="text-[9px] text-slate-500 font-mono truncate mx-1">{row[1]}</span>
                      <span className="text-[9px] text-sky-400 font-mono font-bold shrink-0">{row[2]}</span>
                    </div>
                  ))}
                </div>

                {/* progress bar + slide counter */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex gap-1">
                    {heroSlides.map((_, i) => (
                      <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i === heroSlide ? "bg-sky-500" : "bg-slate-800"}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] text-slate-600 font-mono">Auto-cycling dashboard views</span>
                    <span className="text-[8px] text-slate-600 font-mono">{heroSlide + 1} / {heroSlides.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* floating badge bottom-right */}
            <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 shadow-xl flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-mono font-bold text-slate-300">Live on deinrim360.in</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULES GRID ──────────────────────────────────────────────────── */}
      <section id="modules" className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 font-mono">Unified Features</span>
          <h3 className="text-2xl font-extrabold text-white">9 Production-Ready Modules</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">All fully linked — one entry propagates across inventory, finance, CRM and HR automatically.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: TrendingUp,     name: "CRM & Lead Pipeline",     desc: "Register customers, organize lead scoring stages (Prospect → Proposal → Won), and capture lifetime value." },
            { icon: Package,        name: "Inventory Management",    desc: "Control stocks with batch numbering, rack codes, automated FIFO depletion, and low-level reorder alerts." },
            { icon: ShoppingBag,    name: "Procurement & Purchases", desc: "Generate POs, record supplier credit terms, and process incoming warehouse Goods Receipt Notes (GRN)." },
            { icon: Users,          name: "HR & Employee Rosters",   desc: "Log employee profiles, record clock-in/out times, and review leaves with manager approval signatures." },
            { icon: Wallet,         name: "Finance & Accounting",    desc: "Live P&L, cash flow, accounts payable/receivable — all auto-updated from sales and purchase events." },
            { icon: FileSpreadsheet,name: "GST & Tax Filing",        desc: "Generate GSTR-1, GSTR-3B, and e-invoice data. AI-assisted tax reconciliation built in." },
            { icon: FolderOpen,     name: "Document Management",     desc: "Store and link documents to transactions, customer profiles, or supplier PO registers." },
            { icon: Settings,       name: "Admin & RBAC",            desc: "Role-Based Access Control (System Admin, Company Admin, Managers, Employees, Read-Only)." },
            { icon: LayoutDashboard,name: "Executive Dashboard",     desc: "Real-time KPIs, revenue charts, stock alerts, and activity feeds for decision-makers." },
          ].map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div key={idx} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-sky-500/30 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 h-1 w-16 bg-gradient-to-r from-sky-500 to-blue-500"></div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20">
                    <Icon className="h-4 w-4 text-sky-400" />
                  </div>
                  <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wide font-mono">{mod.name}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{mod.desc}</p>
                <span className="mt-2 inline-block text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold font-mono">Active</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FLOW DIAGRAM ──────────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-sky-400" />
              <h3 className="text-md font-bold text-slate-100">Interactive Working Method Flow</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full uppercase">Click nodes to trace</span>
          </div>
          <div className="relative py-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0 hidden sm:block"></div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 relative z-10">
              {Object.entries(flowNodeDetails).map(([key, node]) => {
                const Icon = node.icon;
                const isActive = activeFlowNode === key;
                return (
                  <button key={key} onClick={() => setActiveFlowNode(key)}
                    className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                      isActive ? "bg-sky-600/20 border-sky-500 text-white shadow-lg shadow-sky-500/10" : "bg-slate-900 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    } ${key === "finance" ? "col-span-2 sm:col-span-1" : ""}`}
                  >
                    <div className={`p-2 rounded-lg mb-2 ${isActive ? "bg-sky-500 text-white" : "bg-slate-800"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold font-mono">{node.title.split(".")[0]}. {node.title.split(".")[1]?.split("(")[0]?.trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {activeFlowNode && (
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                  <CurrentFlowIcon className="h-6 w-6" />
                </div>
                <div className="space-y-3 flex-1 text-sm">
                  <h4 className="text-base font-bold text-white">{flowNodeDetails[activeFlowNode].title}</h4>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Operational Trigger</span>
                    <p className="text-slate-300 mt-0.5 text-xs">{flowNodeDetails[activeFlowNode].trigger}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block font-mono">Database Effect</span>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{flowNodeDetails[activeFlowNode].databaseEffect}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400 block font-mono">Automated Next Step</span>
                      <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{flowNodeDetails[activeFlowNode].nextStep}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── INDUSTRIES ────────────────────────────────────────────────────── */}
      <section id="industries" className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16 space-y-6">
        <div className="text-center space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 font-mono">Target Sectors</span>
          <h3 className="text-2xl font-extrabold text-white">Designed for Versatile Organizations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "🏢 Corporate Offices",       desc: "Centralize employee attendance, track organizational logs, manage permissions, and store documents securely." },
            { title: "📦 SMEs & Wholesalers",      desc: "LIFO/FIFO batch tracking, purchase orders, real-time sales pipeline, and inventory reorder automation." },
            { title: "🏥 Healthcare & Hospitals",  desc: "Staff rosters, warehouse medicine expiry tracking, and isolated data partitions for branch clinics." },
            { title: "🎓 Educational Institutions",desc: "Administrative files, equipment procurement, educational asset logs, and staff accounts under RBAC." },
            { title: "💻 Coworking Spaces",        desc: "Multi-tenant logins, resource allocation, monthly subscription tracking, and corporate desk occupancy." },
            { title: "🏭 Manufacturing Plants",    desc: "Raw material mapping, batch codes, GRN processing, and equipment maintenance scheduling." },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/40 p-5 rounded-2xl border border-slate-800 hover:border-sky-500/20 transition-all space-y-2">
              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST HUB ─────────────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
          <div className="space-y-1 text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 font-mono">Platform Trust</span>
            <h3 className="text-xl font-extrabold text-white">Enterprise Transparency Hub</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            {([
              { id: "about",     icon: HeartHandshake, label: "Company & Trust" },
              { id: "tech",      icon: Server,         label: "Tech Specs" },
              { id: "reseller",  icon: Award,          label: "Agency Resell" },
              { id: "templates", icon: CheckCircle2,   label: "Setup Presets" },
            ] as const).map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveReviewTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeReviewTab === tab.id ? "bg-sky-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/80 text-sm">
            {activeReviewTab === "about" && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60"><History className="h-4 w-4 text-sky-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-white">Corporate Heritage & High-Touch Support</h4></div>
                <p className="text-xs text-slate-300">Operated by <strong className="text-white">M/s Deinrim Solutionss (P) Ltd.</strong>, incorporated in Kolkata, WB, India. Engineering custom SaaS enterprise software since 2018, scaling from a regional consultancy to managing high-performance multi-tenant platforms.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-sky-400 uppercase tracking-widest font-bold">Priority Support SLA</span><p className="text-slate-300 mt-1 font-sans">2-hour response time for critical issues. Standard tickets resolved within 12-24 hours via dedicated email and callback.</p></div>
                  <div className="bg-slate-950/45 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-orange-400 uppercase tracking-widest font-bold">Active Customer Retention</span><p className="text-slate-300 mt-1 font-sans">Serving 140+ active business tenants in South Asia with zero telemetry loss incidents since inception.</p></div>
                </div>
              </div>
            )}
            {activeReviewTab === "tech" && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60"><Code className="h-4 w-4 text-sky-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-white">Technical Specifications & Data Sovereignty</h4></div>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {[
                    { label: "DATABASE LAYER",        text: "Strictly partitioned schemas on high-performance relational MySQL, preventing cross-tenant leakage." },
                    { label: "DATA EXPORTS & APIS",   text: "1-click JSON and CSV table extracts on all modules. REST endpoints for external CRM connections." },
                    { label: "SECURITY ENCRYPTION",   text: "256-Bit SSL/TLS in-transit encryption and AES-256 rest encryption on cloud storage blocks." },
                    { label: "DISASTER BACKUP",       text: "Automated snapshots every 6 hours, replicated across redundant physical availability zones." },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1"><span className="text-[10px] font-mono text-sky-400 block font-bold">{item.label}</span><p className="text-slate-300 text-xs">{item.text}</p></div>
                  ))}
                </div>
              </div>
            )}
            {activeReviewTab === "reseller" && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60"><Building2 className="h-4 w-4 text-sky-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-white">White-Label Partner Program</h4></div>
                <p className="text-xs text-slate-300">Create a recurring high-margin SaaS revenue channel. We charge you a wholesale flat rate, letting you keep 100% of the customer margins.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  {[
                    { label: "1. Brand Customization", text: "Upload your custom logo, configure brand hex colors, set support emails, and configure footer text." },
                    { label: "2. Custom Domain Mapping", text: "Point your domain (e.g., erp.yourbrand.com) via standard CNAME records mapped instantly." },
                    { label: "3. Custom Pricing Margin", text: "You pay wholesale ₹500/tenant/month. Bill your customers ₹2,000–₹5,000 per month." },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-left space-y-1">
                      <span className="text-sky-400 font-bold text-xs">{item.label}</span>
                      <p className="text-[10px] text-slate-400 leading-normal">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeReviewTab === "templates" && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60"><CheckCircle2 className="h-4 w-4 text-sky-400" /><h4 className="text-xs font-bold uppercase tracking-wider text-white">One-Click Setup Industry Templates</h4></div>
                <p className="text-xs text-slate-300">When provisioning a new tenant, select an industry preset to seed standard master records instantly — zero manual configuration.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
                  {[
                    { emoji: "🏭", name: "Manufacturing Preset", text: "Preloads raw materials, production racks, assembly employee codes, and depreciation ledger maps." },
                    { emoji: "📦", name: "Wholesaling & Retail Preset", text: "Preloads barcode formats, product batches, supplier categories, and margin ledgers." },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-950/45 p-3 rounded-lg border border-slate-800 flex gap-2.5 items-start">
                      <span className="bg-sky-500/10 text-sky-400 p-1 rounded font-bold text-xs shrink-0">{item.emoji}</span>
                      <div><span className="text-white font-bold text-[11px] block">{item.name}</span><p className="text-slate-400 text-[10px] mt-0.5 font-sans leading-normal">{item.text}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD MOCKUPS ─────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-slate-900/80 rounded-2xl p-6 md:p-8 border border-sky-500/10 shadow-2xl space-y-6 text-left">
          <div className="space-y-2 text-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider">Interactive UI Previews</span>
            <h3 className="text-xl font-extrabold text-white">Inspect Our Multi-Tenant Workspace</h3>
            <p className="text-xs text-slate-400">Click tabs to switch between department portals and trace operations.</p>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            {[
              { id: "admin", label: "🛡️ Admin Control Room" },
              { id: "crm", label: "📈 CRM Sales Pipeline" },
              { id: "inventory", label: "📦 Inventory Ledger" },
              { id: "hr", label: "👥 HR Workspace" },
              { id: "purchases", label: "🛍️ Procurement (PO)" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveScreenshotTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeScreenshotTab === tab.id ? "bg-sky-600 text-white shadow-md" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800/80 min-h-[280px]">
            {activeScreenshotTab === "admin" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                  <div><span className="text-[10px] text-sky-400 font-mono font-bold">SYSTEM ADMIN PORTAL</span><h4 className="text-sm font-extrabold text-white">Root Configuration & Tenant Management</h4></div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded font-mono font-bold">LIVE</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[["Active Tenants","14 Companies","text-white"],["Isolated Schemas","14 Partitioned","text-sky-400"],["SSL Routing","100% Active","text-emerald-400"],["API Webhooks","2 Active","text-violet-400"]].map(([label,val,cls],i)=>(
                    <div key={i} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{label}</span><p className={`text-lg font-black mt-0.5 ${cls}`}>{val}</p></div>
                  ))}
                </div>
                <div className="space-y-2"><span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Registered Tenant Instances</span>
                  {[["🏢 Apex Distribution Group","erp.apexdist.com (Active)"],["🏥 West Bengal Healthcare","portal.wbhealthcare.in (Active)"],["🏬 Kolkata Retail Corp","default.deinrim360.in"]].map(([name,cname],i)=>(
                    <div key={i} className="bg-slate-950/30 p-2 rounded-lg border border-slate-800 flex justify-between items-center text-xs"><span className="font-bold text-slate-200">{name}</span><span className="text-sky-400 font-mono text-[10px]">{cname}</span></div>
                  ))}
                </div>
              </div>
            )}
            {activeScreenshotTab === "crm" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60"><div><span className="text-[10px] text-sky-400 font-mono font-bold">CRM & SALES MODULE</span><h4 className="text-sm font-extrabold text-white">Pipeline Stage and Lead Tracker</h4></div><span className="text-[10px] bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded font-mono font-bold">REVENUE ENGINE</span></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[["Pipeline Value","₹18,40,000","text-white"],["Qualified Contacts","32 Contacts","text-sky-400"],["Proposals Out","12 Active","text-orange-400"],["Closed-Won","15 Deals","text-emerald-400"]].map(([label,val,cls],i)=>(
                    <div key={i} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{label}</span><p className={`text-lg font-black mt-0.5 ${cls}`}>{val}</p></div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[["PROSPECT (8)","text-slate-400","Kolkata Medical Inc."],["QUALIFIED (6)","text-sky-400","Bengal Steel Spares"],["PROPOSAL (4)","text-amber-400","Starlight Edu"],["WON (15)","text-emerald-400","Apex Logistics"]].map(([stage,cls,company],i)=>(
                    <div key={i} className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-left space-y-1"><span className={`text-[9px] font-bold ${cls} font-mono block`}>{stage}</span><div className="bg-slate-900 p-1.5 rounded text-[10px] border border-slate-800 text-slate-200">{company}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeScreenshotTab === "inventory" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60"><div><span className="text-[10px] text-sky-400 font-mono font-bold">INVENTORY MANAGEMENT</span><h4 className="text-sm font-extrabold text-white">Stock Levels, Batch Codes & Rack Assignments</h4></div><span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded font-mono font-bold">FIFO COMPLIANT</span></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[["Warehouses","4 Yards","text-white"],["Product SKUs","140 SKUs","text-sky-400"],["Low Stock","2 Warnings","text-red-400"],["Batch Value","₹8,20,400","text-emerald-400"]].map(([label,val,cls],i)=>(
                    <div key={i} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{label}</span><p className={`text-lg font-black mt-0.5 ${cls}`}>{val}</p></div>
                  ))}
                </div>
                <div className="overflow-x-auto"><table className="w-full text-left font-mono border-collapse text-xs"><thead><tr className="border-b border-slate-800 text-[10px] text-slate-500"><th className="py-1">PRODUCT / SKU</th><th className="py-1">BATCH NO</th><th className="py-1">RACK</th><th className="py-1">STOCK</th><th className="py-1 text-right">STATUS</th></tr></thead><tbody className="divide-y divide-slate-800/40">
                  <tr><td className="py-1.5 text-slate-200 font-sans font-bold">Industrial Steel Coils</td><td className="py-1.5 text-slate-400">#ST-2026-09A</td><td className="py-1.5 text-slate-400">Rack A-2</td><td className="py-1.5 text-slate-200">420 Units</td><td className="py-1.5 text-right text-emerald-400">In Stock</td></tr>
                  <tr><td className="py-1.5 text-slate-200 font-sans font-bold">Copper Tubes 15mm</td><td className="py-1.5 text-slate-400">#CU-2026-11C</td><td className="py-1.5 text-slate-400">Rack B-12</td><td className="py-1.5 text-slate-200">12 Units</td><td className="py-1.5 text-right text-rose-400">Low Stock</td></tr>
                  <tr><td className="py-1.5 text-slate-200 font-sans font-bold">High Tensile Bolts (100)</td><td className="py-1.5 text-slate-400">#BT-2026-04B</td><td className="py-1.5 text-slate-400">Rack D-4</td><td className="py-1.5 text-slate-200">1,500 Packs</td><td className="py-1.5 text-right text-emerald-400">In Stock</td></tr>
                </tbody></table></div>
              </div>
            )}
            {activeScreenshotTab === "hr" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60"><div><span className="text-[10px] text-sky-400 font-mono font-bold">HR & EMPLOYEE MANAGEMENT</span><h4 className="text-sm font-extrabold text-white">Staff Rostering, Clock-in & Leave Approvals</h4></div><span className="text-[10px] bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded font-mono font-bold">ACTIVE</span></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[["Total Staff","48 Employees","text-white"],["Clocked-In Today","92% Present","text-emerald-400"],["Leaves Approved","3 Approved","text-sky-400"],["Roster Status","Active","text-violet-400"]].map(([label,val,cls],i)=>(
                    <div key={i} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{label}</span><p className={`text-lg font-black mt-0.5 ${cls}`}>{val}</p></div>
                  ))}
                </div>
                <div className="space-y-1.5 text-xs">
                  {[["Amit Sen (ID #002)","HR Administrator","CLOCKED IN (09:12 AM)","emerald"],["Priyanka Roy (ID #014)","Procurement Lead","CLOCKED IN (09:40 AM)","sky"],["Rahul Das (ID #005)","Sales Executive","LEAVE: Annual (2 Days)","amber"]].map(([name,role,status,color],i)=>(
                    <div key={i} className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full bg-${color}-500`}></span><span className="font-bold text-slate-200">{name}</span><span className="text-slate-500 font-mono text-[10px]">{role}</span></div>
                      <span className={`text-${color}-400 font-bold text-[10px]`}>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeScreenshotTab === "purchases" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60"><div><span className="text-[10px] text-sky-400 font-mono font-bold">PROCUREMENT & PURCHASES</span><h4 className="text-sm font-extrabold text-white">Purchase Orders & Supplier Terms</h4></div><span className="text-[10px] bg-violet-500/10 text-violet-400 px-2.5 py-0.5 rounded font-mono font-bold">COMPLIANCE SECURE</span></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[["Requisitions","6 Pending","text-white"],["Supplier Terms","30-Day Credit","text-sky-400"],["Pending Receipts","2 Orders","text-orange-400"],["Auth Limits","₹5,00,000","text-emerald-400"]].map(([label,val,cls],i)=>(
                    <div key={i} className="bg-slate-950/40 p-3 rounded-lg border border-slate-800"><span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{label}</span><p className={`text-lg font-black mt-0.5 ${cls}`}>{val}</p></div>
                  ))}
                </div>
                <div className="overflow-x-auto"><table className="w-full text-left font-mono border-collapse text-xs"><thead><tr className="border-b border-slate-800 text-[10px] text-slate-500"><th className="py-1">PO CODE</th><th className="py-1">SUPPLIER</th><th className="py-1">VALUE</th><th className="py-1">PAYMENT</th><th className="py-1 text-right">STATUS</th></tr></thead><tbody className="divide-y divide-slate-800/40">
                  <tr><td className="py-1.5 text-sky-400 font-bold">#PO-2026-004</td><td className="py-1.5 text-slate-200">Bengal Steel Spares</td><td className="py-1.5 text-slate-200">₹1,40,000</td><td className="py-1.5 text-slate-400">30-Day Net</td><td className="py-1.5 text-right text-emerald-400 font-bold">Approved</td></tr>
                  <tr><td className="py-1.5 text-sky-400 font-bold">#PO-2026-005</td><td className="py-1.5 text-slate-200">Kolkata Packing Yards</td><td className="py-1.5 text-slate-200">₹45,000</td><td className="py-1.5 text-slate-400">15-Day Net</td><td className="py-1.5 text-right text-amber-400 font-bold">Sent</td></tr>
                </tbody></table></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-sky-500/10 shadow-xl space-y-5 text-center">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 font-mono">Tenant Pricing</span>
            <h3 className="text-xl font-bold text-white">Deinrim OMS Subscription</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">Each registered tenant gets a completely clean database — zero demo data — branded with your company name, logo, and contact details.</p>
          </div>
          <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800 inline-block text-center space-y-3 min-w-[200px]">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">Flat Monthly Charge</span>
            <div><span className="text-4xl font-extrabold text-white">₹500</span><span className="text-xs text-slate-400 ml-1">INR</span></div>
            <span className="text-xs text-slate-500 block">per tenant / month</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 max-w-2xl mx-auto">
            {["Zero Demo Data","Whitelabel Identity","10 Staff Logins","Full Ledger Integration"].map((f,i)=>(
              <div key={i} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />{f}</div>
            ))}
          </div>
          <button onClick={() => openModal("register")} className="px-8 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/20">
            Create Your Account Now →
          </button>
        </div>
      </section>

      {/* ── WHY + ROADMAP ─────────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-1"><span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 font-mono">Engineering Trust</span><h3 className="text-xl font-extrabold text-white">Why Companies Choose DEINRIM 360</h3></div>
            <div className="space-y-4">
              {[
                { title: "⚡ Reduce Manual Effort & Double Entry", desc: "Inventory movements trigger procurement and CRM entries automatically — no re-keying." },
                { title: "🔒 Bank-Grade Multi-Tenant Security", desc: "Your data is entirely isolated in a dedicated tenant partition. Zero risk of cross-tenant leakage." },
                { title: "📊 Deep Data-Driven Decision Making", desc: "Inspect real-time stock levels, margin parameters, and employee rosters on executive control charts." },
                { title: "🇮🇳 Kolkata, West Bengal Local Presence", desc: "High-touch local consultation, rapid deployment, and active SLA backing from our Kolkata team." },
              ].map((point, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 text-xs font-bold mt-0.5">✓</span>
                  <div><span className="text-xs font-bold text-slate-100">{point.title}</span><p className="text-[11px] text-slate-400 leading-normal mt-0.5">{point.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-sky-950/30 rounded-2xl p-6 border border-sky-500/10 space-y-4">
            <div><span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">Future Roadmap v2.0</span><h3 className="text-md font-bold text-slate-100 mt-1">Coming to Your Workspace</h3></div>
            <div className="space-y-2.5 font-mono text-[11px]">
              {[
                ["📈 Consolidated Finance & Accounting","Q3 2026"],
                ["🚪 QR-Code Visitor Management","Q4 2026"],
                ["🛠️ Customer Support Helpdesk","Q4 2026"],
                ["📱 Native iOS & Android Apps","Q1 2027"],
                ["🔔 WhatsApp Automated Alerts","Q2 2027"],
              ].map(([name,status],i)=>(
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-300 font-sans font-semibold">{name}</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded shrink-0">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-950/80 rounded-2xl p-6 md:p-8 border border-sky-500/20 text-center space-y-5">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h3 className="text-xl font-black text-white">Ready to Digitize Your Organization?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">Unlock operational clarity, eliminate double entry, and secure your company database. Schedule a sandbox demo with our Kolkata engineering desk.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => openModal("register")} className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/20">
              ✨ Create Free Account
            </button>
            <a href="https://wa.me/919836130393?text=I'm%20interested%20in%20a%20DEINRIM%20360%20demo" target="_blank" rel="noreferrer" className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 font-bold text-xs rounded-xl transition-all">
              💬 WhatsApp (+91 98361-30393)
            </a>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">M/s Deinrim Solutionss (P) Ltd. • Kolkata, India • deinrim360.in</div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="w-full max-w-4xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-sky-400" /><h3 className="text-md font-bold text-slate-100">Knowledge Base Q&A</h3></div>
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" /><input type="text" placeholder="Search Q&A..." value={helpSearch} onChange={e => setHelpSearch(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full md:w-64 font-semibold" /></div>
          </div>
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredQas.length === 0 ? <div className="text-center py-6 text-slate-500 text-xs">No Q&A articles match your search.</div> : filteredQas.map((item, index) => {
              const isExpanded = expandedQa === index;
              return (
                <div key={index} className={`rounded-xl border transition-all ${isExpanded ? "bg-slate-900 border-sky-500/40" : "bg-slate-900/45 border-slate-800 hover:border-slate-700"}`}>
                  <button onClick={() => setExpandedQa(isExpanded ? null : index)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 font-semibold">
                    <span className="text-xs text-slate-200">{item.q}</span>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-sky-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/40 text-xs text-slate-400 leading-relaxed">
                      <p dangerouslySetInnerHTML={{ __html: item.a.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-bold">$1</strong>') }}></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800 flex items-start gap-3 mt-4">
          <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
          <div><span className="text-xs font-bold text-slate-200">Role-Based Access Control Policy</span><p className="text-[11px] text-slate-400 leading-normal mt-1">All business actions validate user role parameters under the RBAC matrix dynamically before committing to the database. System Admin has unrestricted access to edit or delete any record or account without requiring additional approvals.</p></div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-[#030712] px-6 py-6 text-xs text-slate-400 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto text-left">
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider font-mono">OPERATED & DEVELOPED BY</h4>
            <p className="text-slate-200 font-semibold text-sm">M/s Deinrim Solutionss (P) Ltd.</p>
            <p className="text-slate-300">Kolkata, West Bengal (WB), India</p>
            <p className="text-white font-bold text-sm">Corporate: +91 98361-30393</p>
            <p className="text-slate-500 text-[10px] leading-normal pt-2 border-t border-slate-900 mt-2">DEINRIM OMS v2.0 • Isolated high-performance relational structures with real-time replication.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider font-mono">REGULATORY COMPLIANCE</h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sky-400 font-bold mt-2 text-[11px]">
              {[["privacy","Privacy Policy"],["terms","Terms of Service"],["support","App Support"]].map(([key,label])=>(
                <React.Fragment key={key}><button type="button" onClick={() => setActiveFooterModal(key as any)} className="hover:text-sky-300 underline transition-all cursor-pointer">{label}</button><span className="text-slate-700">|</span></React.Fragment>
              ))}
              <button type="button" onClick={() => setActiveFooterModal("deletion")} className="text-rose-500 hover:text-rose-400 underline transition-all cursor-pointer font-bold">Data Deletion Request</button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider font-mono">ENTERPRISE SECURITY</h4>
            <ul className="space-y-2 text-slate-400 text-xs leading-relaxed">
              <li className="flex items-start gap-2"><span className="text-slate-600 font-mono mt-0.5">•</span><span><strong>Multi-Tenant Isolation:</strong> Company databases are isolated per unique tenant schema. No cross-tenant query execution possible.</span></li>
              <li className="flex items-start gap-2"><span className="text-slate-600 font-mono mt-0.5">•</span><span><strong>Data Sovereignty:</strong> Transactions encrypted using AES-256 standard, backed up every 6 hours on secure containers.</span></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ───────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl overflow-hidden my-4 md:my-0">
            {/* Top accent */}
            <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-blue-400 to-sky-600"></div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center"><Building2 className="h-4 w-4 text-white" /></div>
                <div><div className="text-sm font-bold text-white font-mono">DEINRIM OMS</div><div className="text-[10px] text-slate-500 font-mono">Secure Enterprise Portal</div></div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            {/* 3 Tabs */}
            <div className="flex gap-1 p-3 bg-slate-900/60 border-b border-slate-800">
              {([
                { id: "login",      label: "Login",         icon: LogIn },
                { id: "register",   label: "Create Account",icon: UserPlus },
                { id: "admin-demo", label: "Admin / Demo",  icon: Shield },
              ] as const).map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setModalTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer font-mono ${modalTab === tab.id ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
                  >
                    <Icon className="h-3 w-3" />{tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="p-6 space-y-4">
              {/* ── LOGIN TAB ── */}
              {modalTab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs flex items-start gap-2"><ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />{loginError}</div>}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-400/80 font-mono uppercase tracking-widest">Email Address</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="email" required placeholder="your@company.com" value={email} onChange={e => { setEmail(e.target.value); setLoginError(""); }} className={`${inputCls} pl-10`} /></div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-400/80 font-mono uppercase tracking-widest">Password</label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Enter password" value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }} className={`${inputCls} pl-10`} /></div>
                  </div>
                  <button type="submit" className={btnSky}>Sign In <ArrowRight className="h-3.5 w-3.5" /></button>
                  <p className="text-center text-[10px] text-slate-600 font-mono">Secure multi-tenant verification · DEINRIM OMS v2</p>
                </form>
              )}

              {/* ── REGISTER TAB ── */}
              {modalTab === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  {regError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-lg text-xs flex items-start gap-2"><ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />{regError}</div>}
                  <div className="bg-sky-500/5 border border-sky-500/15 rounded-lg p-3 text-[10px] text-sky-300/80 font-mono">
                    Creating an account provisions a <strong className="text-sky-300">clean, isolated company workspace</strong> with zero demo data. You will be the Company Admin.
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-400/80 font-mono uppercase tracking-widest">Company Name *</label>
                    <input type="text" required placeholder="Acme Corp Pvt. Ltd." value={regCompany} onChange={e => setRegCompany(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-400/80 font-mono uppercase tracking-widest">Admin Email *</label>
                    <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="email" required placeholder="admin@company.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} className={`${inputCls} pl-10`} /></div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-400/80 font-mono uppercase tracking-widest">Password *</label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Min 6 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} className={`${inputCls} pl-10`} /></div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-sky-400/80 font-mono uppercase tracking-widest">Confirm Password *</label>
                    <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Repeat password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className={`${inputCls} pl-10`} /></div>
                  </div>
                  <button type="submit" disabled={regLoading} className={`${btnSky} ${regLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
                    {regLoading ? "Creating Account…" : <><UserPlus className="h-3.5 w-3.5" /> Create Account</>}
                  </button>
                  <p className="text-center text-[10px] text-slate-600 font-mono">System Admin can edit or delete your account at any time.</p>
                </form>
              )}

              {/* ── ADMIN + DEMO TAB ── */}
              {modalTab === "admin-demo" && (
                <div className="space-y-5">
                  {/* Admin section — requires credentials */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <Shield className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">System Admin Access</span>
                    </div>
                    <form onSubmit={handleAdminLogin} className="space-y-3">
                      {adminError && <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-2.5 rounded-lg text-xs">{adminError}</div>}
                      <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="email" required placeholder="Admin email" value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminError(""); }} className={`${inputCls} pl-10`} /></div>
                      <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /><input type="password" required placeholder="Admin password" value={adminPass} onChange={e => { setAdminPass(e.target.value); setAdminError(""); }} className={`${inputCls} pl-10`} /></div>
                      <button type="submit" className={btnSky}><Shield className="h-3.5 w-3.5" /> Admin Sign In</button>
                    </form>
                  </div>

                  {/* Demo section — instant access */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Quick Demo Access</span>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5 text-[10px] text-amber-300/80 font-mono">
                      Demo accounts use shared read-only data. Click any role to land directly on the dashboard.
                    </div>
                    <div className="space-y-2">
                      {([
                        { type: "admin",    label: "Demo — Company Admin",    sub: "Full company view (read-write demo)",  dot: "bg-sky-500" },
                        { type: "sales",    label: "Demo — Sales Manager",    sub: "CRM + Sales pipeline only",           dot: "bg-emerald-500" },
                        { type: "readonly", label: "Demo — Read-Only User",   sub: "All modules, no write access",        dot: "bg-slate-500" },
                      ] as const).map(item => (
                        <button key={item.type} onClick={() => handleDemoLogin(item.type)}
                          className="w-full bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-sky-500/30 rounded-xl px-4 py-3 flex items-center gap-3 text-left cursor-pointer transition-all"
                        >
                          <div className={`w-2 h-2 rounded-full ${item.dot} shrink-0`}></div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-200 font-mono">{item.label}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.sub}</div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER MODALS ─────────────────────────────────────────────────── */}
      {activeFooterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-left max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                {activeFooterModal === "privacy"  && <Shield className="h-5 w-5 text-sky-400" />}
                {activeFooterModal === "terms"    && <FileText className="h-5 w-5 text-sky-400" />}
                {activeFooterModal === "support"  && <BookOpen className="h-5 w-5 text-sky-400" />}
                {activeFooterModal === "deletion" && <AlertTriangle className="h-5 w-5 text-rose-500" />}
                <h3 className="text-base font-bold text-white">
                  {activeFooterModal === "privacy"  && "Privacy Policy"}
                  {activeFooterModal === "terms"    && "Terms of Service"}
                  {activeFooterModal === "support"  && "Submit Support Query"}
                  {activeFooterModal === "deletion" && "Request Data Deletion"}
                </h3>
              </div>
              <button onClick={closeFooterModal} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {activeFooterModal === "privacy" && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-200">Last Updated: June 28, 2026</p>
                <p>Welcome to <strong>DEINRIM OMS & ERP Enterprise</strong>. We respect your privacy and are committed to protecting business data processed by our platform.</p>
                {[["1. Multi-Tenant Logical Partitioning","Our software strictly partitions customer databases by organizational identifiers, ensuring no cross-tenant queries can ever leak between corporate workspaces."],["2. Staff Account & RBAC Security","Access is strictly guarded by Role-Based Access Control schemas, verifying user authorization before allowing read or write execution."],["3. Data Security & Encryption","All transactional streams are processed over secure channels with 256-bit TLS encryption and AES-256 rest encryption."],["4. Contact Info","For inquiries: privacy@deinrim.in or +91 98361-30393."]].map(([title,text],i)=>(
                  <div key={i}><h4 className="font-bold text-sky-400 font-mono uppercase tracking-wider text-[10px]">{title}</h4><p className="mt-1">{text}</p></div>
                ))}
              </div>
            )}
            {activeFooterModal === "terms" && (
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-slate-200">Last Updated: June 28, 2026</p>
                <p>These Terms of Service govern your access to <strong>DEINRIM OMS & ERP</strong> operated by M/s Deinrim Solutionss (P) Ltd.</p>
                {[["1. Tenant Account Registration","Tenants must register with valid corporate coordinates. All white-label configurations must comply with terms and not infringe third-party intellectual property."],["2. Operational Correctness","Financial ledgers and inventory records are calculated based on parameters configured by managers. Tenants are ultimately responsible for checking accounting accuracy."],["3. Service Availability (SLA)","DEINRIM OMS is committed to 99.9% uptime SLA. Scheduled maintenance is performed during off-peak hours with prior notification."],["4. Platform Integrity","Unauthorized access, structural reverse engineering, or API endpoint scanning is prohibited."]].map(([title,text],i)=>(
                  <div key={i}><h4 className="font-bold text-sky-400 font-mono uppercase tracking-wider text-[10px]">{title}</h4><p className="mt-1">{text}</p></div>
                ))}
              </div>
            )}
            {activeFooterModal === "support" && (
              !supportSubmitted ? (
                <form onSubmit={e => { e.preventDefault(); setSupportSubmitted(true); }} className="space-y-4 text-xs">
                  <p className="text-slate-400">Fill out this support ticket and our desk will respond within 24 hours.</p>
                  {[["Full Name",supportName,setSupportName,"text","Your Name"],["Registered Email",supportEmail,setSupportEmail,"email","you@example.com"]].map(([label,val,setter,type,ph]: any,i)=>(
                    <div key={i}><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">{label}</label><input type={type} required value={val} onChange={e => setter(e.target.value)} placeholder={ph} className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-none" /></div>
                  ))}
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Support Details</label><textarea required value={supportMessage} onChange={e => setSupportMessage(e.target.value)} rows={4} placeholder="Describe your issue..." className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-none resize-none" /></div>
                  <button type="submit" className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"><CheckCircle2 className="h-4 w-4" /> Submit Ticket</button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="h-8 w-8" /></div>
                  <div><h4 className="text-sm font-bold text-white">Ticket Submitted!</h4><p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Thank you, {supportName}. Ticket <strong>#OMS-{Math.floor(100000 + Math.random() * 900000)}</strong> is raised.</p></div>
                  <button onClick={closeFooterModal} className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-white cursor-pointer">Close</button>
                </div>
              )
            )}
            {activeFooterModal === "deletion" && (
              !deletionSubmitted ? (
                <form onSubmit={e => { e.preventDefault(); setDeletionSubmitted(true); }} className="space-y-4 text-xs">
                  <p className="text-slate-400">Request permanent deletion of your DEINRIM OMS account, tenant database, and all uploaded documents.</p>
                  <div className="rounded-lg border border-rose-900/40 bg-rose-950/10 p-3 text-rose-400 flex items-start gap-2.5"><AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" /><div><strong className="block text-white mb-0.5">Warning: Irreversible Operation</strong>This permanently deletes all sales, inventory, purchase history, and payroll records. Cannot be undone.</div></div>
                  {[["Registered Corporate Email",deletionEmail,setDeletionEmail,"email","you@example.com"],["Corporate Phone",deletionPhone,setDeletionPhone,"tel","+91 XXXXX-XXXXX"]].map(([label,val,setter,type,ph]: any,i)=>(
                    <div key={i}><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">{label}</label><input type={type} required value={val} onChange={e => setter(e.target.value)} placeholder={ph} className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-none" /></div>
                  ))}
                  <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Reason for Deletion</label><textarea required value={deletionReason} onChange={e => setDeletionReason(e.target.value)} rows={3} placeholder="Briefly describe why..." className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-none resize-none" /></div>
                  <div className="flex items-start gap-2 pt-1"><input type="checkbox" required id="confirmDel" className="mt-1" /><label htmlFor="confirmDel" className="text-[11px] text-slate-400 leading-normal cursor-pointer">I confirm that I want to schedule all operational histories for absolute deletion.</label></div>
                  <button type="submit" className="w-full rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"><Trash2 className="h-4 w-4" /> Schedule Deletion</button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400"><Trash2 className="h-8 w-8" /></div>
                  <div><h4 className="text-sm font-bold text-white">Deletion Scheduled</h4><p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Request for <strong>{deletionEmail}</strong> received. Ticket: <strong>#OMS-DEL-{Math.floor(100000 + Math.random() * 900000)}</strong>. Processing within 14 business days.</p></div>
                  <button onClick={closeFooterModal} className="rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-white cursor-pointer">Close</button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

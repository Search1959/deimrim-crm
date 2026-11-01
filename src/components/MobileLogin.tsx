/**
 * Mobile Homepage & Login — 3-Tab (Login | Create Account | Admin+Demo)
 * Sky-blue theme matching desktop redesign
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Building2, Eye, EyeOff, Loader2, LogIn, UserPlus, Shield,
  Zap, ArrowRight, Check, X, Package, TrendingUp, Users,
  DollarSign, ShoppingBag, LayoutDashboard, ChevronLeft, FileSpreadsheet,
} from "lucide-react";
import { User, UserRole } from "../types";

interface Props {
  onLogin: (user: User) => void;
  usersList: User[];
}

// ── Feature slides for the landing hero ──────────────────────────────────────
const SLIDES = [
  {
    title: "Live Dashboard",
    sub: "Real-time KPIs, revenue charts & stock alerts",
    color: "from-sky-700 to-blue-900",
    accent: "#38bdf8",
    icon: LayoutDashboard,
    metrics: [
      { label: "Revenue", value: "₹14.2L", up: true },
      { label: "Orders", value: "342", up: true },
      { label: "Stock", value: "1,204", up: false },
    ],
    bars: [40, 65, 50, 80, 60, 90, 75],
  },
  {
    title: "CRM & Sales",
    sub: "Lead pipeline, proposals & invoicing",
    color: "from-emerald-700 to-teal-900",
    accent: "#34d399",
    icon: TrendingUp,
    metrics: [
      { label: "Leads", value: "128", up: true },
      { label: "Closed", value: "47", up: true },
      { label: "Value", value: "₹8.6L", up: true },
    ],
    bars: [30, 55, 45, 70, 85, 60, 90],
  },
  {
    title: "Inventory Control",
    sub: "Multi-warehouse, batch & FIFO tracking",
    color: "from-violet-700 to-indigo-900",
    accent: "#a78bfa",
    icon: Package,
    metrics: [
      { label: "SKUs", value: "2,340", up: false },
      { label: "Low Stock", value: "18", up: false },
      { label: "Turnover", value: "4.2×", up: true },
    ],
    bars: [70, 55, 80, 45, 65, 75, 50],
  },
  {
    title: "Procurement",
    sub: "Purchase orders, GRN & vendor mgmt",
    color: "from-orange-700 to-amber-900",
    accent: "#fb923c",
    icon: ShoppingBag,
    metrics: [
      { label: "POs Open", value: "23", up: false },
      { label: "GRN Today", value: "7", up: true },
      { label: "Payable", value: "₹3.1L", up: false },
    ],
    bars: [50, 40, 60, 75, 55, 65, 80],
  },
  {
    title: "HR & Attendance",
    sub: "Staff rosters, clock-in & leave approvals",
    color: "from-amber-700 to-orange-900",
    accent: "#fbbf24",
    icon: Users,
    metrics: [
      { label: "Present", value: "38/42", up: true },
      { label: "On Leave", value: "4", up: false },
      { label: "OT Hours", value: "12h", up: false },
    ],
    bars: [85, 90, 80, 88, 75, 92, 85],
  },
  {
    title: "Finance & P&L",
    sub: "Double-entry ledger, P&L & COGS posting",
    color: "from-rose-700 to-pink-900",
    accent: "#fb7185",
    icon: DollarSign,
    metrics: [
      { label: "Revenue", value: "₹41.8L", up: true },
      { label: "Expenses", value: "₹28.2L", up: false },
      { label: "Net P&L", value: "₹13.6L", up: true },
    ],
    bars: [60, 70, 55, 80, 65, 85, 75],
  },
  {
    title: "GST Compliance",
    sub: "GSTR-1/3B filing & ITC matching",
    color: "from-teal-700 to-cyan-900",
    accent: "#2dd4bf",
    icon: FileSpreadsheet,
    metrics: [
      { label: "ITC Avail", value: "₹2.4L", up: true },
      { label: "GSTR-1", value: "Filed", up: true },
      { label: "Tax Due", value: "₹1.1L", up: false },
    ],
    bars: [55, 65, 75, 60, 80, 70, 85],
  },
];

type Tab = "login" | "register" | "admin-demo";

export default function MobileLogin({ onLogin, usersList }: Props) {
  // ── Screen state: "landing" or "auth" ────────────────────────────────────
  const [screen, setScreen] = useState<"landing" | "auth">("landing");
  const [activeTab, setActiveTab] = useState<Tab>("login");

  // ── Login state ───────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Register state ────────────────────────────────────────────────────────
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // ── Admin+Demo state ──────────────────────────────────────────────────────
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  // ── Hero slideshow ────────────────────────────────────────────────────────
  const [slide, setSlide] = useState(0);
  const [slideAnim, setSlideAnim] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSlideAnim(false);
      setTimeout(() => { setSlide(p => (p + 1) % SLIDES.length); setSlideAnim(true); }, 200);
    }, 2800);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const openAuth = (tab: Tab) => { setActiveTab(tab); setScreen("auth"); };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const clean = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); return; }
      if (res.status === 401) { setLoginError("Invalid email or password."); setLoginLoading(false); return; }
    } catch { /* fall through */ }

    if (clean === "apex7tech@gmail.com" && (password === "Search@1959" || password === "Search@1959...")) {
      const found = usersList.find(u => u.email.toLowerCase() === "apex7tech@gmail.com") ?? {
        id: "u-apex", name: "Apex Tech Admin", email: "apex7tech@gmail.com",
        role: UserRole.SYSTEM_ADMIN, companyId: "comp-1", branchId: "br-hq",
        status: "active" as const, password: "Search@1959",
      } as User;
      onLogin(found); return;
    }

    const matched = usersList.filter(u => u.email.toLowerCase() === clean);
    if (!matched.length) { setLoginError("Email not found."); setLoginLoading(false); return; }
    const exact = matched.find(u => u.password === password);
    if (exact) { onLogin(exact); return; }
    const std = matched.find(u => !u.password);
    if (std && (password === "deinrim123" || password === "")) { onLogin(std); return; }
    setLoginError("Incorrect password.");
    setLoginLoading(false);
  };

  // ── Register ──────────────────────────────────────────────────────────────
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
      if (res.ok && data.ok && data.user) { onLogin(data.user); return; }
      setRegError(data.error || "Registration failed. Please try again.");
    } catch { setRegError("Network error. Please try again."); }
    setRegLoading(false);
  };

  // ── Admin login ───────────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    setAdminLoading(true);
    const clean = adminEmail.trim().toLowerCase();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, password: adminPass }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); return; }
    } catch { /* fall through */ }
    if (clean === "apex7tech@gmail.com" && (adminPass === "Search@1959" || adminPass === "Search@1959...")) {
      const found = usersList.find(u => u.email.toLowerCase() === "apex7tech@gmail.com") ?? {
        id: "u-apex", name: "Apex Tech Admin", email: "apex7tech@gmail.com",
        role: UserRole.SYSTEM_ADMIN, companyId: "comp-1", branchId: "br-hq",
        status: "active" as const,
      } as User;
      onLogin(found); return;
    }
    setAdminError("Admin credentials not recognised.");
    setAdminLoading(false);
  };

  // ── Demo instant login ────────────────────────────────────────────────────
  const handleDemo = async (type: "admin" | "sales" | "readonly") => {
    const map: Record<string, Partial<User>> = {
      admin:    { id: "u-demo-admin",  name: "Demo Company Admin",  email: "demo@deinrim.in",       role: UserRole.COMPANY_ADMIN,  companyId: "comp-1", branchId: "br-hq", status: "active" },
      sales:    { id: "u-demo-sales",  name: "Demo Sales Manager",  email: "demo.sales@deinrim.in", role: UserRole.SALES_MANAGER,  companyId: "comp-1", branchId: "br-hq", status: "active" },
      readonly: { id: "u-demo-ro",     name: "Demo Read-Only User", email: "demo@deinrim.in",       role: UserRole.READ_ONLY,      companyId: "comp-1", branchId: "br-hq", status: "active" },
    };
    try {
      const creds = type === "sales"
        ? { email: "demo.sales@deinrim.in", password: "demo123...." }
        : { email: "demo@deinrim.in", password: "demo123...." };
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
      const data = await res.json();
      if (res.ok && data.ok && data.user) { onLogin(data.user); return; }
    } catch { /* fall through */ }
    onLogin(map[type] as User);
  };

  // ── Shared input class ────────────────────────────────────────────────────
  const inp = "w-full rounded-2xl px-4 py-4 text-sm focus:outline-none transition-all";
  const inpStyle = { background: "rgba(30,41,59,0.9)", border: "1px solid rgba(100,116,139,0.45)", color: "#f1f5f9" };
  const primaryBtn = "w-full rounded-2xl bg-sky-500 py-4 text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50";

  const CurSlide = SLIDES[slide];
  const CurIcon = CurSlide.icon;

  // ══════════════════════════════════════════════════════════════════════════
  // LANDING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === "landing") {
    return (
      <div data-theme="dark" className="flex flex-col h-screen w-screen overflow-hidden select-none" style={{ background: "#0a0f1e" }}>

        {/* Status bar */}
        <div className="h-7 w-full flex items-center justify-between px-5 shrink-0" style={{ background: "#0a0f1e" }}>
          <span className="text-[10px] text-slate-500 font-mono font-bold">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 items-end h-3">
              {[2,3,4,5].map(h => <div key={h} className="w-0.5 bg-slate-400 rounded-sm" style={{ height: `${h * 2}px` }} />)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono ml-1">●</span>
          </div>
        </div>

        {/* HERO — gradient card with mini-dashboard slide */}
        <div className="shrink-0 mx-4 mt-1 rounded-3xl overflow-hidden relative" style={{ height: 230 }}>
          {/* animated gradient bg */}
          <div className={`absolute inset-0 bg-gradient-to-br ${CurSlide.color} transition-all duration-700`} />
          {/* subtle dot grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col p-4 gap-3">

            {/* Top bar: logo + module name */}
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-extrabold text-[11px] tracking-wider uppercase font-mono leading-none">DEINRIM OMS</div>
                <div className="text-white/60 text-[9px] font-mono">Enterprise v2.0</div>
              </div>
              <div className="bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                <span className="text-[9px] text-white font-bold font-mono uppercase">LIVE</span>
              </div>
            </div>

            {/* Module slide content */}
            <div style={{ opacity: slideAnim ? 1 : 0, transition: "opacity 0.2s ease", flex: 1 }} className="flex flex-col gap-2">

              {/* Module label */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-white/20 border border-white/20 flex items-center justify-center shrink-0">
                  <CurIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-white font-extrabold text-sm leading-tight">{CurSlide.title}</div>
                  <div className="text-white/60 text-[9px] leading-snug">{CurSlide.sub}</div>
                </div>
              </div>

              {/* Mini metric cards */}
              <div className="grid grid-cols-3 gap-1.5">
                {CurSlide.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl p-2" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <div className="text-[8px] text-white/50 font-mono uppercase tracking-wide leading-none mb-1">{m.label}</div>
                    <div className="text-white font-extrabold text-[13px] leading-none">{m.value}</div>
                    <div className={`text-[8px] font-bold mt-0.5 ${m.up ? "text-emerald-300" : "text-red-300"}`}>{m.up ? "▲" : "▼"}</div>
                  </div>
                ))}
              </div>

              {/* Mini bar chart */}
              <div className="flex items-end justify-between px-1" style={{ height: 48, gap: 4 }}>
                {CurSlide.bars.map((pct, i) => (
                  <div
                    key={i}
                    className="rounded-sm transition-all duration-500"
                    style={{
                      flex: "0 0 auto",
                      width: 14,
                      height: `${pct}%`,
                      background: i === CurSlide.bars.length - 1 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.28)",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom: dots */}
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setSlide(i); }}
                  className="h-1.5 rounded-full transition-all cursor-pointer"
                  style={{ width: i === slide ? 20 : 6, background: i === slide ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex gap-2 px-4 mt-2 overflow-x-auto shrink-0 pb-1">
          {[
            ["✅", "SSL Secure"],
            ["☁️", "Cloud Hosted"],
            ["📱", "Mobile Ready"],
            ["🔒", "RBAC Protected"],
            ["🧾", "GST Compliant"],
          ].map(([em, label]) => (
            <div key={label} className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: "rgba(30,41,59,0.9)", border: "1px solid rgba(100,116,139,0.4)" }}>
              <span className="text-xs">{em}</span>
              <span className="text-[10px] font-semibold font-mono whitespace-nowrap" style={{ color: "#cbd5e1" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="px-5 mt-2 space-y-0.5 shrink-0">
          <h2 className="text-xl font-extrabold leading-snug" style={{ color: "#ffffff" }}>
            Run Your Entire Business<br />
            <span style={{ color: "#38bdf8" }}>from One Platform</span>
          </h2>
          <p className="text-[11px] leading-relaxed" style={{ color: "#94a3b8" }}>
            CRM · Inventory · Procurement · HR · Finance · GST — unified in one isolated, single-tenant schema.
          </p>
        </div>

        {/* Compact stats + features */}
        <div className="px-4 mt-3 shrink-0 space-y-2">

          {/* Stats row — slim pills */}
          <div className="flex gap-2">
            {[
              { val: "14+", label: "Companies" },
              { val: "7",   label: "Modules" },
              { val: "99.9%", label: "Uptime" },
            ].map(s => (
              <div key={s.label} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl" style={{ background: "rgba(99,102,241,0.09)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <span className="text-sm font-black" style={{ color: "#a5b4fc" }}>{s.val}</span>
                <span className="text-[9px] font-mono" style={{ color: "#475569" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Feature chips — 3-col icon grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "🔒", title: "Schema Isolation" },
              { icon: "⚡", title: "Real-Time Sync" },
              { icon: "🧾", title: "GST Filing" },
            ].map(f => (
              <div key={f.title} className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.9)" }}>
                <span className="text-base">{f.icon}</span>
                <span className="text-[9px] font-bold text-center leading-tight font-mono" style={{ color: "#94a3b8" }}>{f.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons — pinned to bottom */}
        <div className="flex-1" />
        <div className="px-4 pb-8 space-y-3 shrink-0">
          <button
            onClick={() => openAuth("register")}
            className={primaryBtn}
          >
            <UserPlus className="h-4 w-4" /> Create Free Account
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => openAuth("login")}
              className="rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{ border: "1px solid rgba(100,116,139,0.5)", background: "rgba(30,41,59,0.85)", color: "#e2e8f0" }}
            >
              <LogIn className="h-4 w-4" style={{ color: "#38bdf8" }} /> Login
            </button>
            <button
              onClick={() => openAuth("admin-demo")}
              className="rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{ border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)", color: "#fbbf24" }}
            >
              <Zap className="h-4 w-4" /> Try Demo
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 font-mono">
            Apex7tech · deinrim360.in
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN — 3 tabs
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div data-theme="dark" className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: "#0a0f1e" }}>

      {/* Status bar */}
      <div className="h-7 w-full flex items-center justify-between px-5 shrink-0" style={{ background: "#0a0f1e" }}>
        <span className="text-[10px] text-slate-500 font-mono font-bold">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="h-1.5 w-8 bg-slate-700 rounded-full" />
      </div>

      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <button
          onClick={() => setScreen("landing")}
          className="flex items-center gap-1 text-sky-400 font-bold text-sm active:opacity-70"
        >
          <ChevronLeft className="h-5 w-5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-sky-500 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-extrabold text-sm font-mono uppercase tracking-wider">DEINRIM OMS</span>
        </div>
        <div className="w-14" />
      </div>

      {/* Sky accent line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-blue-400 to-sky-600 shrink-0" />

      {/* 3-Tab switcher */}
      <div className="shrink-0 flex gap-1 p-2.5 border-b border-slate-800" style={{ background: "rgba(15,23,42,0.7)" }}>
        {([
          { id: "login",      label: "Login",          icon: LogIn },
          { id: "register",   label: "Create Account", icon: UserPlus },
          { id: "admin-demo", label: "Admin / Demo",   icon: Shield },
        ] as const).map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setLoginError(""); setRegError(""); setAdminError(""); }}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all"
              style={active ? { background: "#0ea5e9", color: "#fff" } : { background: "rgba(30,41,59,0.7)", color: "#94a3b8" }}
            >
              <Icon className="h-3 w-3" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-8">

        {/* ── LOGIN TAB ── */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 pb-2">
              <h3 className="text-xl font-extrabold text-white">Welcome back</h3>
              <p className="text-xs text-slate-400">Sign in to your DEINRIM OMS workspace</p>
            </div>

            {loginError && (
              <div className="rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                <X className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} /> {loginError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: "#38bdf8" }}>Email Address</label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => { setEmail(e.target.value); setLoginError(""); }}
                  placeholder="your@company.com"
                  className={inp} style={inpStyle}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: "#38bdf8" }}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} required autoComplete="current-password"
                    value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                    placeholder="••••••••"
                    className={inp + " pr-12"} style={inpStyle}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loginLoading || !email || !password} className={primaryBtn + " mt-2"}>
              {loginLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                : <><LogIn className="h-4 w-4" /> Sign In</>}
            </button>

            <p className="text-center text-[10px] text-slate-600 font-mono pt-2">
              Secure multi-tenant verification · SSL encrypted
            </p>
          </form>
        )}

        {/* ── CREATE ACCOUNT TAB ── */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1 pb-2">
              <h3 className="text-xl font-extrabold text-white">Create Account</h3>
              <p className="text-xs text-slate-400">Provision a clean, isolated company workspace</p>
            </div>

            <div className="rounded-2xl p-3.5 text-[11px] font-mono leading-relaxed" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", color: "rgba(125,211,252,0.85)" }}>
              Your workspace starts with <strong style={{ color: "#7dd3fc" }}>zero demo data</strong>. You'll be the Company Admin — full access to all modules.
            </div>

            {regError && (
              <div className="rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                <X className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} /> {regError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: "#38bdf8" }}>Company Name *</label>
                <input
                  type="text" required
                  value={regCompany} onChange={e => setRegCompany(e.target.value)}
                  placeholder="Acme Corp Pvt. Ltd."
                  className={inp} style={inpStyle}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: "#38bdf8" }}>Admin Email *</label>
                <input
                  type="email" required
                  value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className={inp} style={inpStyle}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: "#38bdf8" }}>Password * (min 6 chars)</label>
                <div className="relative">
                  <input
                    type={showRegPass ? "text" : "password"} required
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inp + " pr-12"} style={inpStyle}
                  />
                  <button type="button" onClick={() => setShowRegPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1" style={{ color: "#94a3b8" }}>
                    {showRegPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 font-mono" style={{ color: "#38bdf8" }}>Confirm Password *</label>
                <input
                  type="password" required
                  value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={inp} style={inpStyle}
                />
              </div>
            </div>

            <button type="submit" disabled={regLoading || !regCompany || !regEmail || !regPassword || !regConfirm} className={primaryBtn + " mt-2"}>
              {regLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                : <><UserPlus className="h-4 w-4" /> Create Account</>}
            </button>

            <p className="text-center text-[10px] text-slate-600 font-mono pt-2">
              System Admin can edit or delete your account at any time.
            </p>
          </form>
        )}

        {/* ── ADMIN + DEMO TAB ── */}
        {activeTab === "admin-demo" && (
          <div className="space-y-6">
            {/* Admin section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Shield className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">System Admin Access</h3>
              </div>
              <p className="text-[11px] text-slate-400">Admin credentials required to access root configuration.</p>

              <form onSubmit={handleAdminLogin} className="space-y-3">
                {adminError && (
                  <div className="rounded-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                    <X className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f87171" }} /> {adminError}
                  </div>
                )}
                <input
                  type="email" required
                  value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminError(""); }}
                  placeholder="Admin email"
                  className={inp} style={inpStyle}
                />
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"} required
                    value={adminPass} onChange={e => { setAdminPass(e.target.value); setAdminError(""); }}
                    placeholder="Admin password"
                    className={inp + " pr-12"} style={inpStyle}
                  />
                  <button type="button" onClick={() => setShowAdminPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1" style={{ color: "#94a3b8" }}>
                    {showAdminPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <button type="submit" disabled={adminLoading || !adminEmail || !adminPass} className={primaryBtn}>
                  {adminLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                    : <><Shield className="h-4 w-4" /> Admin Sign In</>}
                </button>
              </form>
            </div>

            {/* Demo section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <Zap className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">Quick Demo Access</h3>
              </div>
              <div className="rounded-2xl px-4 py-3 text-[11px] font-mono leading-relaxed" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.18)", color: "rgba(253,230,138,0.85)" }}>
                Demo accounts load shared data instantly — no credentials needed. Tap to land on the dashboard.
              </div>

              <div className="space-y-2.5">
                {([
                  { type: "admin",    label: "Demo — Company Admin",   sub: "Full company view (read-write demo)",  dotColor: "#0ea5e9",  arrowColor: "#38bdf8" },
                  { type: "sales",    label: "Demo — Sales Manager",   sub: "CRM + Sales pipeline only",           dotColor: "#10b981",  arrowColor: "#34d399" },
                  { type: "readonly", label: "Demo — Read-Only User",  sub: "All modules, no write access",        dotColor: "#64748b",  arrowColor: "#94a3b8" },
                ] as const).map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleDemo(item.type)}
                    className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 text-left transition-all"
                    style={{ background: "rgba(30,41,59,0.85)", border: "1px solid rgba(100,116,139,0.35)" }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.dotColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{item.label}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: "#64748b" }}>{item.sub}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0" style={{ color: item.arrowColor }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Trust note */}
            <div className="flex items-start gap-2 p-3.5 rounded-2xl" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(30,41,59,0.8)" }}>
              <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />
              <p className="text-[10px] leading-relaxed font-mono" style={{ color: "#64748b" }}>
                Demo data is read-only shared. Your real account workspace starts completely clean — zero demo contamination.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

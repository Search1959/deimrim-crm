/**
 * Mobile Homepage & Login — 3-Tab (Login | Create Account | Admin+Demo)
 * Sky-blue theme matching desktop redesign
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Building2, Eye, EyeOff, Loader2, LogIn, UserPlus, Shield,
  Zap, ArrowRight, Check, X, Package, TrendingUp, Users,
  DollarSign, ShoppingBag, LayoutDashboard, ChevronLeft,
} from "lucide-react";
import { User, UserRole } from "../types";

interface Props {
  onLogin: (user: User) => void;
  usersList: User[];
}

// ── Feature slides for the landing hero ──────────────────────────────────────
const SLIDES = [
  {
    emoji: "📊",
    title: "Live Dashboard",
    sub: "Real-time KPIs, revenue charts & stock alerts",
    color: "from-sky-600 to-blue-700",
    icon: LayoutDashboard,
  },
  {
    emoji: "📦",
    title: "Inventory Control",
    sub: "Batch tracking, FIFO depletion & rack codes",
    color: "from-violet-600 to-indigo-700",
    icon: Package,
  },
  {
    emoji: "📈",
    title: "CRM & Sales",
    sub: "Leads pipeline, invoicing & customer ledger",
    color: "from-emerald-600 to-teal-700",
    icon: TrendingUp,
  },
  {
    emoji: "👥",
    title: "HR & Attendance",
    sub: "Staff rosters, clock-in & leave approvals",
    color: "from-amber-600 to-orange-700",
    icon: Users,
  },
  {
    emoji: "💰",
    title: "Finance & GST",
    sub: "Live P&L, AP/AR & automated COGS posting",
    color: "from-rose-600 to-pink-700",
    icon: DollarSign,
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
  const inp = "w-full rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all";
  const primaryBtn = "w-full rounded-2xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 py-4 text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50";

  const CurIcon = SLIDES[slide].icon;

  // ══════════════════════════════════════════════════════════════════════════
  // LANDING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === "landing") {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#0a0f1e] overflow-hidden select-none">

        {/* Status bar */}
        <div className="h-7 w-full bg-[#0a0f1e] flex items-center justify-between px-5 shrink-0">
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

        {/* HERO — gradient card with app icon + feature slide */}
        <div className="shrink-0 mx-4 mt-2 rounded-3xl overflow-hidden relative" style={{ height: 260 }}>
          {/* animated gradient bg */}
          <div className={`absolute inset-0 bg-gradient-to-br ${SLIDES[slide].color} transition-all duration-700`} />
          {/* pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }} />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6">
            {/* Top: logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-white font-extrabold text-sm tracking-wider uppercase font-mono leading-none">DEINRIM OMS</div>
                <div className="text-white/60 text-[10px] font-mono">Enterprise v2.0</div>
              </div>
              <div className="ml-auto bg-white/20 px-2 py-0.5 rounded-full">
                <span className="text-[9px] text-white font-bold font-mono uppercase">LIVE</span>
              </div>
            </div>

            {/* Middle: feature slide */}
            <div
              className="flex flex-col items-center text-center"
              style={{ opacity: slideAnim ? 1 : 0, transition: "opacity 0.2s ease" }}
            >
              <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center mb-3">
                <CurIcon className="h-7 w-7 text-white" />
              </div>
              <div className="text-white font-extrabold text-lg leading-tight">{SLIDES[slide].title}</div>
              <div className="text-white/70 text-[11px] mt-0.5 max-w-[200px] leading-relaxed">{SLIDES[slide].sub}</div>
            </div>

            {/* Bottom: dots */}
            <div className="flex items-center justify-center gap-1.5">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setSlide(i); }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${i === slide ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex gap-2 px-4 mt-4 overflow-x-auto shrink-0 pb-1">
          {[
            ["✅", "SSL Secure"],
            ["☁️", "Cloud Hosted"],
            ["📱", "Mobile Ready"],
            ["🔒", "RBAC Protected"],
            ["🧾", "GST Compliant"],
          ].map(([em, label]) => (
            <div key={label} className="shrink-0 flex items-center gap-1 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-full">
              <span className="text-xs">{em}</span>
              <span className="text-[10px] text-slate-300 font-semibold font-mono whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div className="px-5 mt-5 space-y-1 shrink-0">
          <h2 className="text-xl font-extrabold text-white leading-snug">
            One Platform to Run<br />
            <span className="text-sky-400">Your Entire Organization</span>
          </h2>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            CRM · Inventory · HR · Finance · GST — all linked in one secure, multi-tenant workspace.
          </p>
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
              className="rounded-2xl border border-slate-700 bg-slate-800/60 py-3.5 text-sm font-bold text-slate-200 flex items-center justify-center gap-1.5 active:bg-slate-700 transition-all"
            >
              <LogIn className="h-4 w-4 text-sky-400" /> Login
            </button>
            <button
              onClick={() => openAuth("admin-demo")}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 py-3.5 text-sm font-bold text-amber-400 flex items-center justify-center gap-1.5 active:bg-amber-500/10 transition-all"
            >
              <Zap className="h-4 w-4" /> Try Demo
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600 font-mono">
            M/s Deinrim Solutionss (P) Ltd. · deinrim360.in
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTH SCREEN — 3 tabs
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0f1e] overflow-hidden">

      {/* Status bar */}
      <div className="h-7 w-full bg-[#0a0f1e] flex items-center justify-between px-5 shrink-0">
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
      <div className="shrink-0 flex gap-1 p-2.5 bg-slate-900/60 border-b border-slate-800">
        {([
          { id: "login",      label: "Login",          icon: LogIn },
          { id: "register",   label: "Create Account", icon: UserPlus },
          { id: "admin-demo", label: "Admin / Demo",   icon: Shield },
        ] as const).map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setLoginError(""); setRegError(""); setAdminError(""); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeTab === tab.id ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "text-slate-400 bg-slate-800/50"}`}
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
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300 font-semibold flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> {loginError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-2 font-mono">Email Address</label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => { setEmail(e.target.value); setLoginError(""); }}
                  placeholder="your@company.com"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-2 font-mono">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} required autoComplete="current-password"
                    value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                    placeholder="••••••••"
                    className={inp + " pr-12"}
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

            <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-3.5 text-[11px] text-sky-300/80 font-mono leading-relaxed">
              Your workspace starts with <strong className="text-sky-300">zero demo data</strong>. You'll be the Company Admin — full access to all modules.
            </div>

            {regError && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300 font-semibold flex items-start gap-2">
                <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> {regError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-2 font-mono">Company Name *</label>
                <input
                  type="text" required
                  value={regCompany} onChange={e => setRegCompany(e.target.value)}
                  placeholder="Acme Corp Pvt. Ltd."
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-2 font-mono">Admin Email *</label>
                <input
                  type="email" required
                  value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className={inp}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-2 font-mono">Password * (min 6 chars)</label>
                <div className="relative">
                  <input
                    type={showRegPass ? "text" : "password"} required
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inp + " pr-12"}
                  />
                  <button type="button" onClick={() => setShowRegPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                    {showRegPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-2 font-mono">Confirm Password *</label>
                <input
                  type="password" required
                  value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={inp}
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
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-xs text-red-300 font-semibold flex items-start gap-2">
                    <X className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> {adminError}
                  </div>
                )}
                <input
                  type="email" required
                  value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setAdminError(""); }}
                  placeholder="Admin email"
                  className={inp}
                />
                <div className="relative">
                  <input
                    type={showAdminPass ? "text" : "password"} required
                    value={adminPass} onChange={e => { setAdminPass(e.target.value); setAdminError(""); }}
                    placeholder="Admin password"
                    className={inp + " pr-12"}
                  />
                  <button type="button" onClick={() => setShowAdminPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1">
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
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl px-4 py-3 text-[11px] text-amber-300/80 font-mono leading-relaxed">
                Demo accounts load shared data instantly — no credentials needed. Tap to land on the dashboard.
              </div>

              <div className="space-y-2.5">
                {([
                  { type: "admin",    label: "Demo — Company Admin",   sub: "Full company view (read-write demo)",  dot: "bg-sky-500",     arrow: "text-sky-400" },
                  { type: "sales",    label: "Demo — Sales Manager",   sub: "CRM + Sales pipeline only",           dot: "bg-emerald-500", arrow: "text-emerald-400" },
                  { type: "readonly", label: "Demo — Read-Only User",  sub: "All modules, no write access",        dot: "bg-slate-400",   arrow: "text-slate-400" },
                ] as const).map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleDemo(item.type)}
                    className="w-full bg-slate-800/60 active:bg-slate-700 border border-slate-700 rounded-2xl px-4 py-4 flex items-center gap-3 text-left transition-all"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.sub}</div>
                    </div>
                    <ArrowRight className={`h-4 w-4 ${item.arrow} shrink-0`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Trust note */}
            <div className="flex items-start gap-2 p-3.5 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                Demo data is read-only shared. Your real account workspace starts completely clean — zero demo contamination.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

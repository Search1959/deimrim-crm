/**
 * Mobile Login Screen — Android app style
 */
import React, { useState } from "react";
import { Eye, EyeOff, Building2, Loader2 } from "lucide-react";
import { User } from "../types";

interface Props {
  onLogin: (user: User) => void;
  usersList: User[];
}

export default function MobileLogin({ onLogin, usersList }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // ── Server-side login (primary) ──────────────────────────────────────
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.user) {
        onLogin(data.user);
        setLoading(false);
        return;
      }
      if (res.status === 401) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      // DB unavailable — fall through to local check
    } catch {
      // Network error — fall through
    }

    await new Promise(r => setTimeout(r, 300));
    const matchedUsers = usersList.filter(u => u.email.toLowerCase() === cleanEmail);

    if (matchedUsers.length === 0) {
      setError("Email not recognised. Check credentials.");
      setLoading(false);
      return;
    }

    // Hardcoded admin — fallback object if not in DB
    if (cleanEmail === "apex7tech@gmail.com" && (password === "Search@1959" || password === "Search@1959...")) {
      const found = usersList.find(u => u.email.toLowerCase() === "apex7tech@gmail.com") ?? {
        id: "u-apex", name: "Apex Tech Admin", email: "apex7tech@gmail.com",
        role: "System Admin" as User["role"], companyId: "comp-1", branchId: "br-hq",
        status: "active" as const, password: "Search@1959",
      } as User;
      onLogin(found); setLoading(false); return;
    }
    // Demo — fallback object if not in DB
    if (cleanEmail === "demo@deinrim.in" && password === "demo123....") {
      const found = usersList.find(u => u.email.toLowerCase() === "demo@deinrim.in") ?? {
        id: "u-demo", name: "Demo User", email: "demo@deinrim.in",
        role: "Read Only" as User["role"], companyId: "comp-1", branchId: "br-hq",
        status: "active" as const, password: "demo123....",
      } as User;
      onLogin(found); setLoading(false); return;
    }

    // Client / staff accounts
    const exactMatch = matchedUsers.find(u => u.password && u.password === password);
    if (exactMatch) { onLogin(exactMatch); setLoading(false); return; }

    // Standard mock password
    if (password === "deinrim123" || password === "password" || password === "") {
      const standard = matchedUsers.find(u => !u.password);
      if (standard) { onLogin(standard); setLoading(false); return; }
    }

    const hasCustom = matchedUsers.find(u => u.password);
    setError(hasCustom ? "Incorrect password." : "Invalid password. Try 'deinrim123' for standard accounts.");
    setLoading(false);
  };

  const quickLogin = (u: User) => {
    setEmail(u.email);
    setPassword(u.password || "");
    setError("");
  };

  const demoUser = usersList.find(u => u.email === "demo@deinrim.in");

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 md:hidden overflow-hidden">

      {/* Status bar */}
      <div className="h-6 w-full bg-indigo-700 flex items-center justify-end px-4 shrink-0">
        <span className="text-[9px] text-indigo-200 font-mono font-bold tracking-widest">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Hero top section */}
      <div className="flex flex-col items-center justify-center pt-10 pb-8 px-6 shrink-0 bg-gradient-to-b from-indigo-700 via-indigo-800 to-slate-950">
        {/* App icon */}
        <div className="h-20 w-20 rounded-3xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center shadow-2xl mb-4">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">DEINRIM OMS</h1>
        <p className="text-sm text-indigo-200 mt-1 font-medium">Business Management System</p>
      </div>

      {/* Login card */}
      <div className="flex-1 overflow-y-auto px-5 pt-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email / Login ID</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3.5 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 font-semibold text-center">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 py-4 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
          </button>
        </form>

        {/* Demo quick access */}
        {demoUser && (
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Quick Demo</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
            <button onClick={() => quickLogin(demoUser)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300 font-semibold flex items-center justify-between active:bg-slate-700 transition-colors">
              <span>👁 Try Demo (Read-Only)</span>
              <span className="text-[10px] text-slate-500 font-mono">demo@deinrim.in</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pb-8 text-center">
          <p className="text-[10px] text-slate-600 font-mono">v1.2 · Powered by DEINRIM Solutions</p>
        </div>
      </div>
    </div>
  );
}

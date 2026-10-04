/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search, Bell, Building2, Sparkles, Check, X,
  AlertTriangle, Info, CheckCircle, LogOut, KeyRound,
  ChevronDown, Menu,
} from "lucide-react";
import { User, UserRole, Branch, AppNotification } from "../types";

const VIEW_TITLES: Record<string, string> = {
  dashboard:   "Dashboard",
  "my-hr":     "My HR",
  inventory:   "Inventory",
  purchase:    "Purchase",
  "sales-crm": "Sales & CRM",
  hr:          "HR",
  finance:     "Finance",
  admin:       "Admin",
  documents:   "Documents",
  gst:         "GST Compliance",
};

interface HeaderProps {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  usersList: User[];
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  branchesList: Branch[];
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onUpdateCredentials: (userId: string, newEmail: string, newPassword: string) => void;
  onOpenMobileMenu?: () => void;
  activeView?: string;
}

export default function Header({
  currentUser, setCurrentUser, usersList, currentBranch, setCurrentBranch,
  branchesList, notifications, setNotifications, globalSearchQuery,
  setGlobalSearchQuery, onNavigate, onLogout, onUpdateCredentials,
  onOpenMobileMenu, activeView = "dashboard",
}: HeaderProps) {
  const [showRoleMenu, setShowRoleMenu]           = useState(false);
  const [showBranchMenu, setShowBranchMenu]       = useState(false);
  const [showNotifTray, setShowNotifTray]         = useState(false);
  const [showProfileMenu, setShowProfileMenu]     = useState(false);
  const [showCredModal, setShowCredModal]         = useState(false);
  const [credForm, setCredForm]                   = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [credMsg, setCredMsg]                     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const unread = notifications.filter(n => !n.read).length;

  const closeAll = () => { setShowRoleMenu(false); setShowBranchMenu(false); setShowNotifTray(false); setShowProfileMenu(false); };

  const pageTitle = VIEW_TITLES[activeView] ?? activeView;
  const initials  = currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* ── Header bar ── */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center border-b border-slate-200 bg-white px-3 md:px-5 gap-3 shadow-sm">

        {/* Hamburger — mobile */}
        <button onClick={onOpenMobileMenu}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 shrink-0">
          <Menu className="h-5 w-5" />
        </button>

        {/* Page title — desktop */}
        <h1 className="hidden md:block text-xl font-bold text-slate-800 shrink-0 min-w-[120px]">
          {pageTitle}
        </h1>

        {/* Search */}
        <div className="relative flex-1 max-w-sm md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={globalSearchQuery}
            onChange={e => setGlobalSearchQuery(e.target.value)}
            placeholder="Search leads, products, invoices…"
            className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
          {globalSearchQuery && (
            <button onClick={() => setGlobalSearchQuery("")}
              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto shrink-0">

          {/* Branch selector — sm+ */}
          <div className="relative hidden sm:block">
            <button onClick={() => { closeAll(); setShowBranchMenu(p => !p); }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="hidden md:inline max-w-[100px] truncate">{currentBranch.name}</span>
            </button>
            {showBranchMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-50">
                <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Branch</p>
                {branchesList.map(br => (
                  <button key={br.id} onClick={() => { setCurrentBranch(br); setShowBranchMenu(false); }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      br.id === currentBranch.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                    }`}>
                    <div>
                      <div className="font-medium">{br.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{br.code}</div>
                    </div>
                    {br.id === currentBranch.id && <Check className="h-4 w-4 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simulate Role — admin only, desktop */}
          {currentUser.role === UserRole.SYSTEM_ADMIN && (
            <div className="relative hidden md:block">
              <button onClick={() => { closeAll(); setShowRoleMenu(p => !p); }}
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-100">
                <Sparkles className="h-4 w-4" />
                <span>Role</span>
                <span className="text-xs bg-indigo-100 border border-indigo-200 rounded px-1">{currentUser.role.split(" ")[0]}</span>
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-1 z-50 max-h-80 overflow-y-auto">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simulate Roles</p>
                  {usersList.map(u => (
                    <button key={u.id} onClick={() => { setCurrentUser(u); setShowRoleMenu(false); }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        u.id === currentUser.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                      }`}>
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-slate-800 truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{u.role}</div>
                      </div>
                      {u.id === currentUser.id && <Check className="h-4 w-4 text-indigo-500 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bell */}
          <div className="relative">
            <button onClick={() => { closeAll(); setShowNotifTray(p => !p); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {showNotifTray && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl p-0 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm font-bold text-slate-700">Notifications {unread > 0 && `(${unread})`}</span>
                  {unread > 0 && (
                    <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Mark all read</button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-slate-400">
                      <CheckCircle className="h-8 w-8 mb-2 text-slate-300" />
                      <span className="text-xs">All caught up!</span>
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id}
                      onClick={() => {
                        setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x));
                        if (n.title.toLowerCase().includes("stock")) onNavigate("inventory");
                        else if (n.title.toLowerCase().includes("purchase")) onNavigate("purchase");
                        setShowNotifTray(false);
                      }}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${n.read ? "opacity-60" : "bg-indigo-50/50 hover:bg-indigo-50"}`}>
                      {n.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                      {n.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />}
                      {n.type === "info"    && <Info className="h-4 w-4 text-sky-500 mt-0.5 shrink-0" />}
                      {n.type === "error"   && <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                          <button onClick={e => { e.stopPropagation(); setNotifications(p => p.filter(x => x.id !== n.id)); }}
                            className="text-slate-300 hover:text-slate-500 shrink-0"><X className="h-3 w-3" /></button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="relative">
            <button onClick={() => { closeAll(); setShowProfileMenu(p => !p); }}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-50 transition-colors">
              <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {initials}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-800 leading-tight">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400">{currentUser.role}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden lg:block" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1 z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                </div>
                <button onClick={() => { setCredForm({ email: currentUser.email, newPassword: "", confirmPassword: "" }); setCredMsg(null); setShowCredModal(true); setShowProfileMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <KeyRound className="h-4 w-4 text-indigo-500" /> Change Password
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button onClick={() => { onLogout(); setShowProfileMenu(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Change Credentials Modal ── */}
      {showCredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-500" /> Change Login / Password
              </h2>
              <button onClick={() => setShowCredModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Login Email</label>
                <input type="email" value={credForm.email} onChange={e => setCredForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">New Password <span className="text-slate-400 normal-case font-normal">(leave blank to keep)</span></label>
                <input type="password" value={credForm.newPassword} onChange={e => setCredForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="New password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Confirm Password</label>
                <input type="password" value={credForm.confirmPassword} onChange={e => setCredForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat password" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400" />
              </div>
              {credMsg && (
                <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${credMsg.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {credMsg.text}
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCredModal(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => {
                if (!credForm.email.trim()) { setCredMsg({ type: "err", text: "Email cannot be empty." }); return; }
                if (credForm.newPassword && credForm.newPassword !== credForm.confirmPassword) { setCredMsg({ type: "err", text: "Passwords do not match." }); return; }
                if (credForm.newPassword && credForm.newPassword.length < 6) { setCredMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
                onUpdateCredentials(currentUser.id, credForm.email.trim(), credForm.newPassword || currentUser.password || "");
                setCredMsg({ type: "ok", text: "Updated successfully!" });
                setTimeout(() => setShowCredModal(false), 1200);
              }} className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

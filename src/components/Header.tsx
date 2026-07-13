/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Search,
  Bell,
  Building2,
  Users,
  User as UserIcon,
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  LogOut,
  KeyRound,
  ChevronDown
} from "lucide-react";
import { User, UserRole, Branch, AppNotification } from "../types";

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
}

export default function Header({
  currentUser,
  setCurrentUser,
  usersList,
  currentBranch,
  setCurrentBranch,
  branchesList,
  notifications,
  setNotifications,
  globalSearchQuery,
  setGlobalSearchQuery,
  onNavigate,
  onLogout,
  onUpdateCredentials,
}: HeaderProps) {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [credForm, setCredForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [credMsg, setCredMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 shadow-xs">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          placeholder="Global Search (Suppliers, Products, Leads, Invoices...)"
          className="block w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
        />
        {globalSearchQuery && (
          <button
            onClick={() => setGlobalSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Branch Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowBranchMenu(!showBranchMenu);
              setShowRoleMenu(false);
              setShowNotificationTray(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800 focus:outline-hidden"
          >
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="hidden md:inline">{currentBranch.name}</span>
            <span className="md:hidden">{currentBranch.code.split("-")[1] || currentBranch.code}</span>
          </button>

          {showBranchMenu && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl focus:outline-hidden">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Switch Branch
              </div>
              {branchesList.map((br) => (
                <button
                  key={br.id}
                  onClick={() => {
                    setCurrentBranch(br);
                    setShowBranchMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                    br.id === currentBranch.id
                      ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/40"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{br.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{br.code}</span>
                  </div>
                  {br.id === currentBranch.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic User Switcher (Interactive Sandbox Feature for Admins/Demo only) */}
        {(currentUser.role === UserRole.SYSTEM_ADMIN || 
          currentUser.role === UserRole.COMPANY_ADMIN || 
          currentUser.role === UserRole.READ_ONLY) && (
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowBranchMenu(false);
                setShowNotificationTray(false);
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/20 transition-colors focus:outline-hidden animate-fadeIn"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="hidden md:inline">Simulate Role</span>
              <span className="text-xs bg-indigo-950 px-1.5 py-0.5 rounded-sm font-semibold text-indigo-400 border border-indigo-900/60">{currentUser.role.split(" ")[0]}</span>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl focus:outline-hidden max-h-96 overflow-y-auto z-50">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  Simulate System Roles
                </div>
                {usersList.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowRoleMenu(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      u.id === currentUser.id
                        ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/40"
                        : "text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-400">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-xs leading-none mb-1 text-slate-200">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none mb-1">{u.role}</span>
                      <span className="text-[9px] text-slate-500 font-mono leading-none truncate">{u.email}</span>
                    </div>
                    {u.id === currentUser.id && <Check className="h-4 w-4 ml-auto self-center shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notification Tray */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotificationTray(!showNotificationTray);
              setShowRoleMenu(false);
              setShowBranchMenu(false);
            }}
            className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-hidden"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationTray && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl focus:outline-hidden z-50">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
                <span className="text-xs font-bold text-slate-300">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500">
                    <CheckCircle className="h-8 w-8 mb-2 text-slate-600" />
                    <span className="text-xs font-semibold">All caught up! No alerts.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        // Mark as read when clicked
                        setNotifications(prev =>
                          prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                        );
                        if (notif.title.toLowerCase().includes("stock")) {
                          onNavigate("inventory");
                        } else if (notif.title.toLowerCase().includes("purchase") || notif.title.toLowerCase().includes("po")) {
                          onNavigate("purchase");
                        }
                        setShowNotificationTray(false);
                      }}
                      className={`flex items-start gap-2.5 border-b border-slate-800/60 p-3 text-left transition-colors cursor-pointer ${
                        notif.read ? "bg-slate-950/40 opacity-70" : "bg-indigo-950/20 hover:bg-indigo-950/40"
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {notif.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        {notif.type === "info" && <Info className="h-4 w-4 text-sky-500" />}
                        {notif.type === "error" && <X className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-slate-200">{notif.title}</span>
                          <button 
                            onClick={(e) => handleDismissNotification(notif.id, e)}
                            className="text-slate-500 hover:text-slate-300 rounded-sm p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400 leading-normal">{notif.message}</p>
                        <span className="mt-1 block text-[9px] text-slate-500 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge + Profile Dropdown */}
        <div className="relative flex items-center gap-3 border-l border-slate-800 pl-4">
          <button
            onClick={() => { setShowProfileMenu(p => !p); setShowRoleMenu(false); setShowBranchMenu(false); setShowNotificationTray(false); }}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-sm font-bold text-indigo-400">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-200 leading-tight">{currentUser.name}</span>
              <span className="text-[10px] font-medium text-slate-400 leading-none">{currentUser.role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-52 origin-top-right rounded-xl border border-slate-800 bg-slate-950 p-1 shadow-2xl z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={() => {
                  setCredForm({ email: currentUser.email, newPassword: "", confirmPassword: "" });
                  setCredMsg(null);
                  setShowCredModal(true);
                  setShowProfileMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <KeyRound className="h-4 w-4 text-indigo-400" />
                Change Login / Password
              </button>
              <div className="border-t border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => { onLogout(); setShowProfileMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}

          {/* Standalone Log Out button (always visible) */}
          <button
            onClick={onLogout}
            title="Log Out"
            className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>

        {/* Change Credentials Modal */}
        {showCredModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2"><KeyRound className="h-4 w-4 text-indigo-400" /> Change Login / Password</h2>
                <button onClick={() => setShowCredModal(false)} className="text-slate-500 hover:text-slate-300"><X className="h-5 w-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Login Email (ID)</label>
                  <input
                    type="email"
                    value={credForm.email}
                    onChange={e => setCredForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password <span className="text-slate-600 normal-case font-normal">(leave blank to keep current)</span></label>
                  <input
                    type="password"
                    value={credForm.newPassword}
                    onChange={e => setCredForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={credForm.confirmPassword}
                    onChange={e => setCredForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {credMsg && (
                  <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${credMsg.type === "ok" ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                    {credMsg.text}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCredModal(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800">Cancel</button>
                <button
                  onClick={() => {
                    if (!credForm.email.trim()) { setCredMsg({ type: "err", text: "Email cannot be empty." }); return; }
                    if (credForm.newPassword && credForm.newPassword !== credForm.confirmPassword) { setCredMsg({ type: "err", text: "Passwords do not match." }); return; }
                    if (credForm.newPassword && credForm.newPassword.length < 6) { setCredMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
                    const finalPassword = credForm.newPassword || currentUser.password || "";
                    onUpdateCredentials(currentUser.id, credForm.email.trim(), finalPassword);
                    setCredMsg({ type: "ok", text: "Credentials updated successfully!" });
                    setTimeout(() => setShowCredModal(false), 1200);
                  }}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

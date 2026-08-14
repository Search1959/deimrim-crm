/**
 * Mobile App Shell — Android-style wrapper for DEINRIM OMS
 * Shows on screens < 768px. Desktop layout unchanged.
 */
import React, { useState } from "react";
import {
  Bell, ChevronLeft, Search, User as UserIcon,
  LayoutDashboard, Boxes, ShoppingBag, TrendingUp,
  Users2, Wallet, Settings, FolderOpen, FileSpreadsheet,
  Briefcase, ExternalLink, ShieldCheck, LogOut, KeyRound,
  X, Menu, Building,
} from "lucide-react";
import { User, UserRole, AppNotification, Branch, Company } from "../types";

interface Props {
  currentUser: User;
  activeView: string;
  setActiveView: (v: string) => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  onLogout: () => void;
  company: Company;
  currentBranch: Branch;
  children: React.ReactNode;
}

const ALL_TABS = [
  { id: "dashboard", name: "Dashboard",  icon: LayoutDashboard },
  { id: "inventory", name: "Inventory",  icon: Boxes },
  { id: "purchase",  name: "Purchase",   icon: ShoppingBag },
  { id: "sales-crm", name: "Sales",      icon: TrendingUp },
  { id: "hr",        name: "HR",         icon: Users2 },
  { id: "finance",   name: "Finance",    icon: Wallet },
  { id: "admin",     name: "Admin",      icon: Settings },
  { id: "documents", name: "Docs",       icon: FolderOpen },
  { id: "gst",       name: "GST",        icon: FileSpreadsheet },
];

const VIEW_TITLES: Record<string, string> = {
  dashboard: "Dashboard", inventory: "Inventory", purchase: "Purchase",
  "sales-crm": "Sales & CRM", hr: "HR", finance: "Finance",
  admin: "Admin", documents: "Documents", gst: "GST Compliance",
};

export default function MobileAppShell({
  currentUser, activeView, setActiveView,
  notifications, setNotifications, onLogout,
  company, currentBranch, children,
}: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const allowed = ALL_TABS.filter(t => {
    const r = currentUser.role;
    if (r === UserRole.SYSTEM_ADMIN || r === UserRole.COMPANY_ADMIN || r === UserRole.READ_ONLY) return true;
    const map: Record<string, string> = {
      [UserRole.INVENTORY_MANAGER]: "inventory",
      [UserRole.PURCHASE_MANAGER]: "purchase",
      [UserRole.SALES_MANAGER]: "sales-crm",
      [UserRole.CRM_EXECUTIVE]: "sales-crm",
      [UserRole.HR_MANAGER]: "hr",
      [UserRole.FINANCE_MANAGER]: "finance",
      [UserRole.EMPLOYEE]: "dashboard",
    };
    return t.id === map[r];
  });

  const bottomTabs = allowed.slice(0, 4);
  const hasMore = allowed.length > 4;

  const navigate = (id: string) => {
    setActiveView(id);
    setDrawerOpen(false);
    setShowNotif(false);
    setShowProfile(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 md:hidden overflow-hidden">

      {/* ── Status Bar strip (Android feel) ─────────────────────────── */}
      <div className="h-6 w-full bg-indigo-700 flex items-center justify-end px-4 shrink-0">
        <span className="text-[9px] text-indigo-200 font-mono font-bold tracking-widest">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* ── App Bar ─────────────────────────────────────────────────── */}
      <div className="h-14 w-full bg-indigo-600 flex items-center justify-between px-3 shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawerOpen(true)} className="p-1.5 rounded-full hover:bg-indigo-500 active:bg-indigo-700 transition-colors">
            <Menu className="h-5 w-5 text-white" />
          </button>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-white">{VIEW_TITLES[activeView] || "DEINRIM OMS"}</span>
            <span className="text-[10px] text-indigo-200 font-mono">{company.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            className="relative p-2 rounded-full hover:bg-indigo-500 active:bg-indigo-700 transition-colors">
            <Bell className="h-5 w-5 text-white" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-indigo-600">
                {unread}
              </span>
            )}
          </button>
          {/* Avatar */}
          <button onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
            className="h-8 w-8 rounded-full bg-indigo-400 border-2 border-indigo-300 flex items-center justify-center text-sm font-bold text-indigo-900 ml-1">
            {currentUser.name.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* ── Notification Panel ──────────────────────────────────────── */}
      {showNotif && (
        <div className="absolute top-20 right-0 left-0 z-50 bg-slate-950 border-b border-slate-800 max-h-72 overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">Notifications ({unread} new)</span>
            {unread > 0 && (
              <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))}
                className="text-[10px] text-indigo-400">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">All caught up! 🎉</div>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
              className={`px-4 py-3 border-b border-slate-800/60 ${n.read ? "opacity-60" : "bg-indigo-950/20"}`}>
              <p className="text-xs font-bold text-slate-200">{n.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Profile Sheet ────────────────────────────────────────────── */}
      {showProfile && (
        <div className="absolute top-20 right-3 z-50 w-52 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-indigo-950/40">
            <p className="text-sm font-bold text-white">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
            <p className="text-[10px] text-indigo-400 mt-0.5">{currentUser.role}</p>
          </div>
          <button onClick={() => { setShowProfile(false); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 border-b border-slate-800">
            <KeyRound className="h-4 w-4 text-indigo-400" /> Change Password
          </button>
          <button onClick={() => { setShowProfile(false); onLogout(); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      )}

      {/* ── Side Drawer ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-72 h-full bg-slate-900 flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="h-20 bg-indigo-700 flex items-end px-4 pb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 rounded-full bg-indigo-400 flex items-center justify-center text-lg font-bold text-indigo-900">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-200 truncate max-w-[160px]">{currentUser.email}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-indigo-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Company info */}
            <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-slate-200">{company.name}</p>
                <p className="text-[10px] text-slate-500">{currentBranch.name}</p>
              </div>
            </div>

            {/* Role */}
            <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400">Role: <strong className="text-indigo-400">{currentUser.role}</strong></span>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {allowed.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button key={item.id} onClick={() => navigate(item.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                      isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}>
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span className="text-sm font-semibold">{item.name}</span>
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-white" />}
                  </button>
                );
              })}
            </nav>

            {/* AD Services */}
            <div className="px-3 py-3 border-t border-slate-800">
              <a href="https://deinrim360.in/services" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3 bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                AD Services
                <ExternalLink className="h-3.5 w-3.5 ml-auto text-indigo-500" />
              </a>
            </div>

            {/* Logout */}
            <button onClick={() => { setDrawerOpen(false); onLogout(); }}
              className="flex items-center gap-3 px-4 py-4 border-t border-slate-800 text-red-400 text-sm font-semibold w-full hover:bg-red-500/10 transition-colors">
              <LogOut className="h-5 w-5" /> Log Out
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16">
        {children}
      </div>

      {/* ── Bottom Tab Bar ───────────────────────────────────────────── */}
      <div className="h-16 w-full bg-slate-900 border-t border-slate-800 flex items-stretch shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        {bottomTabs.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 relative transition-colors active:bg-slate-800 ${
                isActive ? "text-indigo-400" : "text-slate-500"
              }`}>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 bg-indigo-500 rounded-b-full" />}
              <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-semibold leading-tight">{item.name}</span>
            </button>
          );
        })}
        {hasMore && (
          <button onClick={() => setDrawerOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-500 active:bg-slate-800">
            <div className="flex flex-col gap-0.5 items-center">
              <span className="w-4 h-0.5 bg-slate-500 rounded block" />
              <span className="w-4 h-0.5 bg-slate-500 rounded block" />
              <span className="w-4 h-0.5 bg-slate-500 rounded block" />
            </div>
            <span className="text-[10px] font-semibold">More</span>
          </button>
        )}
      </div>
    </div>
  );
}

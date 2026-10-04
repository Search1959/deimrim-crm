/**
 * Mobile App Shell — matches deinrimapp.in/realestate mobile interface
 * Dark top bar + white bottom nav with raised center Menu button
 */
import React, { useState } from "react";
import {
  Bell, Menu, X, LogOut, KeyRound, ShieldCheck,
  LayoutDashboard, Boxes, ShoppingBag, TrendingUp,
  Users2, Wallet, Settings, FolderOpen, FileSpreadsheet,
  UserCircle, ScanLine, Building, Briefcase, ExternalLink,
  LayoutGrid,
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
  { id: "pos",       name: "POS",       icon: ScanLine },
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
  { id: "my-hr",     name: "My HR",     icon: UserCircle },
  { id: "inventory", name: "Inventory", icon: Boxes },
  { id: "purchase",  name: "Purchase",  icon: ShoppingBag },
  { id: "sales-crm", name: "Sales",     icon: TrendingUp },
  { id: "hr",        name: "HR",        icon: Users2 },
  { id: "finance",   name: "Finance",   icon: Wallet },
  { id: "admin",     name: "Admin",     icon: Settings },
  { id: "documents", name: "Docs",      icon: FolderOpen },
  { id: "gst",       name: "GST",       icon: FileSpreadsheet },
];

const VIEW_TITLES: Record<string, string> = {
  pos: "POS Terminal", dashboard: "Dashboard", "my-hr": "My HR",
  inventory: "Inventory", purchase: "Purchase", "sales-crm": "Sales & CRM",
  hr: "HR", finance: "Finance", admin: "Admin", documents: "Documents", gst: "GST",
};

export default function MobileAppShell({
  currentUser, activeView, setActiveView,
  notifications, setNotifications, onLogout,
  company, currentBranch, children,
}: Props) {
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [showNotif, setShowNotif]     = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unread = notifications.filter(n => !n.read).length;
  const initials = currentUser.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const allowed = ALL_TABS.filter(t => {
    if (t.id === "pos" || t.id === "my-hr") return true;
    const r = currentUser.role;
    if (r === UserRole.SYSTEM_ADMIN || r === UserRole.COMPANY_ADMIN || r === UserRole.READ_ONLY) return true;
    const map: Record<string, string> = {
      [UserRole.INVENTORY_MANAGER]: "inventory",
      [UserRole.PURCHASE_MANAGER]:  "purchase",
      [UserRole.SALES_MANAGER]:     "sales-crm",
      [UserRole.CRM_EXECUTIVE]:     "sales-crm",
      [UserRole.HR_MANAGER]:        "hr",
      [UserRole.FINANCE_MANAGER]:   "finance",
      [UserRole.EMPLOYEE]:          "dashboard",
    };
    return t.id === map[r];
  });

  // Bottom nav: 2 left + centre Menu + 2 right
  const leftTabs  = allowed.slice(0, 2);
  const rightTabs = allowed.slice(2, 4);
  const hasMore   = allowed.length > 4;

  const navigate = (id: string) => {
    setActiveView(id);
    setDrawerOpen(false);
    setShowNotif(false);
    setShowProfile(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 md:hidden overflow-hidden">

      {/* ── Top App Bar (dark, matches real-estate) ── */}
      <div data-theme="dark" className="h-14 w-full bg-[#0f172a] flex items-center justify-between px-3 shrink-0 shadow-md">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-2.5">
          <button onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 active:bg-white/20">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-base font-bold text-white">
            {VIEW_TITLES[activeView] ?? "DEINRIM OMS"}
          </span>
        </div>
        {/* Right: bell + avatar */}
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            className="relative p-2 rounded-full text-slate-300 hover:bg-white/10">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center ring-1 ring-[#0f172a]">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <button onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
            className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white border-2 border-indigo-400 ml-0.5">
            {initials}
          </button>
          {/* dropdown caret */}
          <svg className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* ── Notification panel ── */}
      {showNotif && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-white border-b border-slate-200 max-h-72 overflow-y-auto shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-700">Notifications {unread > 0 && `(${unread})`}</span>
            {unread > 0 && (
              <button onClick={() => setNotifications(p => p.map(n => ({ ...n, read: true })))}
                className="text-xs text-indigo-600 font-medium">Mark all read</button>
            )}
          </div>
          {notifications.length === 0
            ? <div className="p-6 text-center text-slate-400 text-sm">All caught up!</div>
            : notifications.map(n => (
              <div key={n.id}
                onClick={() => setNotifications(p => p.map(x => x.id === n.id ? { ...x, read: true } : x))}
                className={`px-4 py-3 border-b border-slate-50 ${n.read ? "opacity-60" : "bg-indigo-50/40"}`}>
                <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
              </div>
            ))}
        </div>
      )}

      {/* ── Profile sheet ── */}
      {showProfile && (
        <div className="absolute top-14 right-3 z-50 w-52 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-indigo-50">
            <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            <p className="text-[10px] text-indigo-600 mt-0.5 font-medium">{currentUser.role}</p>
          </div>
          <button onClick={() => setShowProfile(false)}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 border-b border-slate-100">
            <KeyRound className="h-4 w-4 text-indigo-500" /> Change Password
          </button>
          <button onClick={() => { setShowProfile(false); onLogout(); }}
            className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      )}

      {/* ── Side Drawer (white, matches real-estate) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-64 h-full bg-white flex flex-col shadow-2xl border-r border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 border-b border-slate-100 h-14 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-extrabold text-slate-800 truncate max-w-[130px]">{company.name}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{currentBranch.name}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.role}</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {allowed.map(item => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button key={item.id} onClick={() => navigate(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium mb-0.5 transition-colors ${
                      active ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}>
                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span className="font-semibold">{item.name}</span>
                    {active && <span className="ml-auto h-2 w-2 rounded-full bg-white/70" />}
                  </button>
                );
              })}
            </nav>

            <div className="px-3 py-3 border-t border-slate-100">
              <a href="https://deinrim360.in/services" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-2">
                <Briefcase className="h-4 w-4" />
                AD Services
                <ExternalLink className="h-3.5 w-3.5 ml-auto text-indigo-400" />
              </a>
              <button onClick={() => { setDrawerOpen(false); onLogout(); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-semibold">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20">
        {children}
      </div>

      {/* ── Bottom Tab Bar (white, real-estate style) ── */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-end shadow-[0_-2px_16px_rgba(0,0,0,0.08)] z-30">
        {/* Left 2 tabs */}
        {leftTabs.map(item => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`flex flex-1 flex-col items-center justify-center pb-2 pt-2 gap-0.5 transition-colors ${
                active ? "text-indigo-600" : "text-slate-400"
              }`}>
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </button>
          );
        })}

        {/* Centre raised "Menu" button */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-16 pb-2">
          <button onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 -mt-5">
            <div className="h-14 w-14 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-300">
              <LayoutGrid className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 mt-0.5">Menu</span>
          </button>
        </div>

        {/* Right 2 tabs */}
        {rightTabs.map(item => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`flex flex-1 flex-col items-center justify-center pb-2 pt-2 gap-0.5 transition-colors ${
                active ? "text-indigo-600" : "text-slate-400"
              }`}>
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </button>
          );
        })}

        {/* If fewer than 4 allowed tabs, fill with notifications shortcut */}
        {rightTabs.length < 2 && (
          <button onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            className="flex flex-1 flex-col items-center justify-center pb-2 pt-2 gap-0.5 text-slate-400 relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1/4 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
            <span className="text-[10px] font-semibold">Alerts</span>
          </button>
        )}
      </div>
    </div>
  );
}

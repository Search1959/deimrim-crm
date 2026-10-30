/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import {
  LayoutDashboard, Settings, ShoppingBag, Boxes, TrendingUp,
  Users2, Wallet, FolderOpen, ShieldCheck, Building,
  FileSpreadsheet, UserCircle, X,
} from "lucide-react";
import { Company, UserRole } from "../types";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userRole: UserRole;
  company: Company;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

// Nav structure with section groupings (matches real-estate app style)
const NAV_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { id: "dashboard", name: "Dashboard", icon: LayoutDashboard },
      { id: "my-hr",     name: "My HR",     icon: UserCircle },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { id: "inventory",  name: "Inventory",   icon: Boxes },
      { id: "purchase",   name: "Purchase",    icon: ShoppingBag },
      { id: "sales-crm",  name: "Sales & CRM", icon: TrendingUp },
      { id: "hr",         name: "HR",          icon: Users2 },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { id: "finance", name: "Finance", icon: Wallet },
      { id: "gst",     name: "GST",     icon: FileSpreadsheet },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "documents", name: "Documents", icon: FolderOpen },
      { id: "admin",     name: "Admin",     icon: Settings },
    ],
  },
];

function isAllowed(id: string, userRole: UserRole): boolean {
  if (id === "my-hr") return true;
  if (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.COMPANY_ADMIN) return true;
  if (userRole === UserRole.READ_ONLY) return id !== "admin";
  const map: Record<string, string> = {
    [UserRole.INVENTORY_MANAGER]: "inventory",
    [UserRole.PURCHASE_MANAGER]:  "purchase",
    [UserRole.SALES_MANAGER]:     "sales-crm",
    [UserRole.CRM_EXECUTIVE]:     "sales-crm",
    [UserRole.HR_MANAGER]:        "hr",
    [UserRole.FINANCE_MANAGER]:   "finance",
    [UserRole.EMPLOYEE]:          "dashboard",
  };
  return id === map[userRole];
}

interface NavListProps {
  activeView: string;
  userRole: UserRole;
  onNavigate: (id: string) => void;
  collapsed?: boolean;
}

function NavList({ activeView, userRole, onNavigate, collapsed = false }: NavListProps) {
  return (
    <nav className="flex-1 overflow-y-auto py-3" style={{ overscrollBehavior: "contain" }}>
      {NAV_SECTIONS.map(section => {
        const allowed = section.items.filter(i => isAllowed(i.id, userRole));
        if (allowed.length === 0) return null;
        return (
          <div key={section.label} className="mb-1">
            {!collapsed && (
              <p className="mb-1 mt-3 px-5 text-[10px] font-bold tracking-[.08em] text-slate-500 uppercase select-none">
                {section.label}
              </p>
            )}
            {allowed.map(item => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.name : undefined}
                  className={`group relative flex w-full items-center gap-[.7rem] text-left text-[.87rem] transition-colors duration-100 mb-0.5
                    ${collapsed ? "justify-center px-0 py-[.42rem]" : "px-5 py-[.42rem]"}
                    ${active
                      ? "border-l-[3px] border-indigo-400 bg-indigo-500/20 text-white font-semibold"
                      : "border-l-[3px] border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-indigo-300" : "text-slate-400 group-hover:text-slate-200"}`} />
                  {!collapsed && (
                    <span className="truncate leading-none">{item.name}</span>
                  )}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-3 rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 whitespace-nowrap shadow-lg">
                      {item.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

export default function Sidebar({
  activeView, setActiveView, collapsed, setCollapsed,
  userRole, company, mobileOpen = false, setMobileOpen,
}: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen?.(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  const navigate = (id: string) => { setActiveView(id); setMobileOpen?.(false); };

  // ── Desktop sidebar ──────────────────────────────────────────────────────
  const DesktopSidebar = (
    <aside className={`hidden md:flex relative flex-col transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[252px]"}`}
      style={{ background: "#0f172a", color: "#cbd5e1" }}>
      {/* Logo / brand */}
      <div className={`flex h-14 items-center shrink-0 ${collapsed ? "justify-center px-2" : "gap-3 px-5"}`}
        style={{ borderBottom: "1px solid #1e293b" }}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-900/40">
          <Building className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-extrabold text-white truncate leading-tight" title={company.name}>{company.name}</span>
            <span className="text-[10px] font-medium" style={{ color: "#94a3b8" }}>{userRole}</span>
          </div>
        )}
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[26px] z-50 flex h-6 w-6 items-center justify-center rounded-full shadow-md"
        style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}
      >
        {collapsed ? (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6"/></svg>
        ) : (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6"/></svg>
        )}
      </button>

      <NavList activeView={activeView} userRole={userRole} onNavigate={navigate} collapsed={collapsed} />

      {!collapsed && (
        <div className="px-5 py-3 shrink-0" style={{ borderTop: "1px solid #1e293b" }}>
          <p className="text-[10px] font-medium text-center" style={{ color: "#64748b" }}>DEINRIM OMS v1.2</p>
        </div>
      )}
    </aside>
  );

  // ── Mobile slide-out drawer ──────────────────────────────────────────────
  const MobileDrawer = (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen?.(false)} />
      )}
      <div className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col shadow-2xl transition-transform duration-300 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#0f172a", color: "#cbd5e1" }}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between px-4 shrink-0" style={{ borderBottom: "1px solid #1e293b" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white">
              <Building className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-extrabold text-white truncate max-w-[130px]">{company.name}</span>
              <span className="text-[10px]" style={{ color: "#94a3b8" }}>{userRole}</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen?.(false)} className="p-1.5 rounded-lg" style={{ color: "#94a3b8" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <NavList activeView={activeView} userRole={userRole} onNavigate={navigate} />
      </div>
    </>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileDrawer}
    </>
  );
}

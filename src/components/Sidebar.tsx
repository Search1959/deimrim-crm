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
    <nav className="flex-1 overflow-y-auto px-3 py-3">
      {NAV_SECTIONS.map(section => {
        const allowed = section.items.filter(i => isAllowed(i.id, userRole));
        if (allowed.length === 0) return null;
        return (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <p className="mb-1 mt-2 px-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase select-none">
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
                  className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 mb-0.5 ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-slate-700"}`} />
                  {!collapsed && (
                    <span className="truncate font-semibold leading-none">{item.name}</span>
                  )}
                  {collapsed && (
                    <div className="pointer-events-none absolute left-full ml-3 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 z-50 whitespace-nowrap shadow-lg">
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
    <aside className={`hidden md:flex relative flex-col border-r border-slate-200 bg-white transition-all duration-300 ${collapsed ? "w-[68px]" : "w-56"}`}>
      {/* Logo */}
      <div className={`flex h-14 items-center border-b border-slate-100 ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
          <Building className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-extrabold text-slate-800 truncate leading-tight" title={company.name}>{company.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">{userRole}</span>
          </div>
        )}
      </div>

      {/* Toggle collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[26px] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:bg-slate-50 hover:text-slate-600"
      >
        {collapsed ? (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6"/></svg>
        ) : (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6"/></svg>
        )}
      </button>

      <NavList activeView={activeView} userRole={userRole} onNavigate={navigate} collapsed={collapsed} />

      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-medium text-center">DEINRIM OMS v1.2</p>
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
      <div className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[13px] font-extrabold text-slate-800 truncate max-w-[130px]">{company.name}</span>
              <span className="text-[10px] text-slate-400">{userRole}</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen?.(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100">
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

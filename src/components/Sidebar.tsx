/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import {
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Users2,
  Wallet,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  Briefcase,
  ExternalLink,
  FileSpreadsheet,
  X,
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

export default function Sidebar({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  userRole,
  company,
  mobileOpen = false,
  setMobileOpen,
}: SidebarProps) {

  const menuItems = [
    { id: "dashboard",  name: "Dashboard",       icon: LayoutDashboard, description: "Overview & Analytics",          badge: null },
    { id: "inventory",  name: "Inventory",        icon: Boxes,           description: "Real-time Stock Ledger",        badge: "Heart" },
    { id: "purchase",   name: "Purchase",         icon: ShoppingBag,     description: "Procurement & Suppliers",       badge: null },
    { id: "sales-crm",  name: "Sales & CRM",      icon: TrendingUp,      description: "Leads, pipeline & Invoices",    badge: null },
    { id: "hr",         name: "HR",               icon: Users2,          description: "Staff, Leaves & Payroll",       badge: null },
    { id: "finance",    name: "Finance",          icon: Wallet,          description: "Profit / Loss & Cashflow",      badge: null },
    { id: "admin",      name: "Admin",            icon: Settings,        description: "Companies, Roles & Settings",   badge: null },
    { id: "documents",  name: "Documents",        icon: FolderOpen,      description: "Shared files storage",          badge: null },
    { id: "gst",        name: "GST",              icon: FileSpreadsheet, description: "Returns, GSTR-1, GSTR-3B, AI",  badge: null },
  ];

  const allowedMenuItems = menuItems.filter((item) => {
    if (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.COMPANY_ADMIN) return true;
    if (userRole === UserRole.READ_ONLY) return item.id !== "admin";
    switch (userRole) {
      case UserRole.INVENTORY_MANAGER: return item.id === "inventory";
      case UserRole.PURCHASE_MANAGER:  return item.id === "purchase";
      case UserRole.SALES_MANAGER:
      case UserRole.CRM_EXECUTIVE:     return item.id === "sales-crm";
      case UserRole.HR_MANAGER:        return item.id === "hr";
      case UserRole.FINANCE_MANAGER:   return item.id === "finance";
      case UserRole.EMPLOYEE:          return item.id === "dashboard";
      default: return false;
    }
  });

  // Close mobile drawer on outside click / escape
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen?.(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, setMobileOpen]);

  const navigate = (id: string) => {
    setActiveView(id);
    setMobileOpen?.(false);
  };

  // ── Desktop sidebar ──────────────────────────────────────────────────────
  const DesktopSidebar = (
    <aside
      className={`hidden md:flex relative flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/10">
            <Building className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col text-left max-w-[150px] overflow-hidden">
              <span className="font-sans text-xs font-extrabold tracking-wide text-white uppercase truncate" title={company.name}>{company.name}</span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest font-mono truncate">{company.code || "OMS"} v1.2</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="m-4 rounded-xl bg-slate-800/50 p-3 border border-slate-800/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Role Permissions</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Simulated as: <strong className="text-indigo-400">{userRole}</strong>
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => navigate(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 relative ${
                isActive ? "bg-indigo-600 text-white shadow-xs" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300"}`} />
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="truncate leading-none font-semibold">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs font-mono tracking-wide ${
                        isActive ? "bg-white/20 text-white" : "bg-indigo-950/60 text-indigo-400 border border-indigo-900/60"
                      }`}>{item.badge}</span>
                    )}
                  </div>
                  <span className={`block text-[10px] mt-0.5 truncate font-normal ${isActive ? "text-indigo-200" : "text-slate-500"}`}>
                    {item.description}
                  </span>
                </div>
              )}
              {collapsed && (
                <div className="pointer-events-none absolute left-full ml-4 rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <a href="https://deinrim360.in/services" target="_blank" rel="noopener noreferrer"
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 hover:border-indigo-600/60 text-indigo-300 hover:text-indigo-100"
        >
          <Briefcase className="h-5 w-5 shrink-0 text-indigo-400 group-hover:text-indigo-200" />
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="truncate leading-none font-semibold">AD Services</span>
                <ExternalLink className="h-3 w-3 text-indigo-500 group-hover:text-indigo-300" />
              </div>
              <span className="block text-[10px] mt-0.5 text-indigo-500 group-hover:text-indigo-400">Salon, Agency & more</span>
            </div>
          )}
          {collapsed && (
            <div className="pointer-events-none absolute left-full ml-4 rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
              AD Services
            </div>
          )}
        </a>
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-slate-800 text-center text-slate-500 text-[10px] font-mono leading-relaxed bg-slate-950/20">
          <div>ERP SYSTEM CORE</div>
          <div className="text-slate-600 font-semibold uppercase mt-0.5">Inventory First Logic</div>
        </div>
      )}
    </aside>
  );

  // ── Mobile slide-out drawer ──────────────────────────────────────────────
  const MobileDrawer = (
    <>
      {/* Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen?.(false)} />
      )}
      {/* Drawer */}
      <div className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Drawer header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold text-white uppercase truncate max-w-[160px]">{company.name}</span>
              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest font-mono">{company.code || "OMS"} v1.2</span>
            </div>
          </div>
          <button onClick={() => setMobileOpen?.(false)} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="mx-4 my-3 rounded-xl bg-slate-800/50 p-3 border border-slate-800/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Role: <strong className="text-indigo-400">{userRole}</strong></span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto pb-4">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                  isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <div className="flex-1">
                  <div className="font-semibold leading-tight">{item.name}</div>
                  <div className={`text-[10px] mt-0.5 ${isActive ? "text-indigo-200" : "text-slate-500"}`}>{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <a href="https://deinrim360.in/services" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium bg-indigo-950/60 border border-indigo-800/40 text-indigo-300">
            <Briefcase className="h-5 w-5 text-indigo-400" />
            <span>AD Services</span>
            <ExternalLink className="h-3.5 w-3.5 ml-auto text-indigo-500" />
          </a>
        </div>
      </div>
    </>
  );

  // ── Mobile bottom tab bar ────────────────────────────────────────────────
  // Show first 5 allowed items as bottom tabs; "more" opens the drawer
  const bottomItems = allowedMenuItems.slice(0, 4);
  const MobileBottomBar = (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden bg-slate-900 border-t border-slate-800 safe-area-pb">
      {bottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button key={item.id} onClick={() => navigate(item.id)}
            className={`flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
              isActive ? "text-indigo-400" : "text-slate-500"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
            <span className="truncate max-w-[60px] text-center leading-tight">{item.name}</span>
            {isActive && <span className="absolute bottom-0 h-0.5 w-10 bg-indigo-500 rounded-t-full" />}
          </button>
        );
      })}
      {/* More button opens drawer */}
      {allowedMenuItems.length > 4 && (
        <button onClick={() => setMobileOpen?.(true)}
          className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold text-slate-500">
          <div className="flex flex-col gap-0.5 items-center">
            <span className="block w-4 h-0.5 bg-slate-500 rounded" />
            <span className="block w-4 h-0.5 bg-slate-500 rounded" />
            <span className="block w-4 h-0.5 bg-slate-500 rounded" />
          </div>
          <span>More</span>
        </button>
      )}
    </nav>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileDrawer}
      {MobileBottomBar}
    </>
  );
}

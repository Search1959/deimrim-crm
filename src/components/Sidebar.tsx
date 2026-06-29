/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  LayoutDashboard, 
  Settings, 
  ShoppingBag, 
  Boxes, 
  TrendingUp, 
  Users2, 
  Wallet, 
  FolderOpen, 
  Terminal,
  Menu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building
} from "lucide-react";
import { Company, UserRole } from "../types";

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  userRole: UserRole;
  company: Company;
}

export default function Sidebar({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  userRole,
  company,
}: SidebarProps) {
  
  // Define sidebar navigation items
  const menuItems = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
      badge: null,
    },
    {
      id: "inventory",
      name: "Inventory Engine",
      icon: Boxes,
      description: "Real-time Stock Ledger",
      badge: "Heart",
    },
    {
      id: "purchase",
      name: "Purchase Mgmt",
      icon: ShoppingBag,
      description: "Procurement & Suppliers",
      badge: null,
    },
    {
      id: "sales-crm",
      name: "Sales & CRM",
      icon: TrendingUp,
      description: "Leads, pipeline & Invoices",
      badge: null,
    },
    {
      id: "hr",
      name: "HR Management",
      icon: Users2,
      description: "Staff, Leaves & Payroll",
      badge: null,
    },
    {
      id: "finance",
      name: "Finance Overview",
      icon: Wallet,
      description: "Profit / Loss & Cashflow",
      badge: null,
    },
    {
      id: "admin",
      name: "System Admin",
      icon: Settings,
      description: "Companies, Roles & Settings",
      badge: null,
    },
    {
      id: "documents",
      name: "Documents Hub",
      icon: FolderOpen,
      description: "Shared files storage",
      badge: null,
    },
  ];

  // Filter menu items based on role permission
  const allowedMenuItems = menuItems.filter((item) => {
    // System Admin, Company Admin, and Read Only can access everything except admin is restricted for Read Only
    if (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.COMPANY_ADMIN) {
      return true;
    }
    if (userRole === UserRole.READ_ONLY) {
      return item.id !== "admin";
    }

    // Role-specific view filters for staff & managers
    switch (userRole) {
      case UserRole.INVENTORY_MANAGER:
        return item.id === "inventory";
      case UserRole.PURCHASE_MANAGER:
        return item.id === "purchase";
      case UserRole.SALES_MANAGER:
      case UserRole.CRM_EXECUTIVE:
        return item.id === "sales-crm";
      case UserRole.HR_MANAGER:
        return item.id === "hr";
      case UserRole.FINANCE_MANAGER:
        return item.id === "finance";
      case UserRole.EMPLOYEE:
        return item.id === "dashboard";
      default:
        return false;
    }
  });

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header / Logo */}
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
          {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* User Simulation Info (Small visual widget at top of sidebar) */}
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

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 relative ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300"
                }`}
              />
              
              {!collapsed && (
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="truncate leading-none font-semibold">{item.name}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-xs font-mono tracking-wide ${
                        isActive ? "bg-white/20 text-white" : "bg-indigo-950/60 text-indigo-400 border border-indigo-900/60"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className={`block text-[10px] mt-0.5 truncate font-normal ${
                    isActive ? "text-indigo-200" : "text-slate-500"
                  }`}>
                    {item.description}
                  </span>
                </div>
              )}

              {/* Collapsed Tooltip */}
              {collapsed && (
                <div className="pointer-events-none absolute left-full ml-4 rounded-md bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-50 whitespace-nowrap shadow-md">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapsible Sidebar Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 text-center text-slate-500 text-[10px] font-mono leading-relaxed bg-slate-950/20">
          <div>ERP SYSTEM CORE</div>
          <div className="text-slate-600 font-semibold uppercase mt-0.5">Inventory First Logic</div>
        </div>
      )}
    </aside>
  );
}

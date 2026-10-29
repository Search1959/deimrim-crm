/**
 * Full-screen tile grid menu for mobile — matches realestate menu.php
 * Searchable, grouped, navigates to any module.
 */
import React, { useState, useMemo } from "react";
import {
  Search, LayoutDashboard, Boxes, ShoppingBag, TrendingUp,
  Users2, Wallet, Settings, FolderOpen, FileSpreadsheet,
  UserCircle, ScanLine, X,
} from "lucide-react";
import { User, UserRole } from "../types";

interface MenuTile {
  id: string;
  label: string;
  icon: React.ElementType;
  group: string;
}

const ALL_TILES: MenuTile[] = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard, group: "Overview"    },
  { id: "my-hr",      label: "My HR",      icon: UserCircle,      group: "Overview"    },
  { id: "pos",        label: "POS",        icon: ScanLine,        group: "Overview"    },
  { id: "inventory",  label: "Inventory",  icon: Boxes,           group: "Operations"  },
  { id: "purchase",   label: "Purchase",   icon: ShoppingBag,     group: "Operations"  },
  { id: "sales-crm",  label: "Sales & CRM",icon: TrendingUp,      group: "Operations"  },
  { id: "hr",         label: "HR",         icon: Users2,          group: "Operations"  },
  { id: "finance",    label: "Finance",    icon: Wallet,          group: "Finance"     },
  { id: "gst",        label: "GST",        icon: FileSpreadsheet, group: "Finance"     },
  { id: "documents",  label: "Documents",  icon: FolderOpen,      group: "System"      },
  { id: "admin",      label: "Admin",      icon: Settings,        group: "System"      },
];

function isAllowed(tile: MenuTile, role: UserRole): boolean {
  if (tile.id === "pos" || tile.id === "my-hr" || tile.id === "dashboard") return true;
  if (role === UserRole.SYSTEM_ADMIN || role === UserRole.COMPANY_ADMIN || role === UserRole.READ_ONLY) return true;
  const map: Record<string, string[]> = {
    [UserRole.INVENTORY_MANAGER]: ["inventory"],
    [UserRole.PURCHASE_MANAGER]:  ["purchase"],
    [UserRole.SALES_MANAGER]:     ["sales-crm"],
    [UserRole.CRM_EXECUTIVE]:     ["sales-crm"],
    [UserRole.HR_MANAGER]:        ["hr"],
    [UserRole.FINANCE_MANAGER]:   ["finance"],
    [UserRole.EMPLOYEE]:          [],
  };
  return (map[role] ?? []).includes(tile.id);
}

const GROUP_ORDER = ["Overview", "Operations", "Finance", "System"];

interface Props {
  currentUser: User;
  activeView: string;
  setActiveView: (v: string) => void;
  onClose: () => void;
}

export default function MobileMenuView({ currentUser, activeView, setActiveView, onClose }: Props) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const allowed = ALL_TILES.filter(t => isAllowed(t, currentUser.role));
    const q = query.trim().toLowerCase();
    if (!q) return allowed;
    return allowed.filter(t =>
      t.label.toLowerCase().includes(q) || t.group.toLowerCase().includes(q)
    );
  }, [query, currentUser.role]);

  const grouped = useMemo(() => {
    const map: Record<string, MenuTile[]> = {};
    visible.forEach(t => {
      if (!map[t.group]) map[t.group] = [];
      map[t.group].push(t);
    });
    return GROUP_ORDER.map(g => ({ group: g, tiles: map[g] ?? [] })).filter(g => g.tiles.length > 0);
  }, [visible]);

  const navigate = (id: string) => {
    setActiveView(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col md:hidden">

      {/* Header */}
      <div className="h-14 bg-[#0f172a] flex items-center gap-3 px-4 shrink-0">
        <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <span className="text-white font-bold text-base flex-1">All Menus</span>
      </div>

      {/* Search bar */}
      <div className="px-4 pt-4 pb-2 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Find a menu…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Scrollable groups */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {grouped.length === 0 && (
          <p className="text-center text-slate-400 text-sm mt-16">No menus found for "{query}"</p>
        )}

        {grouped.map(({ group, tiles }) => (
          <div key={group}>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{group}</p>
            <div className="grid grid-cols-3 gap-3">
              {tiles.map(tile => {
                const Icon = tile.icon;
                const isActive = activeView === tile.id;
                return (
                  <button
                    key={tile.id}
                    onClick={() => navigate(tile.id)}
                    className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border transition-all active:scale-95 ${
                      isActive
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200"
                        : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    <span className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      isActive ? "bg-white/20" : "bg-slate-100"
                    }`}>
                      <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-indigo-600"}`} />
                    </span>
                    <span className="text-[11px] font-semibold text-center leading-tight">{tile.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

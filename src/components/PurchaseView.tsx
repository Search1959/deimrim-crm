import { toast } from "../utils/toast";
import React, { useState } from "react";
import { ShoppingBag, Users, FileCheck, ChevronRight } from "lucide-react";
import { Supplier, PurchaseOrder, Product, UserRole } from "../types";

import OrdersPanel from "./procurement/OrdersPanel";
import VendorsPanel from "./procurement/VendorsPanel";
import VendorBillsPanel from "./procurement/VendorBillsPanel";

interface PurchaseViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  products: Product[];
  warehouses: any[];
  batchStocks?: any[];
  userRole: UserRole;
  companyId: string;
  onReceiveGRN: (poId: string, warehouseId: string, items: Array<{ productId: string; qty: number; batchNumber: string; expiryDate?: string; rack?: string }>) => void;
  onMarkPOReceived: (poId: string) => void;
}

type ActiveTab = "orders" | "vendors" | "bills";

export default function PurchaseView({
  suppliers,
  setSuppliers,
  purchaseOrders,
  setPurchaseOrders,
  products,
  batchStocks = [],
  userRole,
  companyId,
  onMarkPOReceived,
}: PurchaseViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("orders");

  const handleAddSupplier = (newSup: Omit<Supplier, "id">) => {
    const fresh: Supplier = {
      id: `sup-${Date.now()}`,
      companyId,
      name: newSup.name,
      code: newSup.code,
      contactPerson: newSup.contactPerson,
      email: newSup.email,
      phone: newSup.phone,
      address: newSup.address,
      creditDays: newSup.creditDays,
      taxId: newSup.taxId,
    };
    setSuppliers(prev => [...prev, fresh]);
    toast.success("Vendor Saved", "Added to approved vendor directory");
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm("Are you sure you want to remove this vendor?")) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  const tabs = [
    { id: "orders" as const,  name: "Purchase Orders", icon: ShoppingBag },
    { id: "vendors" as const, name: "Vendor Management", icon: Users },
    { id: "bills" as const,   name: "Vendor Bills",     icon: FileCheck },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "orders":
        return (
          <OrdersPanel
            suppliers={suppliers}
            products={products}
            purchaseOrders={purchaseOrders}
            setPurchaseOrders={setPurchaseOrders}
            onMarkPOReceived={onMarkPOReceived}
            batchStocks={batchStocks}
          />
        );
      case "vendors":
        return (
          <VendorsPanel
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            companyId={companyId}
          />
        );
      case "bills":
        return <VendorBillsPanel suppliers={suppliers} orders={purchaseOrders} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden text-left bg-slate-950/20">
      {/* Sidebar */}
      <div className="w-56 border-r border-slate-900 bg-slate-950/60 flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/25">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <strong className="text-white text-xs block font-bold uppercase tracking-widest font-mono">PURCHASE</strong>
              <span className="text-[10px] text-slate-500 font-mono">Orders & Vendors</span>
            </div>
          </div>
          <nav className="space-y-0.5">
            {tabs.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden bg-slate-950/60 border-b border-slate-900 p-2 flex gap-1 overflow-x-auto">
        {tabs.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 rounded text-[10px] font-bold font-mono shrink-0 cursor-pointer transition-all ${
              activeTab === item.id
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25"
                : "text-slate-500 hover:text-slate-300 bg-slate-900/40"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {renderContent()}
      </div>
    </div>
  );
}

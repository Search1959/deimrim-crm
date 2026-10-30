import { toast } from "../utils/toast";
import React, { useState } from "react";
import { ShoppingBag, Users, FileCheck, ChevronRight } from "lucide-react";
import { Supplier, PurchaseOrder, Product, UserRole, VendorInvoice } from "../types";

import OrdersPanel from "./procurement/OrdersPanel";
import VendorsPanel from "./procurement/VendorsPanel";
import VendorBillsPanel from "./procurement/VendorBillsPanel";

interface PurchaseViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  warehouses: any[];
  batchStocks?: any[];
  setBatchStocks: React.Dispatch<React.SetStateAction<any[]>>;
  userRole: UserRole;
  companyId: string;
  onReceiveGRN: (poId: string, warehouseId: string, items: Array<{ productId: string; qty: number; batchNumber: string; expiryDate?: string; rack?: string }>) => void;
  onMarkPOReceived: (poId: string) => void;
  vendorBills: VendorInvoice[];
  setVendorBills: React.Dispatch<React.SetStateAction<VendorInvoice[]>>;
}

type ActiveTab = "orders" | "vendors" | "bills";

export default function PurchaseView({
  suppliers,
  setSuppliers,
  purchaseOrders,
  setPurchaseOrders,
  products,
  setProducts,
  batchStocks = [],
  setBatchStocks,
  userRole,
  companyId,
  onMarkPOReceived,
  vendorBills,
  setVendorBills,
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
            setSuppliers={setSuppliers}
            products={products}
            setProducts={setProducts}
            purchaseOrders={purchaseOrders}
            setPurchaseOrders={setPurchaseOrders}
            onMarkPOReceived={onMarkPOReceived}
            batchStocks={batchStocks}
            setBatchStocks={setBatchStocks}
            companyId={companyId}
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
        return <VendorBillsPanel
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          orders={purchaseOrders}
          vendorBills={vendorBills}
          setVendorBills={setVendorBills}
          products={products}
          setProducts={setProducts}
          setBatchStocks={setBatchStocks}
          companyId={companyId}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden text-left">

      {/* Mobile tab bar */}
      <div className="md:hidden shrink-0 bg-white border-b border-slate-100 px-3 py-2 flex gap-1 overflow-x-auto">
        {tabs.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              <Icon className="h-3.5 w-3.5" />
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Desktop sidebar */}
      <div className="w-52 border-r border-slate-100 bg-white flex-col shrink-0 hidden md:flex">
        <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <strong className="text-slate-800 text-xs block font-bold">PURCHASE</strong>
            <span className="text-[10px] text-slate-400">Orders & Vendors</span>
          </div>
        </div>
        <nav className="px-3 py-3 space-y-0.5">
          {tabs.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer border-l-[3px] ${
                  isActive ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        {renderContent()}
      </div>
    </div>
  );
}

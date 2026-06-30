import { toast } from "../utils/toast";
import React, { useState } from "react";
import { 
  ShoppingBag, 
  Truck, 
  Users, 
  FileText, 
  Send, 
  Gavel, 
  FileCheck, 
  Landmark, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Supplier, PurchaseOrder, Product, Warehouse, UserRole } from "../types";

// Import new modular subcomponents
import RequisitionsPanel from "./procurement/RequisitionsPanel";
import OrdersPanel from "./procurement/OrdersPanel";
import RFQPanel from "./procurement/RFQPanel";
import AuctionsPanel from "./procurement/AuctionsPanel";
import VendorBillsPanel from "./procurement/VendorBillsPanel";
import VendorPaymentsPanel from "./procurement/VendorPaymentsPanel";
import VendorsPanel from "./procurement/VendorsPanel";
import GRNPanel from "./procurement/GRNPanel";
import ProcurementAnalyticsPanel from "./procurement/ProcurementAnalyticsPanel";
import ProcurementAuditPanel from "./procurement/ProcurementAuditPanel";

interface PurchaseViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  products: Product[];
  warehouses: Warehouse[];
  userRole: UserRole;
  onReceiveGRN: (poId: string, warehouseId: string, items: Array<{ productId: string; qty: number; batchNumber: string; expiryDate?: string; rack?: string }>) => void;
}

type ActiveTab = 
  | "requisitions"
  | "orders"
  | "rfq"
  | "auctions"
  | "bills"
  | "payments"
  | "vendors"
  | "grn"
  | "analytics"
  | "audit";

export default function PurchaseView({
  suppliers,
  setSuppliers,
  purchaseOrders,
  setPurchaseOrders,
  products,
  warehouses,
  userRole,
  onReceiveGRN,
}: PurchaseViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("requisitions");

  // Supplier Management handoff controllers
  const handleAddSupplier = (newSup: Omit<Supplier, "id">) => {
    const fresh: Supplier = {
      id: `sup-${Date.now()}`,
      companyId: "comp-1",
      name: newSup.name,
      code: newSup.code,
      contactPerson: newSup.contactPerson,
      email: newSup.email,
      phone: newSup.phone,
      address: newSup.address,
      creditDays: newSup.creditDays,
      taxId: newSup.taxId
    };

    setSuppliers(prev => [...prev, fresh]);
    toast.success("Vendor Saved", "Added to approved vendor directory")
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm("Are you sure you want to retire this Vendor profile?")) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
    }
  };

  // GRN Inventory Synchronization handoff
  const handleGRNReceived = (poId: string, receivedItems: Array<{ productId: string; quantity: number }>) => {
    const targetWarehouse = warehouses[0]?.id || "wh-main";
    const mapped = receivedItems.map(item => ({
      productId: item.productId,
      qty: item.quantity,
      batchNumber: `B26-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      expiryDate: "2030-12-31",
      rack: "Rack A-01"
    }));

    onReceiveGRN(poId, targetWarehouse, mapped);
    
    // Also mark PO as Completed or grn_pending in state
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        return {
          ...po,
          status: "completed" as const,
          paymentStatus: "unpaid" as const
        };
      }
      return po;
    }));
  };

  const menuGroups = [
    {
      title: "PROCUREMENT",
      items: [
        { id: "requisitions", name: "Purchase Requisitions", icon: FileText },
        { id: "orders", name: "Purchase Orders", icon: ShoppingBag },
        { id: "rfq", name: "RFQ Management", icon: Send },
        { id: "auctions", name: "E-Auctions", icon: Gavel },
      ]
    },
    {
      title: "FINANCE",
      items: [
        { id: "bills", name: "Invoices (Bills)", icon: FileCheck },
        { id: "payments", name: "Payments", icon: Landmark },
      ]
    },
    {
      title: "SUPPLY CHAIN",
      items: [
        { id: "vendors", name: "Vendor Management", icon: Users },
        { id: "grn", name: "Goods Receipt (GRN)", icon: Truck },
      ]
    },
    {
      title: "REPORTING",
      items: [
        { id: "analytics", name: "Analytics & Reports", icon: TrendingUp },
        { id: "audit", name: "Audit Logs", icon: ShieldCheck },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "requisitions":
        return <RequisitionsPanel />;
      case "orders":
        return <OrdersPanel suppliers={suppliers} products={products} />;
      case "rfq":
        return <RFQPanel suppliers={suppliers} />;
      case "auctions":
        return <AuctionsPanel suppliers={suppliers} />;
      case "bills":
        return <VendorBillsPanel suppliers={suppliers} orders={purchaseOrders} />;
      case "payments":
        return <VendorPaymentsPanel bills={[]} />;
      case "vendors":
        return (
          <VendorsPanel 
            suppliers={suppliers} 
            onAddSupplier={handleAddSupplier} 
            onDeleteSupplier={handleDeleteSupplier} 
          />
        );
      case "grn":
        return (
          <GRNPanel 
            orders={purchaseOrders} 
            suppliers={suppliers} 
            onReceiveGRN={handleGRNReceived} 
          />
        );
      case "analytics":
        return <ProcurementAnalyticsPanel />;
      case "audit":
        return <ProcurementAuditPanel />;
      default:
        return <RequisitionsPanel />;
    }
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden text-left bg-slate-950/20">
      {/* Module Navigation left-sidebar */}
      <div className="w-64 border-r border-slate-900 bg-slate-950/60 flex flex-col justify-between shrink-0 font-sans hidden md:flex">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/25">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <strong className="text-white text-xs block font-bold uppercase tracking-widest font-mono">PO SUITE</strong>
              <span className="text-[10px] text-slate-500 font-bold font-mono">Kolkata Operations</span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-4">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="block text-[8px] font-bold text-slate-600 tracking-widest font-mono uppercase px-2">
                  {group.title}
                </span>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as ActiveTab)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
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
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Banner */}
        <div className="p-3 border-t border-slate-900/60 bg-slate-950/20 text-[10px] text-slate-500 font-semibold leading-relaxed">
          <div className="flex items-center gap-1.5 text-indigo-400/80 font-bold uppercase font-mono tracking-wider mb-1">
            <Sparkles className="h-3 w-3" />
            <span>Smart Sourcing</span>
          </div>
          Compliance-audited electronic purchase orders & bidding sheets.
        </div>
      </div>

      {/* Main content workspace area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/15">
        {/* Mobile quick-bar subheader */}
        <div className="md:hidden bg-slate-950/60 border-b border-slate-900 p-2.5 flex items-center gap-1 overflow-x-auto select-none">
          {menuGroups.flatMap(g => g.items).map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`px-3 py-1 rounded text-[10px] font-bold font-mono tracking-tight shrink-0 cursor-pointer transition-all ${
                  isActive 
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25" 
                    : "text-slate-500 hover:text-slate-300 bg-slate-900/40"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Working Panel */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-left max-w-[1500px] w-full mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

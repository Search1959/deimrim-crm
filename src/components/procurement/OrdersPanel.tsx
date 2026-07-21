import { toast } from "../../utils/toast";
import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, Trash2, Check, ShoppingBag, Eye, PackageCheck, X, Upload } from "lucide-react";
import { PurchaseOrder, Supplier, Product, BatchStock, formatINR } from "../../types";

interface OrdersPanelProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  onMarkPOReceived: (poId: string) => void;
  batchStocks?: BatchStock[];
  setBatchStocks: React.Dispatch<React.SetStateAction<BatchStock[]>>;
  companyId: string;
}

// ── SKU generator from product description ─────────────────────────────────
function makeSKU(desc: string): string {
  let s = desc
    .replace(/^LEO PUMPS?\s+/i, "LEO-")
    .replace(/^CENTRIFUGAL PUMP\s+/i, "CENT-")
    .replace(/\s*[-–\s]+\s*/g, "-")
    .replace(/[^A-Z0-9\-]/gi, "")
    .toUpperCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s.slice(0, 25);
}

interface LineItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

function getStock(productId: string, batchStocks: BatchStock[] = []): number {
  return batchStocks.filter(b => b.productId === productId).reduce((s, b) => s + b.quantity, 0);
}

// ── Searchable product combobox ────────────────────────────────────────────
function ProductCombobox({
  products, batchStocks, value, onChange,
}: {
  products: Product[];
  batchStocks: BatchStock[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = products.find(p => p.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const extractHsn = (desc: string) => ((desc || "").match(/HSN[:\s]+(\w+)/i) || [])[1] || "";
  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        extractHsn(p.description || "").toLowerCase().includes(q)
      ).slice(0, 60)
    : products.slice(0, 60);

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white cursor-pointer flex items-center justify-between gap-1 min-h-[26px]"
      >
        <span className={selected ? "text-white" : "text-slate-500"}>
          {selected ? selected.name : "-- Select Product --"}
        </span>
        <span className="text-slate-600 text-[8px]">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-0.5 w-72 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-1.5 border-b border-slate-800">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or HSN…"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-slate-400 font-semibold">No products found</p>
                <p className="text-[9px] text-slate-500 mt-1">Product not in list?</p>
                <p className="text-[9px] text-amber-400 mt-0.5">Go to <span className="font-bold">Inventory Engine → Add Product</span> first, then come back to create the PO.</p>
              </div>
            )}
            {filtered.map(p => {
              const stock = getStock(p.id, batchStocks);
              const hsn = extractHsn(p.description || "");
              return (
                <div
                  key={p.id}
                  onClick={() => { onChange(p.id); setOpen(false); setQuery(""); }}
                  className={`flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-slate-800 text-[10px] ${p.id === value ? "bg-indigo-900/30" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-100 truncate">{p.name}</div>
                    {hsn && <div className="text-slate-500 font-mono text-[9px]">HSN: {hsn}</div>}
                  </div>
                  <span className={`ml-2 font-mono font-bold shrink-0 ${stock === 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {stock} {p.unit || "nos"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vendor combobox ────────────────────────────────────────────────────────
function VendorCombobox({ suppliers, value, onChange }: { suppliers: Supplier[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = suppliers.find(s => s.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? suppliers.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : suppliers;

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => { setOpen(o => !o); setQuery(""); }}
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white cursor-pointer flex items-center justify-between gap-1 min-h-[34px] focus:border-indigo-500"
      >
        <span className={selected ? "text-white font-semibold" : "text-slate-500"}>
          {selected ? `${selected.name} (${selected.code})` : "-- Select Vendor --"}
        </span>
        <span className="text-slate-600 text-[9px]">▼</span>
      </div>
      {open && (
        <div className="absolute z-50 left-0 top-full mt-0.5 w-full bg-slate-950 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-1.5 border-b border-slate-800">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search vendor…"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">No vendors found</div>}
            {filtered.map(s => (
              <div
                key={s.id}
                onClick={() => { onChange(s.id); setOpen(false); setQuery(""); }}
                className={`px-3 py-2 cursor-pointer hover:bg-slate-800 text-xs ${s.id === value ? "bg-indigo-900/30 text-indigo-300" : "text-slate-100"}`}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-slate-400 ml-1 text-[10px]">({s.code})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPanel({
  suppliers,
  setSuppliers,
  products,
  setProducts,
  purchaseOrders,
  setPurchaseOrders,
  onMarkPOReceived,
  batchStocks = [],
  setBatchStocks,
  companyId,
}: OrdersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrderView, setSelectedOrderView] = useState<PurchaseOrder | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [vendorId, setVendorId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0 }]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [gstPct, setGstPct] = useState(18);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState("");

  const resetForm = () => {
    setVendorId("");
    setLineItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
    setDeliveryDate("");
    setNotes("");
    setGstPct(18);
    setSupplierInvoiceNo("");
    setSupplierInvoiceDate("");
  };

  // ── Excel Import ───────────────────────────────────────────────────────────
  const handleImportXLSX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "" });

      // ── Find column positions from header row ──────────────────────────
      let descCol = 1, qtyCol = 10, rateCol = 11, unitCol = 12;
      for (const row of rows) {
        const lower = (row as any[]).map((c: any) => String(c).toLowerCase().trim());
        const descIdx = lower.findIndex((c: string) => c.includes("description"));
        if (descIdx >= 0) {
          descCol = descIdx;
          const qtyIdx = lower.findIndex((c: string) => c === "quantity" || c === "qty");
          if (qtyIdx >= 0) qtyCol = qtyIdx;
          const rateIdx = lower.findIndex((c: string) => c === "rate" || c.includes("unit price"));
          if (rateIdx >= 0) rateCol = rateIdx;
          const unitIdx = lower.findIndex((c: string) => c === "per" || c === "unit");
          if (unitIdx >= 0) unitCol = unitIdx;
          break;
        }
      }

      // ── Extract invoice header metadata ────────────────────────────────
      let invoiceNo = "";
      let invDate = "";
      let supplierName = "";

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as any[];
        for (let j = 0; j < row.length; j++) {
          const cell = String(row[j]).toLowerCase().trim();
          if (cell.includes("invoice no") && !cell.includes("supplier") && !invoiceNo) {
            const val = String(rows[i + 1]?.[j] ?? "").trim().split(/\s+/)[0];
            if (val) invoiceNo = val;
          }
          if ((cell === "dated" || cell === "date" || cell.includes("invoice date")) && !invDate) {
            const val = String(rows[i + 1]?.[j] ?? "").trim();
            if (val) invDate = val;
          }
        }
        const firstCell = String(row[0]).toLowerCase();
        if (firstCell.includes("supplier") && firstCell.includes("bill")) {
          supplierName = String(rows[i + 1]?.[0] ?? "").trim();
        }
      }

      // ── Find or auto-create supplier ───────────────────────────────────
      let supplierId = "";
      const matchKey = supplierName.slice(0, 10).toLowerCase();
      const existing = suppliers.find(s => s.name.toLowerCase().includes(matchKey));
      if (existing) {
        supplierId = existing.id;
      } else if (supplierName) {
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          companyId,
          name: supplierName,
          code: `SUP-IMP-${String(suppliers.length + 1).padStart(3, "0")}`,
          contactPerson: "", email: "", phone: "", address: "", creditDays: 30,
        };
        setSuppliers(prev => [...prev, newSup]);
        supplierId = newSup.id;
        toast.success("Vendor Auto-Created", supplierName);
      }

      // ── Parse line items ───────────────────────────────────────────────
      const importedLines: LineItem[] = [];
      const createdProducts: Product[] = [];

      for (const row of rows) {
        const slNo = (row as any[])[0];
        if (typeof slNo !== "number" || slNo <= 0) continue;

        const rawDesc = String((row as any[])[descCol] ?? "").trim();
        const desc = rawDesc.replace(/^[*#\s]+|[*#\s]+$/g, "").replace(/\s+/g, " ").trim();
        const qty  = Number((row as any[])[qtyCol])  || 0;
        const rate = Number((row as any[])[rateCol]) || 0;
        const unit = String((row as any[])[unitCol] ?? "NOS").trim() || "NOS";

        if (!desc || qty <= 0 || rate <= 0) continue;

        const sku = makeSKU(desc);
        const allProducts = [...products, ...createdProducts];
        let prod = allProducts.find(p =>
          p.name.toLowerCase() === desc.toLowerCase() ||
          p.sku.toLowerCase() === sku.toLowerCase()
        );

        if (!prod) {
          prod = {
            id: `prod-imp-${Date.now()}-${importedLines.length}`,
            sku,
            name: desc,
            categoryId: "",
            brandId: "",
            unit,
            purchasePrice: rate,
            sellingPrice: Math.round(rate * 1.2),
            minStockLevel: 5,
            maxStockLevel: 500,
            description: `Imported · Invoice ${invoiceNo || file.name}`,
          };
          createdProducts.push(prod);
        }

        importedLines.push({ productId: prod.id, quantity: qty, unitPrice: rate });
      }

      if (createdProducts.length > 0) {
        setProducts(prev => [...prev, ...createdProducts]);
      }

      // ── Detect GST % from totals section ──────────────────────────────
      const subtotalCalc = importedLines.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      let igst = 0;
      for (const row of rows) {
        const rowText = (row as any[]).map((c: any) => String(c)).join(" ").toUpperCase();
        if (rowText.includes("GST") && !rowText.includes("GSTIN")) {
          const amounts = (row as any[]).map((c: any) => Number(c)).filter(n => n > 1000);
          if (amounts.length > 0) igst = Math.max(...amounts);
        }
      }
      const detectedGST = subtotalCalc > 0 && igst > 0
        ? Math.round((igst / subtotalCalc) * 100)
        : 18;

      if (importedLines.length === 0) {
        toast.error("No items found", "Check column headers in the Excel file.");
        return;
      }

      // ── Auto-create PO directly ────────────────────────────────────────
      const subtotalCalcd = importedLines.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      const gstAmt = subtotalCalcd * (detectedGST / 100);
      const total = subtotalCalcd + gstAmt;

      const newPO: PurchaseOrder = {
        id: `po-${Date.now()}`,
        poNumber: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, "0")}`,
        supplierId,
        branchId: "br-hq",
        items: importedLines.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, receivedQuantity: i.quantity })),
        totalAmount: total,
        status: "completed",
        paymentStatus: "unpaid",
        supplierInvoiceNo: invoiceNo || undefined,
        supplierInvoiceDate: invDate || undefined,
        remarks: `Imported from: ${file.name}`,
        createdAt: new Date().toISOString(),
      };
      setPurchaseOrders(prev => [...prev, newPO]);

      // ── Add stock to inventory immediately ────────────────────────────
      const newStocks: BatchStock[] = importedLines.map((i, idx) => ({
        id: `bs-imp-${Date.now()}-${idx}`,
        productId: i.productId,
        warehouseId: "wh-main",
        batchNumber: `BATCH-${invoiceNo || Date.now()}`,
        quantity: i.quantity,
      }));
      setBatchStocks(prev => [...prev, ...newStocks]);

      toast.success(
        `PO created — ${importedLines.length} items`,
        `${createdProducts.length} new products · stock added to Inventory · GST ${detectedGST}%`
      );
    } catch (err) {
      toast.error("Import Failed", "Could not parse the Excel file. Check format.");
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOpenAdd = () => { resetForm(); setShowAddModal(true); };

  const handleProductPick = (idx: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      // Use purchasePrice for PO; fall back to sellingPrice if not set
      const price = prod ? (prod.purchasePrice && prod.purchasePrice > 0 ? prod.purchasePrice : prod.sellingPrice ?? 0) : 0;
      return { ...item, productId, unitPrice: price };
    }));
  };

  const handleLineChange = (idx: number, key: "quantity" | "unitPrice", value: number) => {
    setLineItems(prev => prev.map((item, i) => i !== idx ? item : { ...item, [key]: value }));
  };

  const subtotal   = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const gstAmount  = subtotal * (gstPct / 100);
  const grandTotal = subtotal + gstAmount;

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) { toast.error("Please select a vendor"); return; }
    if (lineItems.some(i => !i.productId || i.quantity <= 0)) {
      toast.error("All line items need a product and quantity"); return;
    }
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, "0")}`,
      supplierId: vendorId,
      branchId: "br-hq",
      items: lineItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, receivedQuantity: 0 })),
      totalAmount: grandTotal,
      status: "draft",
      paymentStatus: "unpaid",
      deliveryDate: deliveryDate || undefined,
      remarks: notes || undefined,
      supplierInvoiceNo: supplierInvoiceNo || undefined,
      supplierInvoiceDate: supplierInvoiceDate || undefined,
      createdAt: new Date().toISOString(),
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    setShowAddModal(false);
    toast.success("PO Created", `${newPO.poNumber} saved — approve it to send to vendor`);
  };

  const handleApprovePO = (id: string) => {
    setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status: "approved" as const } : po));
    toast.success("PO Approved", "Purchase order approved and ready to receive stock");
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this Purchase Order?")) return;
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
  };

  const filtered = purchaseOrders.filter(po => {
    const supplier = suppliers.find(s => s.id === po.supplierId);
    const matchSearch = po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by PO# or vendor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
          />
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono font-bold">
        {["All", "draft", "approved", "completed", "cancelled"].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-md border transition-all shrink-0 cursor-pointer ${
              statusFilter === s
                ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-300"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">PO Number</th>
                <th className="px-5 py-3 text-left">Vendor</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Delivery</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No purchase orders found. Create one to get started.
                  </td>
                </tr>
              ) : filtered.map(po => {
                const supplier = suppliers.find(s => s.id === po.supplierId);
                return (
                  <tr key={po.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-indigo-400 font-mono">{po.poNumber}</td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-100">{supplier?.name ?? "Unknown Vendor"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{supplier?.code ?? "—"}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">{new Date(po.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">{po.deliveryDate ?? "Not set"}</td>
                    <td className="px-5 py-4 font-bold font-mono text-slate-200">{formatINR(po.totalAmount)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                        po.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        po.status === "approved"  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        po.status === "cancelled" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setSelectedOrderView(po)} className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer" title="View PO">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {po.status === "draft" && (
                          <button onClick={() => handleApprovePO(po.id)} className="inline-flex items-center gap-1 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2 py-1 text-[10px] font-bold hover:bg-indigo-600/30 cursor-pointer">
                            <Check className="h-3 w-3" /> Approve
                          </button>
                        )}
                        {po.status === "approved" && (
                          <button onClick={() => onMarkPOReceived(po.id)} className="inline-flex items-center gap-1 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 text-[10px] font-bold hover:bg-emerald-600/30 cursor-pointer" title="Receive stock into inventory">
                            <PackageCheck className="h-3 w-3" /> Receive Stock
                          </button>
                        )}
                        <button onClick={() => handleDelete(po.id)} className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* View PO Modal */}
      {selectedOrderView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">{selectedOrderView.poNumber}</h3>
              <button onClick={() => setSelectedOrderView(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Vendor: <span className="text-white font-semibold">{suppliers.find(s => s.id === selectedOrderView.supplierId)?.name ?? "—"}</span></div>
                <div>Status: <span className="text-indigo-400 font-semibold uppercase">{selectedOrderView.status}</span></div>
                <div>Created: <span className="text-white font-semibold">{new Date(selectedOrderView.createdAt).toLocaleDateString()}</span></div>
                <div>Delivery: <span className="text-white font-semibold">{selectedOrderView.deliveryDate ?? "Not set"}</span></div>
              </div>
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="text-[10px] font-bold text-indigo-400 uppercase font-mono mb-1">Line Items</div>
                {selectedOrderView.items.map((it, idx) => {
                  const prod = products.find(p => p.id === it.productId);
                  const stock = getStock(it.productId, batchStocks);
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-2 rounded flex justify-between">
                      <div>
                        <div className="text-white font-bold">{prod?.name ?? it.productId}</div>
                        <div className="text-slate-400 text-[10px]">Rate: {formatINR(it.unitPrice)} · Stock: <span className={stock === 0 ? "text-red-400" : "text-emerald-400"}>{stock}</span></div>
                      </div>
                      <div className="text-slate-300 font-bold">{it.quantity} {prod?.unit || "nos"}</div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-800 pt-2 text-right">
                <span className="text-slate-500 block text-[10px]">Grand Total (incl. GST)</span>
                <strong className="text-base text-white font-mono">{formatINR(selectedOrderView.totalAmount)}</strong>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {selectedOrderView.status === "approved" && (
                <button
                  onClick={() => { onMarkPOReceived(selectedOrderView.id); setSelectedOrderView(null); }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold hover:bg-emerald-600/30 cursor-pointer"
                >
                  <PackageCheck className="h-3.5 w-3.5" /> Receive Stock into Inventory
                </button>
              )}
              <button onClick={() => setSelectedOrderView(null)} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePO}
            className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4 my-8"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <ShoppingBag className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white font-mono">Create Purchase Order</h3>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* Vendor */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vendor *</label>
                <VendorCombobox suppliers={suppliers} value={vendorId} onChange={setVendorId} />
                {suppliers.length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">No vendors added yet — go to Vendors tab to add one first.</p>
                )}
              </div>

              {/* Line Items */}
              <div className="border border-slate-800 rounded-lg overflow-visible bg-slate-900/60">
                <table className="min-w-full text-[10px]">
                  <thead className="bg-slate-950 text-slate-400 font-mono font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-2 py-1.5 text-left">Product (Stock)</th>
                      <th className="px-2 py-1.5 text-center w-14">Qty</th>
                      <th className="px-2 py-1.5 text-right w-24">Unit Price ₹</th>
                      <th className="px-2 py-1.5 text-right w-20">Total ₹</th>
                      <th className="px-2 py-1.5 w-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1.5 overflow-visible">
                          <ProductCombobox
                            products={products}
                            batchStocks={batchStocks}
                            value={item.productId}
                            onChange={id => handleProductPick(idx, id)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min={1} required
                            value={item.quantity}
                            onChange={e => handleLineChange(idx, "quantity", Number(e.target.value))}
                            className="w-full text-center bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="number" min={0} required
                            value={item.unitPrice}
                            onChange={e => handleLineChange(idx, "unitPrice", Number(e.target.value))}
                            className="w-full text-right bg-slate-950 border border-slate-800 rounded p-1 text-[10px] text-white font-mono"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold text-slate-300">
                          {formatINR(item.quantity * item.unitPrice)}
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 font-bold"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer: Add item + totals */}
                <div className="bg-slate-950 p-2 border-t border-slate-800 flex justify-between items-end text-[10px]">
                  <button
                    type="button"
                    onClick={() => setLineItems(prev => [...prev, { productId: "", quantity: 1, unitPrice: 0 }])}
                    className="text-indigo-400 hover:text-indigo-300 font-bold font-mono"
                  >
                    + Add Item
                  </button>
                  <div className="text-right space-y-0.5 font-mono font-semibold text-slate-400">
                    <div>Subtotal: <span className="text-slate-200 font-bold">{formatINR(subtotal)}</span></div>
                    <div className="flex items-center justify-end gap-1">
                      GST (
                      <input
                        type="number" min={0} max={100}
                        value={gstPct}
                        onChange={e => setGstPct(Number(e.target.value))}
                        className="w-10 text-center bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] text-white font-mono outline-none"
                      />
                      %): <span className="text-slate-200 font-bold">{formatINR(gstAmount)}</span>
                    </div>
                    <div className="text-indigo-400 text-xs border-t border-slate-800 pt-0.5">
                      Grand Total: <span className="font-bold">{formatINR(grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Supplier Invoice Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Supplier Invoice No.</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2024-001"
                    value={supplierInvoiceNo}
                    onChange={e => setSupplierInvoiceNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Supplier Invoice Date</label>
                  <input
                    type="date"
                    value={supplierInvoiceDate}
                    onChange={e => setSupplierInvoiceDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Optional instructions or remarks..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800 text-xs">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer">
                Create PO
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

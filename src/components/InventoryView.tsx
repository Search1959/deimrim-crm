/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { toast } from "../utils/toast";
import { exportProductsCSV } from "../utils/exportCSV";
import { 
  Boxes, 
  Warehouse, 
  ListOrdered, 
  AlertTriangle, 
  Search, 
  BarChart3, 
  QrCode, 
  Barcode,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Archive,
  Eye,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  X,
  Check
} from "lucide-react";
import { Product, BatchStock, StockMovement, Category, Brand, Warehouse as WarehouseType, formatINR, UserRole } from "../types";

interface InventoryViewProps {
  companyId: string;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  brands: Brand[];
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
  warehouses: WarehouseType[];
  batchStocks: BatchStock[];
  setBatchStocks: React.Dispatch<React.SetStateAction<BatchStock[]>>;
  movements: StockMovement[];
  setMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>;
  userRole: UserRole;
  currentUserId: string;
}

export default function InventoryView({
  companyId,
  products,
  setProducts,
  categories,
  setCategories,
  brands,
  setBrands,
  warehouses,
  batchStocks,
  setBatchStocks,
  movements,
  setMovements,
  userRole,
  currentUserId,
}: InventoryViewProps) {
  const canWrite = userRole !== UserRole.READ_ONLY && userRole !== UserRole.EMPLOYEE;
  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "categories" | "brands" | "warehouses" | "movements">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Drill-down product detail state
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Excel stock import state
  const [xlsxImporting, setXlsxImporting] = useState(false);
  const [xlsxReplaceAll, setXlsxReplaceAll] = useState(false);
  const [xlsxResult, setXlsxResult] = useState<{ updated: number; added: number; skipped: number } | null>(null);

  const handleXlsxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    e.target.value = "";
    setXlsxImporting(true);
    setXlsxResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const url = `/api/stock/import/${companyId}${xlsxReplaceAll ? "?clear=true" : ""}`;
      const res = await fetch(url, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setXlsxResult({ updated: data.updated, added: data.added, skipped: data.skipped });
      toast.success(`Stock imported: ${data.updated} updated · ${data.added} added`);
      // Reload products, batchStocks and categories from server
      const [pRes, bRes, cRes] = await Promise.all([
        fetch(`/api/data/${companyId}/products`),
        fetch(`/api/data/${companyId}/batchStocks`),
        fetch(`/api/data/${companyId}/categories`),
      ]);
      if (pRes.ok) { const d = await pRes.json(); if (Array.isArray(d)) setProducts(d); }
      if (bRes.ok) { const d = await bRes.json(); if (Array.isArray(d)) setBatchStocks(d); }
      if (cRes.ok) { const d = await cRes.json(); if (Array.isArray(d)) setCategories(d); }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setXlsxImporting(false);
    }
  };

  // CRUD & CSV Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState("");
  const [importNotification, setImportNotification] = useState("");

  // Product Form State
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formOpeningStock, setFormOpeningStock] = useState("0");
  const [formUnit, setFormUnit] = useState("Unit");
  const [formPurchasePrice, setFormPurchasePrice] = useState("0");
  const [formSellingPrice, setFormSellingPrice] = useState("0");
  const [formMinStock, setFormMinStock] = useState("10");
  const [formMaxStock, setFormMaxStock] = useState("100");
  const [formHsn, setFormHsn] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Extract HSN stored as "HSN: XXXXXX" in description
  const extractHsn = (desc: string) => ((desc || "").match(/HSN[:\s]+(\w+)/i) || [])[1] || "";
  const extractNotes = (desc: string) => (desc || "").replace(/HSN[:\s]+\w+\s*[|]?\s*/i, "").trim();
  const combineDesc = (hsn: string, notes: string) => hsn && notes ? `HSN: ${hsn} | ${notes}` : hsn ? `HSN: ${hsn}` : notes;

  // Category and Brand Form States
  const [newCatName, setNewCatName] = useState("");
  const [newCatCode, setNewCatCode] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newBrandName, setNewBrandName] = useState("");

  // Compute stock levels per product
  const productStockMap = products.reduce((acc, p) => {
    const qty = batchStocks
      .filter(bs => bs.productId === p.id)
      .reduce((s, bs) => s + bs.quantity, 0);
    acc[p.id] = qty;
    return acc;
  }, {} as Record<string, number>);

  // Total inventory valuation (Total Purchase Cost of on-hand batches)
  const totalValuation = batchStocks.reduce((sum, bs) => {
    const prod = products.find(p => p.id === bs.productId);
    if (!prod) return sum;
    return sum + (bs.quantity * prod.purchasePrice);
  }, 0);

  // Potential selling value
  const potentialSellingValue = batchStocks.reduce((sum, bs) => {
    const prod = products.find(p => p.id === bs.productId);
    if (!prod) return sum;
    return sum + (bs.quantity * prod.sellingPrice);
  }, 0);

  const profitProjection = potentialSellingValue - totalValuation;

  // Filter products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  // Reset to page 1 when filter changes
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedCategory]);

  // Open Add modal with reset values
  const openAddModal = () => {
    setFormSku(`DR-SKU-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormCategoryId(categories[0]?.id || "");
    setFormBrandId(brands[0]?.id || "");
    setFormUnit("Unit");
    setFormPurchasePrice("150");
    setFormSellingPrice("299");
    setFormMinStock("5");
    setFormMaxStock("100");
    setFormHsn("");
    setFormDescription("");
    setFormOpeningStock("0");
    setShowAddModal(true);
  };

  // Open Edit modal
  const openEditModal = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToEdit(p);
    setFormSku(p.sku);
    setFormName(p.name);
    setFormCategoryId(p.categoryId);
    setFormBrandId(p.brandId);
    setFormUnit(p.unit);
    setFormPurchasePrice(String(p.purchasePrice));
    setFormSellingPrice(String(p.sellingPrice));
    setFormMinStock(String(p.minStockLevel));
    setFormMaxStock(String(p.maxStockLevel));
    setFormHsn(extractHsn(p.description || ""));
    setFormDescription(extractNotes(p.description || ""));
    setShowEditModal(true);
  };

  // Handle Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku || !formName) { toast.error("SKU and Name are required"); return; }

    const newProductObj: Product = {
      id: `prod-${Date.now()}`,
      sku: formSku,
      name: formName,
      categoryId: formCategoryId,
      brandId: formBrandId,
      unit: formUnit,
      purchasePrice: parseFloat(formPurchasePrice) || 0,
      sellingPrice: parseFloat(formSellingPrice) || 0,
      minStockLevel: parseInt(formMinStock) || 0,
      maxStockLevel: parseInt(formMaxStock) || 0,
      description: combineDesc(formHsn, formDescription),
    };

    const openingQty = parseInt(formOpeningStock) || 0;

    setProducts(prev => [newProductObj, ...prev]);

    // Create batchStock entry with opening quantity
    const newBatch = {
      id: `bs-${newProductObj.id}`,
      productId: newProductObj.id,
      batchNumber: "STOCK",
      quantity: openingQty,
      unit: formUnit,
      purchasePrice: newProductObj.purchasePrice,
      expiryDate: "",
      location: "",
      createdAt: new Date().toISOString(),
    };
    setBatchStocks(prev => [newBatch, ...prev]);

    setShowAddModal(false);

    // Write audit log
    const log: StockMovement = {
      id: `sm-new-${Date.now()}`,
      productId: newProductObj.id,
      warehouseId: warehouses[0]?.id || "wh-main",
      type: "IN",
      source: "OPENING",
      referenceId: "SYS-ADD",
      quantity: openingQty,
      unitPrice: newProductObj.purchasePrice,
      userId: currentUserId,
      timestamp: new Date().toISOString(),
      remarks: `Product ${newProductObj.name} added with opening stock of ${openingQty} ${formUnit}.`,
    };
    setMovements(prev => [log, ...prev]);
  };

  // Handle Edit Product
  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit) return;

    setProducts(prev => prev.map(p => {
      if (p.id === productToEdit.id) {
        return {
          ...p,
          sku: formSku,
          name: formName,
          categoryId: formCategoryId,
          brandId: formBrandId,
          unit: formUnit,
          purchasePrice: parseFloat(formPurchasePrice) || 0,
          sellingPrice: parseFloat(formSellingPrice) || 0,
          minStockLevel: parseInt(formMinStock) || 0,
          maxStockLevel: parseInt(formMaxStock) || 0,
          description: combineDesc(formHsn, formDescription),
        };
      }
      return p;
    }));

    setShowEditModal(false);
    setProductToEdit(null);
  };

  // Handle Delete Product
  const handleDeleteProduct = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}" from the product registry?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      // Clean corresponding batch stock to prevent orphan mappings
      setBatchStocks(prev => prev.filter(bs => bs.productId !== id));
      if (selectedProductDetail?.id === id) {
        setSelectedProductDetail(null);
      }
    }
  };

  // Export to Real CSV
  const handleExportCSV = () => {
    const headers = ["ID", "SKU", "Name", "Category", "Brand", "Unit", "Purchase Price", "Selling Price", "Min Stock Level", "Max Stock Level", "Barcode", "QR Code", "Description"];
    const csvRows = [headers.join(",")];

    products.forEach(p => {
      const cat = categories.find(c => c.id === p.categoryId)?.name || "";
      const brand = brands.find(b => b.id === p.brandId)?.name || "";
      const row = [
        p.id,
        p.sku,
        p.name,
        cat,
        brand,
        p.unit,
        p.purchasePrice,
        p.sellingPrice,
        p.minStockLevel,
        p.maxStockLevel,
        p.barcode || "",
        p.qrCode || "",
        p.description || ""
      ].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `product_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load sample CSV
  const handleLoadSampleCSV = () => {
    const sample = `sku,name,categoryId,unit,purchasePrice,sellingPrice,minStock,maxStock,barcode,qrCode,description
DR-NET-C9200,Cisco Catalyst Switch 9200,cat-1,Unit,1400,2450,2,20,88091100223,QR-C92,Enterprise network switch with POE
DR-LAP-M3PRO,MacBook Pro M3 Max 16,cat-2,Unit,3200,3800,5,30,88091100224,QR-MBP,Developer productivity hardware
DR-IOT-TEMP1,IoT Ambient Temperature Sensor,cat-3,Unit,45,95,20,200,88091100225,QR-TEMP,Industrial thermal sensor node`;
    setCsvTextInput(sample);
  };

  // Parse & Import CSV
  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) { toast.error("Please paste CSV content first"); return; }

    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error("CSV needs a header row + at least one data row"); return; }

    let importedCount = 0;
    const newProducts: Product[] = [];

    // Simple CSV Line Parser (split by commas but keep quoted strings safe)
    const parseCsvLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Assuming first row is headers: sku, name, categoryId, unit, purchasePrice, sellingPrice, minStock, maxStock, barcode, qrCode, description
    const dataRows = lines.slice(1);
    dataRows.forEach((rowLine, idx) => {
      const columns = parseCsvLine(rowLine);
      if (columns.length >= 3) {
        const [sku, name, catId, unit, pPrice, sPrice, minStk, maxStk, bCode, qrC, desc] = columns;
        
        // Find if Category ID exists, otherwise fall back to first category
        const matchedCategory = categories.find(c => c.id === catId || c.name.toLowerCase() === catId?.toLowerCase())?.id || "cat-1";

        newProducts.push({
          id: `prod-imported-${Date.now()}-${idx}`,
          sku: sku || `DR-SKU-IMP-${Math.floor(100 + Math.random() * 900)}`,
          name: name || "Imported SKU Product",
          categoryId: matchedCategory,
          brandId: "b-1", // default brand
          unit: unit || "Unit",
          purchasePrice: parseFloat(pPrice) || 100,
          sellingPrice: parseFloat(sPrice) || 199,
          minStockLevel: parseInt(minStk) || 5,
          maxStockLevel: parseInt(maxStk) || 50,
          barcode: bCode || String(Math.floor(880000000000 + Math.random() * 9999999999)),
          qrCode: qrC || `QR-IMP-${idx}`,
          description: desc || "Bulk imported item catalog reference.",
        });
        importedCount++;
      }
    });

    if (newProducts.length > 0) {
      setProducts(prev => [...newProducts, ...prev]);
      setImportNotification(`Successfully parsed and imported ${importedCount} products into Catalog Registry!`);
      setTimeout(() => {
        setImportNotification("");
        setShowImportModal(false);
        setCsvTextInput("");
      }, 3000);
    } else {
      toast.error("CSV Import Failed", "No valid product rows found. Check formatting.");
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Module Title & Stats bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Core Inventory Engine</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time valuation models, warehouse logistics mapping, and stock transaction ledger audit trail.</p>
        </div>

        {/* Dynamic Valuation Metrics */}
        <div className="flex gap-4 self-start bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Capital Valuation</span>
            <div className="text-base font-bold text-slate-200 font-mono mt-1">{formatINR(totalValuation)}</div>
          </div>
          <div className="border-l border-slate-800 pl-4 text-left">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Expected Returns</span>
            <div className="text-base font-bold text-indigo-400 font-mono mt-1">{formatINR(potentialSellingValue)}</div>
          </div>
          <div className="border-l border-slate-800 pl-4 text-left hidden sm:block">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Potential Margin</span>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">+{formatINR(profitProjection)}</div>
          </div>
        </div>
      </div>

      {/* View switcher & Search Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="flex bg-slate-900 p-1 rounded-lg self-start flex-wrap gap-1">
          <button
            onClick={() => { setActiveSubTab("catalog"); setSelectedProductDetail(null); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeSubTab === "catalog" ? "bg-slate-800 text-indigo-400 shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Stock On Hand
          </button>
          <button
            onClick={() => { setActiveSubTab("categories"); setSelectedProductDetail(null); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeSubTab === "categories" ? "bg-slate-800 text-indigo-400 shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Product Categories
          </button>

          <button
            onClick={() => { setActiveSubTab("warehouses"); setSelectedProductDetail(null); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeSubTab === "warehouses" ? "bg-slate-800 text-indigo-400 shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Godown & Racks
          </button>
          <button
            onClick={() => { setActiveSubTab("movements"); setSelectedProductDetail(null); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeSubTab === "movements" ? "bg-slate-800 text-indigo-400 shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Stock Movement Logs
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeSubTab === "catalog" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by SKU or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-9 rounded-lg border border-slate-800 bg-slate-900 py-2 pr-3 text-xs focus:bg-slate-950 focus:outline-hidden text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs focus:bg-slate-950 focus:outline-hidden text-white font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </>
          )}

          {/* Import / Export / Add buttons */}
          {activeSubTab === "catalog" && (
            <div className="flex gap-1.5">
              {canWrite && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Product</span>
              </button>
              )}

              {canWrite && (
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                title="Import catalog from CSV text"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import CSV</span>
              </button>
              )}

              {canWrite && (
              <div className="flex items-center gap-1.5">
                <label
                  className={`flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${xlsxImporting ? "border-indigo-700 bg-indigo-950 text-indigo-300" : "border-indigo-800 bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300"}`}
                  title="Import stock from Excel (.xlsx)"
                >
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXlsxImport} disabled={xlsxImporting} />
                  <Upload className="h-3.5 w-3.5" />
                  <span>{xlsxImporting ? "Importing…" : "Import Excel"}</span>
                </label>
                <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer select-none" title="Replace All: clears existing products and stock before importing">
                  <input type="checkbox" checked={xlsxReplaceAll} onChange={e => setXlsxReplaceAll(e.target.checked)} className="accent-red-500 w-3 h-3" />
                  <span className={xlsxReplaceAll ? "text-red-400 font-bold" : ""}>Replace All</span>
                </label>
              </div>
              )}
              {xlsxResult && (
                <span className="text-[10px] text-emerald-400 font-mono self-center">
                  ✓ {xlsxResult.updated} updated · {xlsxResult.added} added · {xlsxResult.skipped} skipped
                </span>
              )}

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                title="Download CSV database file"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB: STOCK ON HAND LEDGER */}
      {activeSubTab === "catalog" && !selectedProductDetail && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm text-left">
              <thead className="bg-slate-950 text-slate-300 font-semibold">
                <tr>
                  <th className="px-5 py-3">Product Description</th>
                  <th className="px-5 py-3">SKU Code</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Cost / Selling Price</th>
                  <th className="px-5 py-3">On Hand Stock</th>
                  <th className="px-5 py-3">Safety Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {pagedProducts.map((p) => {
                  const qty = productStockMap[p.id] || 0;
                  const category = categories.find(c => c.id === p.categoryId);
                  const isLow = qty === 0;
                  const isNegative = qty < 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-100 leading-tight">{p.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 max-w-[280px] truncate">{p.description}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-indigo-400">{p.sku}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-400">{category?.name || "Uncategorized"}</td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-xs text-slate-300">Cost: <strong className="text-slate-100">{formatINR(p.purchasePrice)}</strong></div>
                        <div className="font-mono text-[10px] text-indigo-400 mt-0.5">MSRP: {formatINR(p.sellingPrice)}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-100 text-xs">
                        {qty} {p.unit}
                      </td>
                      <td className="px-5 py-4">
                        {isNegative ? (
                          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-red-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Negative Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-amber-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Low Stock Alert</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border border-emerald-500/20">
                            <span>Sufficient Stock</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProductDetail(p)}
                            className="rounded-lg p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                            title="View Barcode & Batches"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {canWrite && (
                          <button
                            onClick={(e) => openEditModal(p, e)}
                            className="rounded-lg p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Product Specification"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          )}

                          {canWrite && (
                          <button
                            onClick={(e) => handleDeleteProduct(p.id, p.name, e)}
                            className="rounded-lg p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/60">
              <span className="text-xs text-slate-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >«</button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >‹</button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) { page = i + 1; }
                  else if (currentPage <= 4) { page = i + 1; }
                  else if (currentPage >= totalPages - 3) { page = totalPages - 6 + i; }
                  else { page = currentPage - 3 + i; }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 text-xs rounded border cursor-pointer ${currentPage === page ? "border-indigo-500 bg-indigo-600 text-white font-bold" : "border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800"}`}
                    >{page}</button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-xs rounded border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >›</button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs rounded border border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >»</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PRODUCT SUB-DRILLDOWN DETAILS (Barcode, Batch Lists) */}
      {activeSubTab === "catalog" && selectedProductDetail && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase">Product Registry Details</span>
              <h3 className="text-lg font-bold text-white mt-1">{selectedProductDetail.name}</h3>
            </div>
            <button
              onClick={() => setSelectedProductDetail(null)}
              className="text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 rounded-lg px-3 py-1.5 bg-slate-900"
            >
              Back to List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Info Panel */}
            <div className="border border-slate-800 rounded-xl p-5 space-y-3 bg-slate-950/40">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Product Details</span>

              {/* HSN */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">HSN Code</div>
                <div className="text-sm font-bold text-indigo-300 font-mono">
                  {extractHsn(selectedProductDetail.description || "") || "—"}
                </div>
              </div>

              {/* Category */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Category</div>
                <div className="text-sm font-semibold text-slate-100">
                  {categories.find(c => c.id === selectedProductDetail.categoryId)?.name || "—"}
                </div>
              </div>

              {/* Prices */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Purchase Cost</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">{formatINR(selectedProductDetail.purchasePrice)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Selling Price</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">{formatINR(selectedProductDetail.sellingPrice)}</div>
                </div>
              </div>

              {/* Stock thresholds */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-2">
              </div>

              {/* Unit + SKU */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Unit</div>
                  <div className="text-sm font-semibold text-slate-200">{selectedProductDetail.unit || "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">SKU</div>
                  <div className="text-xs font-mono text-slate-400">{selectedProductDetail.sku || "—"}</div>
                </div>
              </div>

              {/* Notes */}
              {extractNotes(selectedProductDetail.description || "") && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-mono mb-0.5">Notes</div>
                  <div className="text-xs text-slate-300">{extractNotes(selectedProductDetail.description || "")}</div>
                </div>
              )}
            </div>

            {/* Dynamic Batches listing for this product */}
            <div className="md:col-span-2 space-y-4 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">Stored Batches & Warehouse Racks</span>
              
              <div className="space-y-3">
                {batchStocks
                  .filter(bs => bs.productId === selectedProductDetail.id)
                  .map(bs => {
                    const wh = warehouses.find(w => w.id === bs.warehouseId);
                    return (
                      <div key={bs.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-xs gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-white font-bold">Batch: {bs.batchNumber}</strong>
                            {bs.expiryDate && (
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold font-mono border border-indigo-500/20">
                                Exps: {bs.expiryDate}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Warehouse className="h-3.5 w-3.5 text-slate-500" />
                            <span>{wh?.name} ({wh?.location})</span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right font-mono">
                          <span className="block text-xs text-slate-500">Inventory Segment</span>
                          <strong className="block text-sm text-slate-200 font-extrabold">{bs.quantity} {selectedProductDetail.unit}</strong>
                          <span className="block text-[10px] text-indigo-400 font-semibold">{bs.rackLocation || "General Floor"}</span>
                        </div>
                      </div>
                    );
                  })}
                {batchStocks.filter(bs => bs.productId === selectedProductDetail.id).length === 0 && (
                  <div className="text-center py-6 text-slate-500 border border-dashed rounded-xl border-slate-800 bg-slate-950/20">
                    <Archive className="mx-auto h-8 w-8 mb-2 text-slate-600" />
                    <span className="text-xs font-medium">No batch items registered. Generate a Purchase GRN to add stock.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRODUCT CATEGORIES */}
      {activeSubTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Add Category Form Column */}
          {canWrite && (<div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" /> Register Category
            </h3>
            <p className="text-xs text-slate-400">Register new category classes to group products systematically in the master inventory.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newCatName.trim()) { toast.error("Category name is required"); return; }
              const code = newCatCode.trim() || newCatName.slice(0, 3).toUpperCase();
              const newCat = {
                id: `cat-${Date.now()}`,
                name: newCatName,
                code,
                description: newCatDesc
              };
              setCategories(prev => [...prev, newCat]);
              setNewCatName("");
              setNewCatCode("");
              setNewCatDesc("");
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Storage Components"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Category Code</label>
                <input
                  type="text"
                  placeholder="e.g. STO (Optional)"
                  value={newCatCode}
                  onChange={(e) => setNewCatCode(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Description</label>
                <textarea
                  placeholder="Provide category description details..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden min-h-[80px]"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Save Category Class
              </button>
            </form>
          </div>)}

          {/* Categories List Column */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Active Category Register</h3>
              <span className="text-xs font-mono font-bold text-indigo-400">{categories.length} Categories</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950 font-semibold text-slate-300">
                  <tr>
                    <th className="px-5 py-3 text-left">Code</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Description</th>
                    <th className="px-5 py-3 text-left">Linked Products</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {categories.map(c => {
                    const count = products.filter(p => p.categoryId === c.id).length;
                    return (
                      <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs font-bold text-indigo-400">{c.code}</td>
                        <td className="px-5 py-4 font-semibold text-white">{c.name}</td>
                        <td className="px-5 py-4 text-xs text-slate-400 truncate max-w-[200px]" title={c.description}>
                          {c.description || <span className="italic text-slate-600">No description provided</span>}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-300">{count} SKU(s)</td>
                        <td className="px-5 py-4 text-center">
                          {canWrite && (<button
                            onClick={() => {
                              if (count > 0) {
                                toast.warning("Cannot Delete Category", `"${c.name}" is linked to ${count} product(s)`);
                                return;
                              }
                              if (confirm(`Are you sure you want to delete category "${c.name}"?`)) {
                                setCategories(prev => prev.filter(cat => cat.id !== c.id));
                              }
                            }}
                            className="text-rose-500 hover:text-rose-400 p-1"
                            title="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>)}
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                        No categories registered. Use the panel on the left to add your first Category!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRODUCT BRANDS */}
      {activeSubTab === "brands" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Add Brand Form Column */}
          {canWrite && (<div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" /> Register Brand
            </h3>
            <p className="text-xs text-slate-400">Register product brands/manufacturers to segment catalog lists accurately.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newBrandName.trim()) { toast.error("Brand name is required"); return; }
              const newBrand = {
                id: `b-${Date.now()}`,
                name: newBrandName
              };
              setBrands(prev => [...prev, newBrand]);
              setNewBrandName("");
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco, Dell, Intel"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Save Brand Entity
              </button>
            </form>
          </div>)}

          {/* Brands List Column */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Active Brand Directory</h3>
              <span className="text-xs font-mono font-bold text-indigo-400">{brands.length} Brands</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950 font-semibold text-slate-300">
                  <tr>
                    <th className="px-5 py-3 text-left">Brand ID</th>
                    <th className="px-5 py-3 text-left">Brand Name</th>
                    <th className="px-5 py-3 text-left">Registered SKU Count</th>
                    <th className="px-5 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {brands.map(b => {
                    const count = products.filter(p => p.brandId === b.id).length;
                    return (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-indigo-400">{b.id}</td>
                        <td className="px-5 py-4 font-semibold text-white">{b.name}</td>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-300">{count} SKU(s)</td>
                        <td className="px-5 py-4 text-center">
                          {canWrite && (<button
                            onClick={() => {
                              if (count > 0) {
                                toast.warning("Cannot Delete Brand", `"${b.name}" is linked to ${count} product(s)`);
                                return;
                              }
                              if (confirm(`Are you sure you want to delete brand "${b.name}"?`)) {
                                setBrands(prev => prev.filter(brand => brand.id !== b.id));
                              }
                            }}
                            className="text-rose-500 hover:text-rose-400 p-1"
                            title="Delete brand"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>)}
                        </td>
                      </tr>
                    );
                  })}
                  {brands.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        No brands registered. Use the panel on the left to add your first Brand!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: GODOWNS & WAREHOUSES DESK */}
      {activeSubTab === "warehouses" && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {warehouses.map(wh => {
              const whBatches = batchStocks.filter(bs => bs.warehouseId === wh.id);
              const totalItemsCount = whBatches.reduce((sum, b) => sum + b.quantity, 0);

              return (
                <div key={wh.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">{wh.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{wh.location}</p>
                    </div>
                    <span className="font-mono text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase border border-indigo-500/20">{wh.code}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center bg-slate-900 p-3 rounded-lg border border-slate-800/60">
                    <div className="text-left pl-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Storage Batches</span>
                      <strong className="block text-lg font-bold text-slate-200 font-mono mt-0.5">{whBatches.length}</strong>
                    </div>
                    <div className="border-l border-slate-800 text-left pl-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Total Quantities</span>
                      <strong className="block text-lg font-bold text-indigo-400 font-mono mt-0.5">{totalItemsCount} units</strong>
                    </div>
                  </div>

                  {/* Stored products list */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Allocated Batch Ledger</span>
                    {whBatches.map(b => {
                      const prod = products.find(p => p.id === b.productId);
                      return (
                        <div key={b.id} className="flex items-center justify-between text-xs border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 p-2.5 rounded-lg">
                          <div className="truncate max-w-[200px]">
                            <span className="font-bold text-slate-200 font-mono text-[10px] mr-1">[{b.batchNumber}]</span>
                            <span className="font-semibold text-slate-300">{prod?.name}</span>
                          </div>
                          <span className="font-mono font-bold text-slate-100">{b.quantity} qty</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: STOCK MOVEMENT LOGS */}
      {activeSubTab === "movements" && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs text-left">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Chronological Stock Audit Logs</h3>
            <span className="text-xs font-mono font-bold text-indigo-400">Dynamic Ledger Updates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950 font-semibold text-slate-300">
                <tr>
                  <th className="px-5 py-3 text-left">Movement Date</th>
                  <th className="px-5 py-3 text-left">Product SKU</th>
                  <th className="px-5 py-3 text-left">Log Source</th>
                  <th className="px-5 py-3 text-left">Warehouse</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Quantity Changes</th>
                  <th className="px-5 py-3 text-left">Document Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {movements.map((move) => {
                  const product = products.find(p => p.id === move.productId);
                  const wh = warehouses.find(w => w.id === move.warehouseId);
                  const isIN = move.type === "IN";

                  return (
                    <tr key={move.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">{new Date(move.timestamp).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-100">{product?.name}</div>
                        <div className="text-[10px] text-indigo-400 font-mono font-bold">{product?.sku}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-xs uppercase tracking-wide text-slate-300">{move.source}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-400">{wh?.name || "General"}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isIN ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        }`}>
                          {isIN ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          <span>{move.type}</span>
                        </span>
                      </td>
                      <td className={`px-5 py-4 font-bold font-mono text-xs ${isIN ? "text-emerald-400" : "text-rose-400"}`}>
                        {isIN ? "+" : "-"}{move.quantity} {product?.unit}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-xs text-indigo-400">{move.referenceId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
         ADD PRODUCT MODAL
         ==================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">Add New Product to Ledger</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Dell PowerEdge Server"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt("Enter new category name:");
                        if (!name) return;
                        const code = prompt("Enter category code (e.g., ESH, PWS):") || name.slice(0, 3).toUpperCase();
                        const newCat = { id: `cat-${Date.now()}`, name, code, description: "" };
                        setCategories(prev => [...prev, newCat]);
                        setFormCategoryId(newCat.id);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Quick Add
                    </button>
                  </div>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    {categories.length === 0 && <option value="">-- No Categories --</option>}
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. Unit, Box, kg"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">On Hand Stock</label>
                  <input
                    type="number"
                    value={formOpeningStock}
                    onChange={(e) => setFormOpeningStock(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Selling MSRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">HSN Code</label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    placeholder="e.g. 84137010"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / Remarks</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md"
                >
                  Create Product Reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         EDIT PRODUCT MODAL
         ==================================================================== */}
      {showEditModal && productToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono">Edit Product Specifications</h3>
              <button onClick={() => { setShowEditModal(false); setProductToEdit(null); }} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Category</label>
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt("Enter new category name:");
                        if (!name) return;
                        const code = prompt("Enter category code (e.g., ESH, PWS):") || name.slice(0, 3).toUpperCase();
                        const newCat = { id: `cat-${Date.now()}`, name, code, description: "" };
                        setCategories(prev => [...prev, newCat]);
                        setFormCategoryId(newCat.id);
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Quick Add
                    </button>
                  </div>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    {categories.length === 0 && <option value="">-- No Categories --</option>}
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Current Stock</label>
                  <div className="w-full rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 text-sm font-mono font-bold flex items-center gap-2">
                    {(() => {
                      const bs = batchStocks.find(b => b.productId === productToEdit?.id);
                      const qty = bs?.quantity ?? 0;
                      return (
                        <>
                          <span className={qty === 0 ? "text-red-400" : "text-green-400"}>
                            {qty}
                          </span>
                          <span className="text-slate-500 font-normal">{productToEdit?.unit || "nos"}</span>
                          {qty === 0 && <span className="text-xs text-red-400 font-normal ml-auto">OUT OF STOCK</span>}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Selling MSRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">HSN Code</label>
                  <input
                    type="text"
                    value={formHsn}
                    onChange={(e) => setFormHsn(e.target.value)}
                    placeholder="e.g. 84137010"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Notes / Remarks</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setProductToEdit(null); }}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md"
                >
                  Save Specification Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
         IMPORT CSV MODAL
         ==================================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <Upload className="h-5 w-5 text-indigo-400" />
                <span>Bulk Import Products Catalog</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {importNotification && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-pulse">
                <Check className="h-4 w-4" />
                <span>{importNotification}</span>
              </div>
            )}

            <form onSubmit={handleImportCSV} className="mt-4 space-y-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-1">
                <span className="font-bold text-slate-200 block uppercase font-mono tracking-wider">Required Header & Row structure:</span>
                <code className="block bg-slate-950 p-2 rounded text-indigo-300 font-mono mt-1 overflow-x-auto text-[10px]">
                  sku,name,categoryId,unit,purchasePrice,sellingPrice,minStock,maxStock,barcode,qrCode,description
                </code>
                <p className="pt-2">Note: Category mapping matches standard keys (<code className="text-slate-200">cat-1</code> to <code className="text-slate-200">cat-4</code>) or text.</p>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Pasted CSV Content / File simulator</span>
                <button
                  type="button"
                  onClick={handleLoadSampleCSV}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline"
                >
                  Load Sample Template Data
                </button>
              </div>

              <textarea
                rows={8}
                required
                value={csvTextInput}
                onChange={(e) => setCsvTextInput(e.target.value)}
                placeholder="sku,name,categoryId,unit,purchasePrice,sellingPrice,minStock,maxStock,barcode,qrCode,description&#10;DR-NET-92,My New Switch,cat-1,Unit,1200,1950,5,100,8809110,QR-NET-92,Premium switch"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md"
                >
                  Upload & Parse CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

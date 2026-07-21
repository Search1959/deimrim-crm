import React, { useState, useRef } from "react";
import { FileCheck, Plus, X, IndianRupee, CreditCard, ChevronDown, ChevronUp, Upload, Printer, Eye } from "lucide-react";
import { Supplier, PurchaseOrder, VendorInvoice, BillPayment, Product, BatchStock, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  orders: PurchaseOrder[];
  vendorBills: VendorInvoice[];
  setVendorBills: React.Dispatch<React.SetStateAction<VendorInvoice[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setBatchStocks: React.Dispatch<React.SetStateAction<BatchStock[]>>;
  companyId: string;
  companyName?: string;
}

const STATUS_COLORS: Record<VendorInvoice["status"], string> = {
  "Draft":           "bg-slate-700/40 text-slate-400 border-slate-600/30",
  "Pending Payment": "bg-red-500/10 text-red-400 border-red-500/20",
  "Partially Paid":  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Paid":            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

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

function printBill(bill: VendorInvoice, companyName: string) {
  const items = bill.items || [];
  const rows = items.map((it, i) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:center">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #ccc">${it.description}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:center">${it.hsn || ""}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:center">${it.quantity}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:center">${it.unit}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">₹${it.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">₹${it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
    </tr>`).join("");

  const gstAmt = bill.totalAmount - bill.amountBeforeGst;

  const html = `<!DOCTYPE html><html><head><title>Purchase Bill – ${bill.billNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; padding: 20px; }
    h1 { margin: 0; font-size: 18px; } h2 { margin: 0; font-size: 13px; font-weight: normal; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #f0f0f0; padding: 6px 8px; border: 1px solid #ccc; text-align: left; font-size: 11px; }
    .total-row td { font-weight: bold; background: #f9f9f9; }
    @media print { button { display: none; } }
  </style></head><body>
  <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:14px">
    <h1>${companyName}</h1>
    <h2>PURCHASE INVOICE</h2>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:14px">
    <div>
      <strong>Supplier:</strong> ${bill.supplierName}<br/>
      <strong>Bill No.:</strong> ${bill.billNumber}
    </div>
    <div style="text-align:right">
      <strong>Invoice Date:</strong> ${bill.invoiceDate || "—"}<br/>
      <strong>Due Date:</strong> ${bill.dueDate}
    </div>
  </div>
  ${items.length > 0 ? `
  <table>
    <thead><tr>
      <th style="width:40px">Sl.</th>
      <th>Description</th>
      <th style="width:80px">HSN</th>
      <th style="width:60px">Qty</th>
      <th style="width:50px">Unit</th>
      <th style="width:100px;text-align:right">Rate</th>
      <th style="width:110px;text-align:right">Amount</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="6" style="padding:6px 8px;border:1px solid #ccc;text-align:right">Sub Total</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">₹${bill.amountBeforeGst.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
      </tr>
      <tr>
        <td colspan="6" style="padding:6px 8px;border:1px solid #ccc;text-align:right">GST (${bill.gstRate}%)</td>
        <td style="padding:6px 8px;border:1px solid #ccc;text-align:right">₹${gstAmt.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
      </tr>
      <tr class="total-row">
        <td colspan="6" style="padding:8px;border:1px solid #ccc;text-align:right;font-size:13px">GRAND TOTAL</td>
        <td style="padding:8px;border:1px solid #ccc;text-align:right;font-size:13px">₹${bill.totalAmount.toLocaleString("en-IN",{minimumFractionDigits:2})}</td>
      </tr>
    </tfoot>
  </table>` : `<p>No line items recorded.</p>`}
  <div style="margin-top:30px;text-align:right">
    <button onclick="window.print()" style="padding:8px 20px;background:#333;color:#fff;border:none;cursor:pointer;font-size:12px">🖨 Print</button>
  </div>
  </body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (w) { w.document.write(html); w.document.close(); }
}

export default function VendorBillsPanel({
  suppliers, setSuppliers, orders, vendorBills: bills, setVendorBills: setBills,
  products, setProducts, setBatchStocks, companyId, companyName = "DEINRIM",
}: Props) {

  const [showBillForm, setShowBillForm] = useState(false);
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formBillNumber, setFormBillNumber] = useState("");
  const [formPoId, setFormPoId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formGstRate, setFormGstRate] = useState("18");
  const [formDueDate, setFormDueDate] = useState("");
  const [formStatus, setFormStatus] = useState<VendorInvoice["status"]>("Pending Payment");

  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMode, setPayMode] = useState<BillPayment["mode"]>("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingBill, setViewingBill] = useState<VendorInvoice | null>(null);

  const resetBillForm = () => {
    setFormSupplierId(""); setFormBillNumber(""); setFormPoId("");
    setFormAmount(""); setFormGstRate("18"); setFormDueDate("");
    setFormStatus("Pending Payment");
  };
  const resetPayForm = () => {
    setPayAmount(""); setPayDate(new Date().toISOString().slice(0, 10));
    setPayMode("Bank Transfer"); setPayRef(""); setPayRemarks("");
  };

  const supplierPOs = orders.filter(po => po.supplierId === formSupplierId);
  const amountBeforeGst = parseFloat(formAmount) || 0;
  const gstRate = parseFloat(formGstRate) || 0;
  const totalAmount = +(amountBeforeGst + amountBeforeGst * gstRate / 100).toFixed(2);

  // ── Excel Import ────────────────────────────────────────────────────────────
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

      let descCol = 1, hsnCol = -1, qtyCol = 10, rateCol = 11, unitCol = 12;
      for (const row of rows) {
        const lower = (row as any[]).map((c: any) => String(c).toLowerCase().trim());
        const descIdx = lower.findIndex((c: string) => c.includes("description"));
        if (descIdx >= 0) {
          descCol = descIdx;
          const hsnIdx = lower.findIndex((c: string) => c === "hsn" || c.includes("hsn code"));
          if (hsnIdx >= 0) hsnCol = hsnIdx;
          const qtyIdx = lower.findIndex((c: string) => c === "quantity" || c === "qty");
          if (qtyIdx >= 0) qtyCol = qtyIdx;
          const rateIdx = lower.findIndex((c: string) => c === "rate" || c.includes("unit price"));
          if (rateIdx >= 0) rateCol = rateIdx;
          const unitIdx = lower.findIndex((c: string) => c === "per" || c === "unit");
          if (unitIdx >= 0) unitCol = unitIdx;
          break;
        }
      }

      let invoiceNo = "", invDate = "", supplierName = "";
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

      const importedLines: Array<{ productId: string; quantity: number; unitPrice: number }> = [];
      const billItems: NonNullable<VendorInvoice["items"]> = [];
      const createdProducts: Product[] = [];

      for (const row of rows) {
        const slNo = (row as any[])[0];
        if (typeof slNo !== "number" || slNo <= 0) continue;

        const rawDesc = String((row as any[])[descCol] ?? "").trim();
        const desc = rawDesc.replace(/^[*#\s]+|[*#\s]+$/g, "").replace(/\s+/g, " ").trim();
        const qty  = Number((row as any[])[qtyCol])  || 0;
        const rate = Number((row as any[])[rateCol]) || 0;
        const unit = String((row as any[])[unitCol] ?? "NOS").trim() || "NOS";
        const hsn  = hsnCol >= 0 ? String((row as any[])[hsnCol] ?? "").trim() : "";

        if (!desc || qty <= 0 || rate <= 0) continue;

        const sku = makeSKU(desc);
        const allProducts = [...products, ...createdProducts];
        let prod = allProducts.find(p =>
          p.name.toLowerCase() === desc.toLowerCase() || p.sku.toLowerCase() === sku.toLowerCase()
        );
        if (!prod) {
          prod = {
            id: `prod-imp-${Date.now()}-${importedLines.length}`,
            sku, name: desc,
            categoryId: "", brandId: "", unit,
            purchasePrice: rate,
            sellingPrice: Math.round(rate * 1.2),
            minStockLevel: 5, maxStockLevel: 500,
            description: `Imported · Invoice ${invoiceNo || file.name}`,
          };
          createdProducts.push(prod);
        }
        importedLines.push({ productId: prod.id, quantity: qty, unitPrice: rate });
        billItems.push({ description: desc, hsn, unit, quantity: qty, rate, amount: +(qty * rate).toFixed(2) });
      }

      if (createdProducts.length > 0) setProducts(prev => [...prev, ...createdProducts]);

      const subtotalCalc = importedLines.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
      let igst = 0;
      for (const row of rows) {
        const rowText = (row as any[]).map((c: any) => String(c)).join(" ").toUpperCase();
        if (rowText.includes("GST") && !rowText.includes("GSTIN")) {
          const amounts = (row as any[]).map((c: any) => Number(c)).filter(n => n > 1000);
          if (amounts.length > 0) igst = Math.max(...amounts);
        }
      }
      const detectedGST = subtotalCalc > 0 && igst > 0 ? Math.round((igst / subtotalCalc) * 100) : 18;
      const gstAmt = subtotalCalc * (detectedGST / 100);
      const grandTotal = +(subtotalCalc + gstAmt).toFixed(2);

      if (importedLines.length === 0) {
        toast.error("No items found", "Check column headers in the Excel file."); return;
      }

      // Add stock to inventory
      const newStocks: BatchStock[] = importedLines.map((i, idx) => ({
        id: `bs-imp-${Date.now()}-${idx}`,
        productId: i.productId,
        warehouseId: "wh-main",
        batchNumber: `BATCH-${invoiceNo || Date.now()}`,
        quantity: i.quantity,
      }));
      setBatchStocks(prev => [...prev, ...newStocks]);

      // Create Vendor Bill directly
      const sup = suppliers.find(s => s.id === supplierId) || createdProducts.length > 0 ? { name: supplierName } : null;
      const newBill: VendorInvoice = {
        id: `vb-${Date.now()}`,
        billNumber: invoiceNo || `BILL-IMP-${Date.now()}`,
        supplierId,
        supplierName: suppliers.find(s => s.id === supplierId)?.name || supplierName,
        invoiceDate: invDate || undefined,
        amountBeforeGst: +subtotalCalc.toFixed(2),
        gstType: "IGST",
        gstRate: detectedGST,
        totalAmount: grandTotal,
        paidAmount: 0,
        balanceAmount: grandTotal,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: "Pending Payment",
        createdAt: new Date().toISOString(),
        payments: [],
        items: billItems,
      };
      setBills(prev => [newBill, ...prev]);

      toast.success(
        `Bill created — ${billItems.length} items`,
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

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplierId || !formBillNumber || !formAmount) {
      toast.error("Supplier, Bill Number and Amount are required"); return;
    }
    const sup = suppliers.find(s => s.id === formSupplierId);
    const po = orders.find(o => o.id === formPoId);
    const newBill: VendorInvoice = {
      id: `vb-${Date.now()}`,
      billNumber: formBillNumber,
      poId: formPoId || undefined,
      poNumber: po?.poNumber,
      supplierId: formSupplierId,
      supplierName: sup?.name || "",
      amountBeforeGst,
      gstType: "GST",
      gstRate,
      totalAmount,
      dueDate: formDueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: formStatus,
      createdAt: new Date().toISOString(),
      payments: [],
      paidAmount: 0,
      balanceAmount: totalAmount,
    };
    setBills(prev => [newBill, ...prev]);
    toast.success("Bill Recorded", `${formatINR(totalAmount)} bill from ${sup?.name}`);
    setShowBillForm(false);
    resetBillForm();
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount) || 0;
    if (!amt || !payingBillId) { toast.error("Enter a valid payment amount"); return; }
    setBills(prev => prev.map(b => {
      if (b.id !== payingBillId) return b;
      if (amt > b.balanceAmount) { toast.error(`Amount exceeds balance of ${formatINR(b.balanceAmount)}`); return b; }
      const newPayment: BillPayment = {
        id: `pay-${Date.now()}`, billId: b.id, amount: amt,
        date: payDate, mode: payMode, reference: payRef, remarks: payRemarks,
      };
      const newPaid = +(b.paidAmount + amt).toFixed(2);
      const newBalance = +(b.totalAmount - newPaid).toFixed(2);
      const newStatus: VendorInvoice["status"] = newBalance <= 0 ? "Paid" : "Partially Paid";
      return { ...b, payments: [...b.payments, newPayment], paidAmount: newPaid, balanceAmount: newBalance, status: newStatus };
    }));
    toast.success("Payment Recorded", `${formatINR(amt)} via ${payMode}`);
    setPayingBillId(null);
    resetPayForm();
  };

  const totalPending = bills.filter(b => b.status !== "Paid").reduce((s, b) => s + b.balanceAmount, 0);
  const totalPaid    = bills.reduce((s, b) => s + b.paidAmount, 0);
  const payingBill   = bills.find(b => b.id === payingBillId);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Vendor Bills & Payments</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Record supplier bills and track payments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            {importing ? "Importing…" : "Import Excel"}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportXLSX} className="hidden" />
          <button
            onClick={() => { setShowBillForm(true); resetBillForm(); }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Record Bill
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {bills.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
            <p className="text-[10px] text-red-400 font-mono uppercase font-bold mb-1">Balance Pending</p>
            <p className="text-lg font-bold text-red-300 font-mono">{formatINR(totalPending)}</p>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-4">
            <p className="text-[10px] text-emerald-400 font-mono uppercase font-bold mb-1">Total Paid</p>
            <p className="text-lg font-bold text-emerald-300 font-mono">{formatINR(totalPaid)}</p>
          </div>
        </div>
      )}

      {/* Bills table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-xs">
          <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Bill No.</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Invoice Date</th>
              <th className="px-4 py-3 text-left">Due Date</th>
              <th className="px-4 py-3 text-right">Bill Amount</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {bills.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                  No bills recorded yet. Click <span className="text-emerald-400 font-semibold">Import Excel</span> or <span className="text-indigo-400 font-semibold">Record Bill</span> to add one.
                </td>
              </tr>
            ) : bills.map(b => (
              <React.Fragment key={b.id}>
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-indigo-400 font-mono">{b.billNumber}</td>
                  <td className="px-4 py-3 font-semibold text-slate-100">{b.supplierName}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.invoiceDate || "—"}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{b.dueDate}</td>
                  <td className="px-4 py-3 text-right font-bold font-mono text-slate-200">{formatINR(b.totalAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">{formatINR(b.paidAmount)}</td>
                  <td className={`px-4 py-3 text-right font-bold font-mono ${b.balanceAmount > 0 ? "text-red-400" : "text-slate-500"}`}>
                    {formatINR(b.balanceAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingBill(b)}
                        title="View Bill"
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => printBill(b, companyName)}
                        title="Print Invoice"
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                      {b.status !== "Paid" && (
                        <button
                          onClick={() => { setPayingBillId(b.id); resetPayForm(); setPayAmount(String(b.balanceAmount)); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" /> Pay
                        </button>
                      )}
                      {b.payments.length > 0 && (
                        <button
                          onClick={() => setExpandedBillId(expandedBillId === b.id ? null : b.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {expandedBillId === b.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {b.payments.length}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {expandedBillId === b.id && b.payments.length > 0 && (
                  <tr>
                    <td colSpan={9} className="bg-slate-900/60 px-6 py-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-2">Payment History</p>
                      <div className="space-y-1.5">
                        {b.payments.map(p => (
                          <div key={p.id} className="flex items-center gap-4 text-[10px] border-b border-slate-800/50 pb-1.5">
                            <span className="font-mono text-slate-400">{p.date}</span>
                            <span className="font-bold text-emerald-400 font-mono">{formatINR(p.amount)}</span>
                            <span className="text-slate-300">{p.mode}</span>
                            {p.reference && <span className="text-slate-500 font-mono">Ref: {p.reference}</span>}
                            {p.remarks && <span className="text-slate-500 italic">{p.remarks}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Bill Modal */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Purchase Bill — {viewingBill.billNumber}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{viewingBill.supplierName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printBill(viewingBill, companyName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setViewingBill(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Bill info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-b border-slate-800">
              {[
                { label: "Supplier", value: viewingBill.supplierName },
                { label: "Invoice No.", value: viewingBill.billNumber },
                { label: "Invoice Date", value: viewingBill.invoiceDate || "—" },
                { label: "Due Date", value: viewingBill.dueDate },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-0.5">{f.label}</p>
                  <p className="text-xs text-white font-semibold">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div className="px-6 py-4 overflow-x-auto">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold mb-3">Line Items</p>
              {viewingBill.items && viewingBill.items.length > 0 ? (
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px]">
                      <th className="px-3 py-2 border border-slate-800 text-center w-10">Sl.</th>
                      <th className="px-3 py-2 border border-slate-800 text-left">Description</th>
                      <th className="px-3 py-2 border border-slate-800 text-center w-24">HSN</th>
                      <th className="px-3 py-2 border border-slate-800 text-center w-16">Qty</th>
                      <th className="px-3 py-2 border border-slate-800 text-center w-16">Unit</th>
                      <th className="px-3 py-2 border border-slate-800 text-right w-28">Rate (₹)</th>
                      <th className="px-3 py-2 border border-slate-800 text-right w-32">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingBill.items.map((it, i) => (
                      <tr key={i} className="border-b border-slate-800 hover:bg-slate-900/40">
                        <td className="px-3 py-2 border border-slate-800 text-center text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 border border-slate-800 text-slate-200">{it.description}</td>
                        <td className="px-3 py-2 border border-slate-800 text-center text-slate-400 font-mono">{it.hsn || "—"}</td>
                        <td className="px-3 py-2 border border-slate-800 text-center font-bold text-white">{it.quantity}</td>
                        <td className="px-3 py-2 border border-slate-800 text-center text-slate-400">{it.unit}</td>
                        <td className="px-3 py-2 border border-slate-800 text-right font-mono text-slate-300">{it.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-2 border border-slate-800 text-right font-bold font-mono text-white">{it.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900/60">
                      <td colSpan={6} className="px-3 py-2 border border-slate-800 text-right text-slate-400 font-bold">Sub Total</td>
                      <td className="px-3 py-2 border border-slate-800 text-right font-bold font-mono text-slate-200">{viewingBill.amountBeforeGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan={6} className="px-3 py-2 border border-slate-800 text-right text-slate-400">{viewingBill.gstType} @ {viewingBill.gstRate}%</td>
                      <td className="px-3 py-2 border border-slate-800 text-right font-mono text-amber-400">{(viewingBill.totalAmount - viewingBill.amountBeforeGst).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr className="bg-indigo-950/40">
                      <td colSpan={6} className="px-3 py-2.5 border border-slate-700 text-right font-bold text-white text-sm">Grand Total</td>
                      <td className="px-3 py-2.5 border border-slate-700 text-right font-bold font-mono text-indigo-300 text-sm">{formatINR(viewingBill.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <p className="text-slate-500 text-xs">No line items — this bill was created manually.</p>
              )}
            </div>

            {/* Payment summary */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4 border-t border-slate-800">
              {[
                { label: "Bill Total", value: formatINR(viewingBill.totalAmount), color: "text-slate-200" },
                { label: "Paid", value: formatINR(viewingBill.paidAmount), color: "text-emerald-400" },
                { label: "Balance", value: formatINR(viewingBill.balanceAmount), color: viewingBill.balanceAmount > 0 ? "text-red-400" : "text-slate-500" },
              ].map(f => (
                <div key={f.label} className="bg-slate-900 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-mono mb-1">{f.label}</p>
                  <p className={`text-sm font-bold font-mono ${f.color}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Bill Modal */}
      {showBillForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white font-mono">Record Vendor Bill</h3>
              <button onClick={() => setShowBillForm(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Supplier *</label>
                  <select required value={formSupplierId} onChange={e => { setFormSupplierId(e.target.value); setFormPoId(""); }}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bill Number *</label>
                  <input required value={formBillNumber} onChange={e => setFormBillNumber(e.target.value)}
                    placeholder="e.g. INV/2025/001"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Link to Purchase Order (Optional)</label>
                <select value={formPoId} onChange={e => { setFormPoId(e.target.value); const po = orders.find(o => o.id === e.target.value); if (po) setFormAmount(String(po.totalAmount || "")); }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none font-mono">
                  <option value="">-- No PO Link --</option>
                  {supplierPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber} — {formatINR(po.totalAmount)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount Before GST *</label>
                  <input required type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GST %</label>
                  <select value={formGstRate} onChange={e => setFormGstRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none">
                    {["0","5","12","18","28"].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Total</label>
                  <div className="w-full rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 text-xs font-bold font-mono text-emerald-400">{formatINR(totalAmount)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Due Date</label>
                  <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Status</label>
                  <select value={formStatus} onChange={e => setFormStatus(e.target.value as VendorInvoice["status"])}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none">
                    <option>Draft</option><option>Pending Payment</option><option>Partially Paid</option><option>Paid</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowBillForm(false)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingBillId && payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">Record Payment</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{payingBill.supplierName} · Bill {payingBill.billNumber}</p>
              </div>
              <button onClick={() => setPayingBillId(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Bill Total", value: formatINR(payingBill.totalAmount), color: "text-slate-200" },
                { label: "Already Paid", value: formatINR(payingBill.paidAmount), color: "text-emerald-400" },
                { label: "Balance Due", value: formatINR(payingBill.balanceAmount), color: "text-red-400" },
              ].map(item => (
                <div key={item.label} className="bg-slate-900 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] text-slate-500 uppercase font-mono">{item.label}</p>
                  <p className={`text-xs font-bold font-mono mt-0.5 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount Paid *</label>
                  <input required type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Date</label>
                  <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Mode</label>
                  <select value={payMode} onChange={e => setPayMode(e.target.value as BillPayment["mode"])}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none">
                    <option>Cash</option><option>Bank Transfer</option><option>Cheque</option><option>UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Ref / Cheque No.</label>
                  <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Optional"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Remarks</label>
                <input value={payRemarks} onChange={e => setPayRemarks(e.target.value)} placeholder="Optional notes"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setPayingBillId(null)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit"
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer">
                  <IndianRupee className="w-3 h-3" /> Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

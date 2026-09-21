import React, { useState, useRef } from "react";
import { FileCheck, Plus, X, IndianRupee, CreditCard, ChevronDown, ChevronUp, Upload, Printer, Eye, Camera } from "lucide-react";
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

  // Per-slab GST aggregation
  const slabMap: Record<number, { taxable: number; cgst: number; sgst: number }> = {};

  const rows = items.map((it, i) => {
    const qty    = it.quantity || 0;
    const free   = (it as any).free || "";
    const pack   = (it as any).pack || "";
    const batch  = (it as any).batch || "";
    const expiry = (it as any).expiryDate || "";
    const mrp    = parseFloat((it as any).mrp) || 0;
    const disc   = parseFloat((it as any).discount) || 0;
    const gstPct = parseFloat((it as any).gstPct) || 0;
    const taxable = +(it.amount * (1 - disc / 100)).toFixed(2);
    const cgstPct = gstPct / 2;
    const sgstPct = gstPct / 2;
    const cgstAmt = +(taxable * cgstPct / 100).toFixed(2);
    const sgstAmt = +(taxable * sgstPct / 100).toFixed(2);
    if (!slabMap[gstPct]) slabMap[gstPct] = { taxable: 0, cgst: 0, sgst: 0 };
    slabMap[gstPct].taxable += taxable;
    slabMap[gstPct].cgst += cgstAmt;
    slabMap[gstPct].sgst += sgstAmt;
    const lineTotal = +(taxable + cgstAmt + sgstAmt).toFixed(2);
    const td = (v: string | number, align = "center") => `<td style="padding:4px 5px;border:1px solid #ccc;text-align:${align}">${v}</td>`;
    return `<tr>
      ${td(i + 1)}
      ${td(it.description, "left")}
      ${td(pack)}
      ${td(it.hsn || "")}
      ${td(batch)}
      ${td(expiry)}
      ${td(mrp > 0 ? mrp.toFixed(2) : "—", "right")}
      ${td(qty)}
      ${td(free || "")}
      ${td(it.rate.toFixed(2), "right")}
      ${td(disc > 0 ? disc + "%" : "—")}
      ${td(taxable.toFixed(2), "right")}
      ${td(cgstPct > 0 ? cgstPct + "%" : "—")}
      ${td(cgstAmt > 0 ? cgstAmt.toFixed(2) : "—", "right")}
      ${td(sgstPct > 0 ? sgstPct + "%" : "—")}
      ${td(sgstAmt > 0 ? sgstAmt.toFixed(2) : "—", "right")}
      <td style="padding:4px 5px;border:1px solid #ccc;text-align:right;font-weight:600">${lineTotal.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const totalDiscount = items.reduce((s, it) => s + it.amount * (parseFloat((it as any).discount) || 0) / 100, 0);
  const taxableTotal = subtotal - totalDiscount;
  const totalCGST = Object.values(slabMap).reduce((s, v) => s + v.cgst, 0);
  const totalSGST = Object.values(slabMap).reduce((s, v) => s + v.sgst, 0);
  const grandTotal = bill.totalAmount;
  const roundOff = +(grandTotal - (taxableTotal + totalCGST + totalSGST)).toFixed(2);

  const slabRows = Object.entries(slabMap)
    .filter(([, v]) => v.taxable > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([rate, v]) => `<tr>
      <td style="padding:4px 8px;border:1px solid #ddd">${rate}%</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${v.taxable.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${(Number(rate)/2).toFixed(1)}%</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${v.cgst.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:center">${(Number(rate)/2).toFixed(1)}%</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${v.sgst.toFixed(2)}</td>
      <td style="padding:4px 8px;border:1px solid #ddd;text-align:right;font-weight:600">${(v.cgst + v.sgst).toFixed(2)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Purchase Invoice – ${bill.billNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 15px; }
    h1 { margin: 0; font-size: 16px; color: #1a237e; }
    h2 { margin: 4px 0 2px; font-size: 12px; font-weight: bold; color: #1a237e; letter-spacing: 2px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 10px; }
    th { background: #e8eaf6; padding: 5px; border: 1px solid #9fa8da; text-align: center; font-size: 9px; font-weight: bold; }
    .total-row td { font-weight: bold; background: #f5f5f5; }
    .grand-row td { font-weight: bold; background: #e8eaf6; font-size: 12px; color: #1a237e; }
    .sec { font-size: 10px; font-weight: bold; color: #1a237e; text-transform: uppercase; letter-spacing: 1px; margin: 8px 0 4px; border-bottom: 1px solid #9fa8da; padding-bottom: 2px; }
    @media print { button { display: none; } body { padding: 8px; } }
  </style></head><body>

  <div style="text-align:center;border-bottom:3px double #1a237e;padding-bottom:10px;margin-bottom:12px">
    <h1>${companyName}</h1>
    <h2>PURCHASE INVOICE</h2>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
    <div style="border:1px solid #ddd;border-radius:4px;padding:8px;background:#fafafa">
      <div class="sec">Supplier Details</div>
      <strong>${bill.supplierName || "—"}</strong><br/>
      ${(bill as any).supplierGSTIN ? `GSTIN: <strong>${(bill as any).supplierGSTIN}</strong><br/>` : ""}
    </div>
    <div style="border:1px solid #ddd;border-radius:4px;padding:8px;background:#fafafa">
      <div class="sec">Invoice Details</div>
      <table style="margin:0;border:none">
        <tr><td style="padding:2px 6px 2px 0;border:none;color:#555">Invoice No.:</td><td style="padding:2px 0;border:none;font-weight:bold">${bill.billNumber}</td></tr>
        <tr><td style="padding:2px 6px 2px 0;border:none;color:#555">Invoice Date:</td><td style="padding:2px 0;border:none;font-weight:bold">${bill.invoiceDate || "—"}</td></tr>
        <tr><td style="padding:2px 6px 2px 0;border:none;color:#555">Due Date:</td><td style="padding:2px 0;border:none">${bill.dueDate || "—"}</td></tr>
        ${(bill as any).challanNo ? `<tr><td style="padding:2px 6px 2px 0;border:none;color:#555">Challan No.:</td><td style="padding:2px 0;border:none">${(bill as any).challanNo}</td></tr>` : ""}
      </table>
    </div>
  </div>

  ${items.length > 0 ? `
  <div class="sec">Product Details</div>
  <div style="overflow-x:auto">
  <table style="font-size:9.5px">
    <thead><tr>
      <th style="width:26px">Sl.</th>
      <th style="min-width:140px;text-align:left">Product Description</th>
      <th style="width:44px">Pack</th>
      <th style="width:52px">HSN</th>
      <th style="width:68px">Batch No.</th>
      <th style="width:52px">Exp.Dt</th>
      <th style="width:58px">MRP</th>
      <th style="width:36px">Qty</th>
      <th style="width:32px">Free</th>
      <th style="width:58px">Rate</th>
      <th style="width:42px">Dis%</th>
      <th style="width:68px">Taxable</th>
      <th style="width:42px">CGST%</th>
      <th style="width:58px">CGST ₹</th>
      <th style="width:42px">SGST%</th>
      <th style="width:58px">SGST ₹</th>
      <th style="width:70px">Amt (₹)</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="7" style="padding:5px;border:1px solid #ccc;text-align:right">Sub Total</td>
        <td style="padding:5px;border:1px solid #ccc;text-align:center">${items.reduce((s, it) => s + it.quantity, 0)}</td>
        <td colspan="3" style="padding:5px;border:1px solid #ccc"></td>
        <td style="padding:5px;border:1px solid #ccc;text-align:right">${taxableTotal.toFixed(2)}</td>
        <td colspan="2" style="padding:5px;border:1px solid #ccc;text-align:right">${totalCGST.toFixed(2)}</td>
        <td colspan="2" style="padding:5px;border:1px solid #ccc;text-align:right">${totalSGST.toFixed(2)}</td>
        <td style="padding:5px;border:1px solid #ccc;text-align:right">${(taxableTotal + totalCGST + totalSGST).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  </div>

  ${slabRows ? `<div class="sec" style="margin-top:10px">GST Summary (Slab-wise)</div>
  <table style="max-width:480px;font-size:10px">
    <thead><tr>
      <th>GST Slab</th><th>Taxable Amt</th><th>CGST %</th><th>CGST Amt</th><th>SGST %</th><th>SGST Amt</th><th>Total Tax</th>
    </tr></thead>
    <tbody>${slabRows}</tbody>
  </table>` : ""}

  <div style="display:flex;justify-content:flex-end;margin-top:10px">
    <table style="width:280px;font-size:11px">
      <tr><td style="padding:4px 8px;border:1px solid #ddd">Gross Amount</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${subtotal.toFixed(2)}</td></tr>
      ${totalDiscount > 0 ? `<tr><td style="padding:4px 8px;border:1px solid #ddd">(-) Discount</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right;color:#c62828">${totalDiscount.toFixed(2)}</td></tr>` : ""}
      <tr><td style="padding:4px 8px;border:1px solid #ddd">Taxable Value</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${taxableTotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 8px;border:1px solid #ddd">CGST</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${totalCGST.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 8px;border:1px solid #ddd">SGST</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${totalSGST.toFixed(2)}</td></tr>
      ${roundOff !== 0 ? `<tr><td style="padding:4px 8px;border:1px solid #ddd">Round Off</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:right">${roundOff > 0 ? "+" : ""}${roundOff.toFixed(2)}</td></tr>` : ""}
      <tr class="grand-row"><td style="padding:6px 8px;border:1px solid #9fa8da">Grand Total</td><td style="padding:6px 8px;border:1px solid #9fa8da;text-align:right">₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>` : `<p style="color:#888">No line items recorded.</p>`}

  <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:10px;border-top:1px solid #ddd">
    <div style="text-align:center;min-width:140px"><div style="border-top:1px solid #333;padding-top:4px;margin-top:30px">Receiver's Signature</div></div>
    <div style="text-align:center;min-width:140px"><div style="border-top:1px solid #333;padding-top:4px;margin-top:30px">Authorised Signatory</div></div>
  </div>
  <div style="margin-top:16px">
    <button onclick="window.print()" style="padding:8px 20px;background:#1a237e;color:#fff;border:none;cursor:pointer;font-size:12px;border-radius:4px">🖨 Print</button>
  </div>
  </body></html>`;

  const w = window.open("", "_blank", "width=1150,height=780");
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
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
  // Extended purchase bill form fields
  const [formInvoiceDate, setFormInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [formSupplierGSTIN, setFormSupplierGSTIN] = useState("");
  const [formChallanNo, setFormChallanNo] = useState("");
  const [formEWayBillNo, setFormEWayBillNo] = useState("");
  const [formVehicleNo, setFormVehicleNo] = useState("");
  const [formTransportMode, setFormTransportMode] = useState("Road");
  const [formNarration, setFormNarration] = useState("");
  type BillLineItem = { id: string; description: string; hsn: string; qty: string; free: string; pack: string; unit: string; batch: string; expiryDate: string; mrp: string; rate: string; discount: string; gstPct: string; };
  const blankLine = (): BillLineItem => ({ id: Date.now().toString(), description: "", hsn: "", qty: "1", free: "", pack: "", unit: "Nos", batch: "", expiryDate: "", mrp: "", rate: "", discount: "", gstPct: "18" });
  const [formLines, setFormLines] = useState<BillLineItem[]>([blankLine()]);
  const [useLineItems, setUseLineItems] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showScanMenu, setShowScanMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = async (facing: "environment" | "user") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch {
      toast.error("Camera access denied — please allow camera permission");
      setShowCamera(false);
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      stopCamera();
      setShowCamera(false);
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
      resetBillForm();
      setShowBillForm(true);
      handleScanBill(file);
    }, "image/jpeg", 0.92);
  };

  const handleScanBill = async (file: File) => {
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/scan-bill", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.bill) { toast.error(data.error || "Could not read bill"); return; }
      const b = data.bill;
      if (b.supplierName) {
        const matched = suppliers.find(s => s.name.toLowerCase().includes(b.supplierName.toLowerCase()));
        if (matched) { setFormSupplierId(matched.id); setFormSupplierGSTIN(matched.taxId || b.supplierGSTIN || ""); }
        else setFormSupplierGSTIN(b.supplierGSTIN || "");
      }
      if (b.billNumber) setFormBillNumber(b.billNumber);
      if (b.invoiceDate) setFormInvoiceDate(b.invoiceDate);
      if (b.dueDate) setFormDueDate(b.dueDate);
      if (b.challanNo) setFormChallanNo(b.challanNo);
      if (b.eWayBillNo) setFormEWayBillNo(b.eWayBillNo);
      if (b.vehicleNo) setFormVehicleNo(b.vehicleNo.toUpperCase());
      if (b.transportMode) setFormTransportMode(b.transportMode);
      if (b.narration) setFormNarration(b.narration);
      if (b.items?.length) {
        setUseLineItems(true);
        setFormLines(b.items.map((item: any) => ({
          id: Date.now().toString() + Math.random(),
          description: item.description || "",
          hsn: item.hsn || "",
          qty: String(item.qty ?? 1),
          free: String(item.free ?? ""),
          pack: item.pack || "",
          unit: item.unit || "Nos",
          batch: item.batch || "",
          expiryDate: item.expiryDate || "",
          mrp: String(item.mrp ?? ""),
          rate: String(item.rate ?? ""),
          discount: String(item.discount ?? ""),
          gstPct: String(item.gstPct ?? 18),
        })));
      }
      if (isMobile) setWasScannedOnMobile(true);
      toast.success("Bill scanned — please review and save");
    } catch {
      toast.error("Scan failed — try a clearer photo");
    } finally {
      setScanning(false);
    }
  };

  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payMode, setPayMode] = useState<BillPayment["mode"]>("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [skipStock, setSkipStock] = useState(false);
  const [wasScannedOnMobile, setWasScannedOnMobile] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewingBill, setViewingBill] = useState<VendorInvoice | null>(null);

  const resetBillForm = () => {
    setFormSupplierId(""); setFormBillNumber(""); setFormPoId("");
    setFormAmount(""); setFormGstRate("18"); setFormDueDate("");
    setFormStatus("Pending Payment");
    setFormInvoiceDate(new Date().toISOString().slice(0, 10));
    setFormSupplierGSTIN(""); setFormChallanNo(""); setFormEWayBillNo("");
    setFormVehicleNo(""); setFormTransportMode("Road"); setFormNarration("");
    setFormLines([blankLine()]); setUseLineItems(true);
    setWasScannedOnMobile(false);
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
            const val = String(rows[i + 1]?.[j] ?? row[j + 1] ?? "").trim().split(/\s+/)[0];
            if (val && !/^(no|number|#)$/i.test(val)) invoiceNo = val;
          }
          if ((cell === "dated" || cell === "date" || cell.includes("invoice date")) && !invDate) {
            const val = String(rows[i + 1]?.[j] ?? row[j + 1] ?? "").trim();
            if (val) invDate = val;
          }
          // Capture supplier name from adjacent cell (common in Tally: "Party Name:" "M/s XYZ")
          if (!supplierName && /^(party\s*name|party|supplier\s*name|vendor\s*name|bill\s*to|sold\s*to|buyer|from\s*m\/s|company\s*name)/i.test(cell)) {
            const sameRow = String(row[j + 1] ?? "").trim();
            const nextRow = String(rows[i + 1]?.[j] ?? "").trim();
            const candidate = sameRow || nextRow;
            if (candidate && !/^(name|gstin|address|phone|email|:)$/i.test(candidate) && candidate.length > 1) {
              supplierName = candidate;
            }
          }
        }
        const firstCell = String(row[0]).toLowerCase().trim();
        // Legacy pattern + broader fallback
        if (!supplierName && (firstCell.includes("supplier") && firstCell.includes("bill"))) {
          supplierName = String(rows[i + 1]?.[0] ?? "").trim();
        }
        if (!supplierName && /^(party|supplier|vendor|bill\s*to|from)[\s:]/i.test(firstCell)) {
          const candidate = String(row[1] ?? rows[i + 1]?.[0] ?? "").trim();
          if (candidate && candidate.length > 1) supplierName = candidate;
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
        billItems.push({ description: desc, hsn, unit, quantity: qty, rate, amount: +(qty * rate).toFixed(2), gstPct: 18 } as any);
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

      // Add stock only if not skipped
      let stockWasAdded = false;
      if (!skipStock) {
        const importedProductIds = new Set(importedLines.map(i => i.productId));
        const newStocks: BatchStock[] = importedLines.map((i, idx) => ({
          id: `bs-imp-${Date.now()}-${idx}`,
          productId: i.productId,
          warehouseId: "wh-main",
          batchNumber: `BATCH-${invoiceNo || Date.now()}`,
          quantity: i.quantity,
        }));
        setBatchStocks(prev => [...prev.filter(b => !importedProductIds.has(b.productId)), ...newStocks]);
        stockWasAdded = true;
      }

      // Create Purchase Bill directly
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
        stockAdded: stockWasAdded,
      };
      setBills(prev => [newBill, ...prev]);

      toast.success(
        `Bill created — ${billItems.length} items`,
        stockWasAdded
          ? `${createdProducts.length} new products · stock added to Inventory · GST ${detectedGST}%`
          : `Stock NOT added — click "Add to Stock" on the bill when ready`
      );
    } catch (err) {
      toast.error("Import Failed", "Could not parse the Excel file. Check format.");
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddStock = (bill: VendorInvoice) => {
    if (!bill.items || bill.items.length === 0) { toast.error("No line items on this bill"); return; }
    const allProducts = products;
    const batchNum = `BATCH-${bill.billNumber}`;
    const newStocks: BatchStock[] = bill.items.map((it, idx) => {
      const prod = allProducts.find(p => p.name.toLowerCase() === it.description.toLowerCase());
      if (!prod) return null;
      return { id: `bs-man-${Date.now()}-${idx}`, productId: prod.id, warehouseId: "wh-main", batchNumber: batchNum, quantity: it.quantity };
    }).filter(Boolean) as BatchStock[];
    if (newStocks.length === 0) { toast.error("No matching products found in inventory"); return; }
    const addedIds = new Set(newStocks.map(s => s.productId));
    setBatchStocks(prev => [...prev.filter(b => !addedIds.has(b.productId)), ...newStocks]);
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, stockAdded: true } : b));
    toast.success(`Stock added — ${newStocks.length} products updated`);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplierId || !formBillNumber) {
      toast.error("Supplier and Bill Number are required"); return;
    }
    const sup = suppliers.find(s => s.id === formSupplierId);
    const po = orders.find(o => o.id === formPoId);

    let computedSubtotal = 0;
    let computedGST = 0;
    let billItems: VendorInvoice["items"] = undefined;

    if (useLineItems && formLines.some(l => l.description && l.rate)) {
      const validLines = formLines.filter(l => l.description && l.rate);
      billItems = validLines.map(l => {
        const qty  = parseFloat(l.qty) || 1;
        const rate = parseFloat(l.rate) || 0;
        const disc = parseFloat(l.discount) || 0;
        const gross = +(qty * rate).toFixed(2);
        const amt   = +(gross * (1 - disc / 100)).toFixed(2);
        const gst   = parseFloat(l.gstPct) || 0;
        computedSubtotal += gross;
        computedGST += +(amt * gst / 100).toFixed(2);
        return {
          description: l.description, hsn: l.hsn, unit: l.unit, quantity: qty, rate, amount: amt,
          free: parseFloat(l.free) || 0, pack: l.pack, batch: l.batch,
          expiryDate: l.expiryDate, mrp: parseFloat(l.mrp) || 0,
          discount: disc, gstPct: gst,
        } as any;
      });
    } else {
      computedSubtotal = parseFloat(formAmount) || 0;
      computedGST = +(computedSubtotal * (parseFloat(formGstRate) || 0) / 100).toFixed(2);
    }

    const finalTotal = +(computedSubtotal + computedGST).toFixed(2);

    const newBill: VendorInvoice = {
      id: `vb-${Date.now()}`,
      billNumber: formBillNumber,
      poId: formPoId || undefined,
      poNumber: po?.poNumber,
      supplierId: formSupplierId,
      supplierName: sup?.name || "",
      invoiceDate: formInvoiceDate,
      amountBeforeGst: computedSubtotal,
      gstType: "GST",
      gstRate: useLineItems ? 0 : (parseFloat(formGstRate) || 0),
      totalAmount: finalTotal,
      dueDate: formDueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: formStatus,
      createdAt: new Date().toISOString(),
      payments: [],
      paidAmount: 0,
      balanceAmount: finalTotal,
      items: billItems,
    };
    setBills(prev => [newBill, ...prev]);

    // Auto-add to inventory when bill was created from mobile camera scan
    if (wasScannedOnMobile && billItems && billItems.length > 0) {
      const batchNum = `BATCH-${newBill.billNumber}`;
      const newStocks: BatchStock[] = billItems.map((it: any, idx: number) => {
        const prod = products.find(p => p.name.toLowerCase() === it.description.toLowerCase());
        if (!prod) return null;
        return { id: `bs-scan-${Date.now()}-${idx}`, productId: prod.id, warehouseId: "wh-main", batchNumber: batchNum, quantity: it.quantity };
      }).filter(Boolean) as BatchStock[];
      if (newStocks.length > 0) {
        const addedIds = new Set(newStocks.map((s: BatchStock) => s.productId));
        setBatchStocks(prev => [...prev.filter(b => !addedIds.has(b.productId)), ...newStocks]);
        setBills(prev => prev.map(b => b.id === newBill.id ? { ...b, stockAdded: true } : b));
        toast.success("Purchase Bill Recorded + Stock Updated", `${newStocks.length} products added to inventory`);
      } else {
        toast.success("Purchase Bill Recorded", `${formatINR(finalTotal)} bill from ${sup?.name} — add products to inventory first`);
      }
    } else {
      toast.success("Purchase Bill Recorded", `${formatINR(finalTotal)} bill from ${sup?.name}`);
    }

    setShowBillForm(false);
    resetBillForm();
    setWasScannedOnMobile(false);
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
            <h3 className="text-sm font-bold text-white font-mono">Purchase Bills & Payments</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Record supplier bills and track payments</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipStock}
              onChange={e => setSkipStock(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5"
            />
            <span className="text-[10px] text-slate-400 font-mono font-bold">Bill only (skip stock)</span>
          </label>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            {importing ? "Importing…" : "Import Excel"}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportXLSX} className="hidden" />
          <input ref={scanInputRef} type="file" accept="image/*,application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { resetBillForm(); setShowBillForm(true); handleScanBill(f); } e.target.value = ""; }} />
          <button
            onClick={() => { setShowBillForm(true); resetBillForm(); }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Record Bill
          </button>
        </div>
      </div>

      {/* Mobile hero scan button */}
      {isMobile && (
        <button
          onClick={() => { setCameraFacing("environment"); setShowCamera(true); startCamera("environment"); }}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 px-4 py-5 text-white font-bold text-base shadow-lg shadow-indigo-900/40 transition-all"
        >
          <Camera className="h-6 w-6" />
          📷 SCAN PURCHASE BILL
          <span className="text-xs font-normal opacity-75 ml-1">Auto inventory entry</span>
        </button>
      )}

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
                      {!b.stockAdded && b.items && b.items.length > 0 && (
                        <button
                          onClick={() => handleAddStock(b)}
                          title="Add to Stock"
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-400 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          + Stock
                        </button>
                      )}
                      {b.stockAdded && (
                        <span className="px-2 py-1 text-[9px] font-bold text-emerald-600 font-mono">✓ Stocked</span>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/70 backdrop-blur-sm p-2 md:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl my-2 md:my-8">
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

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-mono">📷 Scan Purchase Bill</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setCameraFacing(f => { const next = f === "environment" ? "user" : "environment"; startCamera(next); return next; }); }}
                  className="text-[10px] text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-1 cursor-pointer">🔄 Flip</button>
                <button onClick={() => { stopCamera(); setShowCamera(false); }} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
              </div>
            </div>
            <div className="relative bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-72 object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* aim guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-violet-400/60 rounded-lg w-4/5 h-4/5" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)" }} />
              </div>
            </div>
            <div className="px-5 py-4 flex flex-col items-center gap-3">
              <p className="text-[10px] text-slate-400 font-mono text-center">Hold bill flat inside the frame, ensure good lighting</p>
              <button onClick={captureFromCamera}
                className="w-16 h-16 rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all flex items-center justify-center text-2xl shadow-lg cursor-pointer">
                📷
              </button>
              <p className="text-[10px] text-slate-500">Tap the button to capture</p>
            </div>
          </div>
        </div>
      )}

      {/* Record Bill Modal */}
      {showBillForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 sticky top-0 bg-slate-950 z-10">
              <h3 className="text-sm font-bold text-white font-mono">Record Purchase Bill</h3>
              <div className="flex items-center gap-2">
                <input ref={scanInputRef} type="file" accept="image/*,application/pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleScanBill(f); e.target.value = ""; }} />
                <div className="relative">
                  <button type="button" onClick={() => setShowScanMenu(v => !v)} disabled={scanning}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-3 py-1.5 text-[10px] font-bold text-white transition-colors cursor-pointer">
                    {scanning ? "⏳ Scanning…" : "📷 Scan Bill ▾"}
                  </button>
                  {showScanMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
                      <button type="button" onClick={() => { setShowScanMenu(false); setCameraFacing("environment"); setShowCamera(true); setTimeout(() => startCamera("environment"), 100); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-white hover:bg-slate-800 cursor-pointer text-left">
                        📷 <span><span className="font-bold">Rear Camera</span><br/><span className="text-slate-400">Mobile rear / desktop webcam</span></span>
                      </button>
                      <button type="button" onClick={() => { setShowScanMenu(false); setCameraFacing("user"); setShowCamera(true); setTimeout(() => startCamera("user"), 100); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-white hover:bg-slate-800 cursor-pointer text-left border-t border-slate-800">
                        🤳 <span><span className="font-bold">Front Camera</span><br/><span className="text-slate-400">Selfie / front-facing cam</span></span>
                      </button>
                      <button type="button" onClick={() => { setShowScanMenu(false); scanInputRef.current?.click(); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-white hover:bg-slate-800 cursor-pointer text-left border-t border-slate-800">
                        📁 <span><span className="font-bold">Upload File</span><br/><span className="text-slate-400">Photo, scan or PDF</span></span>
                      </button>
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => setShowBillForm(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <form onSubmit={handleCreateBill} className="p-6 space-y-5">

              {/* Section 1: Supplier & Bill Info */}
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono mb-3">Supplier & Bill Details</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Supplier *</label>
                    <select required value={formSupplierId} onChange={e => { setFormSupplierId(e.target.value); setFormPoId(""); const sup = suppliers.find(s => s.id === e.target.value); if (sup) setFormSupplierGSTIN(sup.taxId || ""); }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500">
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Supplier GSTIN</label>
                    <input value={formSupplierGSTIN} onChange={e => setFormSupplierGSTIN(e.target.value)} placeholder="15-digit GSTIN"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bill / Invoice No *</label>
                    <input required value={formBillNumber} onChange={e => setFormBillNumber(e.target.value)} placeholder="e.g. INV/2025/001"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Invoice Date</label>
                    <input type="date" value={formInvoiceDate} onChange={e => setFormInvoiceDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Due Date</label>
                    <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Challan No</label>
                    <input value={formChallanNo} onChange={e => setFormChallanNo(e.target.value)} placeholder="Challan / DC No"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Link to PO (Optional)</label>
                    <select value={formPoId} onChange={e => {
                      const poId = e.target.value;
                      setFormPoId(poId);
                      if (poId && useLineItems) {
                        const po = orders.find(o => o.id === poId);
                        if (po?.items?.length) {
                          setFormLines(po.items.map(item => {
                            const prod = products.find(p => p.id === item.productId || p.name === item.productName);
                            return {
                              id: Date.now().toString() + Math.random(),
                              description: item.productName || prod?.name || "",
                              hsn: prod?.hsn || "",
                              qty: String(item.quantity || 1),
                              free: "", pack: "", unit: item.unit || prod?.unit || "Nos",
                              batch: "", expiryDate: "", mrp: "", discount: "",
                              rate: String(item.unitPrice || item.rate || ""),
                              gstPct: String(prod?.gstRate || "18"),
                            };
                          }));
                        }
                      }
                    }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none font-mono">
                      <option value="">-- No PO Link --</option>
                      {supplierPOs.map(po => <option key={po.id} value={po.id}>{po.poNumber}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Status</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as VendorInvoice["status"])}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none">
                      <option>Draft</option><option>Pending Payment</option><option>Partially Paid</option><option>Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: e-Way Bill / Transport */}
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono mb-3">e-Way Bill / Transport</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">e-Way Bill No</label>
                    <input value={formEWayBillNo} onChange={e => setFormEWayBillNo(e.target.value)} placeholder="12-digit EWB"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Transport Mode</label>
                    <select value={formTransportMode} onChange={e => setFormTransportMode(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none">
                      <option>Road</option><option>Rail</option><option>Air</option><option>Ship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Vehicle Number</label>
                    <input value={formVehicleNo} onChange={e => setFormVehicleNo(e.target.value.toUpperCase())} placeholder="WB12AB1234"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono uppercase focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Narration</label>
                    <input value={formNarration} onChange={e => setFormNarration(e.target.value)} placeholder="Optional remarks"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Section 3: Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Line Items</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={useLineItems} onChange={e => setUseLineItems(e.target.checked)} className="accent-emerald-500" />
                      Use line items
                    </label>
                    {useLineItems && (
                      <button type="button" onClick={() => setFormLines(prev => [...prev, blankLine()])}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer">+ Add Row</button>
                    )}
                  </div>
                </div>

                {useLineItems ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px]">
                        <tr>
                          <th className="px-1 py-2 text-left w-8">#</th>
                          <th className="px-2 py-2 text-left min-w-[150px]">Description *</th>
                          <th className="px-1 py-2 text-center w-20">HSN</th>
                          <th className="px-1 py-2 text-center w-14">Pack</th>
                          <th className="px-1 py-2 text-center w-16">Qty</th>
                          <th className="px-1 py-2 text-center w-12">Free</th>
                          <th className="px-1 py-2 text-center w-16">Unit</th>
                          <th className="px-1 py-2 text-center w-20">Batch</th>
                          <th className="px-1 py-2 text-center w-20">Exp.Dt</th>
                          <th className="px-1 py-2 text-right w-18">MRP</th>
                          <th className="px-1 py-2 text-right w-22">Rate (₹)</th>
                          <th className="px-1 py-2 text-center w-14">Dis%</th>
                          <th className="px-1 py-2 text-center w-14">GST%</th>
                          <th className="px-1 py-2 text-right w-22">Amount (₹)</th>
                          <th className="px-1 py-2 w-6"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formLines.map((line, idx) => {
                          const qty  = parseFloat(line.qty) || 0;
                          const rate = parseFloat(line.rate) || 0;
                          const disc = parseFloat(line.discount) || 0;
                          const gross = +(qty * rate).toFixed(2);
                          const amt  = +(gross * (1 - disc / 100)).toFixed(2);
                          const upd = (field: keyof typeof line) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
                            setFormLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: e.target.value } : l));
                          return (
                            <tr key={line.id} className="border-t border-slate-800">
                              <td className="px-1 py-1 text-slate-500 text-center text-[10px]">{idx + 1}</td>
                              <td className="px-1 py-1">
                                <select value={line.description} onChange={e => {
                                  const val = e.target.value;
                                  const prod = products.find(p => p.name === val);
                                  setFormLines(prev => prev.map((l, i) => i === idx ? {
                                    ...l,
                                    description: val,
                                    hsn: prod?.hsn || l.hsn,
                                    unit: prod?.unit || l.unit,
                                    rate: prod ? String(prod.sellingPrice ?? prod.costPrice ?? l.rate) : l.rate,
                                    gstPct: prod?.gstRate ? String(prod.gstRate) : l.gstPct,
                                  } : l));
                                }} className="w-full bg-slate-800 rounded px-1 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs">
                                  <option value="">-- Product --</option>
                                  {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                  <option value={line.description && !products.find(p => p.name === line.description) ? line.description : "__manual__"}>✏ Manual</option>
                                </select>
                                {(line.description === "__manual__" || (line.description && !products.find(p => p.name === line.description))) && (
                                  <input value={line.description === "__manual__" ? "" : line.description} onChange={e => setFormLines(prev => prev.map((l, i) => i === idx ? { ...l, description: e.target.value } : l))}
                                    className="w-full bg-slate-700 rounded px-1 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs mt-1" placeholder="Description..." autoFocus />
                                )}
                              </td>
                              <td className="px-1 py-1"><input value={line.hsn} onChange={upd("hsn")} className="w-full bg-slate-800 rounded px-1 py-1 text-white font-mono focus:outline-none text-[10px]" placeholder="HSN" /></td>
                              <td className="px-1 py-1"><input value={line.pack} onChange={upd("pack")} className="w-full bg-slate-800 rounded px-1 py-1 text-white focus:outline-none text-[10px]" placeholder="e.g. 10×10" /></td>
                              <td className="px-1 py-1"><input type="number" value={line.qty} onChange={upd("qty")} className="w-full bg-slate-800 rounded px-1 py-1 text-white text-center font-mono focus:outline-none text-[10px]" /></td>
                              <td className="px-1 py-1"><input type="number" value={line.free} onChange={upd("free")} className="w-full bg-slate-800 rounded px-1 py-1 text-white text-center font-mono focus:outline-none text-[10px]" placeholder="0" /></td>
                              <td className="px-1 py-1">
                                <select value={line.unit} onChange={upd("unit")} className="w-full bg-slate-800 rounded px-1 py-1 text-white focus:outline-none text-[10px]">
                                  {["Nos","Pcs","Set","Kg","Ltr","Mtr","Box","Bag","Strip","Botl","Amp","Vial"].map(u => <option key={u}>{u}</option>)}
                                </select>
                              </td>
                              <td className="px-1 py-1"><input value={line.batch} onChange={upd("batch")} className="w-full bg-slate-800 rounded px-1 py-1 text-white font-mono focus:outline-none text-[10px]" placeholder="Batch" /></td>
                              <td className="px-1 py-1"><input value={line.expiryDate} onChange={upd("expiryDate")} className="w-full bg-slate-800 rounded px-1 py-1 text-white font-mono focus:outline-none text-[10px]" placeholder="MM/YY" /></td>
                              <td className="px-1 py-1"><input type="number" value={line.mrp} onChange={upd("mrp")} className="w-full bg-slate-800 rounded px-1 py-1 text-white text-right font-mono focus:outline-none text-[10px]" placeholder="MRP" /></td>
                              <td className="px-1 py-1"><input type="number" value={line.rate} onChange={upd("rate")} className="w-full bg-slate-800 rounded px-1 py-1 text-white text-right font-mono focus:outline-none text-[10px]" placeholder="0.00" /></td>
                              <td className="px-1 py-1"><input type="number" value={line.discount} onChange={upd("discount")} className="w-full bg-slate-800 rounded px-1 py-1 text-white text-center font-mono focus:outline-none text-[10px]" placeholder="0" /></td>
                              <td className="px-1 py-1">
                                <select value={line.gstPct} onChange={upd("gstPct")} className="w-full bg-slate-800 rounded px-1 py-1 text-white focus:outline-none text-[10px]">
                                  {["0","5","12","18","28"].map(r => <option key={r} value={r}>{r}%</option>)}
                                </select>
                              </td>
                              <td className="px-1 py-1 text-right font-mono font-bold text-emerald-400 text-[10px]">{amt > 0 ? amt.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "—"}</td>
                              <td className="px-1 py-1">
                                {formLines.length > 1 && (
                                  <button type="button" onClick={() => setFormLines(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 cursor-pointer"><X className="w-3 h-3" /></button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-900/60 text-[10px] font-mono">
                        {(() => {
                          const validLines = formLines.filter(l => l.description && l.rate);
                          const gross    = validLines.reduce((s, l) => s + (parseFloat(l.qty)||0)*(parseFloat(l.rate)||0), 0);
                          const discTotal= validLines.reduce((s, l) => s + (parseFloat(l.qty)||0)*(parseFloat(l.rate)||0)*(parseFloat(l.discount)||0)/100, 0);
                          const subtotal = gross - discTotal;
                          const gstTotal = validLines.reduce((s, l) => { const amt = (parseFloat(l.qty)||0)*(parseFloat(l.rate)||0)*(1-(parseFloat(l.discount)||0)/100); return s + amt*(parseFloat(l.gstPct)||0)/100; }, 0);
                          const grand = subtotal + gstTotal;
                          return (<>
                            <tr><td colSpan={13} className="px-3 py-1.5 text-right text-slate-400 border-t border-slate-700">Taxable Amount</td><td colSpan={2} className="px-3 py-1.5 text-right text-slate-200 border-t border-slate-700">{subtotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</td></tr>
                            <tr><td colSpan={13} className="px-3 py-1.5 text-right text-slate-400">GST</td><td colSpan={2} className="px-3 py-1.5 text-right text-amber-400">{gstTotal.toLocaleString("en-IN",{minimumFractionDigits:2})}</td></tr>
                            <tr><td colSpan={13} className="px-3 py-2 text-right font-bold text-white">Grand Total</td><td colSpan={2} className="px-3 py-2 text-right font-bold text-emerald-400 text-sm">{formatINR(grand)}</td></tr>
                          </>);
                        })()}
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Taxable Amount *</label>
                      <input required type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
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
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowBillForm(false)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit"
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer">Save Purchase Bill</button>
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

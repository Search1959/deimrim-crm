import React, { useState, useCallback } from "react";
import { X, Plus, Trash2, Printer, Save, ChevronDown } from "lucide-react";
import { Company, Customer, Invoice, Product, BatchStock, ServiceCatalogItem } from "../../types";
import { toast } from "../../utils/toast";

// ---- helpers ----

function numWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen",
    "Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  if (n === 0) return "Zero";
  if (n < 0) return "Minus " + numWords(-n);

  let words = "";
  if (Math.floor(n / 10000000) > 0) {
    words += numWords(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (Math.floor(n / 100000) > 0) {
    words += numWords(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (Math.floor(n / 1000) > 0) {
    words += numWords(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (Math.floor(n / 100) > 0) {
    words += numWords(Math.floor(n / 100)) + " Hundred ";
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) words += ones[n] + " ";
    else words += tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
  }
  return words.trim();
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = "INR " + numWords(rupees) + " Rupees";
  if (paise > 0) result += " and " + numWords(paise) + " Paise";
  result += " Only";
  return result;
}

function genFYInvoiceNumber(existing: Invoice[]): string {
  const now = new Date();
  const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fy = `${yr}-${String(yr + 1).slice(2)}`;
  const fyInvoices = existing.filter(inv => inv.invoiceNumber.startsWith(fy + "/"));
  const next = fyInvoices.length + 1;
  return `${fy}/${String(next).padStart(3, "0")}`;
}

const GST_RATES = [0, 5, 12, 18, 28];

interface LineItem {
  id: string;
  itemType: "product" | "service";
  productId: string;
  description: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
  discPct: number;
  gstPct: number;
}

function calcLine(item: LineItem) {
  const taxable = item.qty * item.rate * (1 - item.discPct / 100);
  const gstAmt = taxable * item.gstPct / 100;
  const cgst = gstAmt / 2;
  const sgst = gstAmt / 2;
  const total = taxable + gstAmt;
  return { taxable, gstAmt, cgst, sgst, total };
}

function blankLine(id: string): LineItem {
  return {
    id, itemType: "product", productId: "", description: "", hsnSac: "",
    qty: 1, unit: "Nos", rate: 0, discPct: 0, gstPct: 18,
  };
}

// ---- props ----

interface GSTInvoiceBuilderProps {
  company: Company;
  setCompany: (c: Company) => void;
  customers: Customer[];
  products: Product[];
  batchStocks: BatchStock[];
  serviceCatalog: ServiceCatalogItem[];
  invoices: Invoice[];
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
}

// ---- component ----

export default function GSTInvoiceBuilder({
  company, setCompany, customers, products, batchStocks,
  serviceCatalog, invoices, onSave, onClose,
}: GSTInvoiceBuilderProps) {

  const invoiceNumber = genFYInvoiceNumber(invoices);
  const today = new Date().toISOString().split("T")[0];

  // Header state
  const [invDate, setInvDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [placeOfSupply, setPlaceOfSupply] = useState(company.state || "West Bengal");
  const [reverseCharge, setReverseCharge] = useState("No");
  const [refPO, setRefPO] = useState("");

  // Buyer state (auto-filled from customer)
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerGSTIN, setBuyerGSTIN] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [buyerState, setBuyerState] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");

  // Line items
  const [items, setItems] = useState<LineItem[]>([blankLine(Date.now().toString())]);

  // Bank details (editable, saved back to company)
  const [bankName, setBankName] = useState(company.bankName || "");
  const [bankAccountName, setBankAccountName] = useState(company.bankAccountName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(company.bankAccountNumber || "");
  const [bankIFSC, setBankIFSC] = useState(company.bankIFSC || "");
  const [bankAccountType, setBankAccountType] = useState(company.bankAccountType || "Current");
  const [bankUPI, setBankUPI] = useState(company.bankUPI || "");

  // T&C + Note
  const [terms, setTerms] = useState(company.defaultTerms || "1. Payment due within 30 days.\n2. Goods once sold will not be taken back.\n3. Interest @18% p.a. will be charged on overdue payments.\n4. Subject to local jurisdiction.");
  const [note, setNote] = useState("");

  const handleCustomerSelect = (cid: string) => {
    setSelectedCustomerId(cid);
    const c = customers.find(x => x.id === cid);
    if (!c) return;
    setBuyerName(c.name);
    setBuyerGSTIN(c.gstin || "");
    setBillingAddress(c.address || "");
    setBuyerPhone(c.phone || "");
    setBuyerEmail(c.email || "");
  };

  const updateItem = useCallback((id: string, patch: Partial<LineItem>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }, []);

  const handleProductPick = (id: string, productId: string) => {
    const p = products.find(x => x.id === productId);
    if (p) {
      updateItem(id, { productId, description: p.name, hsnSac: "", unit: p.unit || "Nos", rate: p.sellingPrice });
    } else {
      updateItem(id, { productId });
    }
  };

  const handleServicePick = (id: string, svcId: string) => {
    const s = serviceCatalog.find(x => x.id === svcId);
    if (s) {
      updateItem(id, { productId: svcId, description: s.name, hsnSac: s.sacCode || "", unit: s.unit || "Nos", rate: s.defaultRate });
    } else {
      updateItem(id, { productId: svcId });
    }
  };

  const addItem = () => setItems(prev => [...prev, blankLine(Date.now().toString())]);
  const removeItem = (id: string) => setItems(prev => prev.filter(it => it.id !== id));

  // Totals
  const calcs = items.map(calcLine);
  const totalTaxable = calcs.reduce((s, c) => s + c.taxable, 0);
  const totalCGST = calcs.reduce((s, c) => s + c.cgst, 0);
  const totalSGST = calcs.reduce((s, c) => s + c.sgst, 0);
  const totalGST = totalCGST + totalSGST;
  const grandTotal = totalTaxable + totalGST;

  const saveBank = () => {
    const updated: Company = {
      ...company,
      bankName, bankAccountName, bankAccountNumber, bankIFSC, bankAccountType, bankUPI,
      defaultTerms: terms,
    };
    setCompany(updated);
    toast.success("Bank details & T&C saved to company profile.");
  };

  const handleSave = () => {
    if (!buyerName.trim()) { toast.error("Please fill buyer name."); return; }
    if (items.some(it => !it.description.trim())) { toast.error("All line items must have a description."); return; }

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: selectedCustomerId,
      branchId: "",
      items: items.map((it, i) => ({
        itemType: it.itemType,
        productId: it.productId || `custom-${i}`,
        description: it.description,
        hsn: it.hsnSac,
        unit: it.unit,
        quantity: it.qty,
        unitPrice: it.rate,
        discount: it.discPct,
        gstPct: it.gstPct,
      })),
      subtotal: totalTaxable,
      taxAmount: totalGST,
      cgst: totalCGST,
      sgst: totalSGST,
      totalAmount: grandTotal,
      status: "unpaid",
      createdAt: invDate,
      dueDate,
      notes: note,
      terms,
      placeOfSupply,
      reverseCharge,
      refPO,
      buyerName,
      buyerGSTIN,
      billingAddress,
      buyerState,
      buyerPhone,
      buyerEmail,
    };
    onSave(invoice);
    toast.success(`Invoice ${invoiceNumber} saved.`);
  };

  const handlePrint = () => {
    const html = buildPrintHTML({
      invoice: {
        invoiceNumber, invDate, dueDate, placeOfSupply, reverseCharge, refPO,
        buyerName, buyerGSTIN, billingAddress, buyerState, buyerPhone, buyerEmail,
        note, terms,
      },
      company,
      items,
      calcs,
      totalTaxable, totalCGST, totalSGST, grandTotal,
    });
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 600);
  };

  const inLabel = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1";
  const inClass = "w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-6 px-2">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl shadow-2xl">

        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-base">GST Tax Invoice</h2>
            <p className="text-slate-400 text-xs mt-0.5">Invoice No: <span className="text-indigo-300 font-mono">{invoiceNumber}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">
              <Save className="h-3.5 w-3.5" /> Save Invoice
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Invoice meta row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={inLabel}>Invoice Date</label>
              <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className={inClass} />
            </div>
            <div>
              <label className={inLabel}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inClass} />
            </div>
            <div>
              <label className={inLabel}>Place of Supply</label>
              <input value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} className={inClass} placeholder="e.g. West Bengal" />
            </div>
            <div>
              <label className={inLabel}>Ref / PO No</label>
              <input value={refPO} onChange={e => setRefPO(e.target.value)} className={inClass} placeholder="Optional" />
            </div>
          </div>

          {/* Seller + Buyer side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3">Seller (Your Company)</p>
              <div className="space-y-1">
                <p className="text-white font-bold text-sm">{company.name || "—"}</p>
                {company.tagline && <p className="text-slate-400 text-xs">{company.tagline}</p>}
                <p className="text-slate-300 text-xs">{company.address || "—"}</p>
                <p className="text-slate-300 text-xs">State: {company.state || "—"}</p>
                <p className="text-slate-300 text-xs">GSTIN: <span className="font-mono">{company.gstin || "—"}</span></p>
                <p className="text-slate-300 text-xs">Phone: {company.phone || "—"} | Email: {company.email || "—"}</p>
              </div>
            </div>

            {/* Buyer */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Buyer / Bill To</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={inLabel}>Select Customer</label>
                  <select value={selectedCustomerId} onChange={e => handleCustomerSelect(e.target.value)} className={inClass}>
                    <option value="">— Choose or fill manually —</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={inLabel}>Buyer Name / Company</label>
                  <input value={buyerName} onChange={e => setBuyerName(e.target.value)} className={inClass} placeholder="Buyer name" />
                </div>
                <div>
                  <label className={inLabel}>GSTIN</label>
                  <input value={buyerGSTIN} onChange={e => setBuyerGSTIN(e.target.value)} className={`${inClass} font-mono`} placeholder="15-digit GSTIN" />
                </div>
                <div>
                  <label className={inLabel}>State</label>
                  <input value={buyerState} onChange={e => setBuyerState(e.target.value)} className={inClass} placeholder="State" />
                </div>
                <div className="col-span-2">
                  <label className={inLabel}>Billing Address</label>
                  <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} rows={2} className={`${inClass} resize-none`} placeholder="Full address" />
                </div>
                <div>
                  <label className={inLabel}>Phone</label>
                  <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className={inClass} placeholder="Phone" />
                </div>
                <div>
                  <label className={inLabel}>Email</label>
                  <input value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className={inClass} placeholder="Email" />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Items</p>
              <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="px-2 py-2 text-left w-6">#</th>
                    <th className="px-2 py-2 text-left w-16">Type</th>
                    <th className="px-2 py-2 text-left min-w-[160px]">Description</th>
                    <th className="px-2 py-2 text-left w-24">HSN/SAC</th>
                    <th className="px-2 py-2 text-right w-16">Qty</th>
                    <th className="px-2 py-2 text-left w-16">Unit</th>
                    <th className="px-2 py-2 text-right w-20">Rate ₹</th>
                    <th className="px-2 py-2 text-right w-14">Disc%</th>
                    <th className="px-2 py-2 text-right w-24">Taxable ₹</th>
                    <th className="px-2 py-2 text-right w-14">GST%</th>
                    <th className="px-2 py-2 text-right w-20">CGST ₹</th>
                    <th className="px-2 py-2 text-right w-20">SGST ₹</th>
                    <th className="px-2 py-2 text-right w-24">Total ₹</th>
                    <th className="px-2 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const c = calcLine(item);
                    return (
                      <tr key={item.id} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                        <td className="px-2 py-1.5 text-slate-500">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <select
                            value={item.itemType}
                            onChange={e => updateItem(item.id, { itemType: e.target.value as "product" | "service", productId: "", description: "", hsnSac: "" })}
                            className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full"
                          >
                            <option value="product">Product</option>
                            <option value="service">Service</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          {item.itemType === "product" ? (
                            <div className="space-y-1">
                              <select
                                value={item.productId}
                                onChange={e => handleProductPick(item.id, e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full"
                              >
                                <option value="">— Select product —</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <input
                                value={item.description}
                                onChange={e => updateItem(item.id, { description: e.target.value })}
                                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full"
                                placeholder="Description"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <select
                                value={item.productId}
                                onChange={e => handleServicePick(item.id, e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full"
                              >
                                <option value="">— Select service —</option>
                                {serviceCatalog.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <input
                                value={item.description}
                                onChange={e => updateItem(item.id, { description: e.target.value })}
                                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full"
                                placeholder="Service description"
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.hsnSac} onChange={e => updateItem(item.id, { hsnSac: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full font-mono" placeholder="HSN/SAC" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" value={item.qty} onChange={e => updateItem(item.id, { qty: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full text-right" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={item.unit} onChange={e => updateItem(item.id, { unit: e.target.value })} className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.id, { rate: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full text-right" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min="0" max="100" value={item.discPct} onChange={e => updateItem(item.id, { discPct: parseFloat(e.target.value) || 0 })} className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-white w-full text-right" />
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-200">{c.taxable.toFixed(2)}</td>
                        <td className="px-2 py-1.5">
                          <select value={item.gstPct} onChange={e => updateItem(item.id, { gstPct: parseFloat(e.target.value) })} className="bg-slate-800 border border-slate-700 rounded px-1 py-1 text-[10px] text-white w-full">
                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-right text-slate-200">{c.cgst.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right text-slate-200">{c.sgst.toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right font-bold text-white">{c.total.toFixed(2)}</td>
                        <td className="px-2 py-1.5">
                          {items.length > 1 && (
                            <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-600 bg-slate-800/40">
                    <td colSpan={8} className="px-2 py-2 text-right text-slate-400 text-xs font-bold">Sub-Total</td>
                    <td className="px-2 py-2 text-right text-white font-bold">{totalTaxable.toFixed(2)}</td>
                    <td></td>
                    <td className="px-2 py-2 text-right text-white font-bold">{totalCGST.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right text-white font-bold">{totalSGST.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right text-indigo-300 font-bold">{grandTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Grand total summary */}
            <div className="mt-3 flex justify-end">
              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl px-6 py-3 space-y-1 min-w-[260px]">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Taxable Amount</span><span>₹{totalTaxable.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>CGST</span><span>₹{totalCGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>SGST</span><span>₹{totalSGST.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white border-t border-indigo-500/30 pt-1 mt-1">
                  <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic">{amountInWords(grandTotal)}</p>
              </div>
            </div>
          </div>

          {/* Bank details + T&C */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank details */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Bank Details</p>
                <button onClick={saveBank} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer">Save to Company</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={inLabel}>Bank Name</label>
                  <input value={bankName} onChange={e => setBankName(e.target.value)} className={inClass} placeholder="e.g. HDFC Bank" />
                </div>
                <div>
                  <label className={inLabel}>Account Name</label>
                  <input value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} className={inClass} />
                </div>
                <div>
                  <label className={inLabel}>Account Number</label>
                  <input value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} className={`${inClass} font-mono`} />
                </div>
                <div>
                  <label className={inLabel}>IFSC Code</label>
                  <input value={bankIFSC} onChange={e => setBankIFSC(e.target.value)} className={`${inClass} font-mono`} />
                </div>
                <div>
                  <label className={inLabel}>Account Type</label>
                  <select value={bankAccountType} onChange={e => setBankAccountType(e.target.value)} className={inClass}>
                    <option>Current</option>
                    <option>Savings</option>
                  </select>
                </div>
                <div>
                  <label className={inLabel}>UPI ID</label>
                  <input value={bankUPI} onChange={e => setBankUPI(e.target.value)} className={inClass} placeholder="abc@bank" />
                </div>
              </div>
            </div>

            {/* T&C */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Terms & Conditions</p>
                <button onClick={saveBank} className="text-[10px] text-violet-400 hover:text-violet-300 font-bold cursor-pointer">Save to Company</button>
              </div>
              <textarea
                value={terms}
                onChange={e => setTerms(e.target.value)}
                rows={6}
                className={`${inClass} resize-none`}
                placeholder="Enter terms and conditions..."
              />
              <div className="mt-3">
                <label className={inLabel}>Note to Buyer</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className={`${inClass} resize-none`} placeholder="Any additional note..." />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---- Print HTML ----

interface PrintData {
  invoice: {
    invoiceNumber: string; invDate: string; dueDate: string; placeOfSupply: string;
    reverseCharge: string; refPO: string; buyerName: string; buyerGSTIN: string;
    billingAddress: string; buyerState: string; buyerPhone: string; buyerEmail: string;
    note: string; terms: string;
  };
  company: Company;
  items: LineItem[];
  calcs: ReturnType<typeof calcLine>[];
  totalTaxable: number; totalCGST: number; totalSGST: number; grandTotal: number;
}

function buildPrintHTML(d: PrintData): string {
  const { invoice: inv, company, items, calcs, totalTaxable, totalCGST, totalSGST, grandTotal } = d;

  const rows = items.map((item, i) => {
    const c = calcs[i];
    return `<tr>
      <td style="padding:6px 8px;border:1px solid #e2e8f0">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0">${item.description || "—"}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;font-family:monospace">${item.hsnSac || "—"}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${item.qty}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${item.unit}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${item.rate.toFixed(2)}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${item.discPct > 0 ? item.discPct + "%" : "—"}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${c.taxable.toFixed(2)}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center">${item.gstPct}%</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${c.cgst.toFixed(2)}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${c.sgst.toFixed(2)}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-weight:700">${c.total.toFixed(2)}</td>
    </tr>`;
  }).join("");

  const termsLines = (inv.terms || "").split("\n").map(l => `<p style="margin:2px 0;font-size:11px">${l}</p>`).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Tax Invoice ${inv.invoiceNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: #1a202c; font-size: 12px; background: #fff; }
  @media print { @page { margin: 10mm; size: A4 portrait; } }
</style>
</head>
<body style="padding:20px;max-width:900px;margin:0 auto">

  <!-- Title bar -->
  <div style="text-align:center;border:2px solid #2d3748;padding:10px 0;margin-bottom:12px">
    <h1 style="font-size:18px;font-weight:800;letter-spacing:2px;color:#1a202c">TAX INVOICE</h1>
    <p style="font-size:10px;color:#718096">(Original for Recipient)</p>
  </div>

  <!-- Seller + Buyer 2-col -->
  <table width="100%" style="border-collapse:collapse;margin-bottom:0">
    <tr>
      <!-- Seller -->
      <td width="50%" style="border:1px solid #e2e8f0;padding:10px;vertical-align:top">
        <p style="font-size:10px;font-weight:700;color:#4a5568;margin-bottom:4px">SELLER</p>
        <p style="font-size:15px;font-weight:800;color:#1a202c">${company.name || ""}</p>
        ${company.tagline ? `<p style="font-size:11px;color:#718096">${company.tagline}</p>` : ""}
        <p style="font-size:11px;margin-top:4px">${company.address || ""}</p>
        <p style="font-size:11px">State: ${company.state || "—"}</p>
        <p style="font-size:11px">GSTIN: <strong style="font-family:monospace">${company.gstin || "—"}</strong></p>
        <p style="font-size:11px">Phone: ${company.phone || "—"}</p>
        <p style="font-size:11px">Email: ${company.email || "—"}</p>
      </td>
      <!-- Invoice meta -->
      <td width="50%" style="border:1px solid #e2e8f0;padding:10px;vertical-align:top">
        <table width="100%" style="border-collapse:collapse">
          <tr><td style="font-size:10px;color:#4a5568;padding:2px 0;width:45%">Invoice No.</td><td style="font-size:11px;font-weight:700;font-family:monospace">${inv.invoiceNumber}</td></tr>
          <tr><td style="font-size:10px;color:#4a5568;padding:2px 0">Invoice Date</td><td style="font-size:11px">${inv.invDate}</td></tr>
          <tr><td style="font-size:10px;color:#4a5568;padding:2px 0">Due Date</td><td style="font-size:11px">${inv.dueDate}</td></tr>
          <tr><td style="font-size:10px;color:#4a5568;padding:2px 0">Place of Supply</td><td style="font-size:11px">${inv.placeOfSupply}</td></tr>
          <tr><td style="font-size:10px;color:#4a5568;padding:2px 0">Reverse Charge</td><td style="font-size:11px">${inv.reverseCharge}</td></tr>
          ${inv.refPO ? `<tr><td style="font-size:10px;color:#4a5568;padding:2px 0">Ref / PO</td><td style="font-size:11px">${inv.refPO}</td></tr>` : ""}
        </table>
      </td>
    </tr>
    <tr>
      <!-- Buyer -->
      <td colspan="2" style="border:1px solid #e2e8f0;padding:10px;vertical-align:top">
        <p style="font-size:10px;font-weight:700;color:#4a5568;margin-bottom:4px">BILL TO / BUYER</p>
        <p style="font-size:14px;font-weight:800">${inv.buyerName}</p>
        ${inv.billingAddress ? `<p style="font-size:11px;margin-top:3px">${inv.billingAddress}</p>` : ""}
        <p style="font-size:11px">State: ${inv.buyerState || "—"}&nbsp;&nbsp;|&nbsp;&nbsp;GSTIN: <strong style="font-family:monospace">${inv.buyerGSTIN || "—"}</strong></p>
        ${inv.buyerPhone ? `<p style="font-size:11px">Phone: ${inv.buyerPhone}</p>` : ""}
        ${inv.buyerEmail ? `<p style="font-size:11px">Email: ${inv.buyerEmail}</p>` : ""}
      </td>
    </tr>
  </table>

  <!-- Line items -->
  <table width="100%" style="border-collapse:collapse;margin-top:12px;font-size:11px">
    <thead style="background:#f7fafc">
      <tr>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left">#</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:left">Description</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:center">HSN/SAC</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:center">Qty</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:center">Unit</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:right">Rate</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:right">Disc%</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:right">Taxable</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:center">GST%</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:right">CGST</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:right">SGST</th>
        <th style="border:1px solid #e2e8f0;padding:6px 8px;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot style="background:#f7fafc;font-weight:700">
      <tr>
        <td colspan="7" style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">Totals</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${totalTaxable.toFixed(2)}</td>
        <td style="border:1px solid #e2e8f0"></td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${totalCGST.toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${totalSGST.toFixed(2)}</td>
        <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right">${grandTotal.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Grand total box + Amount in words -->
  <div style="display:flex;justify-content:flex-end;margin-top:8px">
    <div style="border:2px solid #2d3748;padding:10px 16px;min-width:260px">
      <table width="100%">
        <tr><td style="font-size:11px;color:#4a5568">Taxable Amount</td><td style="font-size:11px;text-align:right">₹${totalTaxable.toFixed(2)}</td></tr>
        <tr><td style="font-size:11px;color:#4a5568">CGST</td><td style="font-size:11px;text-align:right">₹${totalCGST.toFixed(2)}</td></tr>
        <tr><td style="font-size:11px;color:#4a5568">SGST</td><td style="font-size:11px;text-align:right">₹${totalSGST.toFixed(2)}</td></tr>
        <tr style="border-top:2px solid #2d3748">
          <td style="font-size:13px;font-weight:800;padding-top:4px">Grand Total</td>
          <td style="font-size:13px;font-weight:800;text-align:right;padding-top:4px">₹${grandTotal.toFixed(2)}</td>
        </tr>
      </table>
    </div>
  </div>
  <p style="font-size:11px;color:#4a5568;font-style:italic;margin-top:4px;text-align:right">${amountInWords(grandTotal)}</p>

  <!-- Bank + T&C row -->
  <table width="100%" style="border-collapse:collapse;margin-top:16px">
    <tr>
      <td width="50%" style="border:1px solid #e2e8f0;padding:10px;vertical-align:top">
        <p style="font-size:10px;font-weight:700;color:#4a5568;margin-bottom:6px">BANK DETAILS</p>
        <p style="font-size:11px"><strong>Bank:</strong> ${d.company.bankName || "—"}</p>
        <p style="font-size:11px"><strong>A/c Name:</strong> ${d.company.bankAccountName || "—"}</p>
        <p style="font-size:11px"><strong>A/c No.:</strong> <span style="font-family:monospace">${d.company.bankAccountNumber || "—"}</span></p>
        <p style="font-size:11px"><strong>IFSC:</strong> <span style="font-family:monospace">${d.company.bankIFSC || "—"}</span></p>
        <p style="font-size:11px"><strong>Type:</strong> ${d.company.bankAccountType || "Current"}</p>
        ${d.company.bankUPI ? `<p style="font-size:11px"><strong>UPI:</strong> ${d.company.bankUPI}</p>` : ""}
      </td>
      <td width="50%" style="border:1px solid #e2e8f0;padding:10px;vertical-align:top">
        <p style="font-size:10px;font-weight:700;color:#4a5568;margin-bottom:6px">TERMS & CONDITIONS</p>
        ${termsLines}
        ${inv.note ? `<p style="font-size:11px;margin-top:6px"><strong>Note:</strong> ${inv.note}</p>` : ""}
      </td>
    </tr>
  </table>

  <!-- Signature row -->
  <table width="100%" style="border-collapse:collapse;margin-top:0">
    <tr>
      <td width="60%" style="border:1px solid #e2e8f0;padding:10px;vertical-align:bottom;min-height:60px">
        <p style="font-size:10px;color:#4a5568">Received goods/services in good order and condition.</p>
        <p style="font-size:11px;margin-top:30px">Signature: ___________________________</p>
      </td>
      <td width="40%" style="border:1px solid #e2e8f0;padding:10px;text-align:right;vertical-align:bottom">
        <p style="font-size:11px">For <strong>${company.name || ""}</strong></p>
        <p style="font-size:11px;margin-top:30px">Authorised Signatory</p>
      </td>
    </tr>
  </table>

  <p style="font-size:10px;color:#a0aec0;text-align:center;margin-top:12px">Computer-generated Tax Invoice · ${company.name || ""} · ${company.email || ""}</p>
</body>
</html>`;
}

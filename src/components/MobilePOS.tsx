/**
 * MobilePOS — Touch-first POS terminal for DEINRIM OMS
 * Full-screen layout: product search/grid + slide-up cart + payment modal
 */
import React, { useState, useMemo, useCallback } from "react";
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, CreditCard,
  Smartphone, Banknote, ChevronUp, ChevronDown, User, CheckCircle2,
  Printer, ReceiptText,
} from "lucide-react";
import { Product, BatchStock, Customer, Invoice, Company, User as AppUser, formatINR } from "../types";
import { toast } from "../utils/toast";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  gstRate: number;
  qty: number;
  unit: string;
}

interface Props {
  products: Product[];
  batchStocks: BatchStock[];
  customers: Customer[];
  company: Company;
  currentUser: AppUser;
  companyId: string;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

type PayMode = "Cash" | "UPI" | "Card";

function inrWords(n: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const cr = Math.floor(n / 1e7); if (cr) parts.push(`${inrWords(cr)} Crore`);
  const lakh = Math.floor((n % 1e7) / 1e5); if (lakh) parts.push(`${inrWords(lakh)} Lakh`);
  const thou = Math.floor((n % 1e5) / 1e3); if (thou) parts.push(`${inrWords(thou)} Thousand`);
  const hun = Math.floor((n % 1e3) / 100); if (hun) parts.push(`${ones[hun]} Hundred`);
  const rem = n % 100;
  if (rem > 0 && rem < 20) parts.push(ones[rem]);
  else if (rem >= 20) parts.push(`${tens[Math.floor(rem / 10)]}${rem % 10 ? " " + ones[rem % 10] : ""}`);
  return parts.join(" ");
}

function printReceipt(inv: Invoice, company: Company, payMode: PayMode, cash: number) {
  const change = payMode === "Cash" ? Math.max(0, cash - inv.totalAmount) : 0;
  const rows = (inv.items || []).map(it =>
    `<tr><td>${it.productName || it.name || ""}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">₹${(it.unitPrice * it.quantity).toFixed(2)}</td></tr>`
  ).join("");
  const html = `<!DOCTYPE html><html><head><title>Receipt</title>
  <style>
    body{font-family:monospace;font-size:12px;width:280px;margin:0 auto;padding:10px}
    h2{text-align:center;font-size:14px;margin:4px 0} p{text-align:center;margin:2px 0;font-size:11px}
    table{width:100%;border-collapse:collapse;margin:8px 0}
    th{font-size:10px;border-bottom:1px dashed #333;padding:3px 2px}
    td{padding:3px 2px;font-size:11px}
    .total{border-top:1px dashed #333;font-weight:bold;padding:4px 2px}
    .grand{border-top:2px solid #000;font-size:14px;font-weight:bold;padding:5px 2px}
    .footer{text-align:center;font-size:10px;margin-top:8px;border-top:1px dashed #333;padding-top:6px}
    @media print{button{display:none}}
  </style></head><body>
  <h2>${company.name}</h2>
  <p>${company.address || ""}</p>
  <p>GSTIN: ${company.taxId || "—"}</p>
  <p style="border-top:1px dashed #333;border-bottom:1px dashed #333;padding:3px 0;margin:6px 0">
    Bill No: <strong>${inv.invoiceNumber}</strong> &nbsp; ${new Date().toLocaleDateString("en-IN")}
  </p>
  <table>
    <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Amt</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="total"><td colspan="2">Subtotal</td><td style="text-align:right">₹${(inv.totalAmount / (1 + (inv.items?.[0] as any)?.gstRate / 100 || 1.18)).toFixed(2)}</td></tr>
      <tr class="total"><td colspan="2">GST</td><td style="text-align:right">₹${(inv.totalAmount - inv.amountBeforeGst).toFixed(2)}</td></tr>
      <tr class="grand"><td colspan="2">GRAND TOTAL</td><td style="text-align:right">₹${inv.totalAmount.toFixed(2)}</td></tr>
      ${payMode === "Cash" ? `<tr class="total"><td colspan="2">Cash Paid</td><td style="text-align:right">₹${cash.toFixed(2)}</td></tr>
      <tr class="total"><td colspan="2">Change</td><td style="text-align:right">₹${change.toFixed(2)}</td></tr>` : ""}
    </tfoot>
  </table>
  <p>Payment: <strong>${payMode}</strong></p>
  <div class="footer">
    <p>${inrWords(Math.round(inv.totalAmount))} Rupees Only</p>
    <p style="margin-top:6px">Thank you! Visit again.</p>
    <p>${company.phone || ""}</p>
  </div>
  <div style="text-align:center;margin-top:10px">
    <button onclick="window.print()" style="padding:6px 16px;background:#111;color:#fff;border:none;cursor:pointer;font-size:12px">🖨 Print</button>
  </div>
  </body></html>`;
  const w = window.open("", "_blank", "width=380,height=600");
  if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
}

export default function MobilePOS({
  products, batchStocks, customers, company, currentUser, companyId, setInvoices,
}: Props) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payMode, setPayMode] = useState<PayMode>("Cash");
  const [cashGiven, setCashGiven] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [successModal, setSuccessModal] = useState(false);

  // In-stock products only
  const inStockIds = useMemo(() => new Set(
    batchStocks.filter(b => b.quantity > 0).map(b => b.productId)
  ), [batchStocks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p =>
      (inStockIds.has(p.id) || products.length < 5) &&
      (p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || (p as any).hsn?.includes(q))
    ).slice(0, 60);
  }, [products, inStockIds, search]);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const gstTotal  = cart.reduce((s, i) => s + i.price * i.qty * (i.gstRate / 100) / (1 + i.gstRate / 100), 0);
  const taxableAmt = cartTotal - gstTotal;

  const addToCart = useCallback((p: Product) => {
    const price = p.sellingPrice || (p as any).costPrice || 0;
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + 1 };
        return updated;
      }
      return [...prev, { productId: p.id, name: p.name, price, gstRate: (p as any).gstRate || 18, qty: 1, unit: p.unit || "Nos" }];
    });
    toast.success(`${p.name} added`, `₹${price.toFixed(2)}`);
  }, []);

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  };

  const clearCart = () => { setCart([]); setCartOpen(false); };

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setPayModal(true);
    setCartOpen(false);
    setCashGiven(String(Math.ceil(cartTotal)));
  };

  const handleConfirmSale = () => {
    const cash = parseFloat(cashGiven) || 0;
    if (payMode === "Cash" && cash < cartTotal) {
      toast.error("Cash amount is less than total"); return;
    }
    const invoiceNumber = `POS-${Date.now().toString().slice(-6)}`;
    const customer = customers.find(c => c.id === customerId);
    const newInvoice: Invoice = {
      id: `inv-pos-${Date.now()}`,
      invoiceNumber,
      customerId: customerId || "walk-in",
      customerName: customer?.name || "Walk-in Customer",
      companyId,
      branchId: "",
      items: cart.map(i => ({
        productId: i.productId,
        productName: i.name,
        name: i.name,
        quantity: i.qty,
        unitPrice: i.price,
        totalPrice: +(i.price * i.qty).toFixed(2),
        gstRate: i.gstRate,
        unit: i.unit,
      })),
      subtotal: +taxableAmt.toFixed(2),
      amountBeforeGst: +taxableAmt.toFixed(2),
      gstAmount: +gstTotal.toFixed(2),
      totalAmount: +cartTotal.toFixed(2),
      status: "Paid",
      paymentStatus: "Paid",
      paymentMethod: payMode,
      createdAt: new Date().toISOString(),
      dueDate: new Date().toISOString().slice(0, 10),
      notes: `POS Sale — ${payMode}`,
    } as any;

    setInvoices(prev => [newInvoice, ...prev]);
    setLastInvoice(newInvoice);
    setPayModal(false);
    setSuccessModal(true);
    clearCart();
    toast.success(`Sale ₹${formatINR(cartTotal)} recorded`, `${payMode} · ${invoiceNumber}`);
  };

  const cashChange = Math.max(0, (parseFloat(cashGiven) || 0) - cartTotal);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 relative">

      {/* ── Search Bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-slate-900 px-3 pt-3 pb-2 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product, SKU…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {cartCount > 0 && (
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span>{filtered.length} products</span>
            <span className="text-emerald-400 font-bold">{cartCount} item{cartCount > 1 ? "s" : ""} in cart · {formatINR(cartTotal)}</span>
          </div>
        )}
      </div>

      {/* ── Product Grid ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-36">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => {
              const price = p.sellingPrice || (p as any).costPrice || 0;
              const inCart = cart.find(i => i.productId === p.id);
              const stock = batchStocks.filter(b => b.productId === p.id).reduce((s, b) => s + b.quantity, 0);
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`relative flex flex-col items-start p-3 rounded-2xl border text-left active:scale-95 transition-transform ${
                    inCart
                      ? "bg-indigo-900/50 border-indigo-500/60"
                      : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
                  }`}
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {inCart.qty}
                    </span>
                  )}
                  <span className="text-xs font-bold text-white leading-snug line-clamp-2 pr-5">{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</span>
                  <div className="flex items-center justify-between w-full mt-2">
                    <span className="text-sm font-bold text-emerald-400 font-mono">₹{price.toFixed(2)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${stock > 0 ? "bg-emerald-900/60 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                      {stock > 0 ? `${stock} ${p.unit || ""}` : "Out"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Floating Cart Button ─────────────────────────────── */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-2xl px-5 py-4 shadow-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-white" />
              <span className="text-white font-bold text-sm">{cartCount} item{cartCount > 1 ? "s" : ""}</span>
            </div>
            <span className="text-white font-bold text-base">{formatINR(cartTotal)}</span>
          </button>
        </div>
      )}

      {/* ── Cart Bottom Sheet ────────────────────────────────── */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative bg-slate-900 rounded-t-3xl border-t border-slate-700 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Sheet handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Cart ({cartCount} items)</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearCart} className="text-xs text-red-400 font-bold px-2 py-1 rounded-lg hover:bg-red-500/10">
                  Clear
                </button>
                <button onClick={() => setCartOpen(false)} className="text-slate-400">
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {/* Customer selector */}
              <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl p-2 mb-3">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-slate-300 focus:outline-none"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {cart.map(item => (
                <div key={item.productId} className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">₹{item.price.toFixed(2)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item.productId, -1)} className="h-7 w-7 rounded-full bg-slate-700 hover:bg-red-600/30 text-white flex items-center justify-center active:scale-90">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-white">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="h-7 w-7 rounded-full bg-slate-700 hover:bg-indigo-600/50 text-white flex items-center justify-center active:scale-90">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => updateQty(item.productId, -item.qty)} className="h-7 w-7 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center ml-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-emerald-400 font-mono w-16 text-right shrink-0">
                    {formatINR(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cart totals + checkout */}
            <div className="px-4 pt-3 pb-5 border-t border-slate-800 shrink-0 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Taxable</span><span className="font-mono">{formatINR(taxableAmt)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>GST</span><span className="font-mono">{formatINR(gstTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-700 pt-2 mt-1">
                <span>Total</span><span className="font-mono text-base text-emerald-400">{formatINR(cartTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg"
              >
                Proceed to Pay {formatINR(cartTotal)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ────────────────────────────────────── */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPayModal(false)} />
          <div className="relative w-full bg-slate-900 rounded-t-3xl border-t border-slate-700 px-5 pt-5 pb-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Payment</h3>
              <button onClick={() => setPayModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            {/* Total */}
            <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-4 text-center">
              <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest">Amount Due</p>
              <p className="text-3xl font-bold text-white mt-1">{formatINR(cartTotal)}</p>
            </div>

            {/* Pay mode */}
            <div className="grid grid-cols-3 gap-2">
              {(["Cash", "UPI", "Card"] as PayMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setPayMode(m)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border font-bold text-xs transition-colors ${
                    payMode === m
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {m === "Cash" && <Banknote className="h-5 w-5" />}
                  {m === "UPI"  && <Smartphone className="h-5 w-5" />}
                  {m === "Card" && <CreditCard className="h-5 w-5" />}
                  {m}
                </button>
              ))}
            </div>

            {/* UPI QR */}
            {payMode === "UPI" && company.upiQrCode && (
              <div className="flex flex-col items-center gap-2">
                <img src={(company as any).upiQrCode} alt="UPI QR" className="w-36 h-36 rounded-xl border border-slate-700 object-contain bg-white p-2" />
                {(company as any).upiId && <p className="text-xs text-slate-400 font-mono">{(company as any).upiId}</p>}
              </div>
            )}

            {/* Cash input */}
            {payMode === "Cash" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cash Received (₹)</label>
                <input
                  type="number"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500 text-center"
                />
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 500, 1000].map(v => (
                    <button key={v} onClick={() => setCashGiven(String(v))}
                      className="py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 hover:border-slate-500">
                      ₹{v}
                    </button>
                  ))}
                </div>
                {cashChange > 0 && (
                  <div className="flex justify-between bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-2">
                    <span className="text-xs text-amber-400 font-bold">Change to Return</span>
                    <span className="text-sm font-bold text-amber-300 font-mono">{formatINR(cashChange)}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleConfirmSale}
              disabled={payMode === "Cash" && (parseFloat(cashGiven) || 0) < cartTotal}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed active:bg-emerald-700 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg"
            >
              ✓ Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* ── Success Modal ─────────────────────────────────────── */}
      {successModal && lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-700 p-6 text-center shadow-2xl">
            <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Sale Complete!</h3>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">{formatINR(lastInvoice.totalAmount)}</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">{lastInvoice.invoiceNumber}</p>
            <p className="text-sm text-slate-300 mt-1">{lastInvoice.customerName}</p>
            {payMode === "Cash" && cashChange > 0 && (
              <div className="mt-3 bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-2">
                <p className="text-xs text-amber-400 font-bold">Return Change</p>
                <p className="text-xl font-bold text-amber-300 font-mono">{formatINR(cashChange)}</p>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => printReceipt(lastInvoice, company, payMode, parseFloat(cashGiven) || 0)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold"
              >
                <Printer className="h-4 w-4" /> Print
              </button>
              <button
                onClick={() => { setSuccessModal(false); setLastInvoice(null); }}
                className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

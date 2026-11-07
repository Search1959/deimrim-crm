import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import {
  Plus, X, Search, Download, Edit3, Trash2, Check, Clock, Ban,
  ShoppingCart, Briefcase, Megaphone, Monitor, Car, Coffee, MoreHorizontal
} from "lucide-react";
import { formatINR } from "../../types";

// ── Types ──────────────────────────────────────────────────────────────────

type ExpenseStatus = "draft" | "approved" | "paid" | "rejected";

interface Expense {
  id: string;
  date: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: string;
  paymentMode: "cash" | "upi" | "bank" | "card" | "cheque";
  note: string;
  status: ExpenseStatus;
  createdAt: string;
}

type ExpenseCategory =
  | "admin"
  | "marketing"
  | "operations"
  | "it"
  | "travel"
  | "food"
  | "other";

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES: { key: ExpenseCategory; label: string; color: string; Icon: React.ElementType }[] = [
  { key: "admin",      label: "Admin & Office",   color: "#818cf8", Icon: Briefcase   },
  { key: "marketing",  label: "Marketing",        color: "#f472b6", Icon: Megaphone   },
  { key: "operations", label: "Operations",       color: "#34d399", Icon: ShoppingCart},
  { key: "it",         label: "IT & Software",    color: "#38bdf8", Icon: Monitor     },
  { key: "travel",     label: "Travel",           color: "#fb923c", Icon: Car         },
  { key: "food",       label: "Food & Supplies",  color: "#fbbf24", Icon: Coffee      },
  { key: "other",      label: "Other",            color: "#94a3b8", Icon: MoreHorizontal},
];

const STATUS_META: Record<ExpenseStatus, { label: string; color: string; bg: string }> = {
  draft:    { label: "Draft",    color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  approved: { label: "Approved", color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  paid:     { label: "Paid",     color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const PAYMENT_MODES = ["cash", "upi", "bank", "card", "cheque"] as const;

const STORAGE_KEY_PREFIX = "deinrim_expenses_";

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return "exp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function catMeta(key: ExpenseCategory) {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[6];
}

// ── Component ──────────────────────────────────────────────────────────────

interface ExpensePanelProps {
  companyId: string;
  userRole?: string;
}

const inpStyle: React.CSSProperties = {
  background: "rgba(30,41,59,0.9)",
  border: "1px solid rgba(100,116,139,0.45)",
  color: "#f1f5f9",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(100,116,139,0.2)",
};

const modalStyle: React.CSSProperties = {
  background: "#0d1424",
  border: "1px solid rgba(100,116,139,0.3)",
};

export default function ExpensePanel({ companyId, userRole = "admin" }: ExpensePanelProps) {
  const storageKey = STORAGE_KEY_PREFIX + companyId;

  // ── State ────────────────────────────────────────────────────────────────
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "all">("all");
  const [filterMonth, setFilterMonth] = useState("");

  // form state
  const emptyForm = {
    date: new Date().toISOString().slice(0, 10),
    title: "",
    category: "admin" as ExpenseCategory,
    amount: "",
    paidBy: "",
    paymentMode: "cash" as Expense["paymentMode"],
    note: "",
    status: "draft" as ExpenseStatus,
  };
  const [form, setForm] = useState(emptyForm);

  // ── Load from localStorage ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setExpenses(JSON.parse(raw));
    } catch {}
  }, [companyId]);

  const save = (updated: Expense[]) => {
    setExpenses(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) return;

    if (editingExpense) {
      const updated = expenses.map(ex =>
        ex.id === editingExpense.id
          ? { ...editingExpense, ...form, amount: parseFloat(form.amount as string) || 0 }
          : ex
      );
      save(updated);
      toast.success("Expense Updated", form.title);
    } else {
      const newExp: Expense = {
        id: uid(),
        ...form,
        amount: parseFloat(form.amount as string) || 0,
        createdAt: new Date().toISOString(),
      };
      save([newExp, ...expenses]);
      toast.success("Expense Added", form.title);
    }
    setShowAddModal(false);
    setEditingExpense(null);
    setForm(emptyForm);
  };

  const handleEdit = (ex: Expense) => {
    setEditingExpense(ex);
    setForm({
      date: ex.date,
      title: ex.title,
      category: ex.category,
      amount: ex.amount.toString(),
      paidBy: ex.paidBy,
      paymentMode: ex.paymentMode,
      note: ex.note,
      status: ex.status,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this expense?")) return;
    save(expenses.filter(e => e.id !== id));
    toast.success("Expense deleted");
  };

  const handleStatusChange = (id: string, status: ExpenseStatus) => {
    save(expenses.map(e => e.id === id ? { ...e, status } : e));
  };

  // ── Filter + search ──────────────────────────────────────────────────────
  const filtered = expenses.filter(e => {
    if (filterCat !== "all" && e.category !== filterCat) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterMonth && !e.date.startsWith(filterMonth)) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.paidBy.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalAll     = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPaid    = expenses.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const totalDraft   = expenses.filter(e => e.status === "draft").reduce((s, e) => s + e.amount, 0);

  // Category breakdown (for mini-chart)
  const catTotals = CATEGORIES.map(c => ({
    ...c,
    total: expenses.filter(e => e.category === c.key && e.status !== "rejected").reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = catTotals[0]?.total || 1;

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = filtered.map(e => ({
      Date: e.date,
      Title: e.title,
      Category: catMeta(e.category).label,
      Amount: e.amount,
      "Paid By": e.paidBy,
      "Payment Mode": e.paymentMode,
      Status: e.status,
      Note: e.note,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Expenses");
    XLSX.writeFile(wb, `Expenses_${filterMonth || "All"}.xlsx`);
    toast.success("Exported", "Expense register downloaded");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 text-left">

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Expenses",    value: totalAll,     color: "#818cf8" },
          { label: "Paid",              value: totalPaid,    color: "#34d399" },
          { label: "Approved (Pending Payment)", value: totalPending, color: "#fbbf24" },
          { label: "Draft / Unreviewed",value: totalDraft,   color: "#94a3b8" },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4" style={cardStyle}>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">{k.label}</span>
            <strong className="text-sm font-black font-mono mt-1 block" style={{ color: k.color }}>{formatINR(k.value)}</strong>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {catTotals.length > 0 && (
        <div className="rounded-xl p-4 space-y-2.5" style={cardStyle}>
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Spend by Category</h4>
          {catTotals.map(c => (
            <div key={c.key} className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 w-32 shrink-0 font-mono truncate">{c.label}</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((c.total / maxCat) * 100)}%`, background: c.color }} />
              </div>
              <span className="text-[11px] font-mono font-bold w-24 text-right shrink-0" style={{ color: c.color }}>
                {formatINR(c.total)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg focus:outline-none w-40"
              style={inpStyle}
            />
          </div>
          {/* Month filter */}
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg focus:outline-none"
            style={inpStyle}
          />
          {/* Category filter */}
          <select value={filterCat} onChange={e => setFilterCat(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg focus:outline-none" style={inpStyle}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {/* Status filter */}
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs rounded-lg focus:outline-none" style={inpStyle}>
            <option value="all">All Status</option>
            {(["draft","approved","paid","rejected"] as ExpenseStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 cursor-pointer transition-all"
            style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(100,116,139,0.35)" }}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={() => { setEditingExpense(null); setForm(emptyForm); setShowAddModal(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white cursor-pointer transition-all">
            <Plus className="h-3.5 w-3.5" /> Add Expense
          </button>
        </div>
      </div>

      {/* Expense Table */}
      <div className="rounded-xl overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead style={{ background: "rgba(15,23,42,0.6)" }}>
              <tr className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Paid By</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-xs font-mono">
                    {expenses.length === 0 ? "No expenses logged yet. Click 'Add Expense' to start." : "No expenses match your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((ex, i) => {
                const cat = catMeta(ex.category);
                const st  = STATUS_META[ex.status];
                return (
                  <tr key={ex.id}
                    className="transition-all"
                    style={{ borderTop: i > 0 ? "1px solid rgba(100,116,139,0.1)" : undefined,
                             background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{ex.date}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-slate-200">{ex.title}</span>
                      {ex.note && <span className="block text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">{ex.note}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: cat.color, background: `${cat.color}18`, border: `1px solid ${cat.color}30` }}>
                        <cat.Icon className="h-2.5 w-2.5" />
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-extrabold text-sm" style={{ color: "#f87171" }}>
                      {formatINR(ex.amount)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">{ex.paidBy || "—"}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500 font-mono uppercase">{ex.paymentMode}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ex.status}
                        onChange={e => handleStatusChange(ex.id, e.target.value as ExpenseStatus)}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer focus:outline-none"
                        style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}40` }}
                      >
                        {(["draft","approved","paid","rejected"] as ExpenseStatus[]).map(s => (
                          <option key={s} value={s} style={{ background: "#0d1424", color: "#f1f5f9" }}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(ex)}
                          className="rounded p-1 cursor-pointer transition-all"
                          style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8" }}
                          title="Edit">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(ex.id)}
                          className="rounded p-1 cursor-pointer transition-all"
                          style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}
                          title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: "1px solid rgba(100,116,139,0.2)", background: "rgba(15,23,42,0.4)" }}>
                  <td colSpan={3} className="px-4 py-2.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">
                    Total ({filtered.length} entries)
                  </td>
                  <td className="px-4 py-2.5 font-mono font-extrabold text-sm" style={{ color: "#f87171" }}>
                    {formatINR(filtered.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-scaleUp text-left space-y-4 max-h-[90vh] overflow-y-auto"
            style={modalStyle}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(100,116,139,0.25)" }}>
              <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                {editingExpense ? "Edit Expense" : "Log New Expense"}
              </h3>
              <button type="button" onClick={() => { setShowAddModal(false); setEditingExpense(null); }}
                className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(100,116,139,0.35)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Expense Title *</label>
                <input type="text" required
                  placeholder="e.g. Office Rent, AWS Bill"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  style={inpStyle} />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Date *</label>
                <input type="date" required
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-indigo-500"
                  style={inpStyle} />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Category *</label>
                <select required value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inpStyle}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Amount (₹) *</label>
                <input type="number" required min="0" step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  onKeyDown={e => { if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault(); }}
                  className="w-full rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-indigo-500"
                  style={inpStyle} />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Paid By</label>
                <input type="text"
                  placeholder="Employee name or department"
                  value={form.paidBy}
                  onChange={e => setForm(f => ({ ...f, paidBy: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inpStyle} />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Payment Mode</label>
                <select value={form.paymentMode}
                  onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value as Expense["paymentMode"] }))}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inpStyle}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Status</label>
                <select value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as ExpenseStatus }))}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inpStyle}>
                  {(["draft","approved","paid","rejected"] as ExpenseStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Note / Receipt Ref</label>
                <input type="text"
                  placeholder="Invoice no. or brief note"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 focus:outline-none" style={inpStyle} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: "1px solid rgba(100,116,139,0.25)" }}>
              <button type="button"
                onClick={() => { setShowAddModal(false); setEditingExpense(null); }}
                className="rounded px-4 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(100,116,139,0.35)" }}>
                Cancel
              </button>
              <button type="submit"
                className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-1.5 text-xs font-bold cursor-pointer transition-all">
                {editingExpense ? "Save Changes" : "Log Expense"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

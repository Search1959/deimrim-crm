import { toast } from "../utils/toast";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Plus, 
  X, 
  Calculator,
  Briefcase,
  Layers,
  Percent,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload
} from "lucide-react";
import { Transaction, Asset, UserRole, formatINR } from "../types";

interface FinanceViewProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  assets: Asset[];
  setAssets?: React.Dispatch<React.SetStateAction<Asset[]>>; // Made optional or provided
  userRole: UserRole;
  branchId?: string;
}

export default function FinanceView({
  transactions,
  setTransactions,
  assets: initialAssets,
  setAssets,
  userRole,
  branchId = "br-hq",
}: FinanceViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "pl" | "assets">("ledger");
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  
  // Create transaction form states
  const [newTx, setNewTx] = useState({
    type: "EXPENSE",
    category: "Rent & Utilities",
    amount: "",
    paymentMethod: "BANK",
    description: "",
  });

  // Create asset form states
  const [newAssetForm, setNewAssetForm] = useState({
    name: "",
    code: "",
    category: "Hardware",
    purchaseValue: "",
    currentValue: "",
    depreciationRate: "10",
  });

  // Edit states
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  // Local/global Asset fallback state management
  const [localAssets, setLocalAssets] = useState<Asset[]>(initialAssets);
  const activeAssets = setAssets ? initialAssets : localAssets;
  const updateAssetsState = (updater: Asset[] | ((prev: Asset[]) => Asset[])) => {
    if (setAssets) {
      setAssets(updater as any);
    } else {
      setLocalAssets(updater as any);
    }
  };

  // CSV states
  const [showImportTxModal, setShowImportTxModal] = useState(false);
  const [showImportAssetsModal, setShowImportAssetsModal] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState("");
  const [importNotification, setImportNotification] = useState("");

  const isFinanceManager = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.FINANCE_MANAGER
  ].includes(userRole);

  const categories = {
    INCOME: ["Product Sales", "Consulting Services", "License Royalties", "Interest Income"],
    EXPENSE: ["Cost of Goods Sold (COGS)", "Rent & Utilities", "Marketing & Ads", "Employee Payroll", "Office Logistics", "Travel Overheads"],
  };

  // Transaction Actions
  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || Number(newTx.amount) <= 0) return;

    const transaction: Transaction = {
      id: `t-${Date.now()}`,
      type: newTx.type as "INCOME" | "EXPENSE",
      category: newTx.category,
      amount: Number(newTx.amount),
      date: new Date().toISOString().split("T")[0],
      paymentMethod: newTx.paymentMethod as any,
      description: newTx.description,
      branchId: branchId,
    };

    setTransactions(prev => [transaction, ...prev]);
    setNewTx({
      type: "EXPENSE",
      category: "Rent & Utilities",
      amount: "",
      paymentMethod: "BANK",
      description: "",
    });
    setShowAddTx(false);
    toast.success("Transaction Logged", "Financial ledgers updated")
  };

  const handleSaveTxEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToEdit) return;

    setTransactions(prev => prev.map(t => {
      if (t.id === txToEdit.id) {
        return {
          ...t,
          type: txToEdit.type,
          category: txToEdit.category,
          amount: Number(txToEdit.amount),
          paymentMethod: txToEdit.paymentMethod,
          description: txToEdit.description,
        };
      }
      return t;
    }));
    setTxToEdit(null);
    toast.success("Transaction Updated", "Entry saved to ledger")
  };

  const handleDeleteTx = (id: string) => {
    if (confirm("Are you sure you want to void/delete this financial transaction entry?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Asset Actions
  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetForm.name || !newAssetForm.purchaseValue) return;

    const code = newAssetForm.code || `AST-${newAssetForm.name.toUpperCase().slice(0, 3).replace(/\s+/g, "")}-${Date.now().toString().slice(-4)}`;
    const asset: Asset = {
      id: `ast-${Date.now()}`,
      name: newAssetForm.name,
      code,
      category: newAssetForm.category,
      purchaseValue: Number(newAssetForm.purchaseValue),
      currentValue: Number(newAssetForm.currentValue || newAssetForm.purchaseValue),
      purchaseDate: new Date().toISOString().split("T")[0],
      depreciationRate: Number(newAssetForm.depreciationRate),
    };

    updateAssetsState(prev => [asset, ...prev]);
    setNewAssetForm({
      name: "",
      code: "",
      category: "Hardware",
      purchaseValue: "",
      currentValue: "",
      depreciationRate: "10",
    });
    setShowAddAsset(false);
    toast.success("Asset Registered", "Capital asset added to registry")
  };

  const handleSaveAssetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetToEdit) return;

    updateAssetsState(prev => prev.map(a => {
      if (a.id === assetToEdit.id) {
        return {
          ...a,
          name: assetToEdit.name,
          category: assetToEdit.category,
          purchaseValue: Number(assetToEdit.purchaseValue),
          currentValue: Number(assetToEdit.currentValue),
          depreciationRate: Number(assetToEdit.depreciationRate),
        };
      }
      return a;
    }));
    setAssetToEdit(null);
    toast.success("Asset Updated", "Capital asset record modified")
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (confirm(`Are you sure you want to retire/delete capital asset "${name}"?`)) {
      updateAssetsState(prev => prev.filter(a => a.id !== id));
    }
  };

  // Compute stats
  const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const netSurplus = totalIncome - totalExpense;

  const cashAccountSum = transactions
    .filter(t => t.paymentMethod === "CASH" || t.paymentMethod === "UPI")
    .reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  const bankAccountSum = transactions
    .filter(t => t.paymentMethod === "BANK" || t.paymentMethod === "CHEQUE")
    .reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);

  const totalAssetsVal = activeAssets.reduce((sum, a) => sum + a.currentValue, 0);

  // CSV Export
  const handleExportTxCSV = () => {
    const headers = ["ID", "Date", "Type", "Category", "Payment Method", "Description", "Amount"];
    const csvRows = [headers.join(",")];
    transactions.forEach(t => {
      const row = [t.id, t.date, t.type, t.category, t.paymentMethod, t.description, t.amount].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `ledger_transactions_${Date.now()}.csv`);
  };

  const handleExportAssetsCSV = () => {
    const headers = ["ID", "Code", "Name", "Category", "Purchase Value", "Current Value", "Depreciation Rate"];
    const csvRows = [headers.join(",")];
    activeAssets.forEach(a => {
      const row = [a.id, a.code, a.name, a.category, a.purchaseValue, a.currentValue, a.depreciationRate].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `capital_assets_register_${Date.now()}.csv`);
  };

  const triggerCsvDownload = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Templates
  const handleLoadSampleTx = () => {
    const sample = `type,category,amount,paymentMethod,description
EXPENSE,Rent & Utilities,1250,BANK,Monthly corporate workspace server leasing
INCOME,Product Sales,4500,BANK,Direct sales dispatch order ledger entry
EXPENSE,Office Logistics,250,CASH,Petty cash office stationeries refill`;
    setCsvTextInput(sample);
  };

  const handleLoadSampleAssets = () => {
    const sample = `name,code,category,purchaseValue,currentValue,depreciationRate
MacBook Pro M3,AST-MBP-34,Hardware,2500,2200,15
Power Supply Units Rack,AST-PSU-02,Hardware,5200,4800,10
Office Ergonomic Chairs,AST-CH-99,Furniture,1200,1050,12`;
    setCsvTextInput(sample);
  };

  // Import Parsers
  const handleImportTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return;
    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    let count = 0;
    const newTxs: Transaction[] = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 1) {
        const [type, category, amount, paymentMethod, description] = cols;
        newTxs.push({
          id: `tx-imp-${Date.now()}-${count}`,
          type: (type as "INCOME" | "EXPENSE") || "EXPENSE",
          category: category || "Rent & Utilities",
          amount: parseFloat(amount) || 100,
          date: new Date().toISOString().split("T")[0],
          paymentMethod: (paymentMethod as any) || "BANK",
          description: description || "Imported transactional balance",
          branchId: branchId,
        });
        count++;
      }
    });
    if (newTxs.length > 0) {
      setTransactions(prev => [...newTxs, ...prev]);
      setImportNotification(`Successfully parsed and logged ${count} financial ledger entries!`);
      setTimeout(() => { setImportNotification(""); setShowImportTxModal(false); setCsvTextInput(""); }, 2500);
    }
  };

  const handleImportAssets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return;
    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    let count = 0;
    const newAsts: Asset[] = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 1) {
        const [name, code, category, purchaseValue, currentValue, depreciationRate] = cols;
        newAsts.push({
          id: `ast-imp-${Date.now()}-${count}`,
          name: name || "Imported Capital Asset",
          code: code || `AST-IMP-${count}-${Date.now().toString().slice(-4)}`,
          category: category || "Hardware",
          purchaseValue: parseFloat(purchaseValue) || 1000,
          currentValue: parseFloat(currentValue || purchaseValue) || 1000,
          purchaseDate: new Date().toISOString().split("T")[0],
          depreciationRate: parseFloat(depreciationRate) || 10,
        });
        count++;
      }
    });
    if (newAsts.length > 0) {
      updateAssetsState(prev => [...newAsts, ...prev]);
      setImportNotification(`Successfully parsed and registered ${count} physical assets!`);
      setTimeout(() => { setImportNotification(""); setShowImportAssetsModal(false); setCsvTextInput(""); }, 2500);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Title & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance Operations Desk</h1>
          <p className="text-sm text-slate-400 mt-1">Nurture bank reserves, review automatic profit & loss worksheets, and oversee physical company assets.</p>
        </div>

        {/* Financial snapshot */}
        <div className="flex gap-4 self-start bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none font-mono">Main Bank Reserve</span>
            <div className="text-base font-bold text-white font-mono mt-1">{formatINR(bankAccountSum)}</div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none font-mono">Petty Cash Drawer</span>
            <div className="text-base font-bold text-indigo-400 font-mono mt-1">{formatINR(cashAccountSum)}</div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none font-mono">Capital Assets Value</span>
            <div className="text-base font-bold text-emerald-400 font-mono mt-1">{formatINR(totalAssetsVal)}</div>
          </div>
        </div>
      </div>

      {/* View Switch Menu */}
      <div className="flex bg-slate-900 p-1 rounded-lg self-start flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "ledger" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Inflow & Outflow logs
        </button>
        <button
          onClick={() => setActiveSubTab("pl")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "pl" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Profit & Loss Worksheet
        </button>
        <button
          onClick={() => setActiveSubTab("assets")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "assets" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Asset Register
        </button>
      </div>

      {/* SUB-TAB: TRANSACTIONS LEDGER */}
      {activeSubTab === "ledger" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Inflows & Expenditures Operational Ledger</h3>
            <div className="flex gap-2">
              {isFinanceManager && (
                <button
                  onClick={() => setShowAddTx(!showAddTx)}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Transaction</span>
                </button>
              )}
              <button
                onClick={() => setShowImportTxModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={handleExportTxCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ADD TRANSACTION LOG */}
          {showAddTx && (
            <form onSubmit={handleCreateTx} className="bg-slate-950 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4 border-b border-slate-800 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-white font-mono">Post Double-Entry Ledger Entry</h4>
                <button type="button" onClick={() => setShowAddTx(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Flow Type</label>
                <select
                  value={newTx.type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setNewTx(prev => ({
                      ...prev,
                      type,
                      category: categories[type as "INCOME" | "EXPENSE"][0],
                    }));
                  }}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                >
                  <option value="EXPENSE">EXPENSE (Outflow)</option>
                  <option value="INCOME">INCOME (Inflow)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Accounting Category</label>
                <select
                  value={newTx.category}
                  onChange={(e) => setNewTx(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                >
                  {categories[newTx.type as "INCOME" | "EXPENSE"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount Value (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  required
                  value={newTx.amount}
                  onChange={(e) => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Payment Channel</label>
                <select
                  value={newTx.paymentMethod}
                  onChange={(e) => setNewTx(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                >
                  <option value="BANK">Bank Account Transfer</option>
                  <option value="CASH">Petty Cash</option>
                  <option value="UPI">UPI SmartPay</option>
                  <option value="CHEQUE">Company Cheque</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Short Narrative/Description</label>
                <input
                  type="text"
                  required
                  value={newTx.description}
                  onChange={(e) => setNewTx(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="EX: Direct payment of office utility power bills"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div className="md:col-span-4 text-right">
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Post Ledger Log
                </button>
              </div>
            </form>
          )}

          {/* EDIT TRANSACTION MODAL */}
          {txToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveTxEdit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white font-mono">Edit Ledger Log</h4>
                  <button type="button" onClick={() => setTxToEdit(null)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Flow Type</label>
                  <select
                    value={txToEdit.type}
                    onChange={(e) => {
                      const type = e.target.value as "INCOME" | "EXPENSE";
                      setTxToEdit({ ...txToEdit, type, category: categories[type][0] });
                    }}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="INCOME">INCOME</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Category</label>
                  <select
                    value={txToEdit.category}
                    onChange={(e) => setTxToEdit({ ...txToEdit, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    {categories[txToEdit.type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={txToEdit.amount}
                    onChange={(e) => setTxToEdit({ ...txToEdit, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Method</label>
                  <select
                    value={txToEdit.paymentMethod}
                    onChange={(e) => setTxToEdit({ ...txToEdit, paymentMethod: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    <option value="BANK">BANK</option>
                    <option value="CASH">CASH</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">CHEQUE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Narrative</label>
                  <input
                    type="text"
                    required
                    value={txToEdit.description}
                    onChange={(e) => setTxToEdit({ ...txToEdit, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTxToEdit(null)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TRANSACTIONS TABLE */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950 text-slate-300 font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-left">Posting Date</th>
                    <th className="px-5 py-3 text-left">Category / Node</th>
                    <th className="px-5 py-3 text-left">Narrative / Description</th>
                    <th className="px-5 py-3 text-left">Channel</th>
                    <th className="px-5 py-3 text-left">Flow</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {transactions.map(t => {
                    const isIncome = t.type === "INCOME";
                    return (
                      <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-slate-400">{t.date}</td>
                        <td className="px-5 py-4 text-xs font-bold text-slate-200 uppercase tracking-wide">{t.category}</td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-400">{t.description}</td>
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-500">{t.paymentMethod}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            isIncome ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {isIncome ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            <span>{t.type}</span>
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-right font-mono font-bold text-xs ${isIncome ? "text-emerald-400" : "text-rose-400"}`}>
                          {isIncome ? "+" : "-"}{formatINR(t.amount)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setTxToEdit(t)}
                              className="rounded p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Edit Entry"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTx(t.id)}
                              className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete/Void Entry"
                            >
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
        </div>
      )}

      {/* SUB-TAB: AUTOMATED PROFIT & LOSS WORKSHEET */}
      {activeSubTab === "pl" && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 shadow-xs space-y-6 text-left max-w-3xl mx-auto">
          <div className="border-b border-slate-800 pb-3 text-center">
            <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase">P&L Financial Statement</span>
            <h3 className="text-xl font-bold text-white mt-1 font-mono">Interim Statement of Profit & Loss</h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated aggregation of billed revenue & business operations expenditure nodes.</p>
          </div>

          <div className="space-y-4">
            {/* 1. Operating Revenue */}
            <div className="border-b border-slate-800 pb-2">
              <div className="flex items-center justify-between text-sm font-bold text-white">
                <span className="uppercase tracking-wider font-mono">A. Operating Revenues (Inflow)</span>
                <span className="font-mono text-emerald-400">+{formatINR(totalIncome)}</span>
              </div>
              <div className="mt-2 pl-4 space-y-1.5 text-xs text-slate-400">
                {transactions.filter(t => t.type === "INCOME").map(t => (
                  <div key={t.id} className="flex justify-between items-center">
                    <span>{t.description} ({t.category})</span>
                    <span className="font-mono text-slate-300">{formatINR(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. COGS & Purchases */}
            <div className="border-b border-slate-800 pb-2">
              <div className="flex items-center justify-between text-sm font-bold text-white">
                <span className="uppercase tracking-wider font-mono">B. Cost of Goods Sold (COGS)</span>
                <span className="font-mono text-rose-400">
                  -{formatINR(transactions.filter(t => t.category.includes("COGS")).reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
              <div className="mt-2 pl-4 space-y-1.5 text-xs text-slate-400">
                {transactions.filter(t => t.category.includes("COGS")).map(t => (
                  <div key={t.id} className="flex justify-between items-center">
                    <span>{t.description}</span>
                    <span className="font-mono text-slate-300">-{formatINR(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Operational expenditures */}
            <div className="border-b border-slate-800 pb-2">
              <div className="flex items-center justify-between text-sm font-bold text-white">
                <span className="uppercase tracking-wider font-mono">C. Operating Overheads (Expenses)</span>
                <span className="font-mono text-rose-400">
                  -{formatINR(transactions.filter(t => t.type === "EXPENSE" && !t.category.includes("COGS")).reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
              <div className="mt-2 pl-4 space-y-1.5 text-xs text-slate-400">
                {transactions.filter(t => t.type === "EXPENSE" && !t.category.includes("COGS")).map(t => (
                  <div key={t.id} className="flex justify-between items-center">
                    <span>{t.category} - {t.description}</span>
                    <span className="font-mono text-slate-300">-{formatINR(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Net Profit summarize */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-sm">
              <div>
                <strong className="text-white uppercase block tracking-wider text-xs font-mono font-bold">Dynamic Net Profit Margin</strong>
                <span className="text-[10px] text-slate-500 font-semibold uppercase font-mono mt-0.5">Calculated automatically</span>
              </div>
              <strong className={`font-mono text-lg font-extrabold ${netSurplus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {netSurplus >= 0 ? "+" : ""}{formatINR(netSurplus)}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: ASSET REGISTER */}
      {activeSubTab === "assets" && (
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Physical Capital Assets Register Ledger</h3>
            <div className="flex gap-2">
              {isFinanceManager && (
                <button
                  onClick={() => setShowAddAsset(!showAddAsset)}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Log Capital Asset</span>
                </button>
              )}
              <button
                onClick={() => setShowImportAssetsModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import Assets</span>
              </button>
              <button
                onClick={handleExportAssetsCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export Assets</span>
              </button>
            </div>
          </div>

          {/* ADD CAPITAL ASSET */}
          {showAddAsset && (
            <form onSubmit={handleCreateAsset} className="bg-slate-950 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 border-b border-slate-800 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-white font-mono">Register physical Asset Entry</h4>
                <button type="button" onClick={() => setShowAddAsset(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Asset Name</label>
                <input
                  type="text"
                  required
                  value={newAssetForm.name}
                  onChange={(e) => setNewAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Asset Code</label>
                <input
                  type="text"
                  placeholder="EX: AST-MBP-01"
                  value={newAssetForm.code}
                  onChange={(e) => setNewAssetForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Accounting Class</label>
                <select
                  value={newAssetForm.category}
                  onChange={(e) => setNewAssetForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                >
                  <option value="Hardware">Hardware & Electronics</option>
                  <option value="Furniture">Office Furniture</option>
                  <option value="Machinery">Warehouse Machinery</option>
                  <option value="Vehicle">Delivery Fleet Vehicles</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Purchase Cost (₹)</label>
                <input
                  type="number"
                  required
                  value={newAssetForm.purchaseValue}
                  onChange={(e) => setNewAssetForm(prev => ({ ...prev, purchaseValue: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Current Book Value (₹)</label>
                <input
                  type="number"
                  placeholder="Leave blank to match cost"
                  value={newAssetForm.currentValue}
                  onChange={(e) => setNewAssetForm(prev => ({ ...prev, currentValue: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Depreciation Rate (%)</label>
                <input
                  type="number"
                  value={newAssetForm.depreciationRate}
                  onChange={(e) => setNewAssetForm(prev => ({ ...prev, depreciationRate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div className="md:col-span-3 text-right">
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Save Asset Profile
                </button>
              </div>
            </form>
          )}

          {/* EDIT ASSET MODAL */}
          {assetToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveAssetEdit} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white font-mono">Edit Capital Asset Profile</h4>
                  <button type="button" onClick={() => setAssetToEdit(null)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Asset Name</label>
                  <input
                    type="text"
                    required
                    value={assetToEdit.name}
                    onChange={(e) => setAssetToEdit({ ...assetToEdit, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Category</label>
                  <select
                    value={assetToEdit.category}
                    onChange={(e) => setAssetToEdit({ ...assetToEdit, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                  >
                    <option value="Hardware">Hardware & Electronics</option>
                    <option value="Furniture">Office Furniture</option>
                    <option value="Machinery">Warehouse Machinery</option>
                    <option value="Vehicle">Delivery Fleet Vehicles</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Acquired Cost</label>
                    <input
                      type="number"
                      required
                      value={assetToEdit.purchaseValue}
                      onChange={(e) => setAssetToEdit({ ...assetToEdit, purchaseValue: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Book Value</label>
                    <input
                      type="number"
                      required
                      value={assetToEdit.currentValue}
                      onChange={(e) => setAssetToEdit({ ...assetToEdit, currentValue: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Depreciation Index (%)</label>
                  <input
                    type="number"
                    value={assetToEdit.depreciationRate}
                    onChange={(e) => setAssetToEdit({ ...assetToEdit, depreciationRate: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAssetToEdit(null)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ASSETS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeAssets.map(a => (
              <div key={a.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-3.5 shadow-xs relative">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">{a.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{a.code}</span>
                  </div>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-500/20">{a.category}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-2 rounded text-left border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Acquired Cost</span>
                    <strong className="font-mono text-slate-300">{formatINR(a.purchaseValue)}</strong>
                  </div>
                  <div className="bg-slate-900 p-2 rounded text-left border border-slate-850">
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Book Value</span>
                    <strong className="font-mono text-indigo-400">{formatINR(a.currentValue)}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Depreciation</span>
                  <span className="font-mono text-rose-400 font-bold flex items-center gap-0.5">
                    <Percent className="h-3 w-3" />
                    <span>{a.depreciationRate}% p.a.</span>
                  </span>
                </div>

                <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-800/40">
                  <button
                    onClick={() => setAssetToEdit(a)}
                    className="rounded p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(a.id, a.name)}
                    className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Retire Asset"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IMPORT TX MODAL */}
      {showImportTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Ledger Transactions</span>
              </h4>
              <button onClick={() => setShowImportTxModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 font-mono">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                type,category,amount,paymentMethod,description
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Transactions CSV</span>
              <button onClick={handleLoadSampleTx} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="type,category,amount,paymentMethod,description"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportTxModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportTx} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Import Transactions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT ASSETS MODAL */}
      {showImportAssetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Capital Assets Registry</span>
              </h4>
              <button onClick={() => setShowImportAssetsModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 font-mono">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                name,code,category,purchaseValue,currentValue,depreciationRate
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Assets CSV</span>
              <button onClick={handleLoadSampleAssets} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="name,code,category,purchaseValue,currentValue,depreciationRate"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportAssetsModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportAssets} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Import Capital Assets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

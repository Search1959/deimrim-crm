import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import { Wallet, Check, Printer, Eye, X, Calculator, Edit3, Search, Settings, Info, Download } from "lucide-react";
import { Employee, formatINR } from "../../types";

interface HRPayrollPanelProps {
  employees: Employee[];
  companyId: string;
  onSalaryDisbursed?: (employeeId: string, employeeName: string, amount: number, month: string) => void;
}

interface SalaryAdjustment {
  hra: number;
  allowance: number;
  bonus: number;
  customDeduction: number;
}

interface TaxConfig {
  epfPct: number;          // Employee PF %  (default 12)
  esicPct: number;         // ESIC %         (default 0.75)
  esicCeiling: number;     // ESIC max salary (default 21000)
  ptAmount: number;        // Prof Tax flat  (default 200)
  ptThreshold: number;     // PT applies above (default 15000)
  tdsSlabs: Array<{ above: number; pct: number }>; // ascending order
}

const DEFAULT_TAX: TaxConfig = {
  epfPct: 12,
  esicPct: 0.75,
  esicCeiling: 21000,
  ptAmount: 200,
  ptThreshold: 15000,
  tdsSlabs: [
    { above: 100000, pct: 15 },
    { above: 50000,  pct: 10 },
    { above: 25000,  pct: 5  },
    { above: 0,      pct: 0  },
  ],
};

function generateMonthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(d.toLocaleString("en-IN", { month: "long", year: "numeric" }));
  }
  return options;
}

export default function HRPayrollPanel({ employees, companyId, onSalaryDisbursed }: HRPayrollPanelProps) {
  const monthOptions = generateMonthOptions();
  const [payslipMonth, setPayslipMonth] = useState(monthOptions[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmpForSlip, setSelectedEmpForSlip] = useState<Employee | null>(null);
  const [showTaxConfig, setShowTaxConfig] = useState(false);
  const [taxConfig, setTaxConfig] = useState<TaxConfig>(DEFAULT_TAX);
  const [taxForm, setTaxForm] = useState<TaxConfig>(DEFAULT_TAX);
  const taxKey = `deinrim_payroll_taxcfg_${companyId}`;

  const adjKey    = `deinrim_payroll_adj_${companyId}`;
  const statusKey = `deinrim_payroll_status_${companyId}`;

  // Adjustments — persisted to localStorage, no hardcoded seeds
  const [adjustments, setAdjustments] = useState<Record<string, SalaryAdjustment>>({});
  const [payrollStatus, setPayrollStatus] = useState<Record<string, "paid" | "unpaid">>({});

  useEffect(() => {
    try {
      const storedAdj = localStorage.getItem(adjKey);
      if (storedAdj) setAdjustments(JSON.parse(storedAdj));
    } catch {}
    try {
      const storedStatus = localStorage.getItem(statusKey);
      if (storedStatus) setPayrollStatus(JSON.parse(storedStatus));
    } catch {}
    try {
      const storedTax = localStorage.getItem(taxKey);
      if (storedTax) {
        const parsed = JSON.parse(storedTax) as TaxConfig;
        setTaxConfig(parsed);
        setTaxForm(parsed);
      }
    } catch {}
  }, [companyId]);

  const saveAdjustments = (updated: Record<string, SalaryAdjustment>) => {
    setAdjustments(updated);
    localStorage.setItem(adjKey, JSON.stringify(updated));
  };

  const saveStatus = (updated: Record<string, "paid" | "unpaid">) => {
    setPayrollStatus(updated);
    localStorage.setItem(statusKey, JSON.stringify(updated));
  };

  // Adjustment modal
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState("");
  const [formHRA, setFormHRA] = useState("0");
  const [formAllowance, setFormAllowance] = useState("0");
  const [formBonus, setFormBonus] = useState("0");
  const [formCustomDeduction, setFormCustomDeduction] = useState("0");

  // Tax calculations using configurable rates
  const calcEPF  = (s: number) => s * (taxConfig.epfPct / 100);
  const calcESIC = (s: number) => s >= taxConfig.esicCeiling ? 0 : s * (taxConfig.esicPct / 100);
  const calcPT   = (s: number) => s >= taxConfig.ptThreshold ? taxConfig.ptAmount : 0;
  const calcTDS  = (gross: number) => {
    const slabs = [...taxConfig.tdsSlabs].sort((a, b) => b.above - a.above);
    for (const slab of slabs) {
      if (gross > slab.above) return gross * (slab.pct / 100);
    }
    return 0;
  };

  const saveTaxConfig = (cfg: TaxConfig) => {
    setTaxConfig(cfg);
    localStorage.setItem(taxKey, JSON.stringify(cfg));
  };

  const getCalc = (emp: Employee) => {
    const adj = adjustments[emp.id] ?? { hra: 0, allowance: 0, bonus: 0, customDeduction: 0 };
    const gross = emp.salary + adj.hra + adj.allowance + adj.bonus;
    const epf   = calcEPF(emp.salary);
    const esic  = calcESIC(emp.salary);
    const pt    = calcPT(emp.salary);
    const tds   = calcTDS(gross);
    const totalDeductions = epf + esic + pt + tds + adj.customDeduction;
    const netSalary = gross - totalDeductions;
    return { gross, epf, esic, pt, tds, totalDeductions, netSalary, adj };
  };

  const handleMarkAsPaid = (emp: Employee) => {
    const calc = getCalc(emp);
    const updated = { ...payrollStatus, [emp.id]: "paid" as const };
    saveStatus(updated);
    if (onSalaryDisbursed) {
      onSalaryDisbursed(emp.id, emp.name, calc.netSalary, payslipMonth);
    }
    toast.success("Payroll Disbursed", `₹${calc.netSalary.toLocaleString("en-IN")} posted to Finance for ${emp.name}`);
  };

  const handleOpenAdj = (empId: string) => {
    const existing = adjustments[empId] ?? { hra: 0, allowance: 0, bonus: 0, customDeduction: 0 };
    setEditingEmpId(empId);
    setFormHRA(existing.hra.toString());
    setFormAllowance(existing.allowance.toString());
    setFormBonus(existing.bonus.toString());
    setFormCustomDeduction(existing.customDeduction.toString());
    setShowAdjModal(true);
  };

  const handleSaveAdj = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...adjustments,
      [editingEmpId]: {
        hra: parseFloat(formHRA) || 0,
        allowance: parseFloat(formAllowance) || 0,
        bonus: parseFloat(formBonus) || 0,
        customDeduction: parseFloat(formCustomDeduction) || 0,
      }
    };
    saveAdjustments(updated);
    setShowAdjModal(false);
    toast.success("Payroll Updated", "Compensation components saved");
  };

  const totalCommitment = employees.reduce((s, e) => s + getCalc(e).netSalary, 0);
  const totalDisbursed  = employees.filter(e => payrollStatus[e.id] === "paid").reduce((s, e) => s + getCalc(e).netSalary, 0);
  const totalPending    = employees.filter(e => payrollStatus[e.id] !== "paid").reduce((s, e) => s + getCalc(e).netSalary, 0);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Net Pay Commitment", value: totalCommitment, color: "indigo", Icon: Calculator },
          { label: "Disbursed (This Month)",   value: totalDisbursed,  color: "emerald", Icon: Check },
          { label: "Outstanding Liabilities",  value: totalPending,    color: "amber",  Icon: Wallet },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 bg-${color}-500/10 text-${color}-400 rounded-lg shrink-0`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">{label}</span>
              <strong className={`text-base font-bold text-${color === "indigo" ? "white" : color+"-400"} font-mono mt-0.5 block`}>
                {formatINR(value)}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Table header controls */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Monthly Payroll Ledger</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Salaries auto-populated from Active Employees. Adjust allowances, bonuses, and tax overrides per staff.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="pl-7 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 w-36"
              />
            </div>
            <select
              value={payslipMonth}
              onChange={e => setPayslipMonth(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
            >
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              onClick={() => { setTaxForm({ ...taxConfig }); setShowTaxConfig(true); }}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 text-xs font-bold cursor-pointer transition-all"
              title="Configure Tax Rates (EPF / ESIC / PT / TDS)"
            >
              <Settings className="h-3.5 w-3.5" /> Tax Config
            </button>
            <button onClick={async () => {
              const XLSX = await import("xlsx");
              const rows = employees.map(emp => {
                const adj = adjustments[emp.id] || { hra: 0, allowance: 0, bonus: 0, customDeduction: 0 };
                const gross = emp.salary + adj.hra + adj.allowance + adj.bonus;
                const epf = Math.round(gross * taxConfig.epfPct / 100);
                const esic = gross <= 21000 ? Math.round(gross * taxConfig.esicPct / 100) : 0;
                const pt = gross >= (taxConfig.ptThreshold || 10000) ? (taxConfig.ptAmount || 0) : 0;
                const net = gross - epf - esic - pt - adj.customDeduction;
                return {
                  "Employee": emp.name, "Month": payslipMonth,
                  "Basic Salary": emp.salary, "HRA": adj.hra, "Allowance": adj.allowance, "Bonus": adj.bonus,
                  "Gross": gross, "EPF": epf, "ESIC": esic, "PT": pt, "Deductions": adj.customDeduction,
                  "Net Salary": net, "Status": payrollStatus[emp.id] || "pending",
                };
              });
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Salary Register");
              XLSX.writeFile(wb, `Salary_Register_${payslipMonth.replace(" ","_")}.xlsx`);
              toast.success("Exported", "Salary register downloaded");
            }} className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 text-xs font-bold cursor-pointer transition-all">
              <Download className="h-3.5 w-3.5" /> Export Register
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800/60 text-sm">
            <thead className="bg-slate-950 font-bold text-slate-300">
              <tr>
                <th className="px-5 py-3 text-left">Staff Member</th>
                <th className="px-5 py-3 text-left">Basic Salary</th>
                <th className="px-5 py-3 text-left">HRA & Allowance</th>
                <th className="px-5 py-3 text-left">PF & TDS Tax</th>
                <th className="px-5 py-3 text-left">Net Take-Home</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs font-mono">
                    {employees.length === 0 ? "No active staff found." : "No staff match your search."}
                  </td>
                </tr>
              )}
              {filtered.map(emp => {
                const calc = getCalc(emp);
                const isPaid = payrollStatus[emp.id] === "paid";
                return (
                  <tr key={emp.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-200">{emp.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{emp.employeeCode}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold">{formatINR(emp.salary)}</td>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      <div>HRA: {formatINR(calc.adj.hra)}</div>
                      <div className="text-[10px] text-indigo-400">Other: {formatINR(calc.adj.allowance + calc.adj.bonus)}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-red-400">
                      <div>PF: {formatINR(calc.epf)}</div>
                      <div className="text-[10px] text-amber-500">TDS: {formatINR(calc.tds)}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-extrabold text-emerald-400">{formatINR(calc.netSalary)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                        isPaid
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {isPaid ? "Disbursed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdj(emp.id)}
                          className="rounded bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 p-1 cursor-pointer transition-all"
                          title="Adjust Compensation"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedEmpForSlip(emp)}
                          className="rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 p-1 cursor-pointer transition-all"
                          title="View Payslip"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {!isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(emp)}
                            className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold cursor-pointer transition-all"
                          >
                            DISBURSE
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
      </div>

      {/* ADJUSTMENT MODAL */}
      {showAdjModal && (() => {
        const emp = employees.find(e => e.id === editingEmpId);
        if (!emp) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleSaveAdj} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Adjust Compensation</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{emp.name} — {emp.employeeCode}</p>
                </div>
                <button type="button" onClick={() => setShowAdjModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-400">
                Base Salary: <strong className="text-white">{formatINR(emp.salary)}</strong>
              </div>

              <div className="space-y-3 text-xs font-semibold text-slate-300">
                {[
                  ["House Rent Allowance (HRA) ₹", formHRA, setFormHRA],
                  ["Special & Food Allowances ₹",  formAllowance, setFormAllowance],
                  ["Performance Bonus / Overtime ₹", formBonus, setFormBonus],
                  ["Custom Deduction / Loss of Pay ₹", formCustomDeduction, setFormCustomDeduction],
                ].map(([label, val, setter]) => (
                  <div key={label as string}>
                    <label className="block text-slate-400 mb-1">{label as string}</label>
                    <input
                      type="number" min="0"
                      value={val as string}
                      onChange={e => (setter as React.Dispatch<React.SetStateAction<string>>)(e.target.value)}
                      className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAdjModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* TAX CONFIG MODAL */}
      {showTaxConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-left space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Settings className="h-4 w-4 text-amber-400" /> Statutory Tax Configuration
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Update when government rules change. Rates are saved and applied to all future payroll calculations.</p>
              </div>
              <button onClick={() => setShowTaxConfig(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* EPF */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider font-mono">EPF — Employee Provident Fund</h4>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-48 shrink-0">Employee Contribution Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={taxForm.epfPct}
                  onChange={e => setTaxForm(f => ({ ...f, epfPct: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* ESIC */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider font-mono">ESIC — Employee State Insurance</h4>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-48 shrink-0">Employee Contribution Rate (%)</label>
                <input
                  type="number" min="0" max="100" step="0.01"
                  value={taxForm.esicPct}
                  onChange={e => setTaxForm(f => ({ ...f, esicPct: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-48 shrink-0">Salary Ceiling (₹) — exempt above this</label>
                <input
                  type="number" min="0"
                  value={taxForm.esicCeiling}
                  onChange={e => setTaxForm(f => ({ ...f, esicCeiling: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Professional Tax */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[11px] font-extrabold text-purple-400 uppercase tracking-wider font-mono">PT — Professional Tax</h4>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-48 shrink-0">Fixed Monthly Amount (₹)</label>
                <input
                  type="number" min="0"
                  value={taxForm.ptAmount}
                  onChange={e => setTaxForm(f => ({ ...f, ptAmount: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-400 w-48 shrink-0">Minimum Salary Threshold (₹)</label>
                <input
                  type="number" min="0"
                  value={taxForm.ptThreshold}
                  onChange={e => setTaxForm(f => ({ ...f, ptThreshold: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* TDS Slabs */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-[11px] font-extrabold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                TDS — Income Tax Slabs
                <span className="text-[9px] text-slate-500 font-normal normal-case">(highest matching slab applies)</span>
              </h4>
              {taxForm.tdsSlabs.map((slab, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-28 shrink-0 font-mono">
                    {i === taxForm.tdsSlabs.length - 1 ? "Base (₹0+)" : `Above ₹`}
                  </span>
                  {i < taxForm.tdsSlabs.length - 1 && (
                    <input
                      type="number" min="0"
                      value={slab.above}
                      onChange={e => setTaxForm(f => {
                        const slabs = [...f.tdsSlabs];
                        slabs[i] = { ...slabs[i], above: parseFloat(e.target.value) || 0 };
                        return { ...f, tdsSlabs: slabs };
                      })}
                      className="w-28 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                    />
                  )}
                  {i === taxForm.tdsSlabs.length - 1 && <span className="w-28 text-xs text-slate-600 font-mono px-2">—</span>}
                  <span className="text-xs text-slate-500 shrink-0">→ Rate %</span>
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={slab.pct}
                    onChange={e => setTaxForm(f => {
                      const slabs = [...f.tdsSlabs];
                      slabs[i] = { ...slabs[i], pct: parseFloat(e.target.value) || 0 };
                      return { ...f, tdsSlabs: slabs };
                    })}
                    className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                  />
                  <span className="text-xs text-slate-600">%</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-600">
                <Info className="h-3 w-3" /> Example: "Above ₹1,00,000 → 15%" means 15% TDS if gross salary exceeds ₹1 lakh.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => { setTaxForm({ ...DEFAULT_TAX }); }}
                className="text-xs text-slate-500 hover:text-amber-400 underline cursor-pointer"
              >
                Reset to Defaults
              </button>
              <div className="flex gap-2">
                <button onClick={() => setShowTaxConfig(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
                <button
                  onClick={() => { saveTaxConfig(taxForm); setShowTaxConfig(false); toast.success("Tax Config Saved", "New rates will apply to all payroll calculations."); }}
                  className="rounded bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer"
                >
                  Save Tax Rates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAYSLIP MODAL */}
      {selectedEmpForSlip && (() => {
        const emp = selectedEmpForSlip;
        const calc = getCalc(emp);
        const isPaid = payrollStatus[emp.id] === "paid";
        const custom = emp as any;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest">Salary Payslip — {payslipMonth}</span>
                <button onClick={() => setSelectedEmpForSlip(null)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-white text-slate-900 p-6 rounded-xl space-y-5 shadow-md border border-slate-200" id="payslip-print">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">DEINRIM Suite</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Workspace Tenant Node Corp.</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-extrabold text-indigo-600 font-mono uppercase">SALARY PAYSLIP</h3>
                    <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">PAY PERIOD: {payslipMonth.toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-700 border-b border-slate-200 pb-4">
                  <div className="space-y-1">
                    <div><strong>Employee Name:</strong> {emp.name}</div>
                    <div><strong>Code Number:</strong> {emp.employeeCode}</div>
                    <div><strong>Phone:</strong> {emp.phone || "—"}</div>
                    <div><strong>Email:</strong> {emp.email}</div>
                  </div>
                  <div className="space-y-1">
                    <div><strong>Date of Joining:</strong> {emp.joiningDate}</div>
                    <div><strong>Bank A/C No:</strong> {custom.bankAccountNumber || "—"}</div>
                    <div><strong>IFSC Code:</strong> {custom.bankIfsc || "—"}</div>
                    <div><strong>Bank Name:</strong> {custom.bankName || "—"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2">
                    <span className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider border-b border-emerald-500 pb-1">EARNINGS</span>
                    {[
                      ["Basic Salary", emp.salary],
                      ["HRA", calc.adj.hra],
                      ["Special Allowances", calc.adj.allowance],
                      ["Performance Bonus", calc.adj.bonus],
                    ].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1 text-slate-600">
                        <span>{l as string}</span><span className="font-mono">{formatINR(v as number)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-200 font-bold text-slate-900 pt-2">
                      <span>Gross Earnings</span><span className="font-mono">{formatINR(calc.gross)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-[10px] font-extrabold text-red-600 uppercase tracking-wider border-b border-red-500 pb-1">DEDUCTIONS</span>
                    {[
                      [`EPF (${taxConfig.epfPct}%)`, calc.epf],
                      [`ESIC (${taxConfig.esicPct}%)`, calc.esic],
                      ["Professional Tax", calc.pt],
                      ["TDS (Income Tax)", calc.tds],
                      ...(calc.adj.customDeduction > 0 ? [["Custom / Loss of Pay", calc.adj.customDeduction]] : []),
                    ].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between py-1 text-slate-600">
                        <span>{l as string}</span><span className="font-mono">{formatINR(v as number)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-200 font-bold text-slate-900 pt-2">
                      <span>Total Deductions</span><span className="font-mono">{formatINR(calc.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">NET TAKE-HOME</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 italic">Rupees {Math.floor(calc.netSalary).toLocaleString("en-IN")} only</p>
                  </div>
                  <strong className="text-lg font-mono font-black text-indigo-700">{formatINR(calc.netSalary)}</strong>
                </div>

                <div className="flex justify-between items-end pt-6">
                  <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest border-2 rounded ${
                    isPaid ? "border-emerald-600 text-emerald-600" : "border-amber-600 text-amber-600"
                  }`}>
                    {isPaid ? "PAID & DISBURSED" : "PENDING CLEARANCE"}
                  </span>
                  <div className="text-right border-t border-slate-400 w-44 pt-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Authorized Signatory</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" /> Print Slip
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

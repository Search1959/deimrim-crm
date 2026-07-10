import { toast } from "../../utils/toast";
import React, { useState, useEffect } from "react";
import { DollarSign, Wallet, Check, Download, Printer, Eye, X, Calculator, Edit3, Search } from "lucide-react";
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

// Generate last 12 month options dynamically
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

  // Tax calculations (Indian statutory)
  const calcEPF  = (s: number) => s * 0.12;
  const calcESIC = (s: number) => s >= 21000 ? 0 : s * 0.0075;
  const calcPT   = (s: number) => s >= 15000 ? 200 : 0;
  const calcTDS  = (gross: number) => {
    if (gross > 100000) return gross * 0.15;
    if (gross > 50000)  return gross * 0.10;
    if (gross > 25000)  return gross * 0.05;
    return 0;
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
                      ["EPF (12%)", calc.epf],
                      ["ESIC (0.75%)", calc.esic],
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

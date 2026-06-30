import { toast } from "../../utils/toast";
import React, { useState } from "react";
import { DollarSign, Wallet, Check, Download, Printer, User, Eye, X, Calculator, ShieldAlert, Plus, Edit3 } from "lucide-react";
import { Employee, formatINR } from "../../types";

interface HRPayrollPanelProps {
  employees: Employee[];
}

interface SalaryAdjustment {
  hra: number;
  allowance: number;
  bonus: number;
  customDeduction: number;
}

export default function HRPayrollPanel({ employees }: HRPayrollPanelProps) {
  const [selectedEmpForSlip, setSelectedEmpForSlip] = useState<Employee | null>(null);
  const [payslipMonth, setPayslipMonth] = useState("June 2026");

  // Interactive adjustments state seeded with realistic data
  const [adjustments, setAdjustments] = useState<Record<string, SalaryAdjustment>>({
    "emp-1": { hra: 12000, allowance: 5000, bonus: 4000, customDeduction: 0 },
    "emp-2": { hra: 9000, allowance: 3000, bonus: 0, customDeduction: 1000 },
  });

  // Modal controls
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState("");
  const [formHRA, setFormHRA] = useState("0");
  const [formAllowance, setFormAllowance] = useState("0");
  const [formBonus, setFormBonus] = useState("0");
  const [formCustomDeduction, setFormCustomDeduction] = useState("0");

  // Mock payroll status tracking
  const [payrollStatus, setPayrollStatus] = useState<Record<string, "paid" | "unpaid">>({
    "emp-1": "paid",
    "emp-2": "unpaid",
  });

  const handleMarkAsPaid = (id: string) => {
    setPayrollStatus(prev => ({ ...prev, [id]: "paid" }));
    toast.success("Payroll Posted", "Salary disbursement recorded in ledger")
  };

  // Tax calculations
  const calculateEPF = (salary: number) => salary * 0.12; // 12% standard provident fund
  const calculateESIC = (salary: number) => salary >= 21000 ? 0 : salary * 0.0075; // 0.75% ESIC
  const calculatePT = (salary: number) => salary >= 15000 ? 200 : 0; // ₹200 standard professional tax
  const calculateTDS = (salary: number) => {
    if (salary > 100000) return salary * 0.15;
    if (salary > 50000) return salary * 0.10;
    if (salary > 25000) return salary * 0.05;
    return 0;
  };

  const handleOpenAdjustment = (empId: string) => {
    const existing = adjustments[empId] || { hra: 0, allowance: 0, bonus: 0, customDeduction: 0 };
    setEditingEmpId(empId);
    setFormHRA(existing.hra.toString());
    setFormAllowance(existing.allowance.toString());
    setFormBonus(existing.bonus.toString());
    setFormCustomDeduction(existing.customDeduction.toString());
    setShowAdjustmentModal(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;

    setAdjustments(prev => ({
      ...prev,
      [editingEmpId]: {
        hra: parseFloat(formHRA) || 0,
        allowance: parseFloat(formAllowance) || 0,
        bonus: parseFloat(formBonus) || 0,
        customDeduction: parseFloat(formCustomDeduction) || 0,
      }
    }));

    setShowAdjustmentModal(false);
    toast.success("Payroll Updated", "Compensation components adjusted")
  };

  const handleDownloadPayslip = (name: string) => {
    toast.info("Payslip", `Payslip for ${name} - ${payslipMonth} (feature coming soon)`);
  };

  const getCalculatedRecord = (emp: Employee) => {
    const adj = adjustments[emp.id] || { hra: 0, allowance: 0, bonus: 0, customDeduction: 0 };
    const gross = emp.salary + adj.hra + adj.allowance + adj.bonus;
    const epf = calculateEPF(emp.salary);
    const esic = calculateESIC(emp.salary);
    const pt = calculatePT(emp.salary);
    const tds = calculateTDS(gross);
    const totalDeductions = epf + esic + pt + tds + adj.customDeduction;
    const netSalary = gross - totalDeductions;

    return {
      gross,
      epf,
      esic,
      pt,
      tds,
      totalDeductions,
      netSalary,
      adj
    };
  };

  const totalDisbursed = employees.reduce((sum, e) => {
    const isPaid = payrollStatus[e.id] === "paid";
    if (isPaid) {
      const calc = getCalculatedRecord(e);
      return sum + calc.netSalary;
    }
    return sum;
  }, 0);

  const totalOutstanding = employees.reduce((sum, e) => {
    const isUnpaid = payrollStatus[e.id] !== "paid";
    if (isUnpaid) {
      const calc = getCalculatedRecord(e);
      return sum + calc.netSalary;
    }
    return sum;
  }, 0);

  const totalCommitment = employees.reduce((sum, e) => {
    const calc = getCalculatedRecord(e);
    return sum + calc.netSalary;
  }, 0);

  return (
    <div className="space-y-6 text-left">
      {/* KPI Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Total Net Pay Commitment</span>
            <strong className="text-base font-bold text-white font-mono mt-0.5 block">
              {formatINR(totalCommitment)}
            </strong>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Disbursed (This Month)</span>
            <strong className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
              {formatINR(totalDisbursed)}
            </strong>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Outstanding Liabilities</span>
            <strong className="text-base font-bold text-amber-400 font-mono mt-0.5 block">
              {formatINR(totalOutstanding)}
            </strong>
          </div>
        </div>
      </div>

      {/* Salary List Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Monthly Payroll Ledger</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Staff salaries are auto-populated from Active Employees. Use the action tools to adjust allowances, bonuses, and tax overrides.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={payslipMonth}
              onChange={(e) => setPayslipMonth(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
            >
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
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
              {employees.map(emp => {
                const calc = getCalculatedRecord(emp);
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
                        isPaid ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {isPaid ? "disbursed" : "pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjustment(emp.id)}
                          className="rounded bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 p-1 cursor-pointer transition-all"
                          title="Adjust Compensation & Allowances"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedEmpForSlip(emp)}
                          className="rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 p-1 cursor-pointer transition-all"
                          title="Generate Payslip"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {!isPaid && (
                          <button
                            onClick={() => handleMarkAsPaid(emp.id)}
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

              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No active staff found to display in the payroll ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPONENT ADJUSTMENT MODAL */}
      {showAdjustmentModal && (() => {
        const emp = employees.find(e => e.id === editingEmpId);
        if (!emp) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form onSubmit={handleSaveAdjustment} className="w-full max-w-md rounded-2xl border border-slate-850 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Adjust Compensation Components</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-sans font-medium">Employee: <span className="text-slate-300 font-bold">{emp.name} ({emp.employeeCode})</span></p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAdjustmentModal(false)} 
                  className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-300">
                <div className="bg-slate-900/40 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-400">
                  Base Salary: <strong className="text-white">{formatINR(emp.salary)}</strong>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">House Rent Allowance (HRA) (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formHRA}
                    onChange={(e) => setFormHRA(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white font-mono focus:outline-none"
                    placeholder="e.g. 12000"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Special & Food Allowances (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formAllowance}
                    onChange={(e) => setFormAllowance(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white font-mono focus:outline-none"
                    placeholder="e.g. 3000"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Performance Bonus / Overtime Pay (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formBonus}
                    onChange={(e) => setFormBonus(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white font-mono focus:outline-none"
                    placeholder="e.g. 5000"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Custom Deductions / Loss of Pay (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formCustomDeduction}
                    onChange={(e) => setFormCustomDeduction(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-slate-900 p-2 text-white font-mono focus:outline-none text-red-400"
                    placeholder="e.g. 1000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="rounded bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white px-3 py-1.5 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* DETAILED PAYSLIP OVERLAY SPECIFICATION MODAL */}
      {selectedEmpForSlip && (() => {
        const emp = selectedEmpForSlip;
        const calc = getCalculatedRecord(emp);
        const isPaid = payrollStatus[emp.id] === "paid";
        const custom = emp as any;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4 max-h-[90vh] overflow-y-auto font-sans">
              <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 font-mono uppercase tracking-widest">Taxation & Remittance Slip</span>
                <button 
                  onClick={() => setSelectedEmpForSlip(null)} 
                  className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* PRINTABLE SLIP CONTAINER */}
              <div className="bg-white text-slate-900 p-6 rounded-xl space-y-6 shadow-md border border-slate-200">
                {/* Header info */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="text-left">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">DEINRIM Suite</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Workspace Tenant Node Corp.</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-extrabold text-indigo-600 font-mono uppercase">SALARY PAYSLIP</h3>
                    <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">PAY PERIOD: {payslipMonth.toUpperCase()}</p>
                  </div>
                </div>

                {/* Employee Details block */}
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
                    <div><strong>IFSC Code:</strong> <span className="uppercase">{custom.bankIfsc || "—"}</span></div>
                    <div><strong>Bank Name:</strong> {custom.bankName || "—"}</div>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  {/* Earnings */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider border-b border-emerald-500 pb-1">EARNINGS SPECIFICATIONS</span>
                    <div className="flex justify-between font-semibold py-1">
                      <span>Basic Monthly Salary</span>
                      <span className="font-mono">{formatINR(emp.salary)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 py-1">
                      <span>House Rent Allowance (HRA)</span>
                      <span className="font-mono">{formatINR(calc.adj.hra)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 py-1">
                      <span>Special Allowances</span>
                      <span className="font-mono">{formatINR(calc.adj.allowance)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 py-1">
                      <span>Performance Bonus</span>
                      <span className="font-mono">{formatINR(calc.adj.bonus)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 font-bold text-slate-900 pt-2 text-[13px]">
                      <span>Gross Earnings</span>
                      <span className="font-mono">{formatINR(calc.gross)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-extrabold text-red-600 uppercase tracking-wider border-b border-red-500 pb-1">DEDUCTIONS & TAX</span>
                    <div className="flex justify-between text-slate-600 py-1">
                      <span>Provident Fund (EPF 12%)</span>
                      <span className="font-mono">{formatINR(calc.epf)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 py-1">
                      <span>ESIC (0.75%)</span>
                      <span className="font-mono">{formatINR(calc.esic)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 py-1">
                      <span>Professional Tax (PT)</span>
                      <span className="font-mono">{formatINR(calc.pt)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 py-1">
                      <span>TDS Income Tax Slab</span>
                      <span className="font-mono">{formatINR(calc.tds)}</span>
                    </div>
                    {calc.adj.customDeduction > 0 && (
                      <div className="flex justify-between text-slate-600 py-1">
                        <span>Custom / Loss of Pay</span>
                        <span className="font-mono text-red-600">{formatINR(calc.adj.customDeduction)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 font-bold text-slate-900 pt-2 text-[13px]">
                      <span>Total Deductions</span>
                      <span className="font-mono">{formatINR(calc.totalDeductions)}</span>
                    </div>
                  </div>
                </div>

                {/* Take-home salary block */}
                <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center text-slate-950">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">NET TAKE-HOME DISBURSEMENT</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 italic">Amount in words: Rupees {Math.floor(calc.netSalary).toLocaleString("en-IN")} only</p>
                  </div>
                  <div className="text-right">
                    <strong className="text-lg font-mono font-black text-indigo-700">{formatINR(calc.netSalary)}</strong>
                  </div>
                </div>

                {/* Disbursed Stamp & Signature placeholders */}
                <div className="flex justify-between items-end pt-8">
                  <div className="text-left">
                    <span className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-widest border-2 rounded ${
                      isPaid ? "border-emerald-600 text-emerald-600" : "border-amber-600 text-amber-600"
                    }`}>
                      {isPaid ? "PAID & DISBURSED" : "PENDING CLEARANCE"}
                    </span>
                  </div>
                  <div className="text-right border-t border-slate-400 w-44 pt-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Authorized Signatory</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-3">
                <button
                  onClick={() => window.print()}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => handleDownloadPayslip(emp.name)}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


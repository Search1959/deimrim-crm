/**
 * Product Tour — guided walkthrough overlay shown after first login.
 * Like realestate demo.php's flash message, but interactive step-by-step.
 */
import React, { useState } from "react";
import {
  X, ArrowRight, ArrowLeft, CheckCircle2,
  LayoutDashboard, TrendingUp, Boxes, Users2,
  Wallet, FileSpreadsheet, UserCircle, LayoutGrid,
} from "lucide-react";

interface Step {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: LayoutDashboard,
    title: "Your Dashboard",
    desc: "The Dashboard is your command centre — live KPIs, recent activities, branch performance, and quick-links to every module. Everything starts here.",
    color: "text-sky-400",
  },
  {
    icon: TrendingUp,
    title: "Sales & CRM",
    desc: "Manage leads, follow-up schedules, customer accounts, and quotations. Convert leads to orders with one click. The pipeline view shows your revenue forecast at a glance.",
    color: "text-emerald-400",
  },
  {
    icon: Boxes,
    title: "Inventory",
    desc: "Track stock across batches, locations, and expiry dates. Purchase Orders auto-update stock on GRN receipt. Reorder alerts fire when stock falls below threshold.",
    color: "text-orange-400",
  },
  {
    icon: Users2,
    title: "HR Module",
    desc: "Manage employee records, attendance, leave requests, payroll, and targets. Role-based access lets HR Managers configure policy without touching other modules.",
    color: "text-violet-400",
  },
  {
    icon: UserCircle,
    title: "My HR (Self-Service)",
    desc: "Every employee gets their own My HR portal — check in/out with GPS, apply for leave, view payslips, and track personal KPI targets. Available to all roles.",
    color: "text-indigo-400",
  },
  {
    icon: Wallet,
    title: "Finance",
    desc: "Full double-entry ledger fed automatically by every sale and purchase. View P&L, Balance Sheet, cash flow, and pending receivables/payables in real time.",
    color: "text-amber-400",
  },
  {
    icon: FileSpreadsheet,
    title: "GST Module",
    desc: "Auto-generate GSTR-1, GSTR-3B, and GSTR-2A reconciliation reports. Every invoice and bill feeds GST entries without manual data entry.",
    color: "text-rose-400",
  },
  {
    icon: LayoutGrid,
    title: "You're all set!",
    desc: "Explore freely — demo data is read-only and resets daily. Tap the raised Menu button (mobile) or use the sidebar (desktop) to jump between modules anytime.",
    color: "text-teal-400",
  },
];

interface Props {
  onDone: () => void;
}

export default function ProductTour({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-slate-800">
          <div
            className="h-1 bg-indigo-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest">
            Product Tour · {step + 1} / {STEPS.length}
          </span>
          <button onClick={onDone} className="text-slate-500 hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 pt-4 flex flex-col items-center text-center">
          <div className={`h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-5`}>
            <Icon className={`h-8 w-8 ${current.color}`} />
          </div>
          <h2 className="text-lg font-extrabold text-white mb-3">{current.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{current.desc}</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`rounded-full transition-all ${i === step ? "w-5 h-2 bg-indigo-500" : "w-2 h-2 bg-slate-700 hover:bg-slate-600"}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-all">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          <button onClick={isLast ? onDone : () => setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-900">
            {isLast ? (
              <><CheckCircle2 className="h-4 w-4" /> Start Exploring</>
            ) : (
              <>Next <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>

        <div className="px-6 pb-5 text-center">
          <button onClick={onDone} className="text-[10px] text-slate-600 hover:text-slate-400 font-mono">
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
}

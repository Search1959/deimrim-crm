import React, { useState, useEffect } from "react";
import { Plus, Award, Activity, Calendar } from "lucide-react";
import { SalesTarget, formatINR } from "../../types";

export default function TargetsPanel() {
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [period, setPeriod] = useState("July 2026");
  const [targetAmount, setTargetAmount] = useState("");
  const [achievedAmount, setAchievedAmount] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("deinrim_sales_targets");
    if (stored) {
      try { setTargets(JSON.parse(stored)); } catch (e) {}
    } else {
      const defaultT: SalesTarget[] = [
        {
          id: "tgt-1",
          period: "June 2026",
          targetAmount: 2500000,
          achievedAmount: 1850000,
          assignedTo: "Kolkata Sales Node"
        },
        {
          id: "tgt-2",
          period: "Q2 FY26",
          targetAmount: 5000000,
          achievedAmount: 3950000,
          assignedTo: "National CRM Node"
        }
      ];
      setTargets(defaultT);
      localStorage.setItem("deinrim_sales_targets", JSON.stringify(defaultT));
    }
  }, []);

  const saveTargets = (updated: SalesTarget[]) => {
    setTargets(updated);
    localStorage.setItem("deinrim_sales_targets", JSON.stringify(updated));
  };

  const handleOpenAdd = () => {
    setPeriod("July 2026");
    setTargetAmount("");
    setAchievedAmount("0");
    setAssignedTo("");
    setShowAddModal(true);
  };

  const handleSaveTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period || !targetAmount) return;

    const newT: SalesTarget = {
      id: `tgt-${Date.now()}`,
      period,
      targetAmount: parseFloat(targetAmount) || 0,
      achievedAmount: parseFloat(achievedAmount) || 0,
      assignedTo: assignedTo || "General Sales Node"
    };

    const updated = [...targets, newT];
    saveTargets(updated);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Team Sales Quotas & Progress</h3>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
        >
          <Plus className="h-3 w-3" />
          <span>Set Target</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targets.map(t => {
          const pct = Math.min(100, Math.round((t.achievedAmount / t.targetAmount) * 100)) || 0;
          return (
            <div key={t.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start border-b border-slate-800/80 pb-2">
                <div>
                  <div className="font-bold text-slate-100 font-mono text-sm">{t.period}</div>
                  <div className="text-[10px] text-slate-400 font-semibold">{t.assignedTo}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Progress</div>
                  <strong className="text-indigo-400 font-mono text-sm">{pct}%</strong>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Achieved: {formatINR(t.achievedAmount)}</span>
                  <span>Target: {formatINR(t.targetAmount)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form 
            onSubmit={handleSaveTarget}
            className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-left space-y-4 animate-scaleUp"
          >
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Set Target</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Period / Goal Quarter</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. July 2026, Q3 FY26"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Target Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Achieved (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={achievedAmount}
                    onChange={(e) => setAchievedAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono font-bold">Assigned To (Node)</label>
                <input
                  type="text"
                  placeholder="e.g. Kolkata Regional Office"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { Check, X, Calendar, AlertCircle } from "lucide-react";
import { LeaveRequest, Employee } from "../../types";

interface HRLeavePanelProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  isHRManager: boolean;
}

export default function HRLeavePanel({
  employees,
  leaveRequests,
  setLeaveRequests,
  isHRManager
}: HRLeavePanelProps) {
  
  const handleLeaveDecision = (requestId: string, decision: "approved" | "rejected") => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: decision, approvedBy: "HR Manager Node" };
      }
      return req;
    }));
    alert(`Leave request has been marked as ${decision}.`);
  };

  const pendingCount = leaveRequests.filter(l => l.status === "pending").length;

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden text-left">
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Leave Entitlement Pipeline</h3>
          <p className="text-[11px] text-slate-500 font-medium">Review and process staff leave applications and track active schedule logs.</p>
        </div>
        <span className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono uppercase">
          Pending Approvals: {pendingCount}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800/60 text-sm">
          <thead className="bg-slate-950 font-bold text-slate-300">
            <tr>
              <th className="px-5 py-3 text-left">Employee Name</th>
              <th className="px-5 py-3 text-left">Leave Type</th>
              <th className="px-5 py-3 text-left">Span Dates</th>
              <th className="px-5 py-3 text-left">Reason / Note</th>
              <th className="px-5 py-3 text-left">Approval State</th>
              <th className="px-5 py-3 text-right">Decisions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-slate-300">
            {leaveRequests.map(req => {
              const emp = employees.find(e => e.id === req.employeeId);
              return (
                <tr key={req.id} className="hover:bg-slate-900/20 transition-all">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-200">{emp?.name || "Corporate Staff"}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{emp?.employeeCode}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-xs">
                    <span className="capitalize px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono border border-slate-800">
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-slate-300">{req.startDate}</div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">thru {req.endDate}</div>
                  </td>
                  <td className="px-5 py-4 max-w-xs truncate text-xs font-medium text-slate-400" title={req.reason}>
                    {req.reason}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      req.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      req.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {req.status === "pending" && isHRManager && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLeaveDecision(req.id, "approved")}
                          className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 p-1 cursor-pointer transition-all"
                          title="Approve Leave"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleLeaveDecision(req.id, "rejected")}
                          className="rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 p-1 cursor-pointer transition-all"
                          title="Reject Leave"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {leaveRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                  No registered leave requests found in the pipeline.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

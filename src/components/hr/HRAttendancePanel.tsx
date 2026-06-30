import { toast } from "../../utils/toast";
import React, { useState } from "react";
import { Clock, UserCheck, Search, ShieldCheck } from "lucide-react";
import { Employee, Department } from "../../types";

interface HRAttendancePanelProps {
  employees: Employee[];
  departments: Department[];
}

export default function HRAttendancePanel({ employees, departments }: HRAttendancePanelProps) {
  // Simulator clock-in/out states
  const [clockInState, setClockInState] = useState<Record<string, { inTime: string; status: string }>>({
    "emp-1": { inTime: "08:31 AM", status: "present" },
    "emp-2": { inTime: "08:45 AM", status: "present" },
    "emp-3": { inTime: "09:12 AM", status: "late" },
  });

  const [simEmployeeId, setSimEmployeeId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePunchIn = () => {
    if (!simEmployeeId) { toast.error("Select an employee to punch-in"); return; }
    
    if (clockInState[simEmployeeId]) {
      toast.warning("Already Clocked In", "This employee already has an active punch-in")
      return;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setClockInState(prev => ({
      ...prev,
      [simEmployeeId]: { inTime: time, status: "present" }
    }));

    const targetEmpName = employees.find(e => e.id === simEmployeeId)?.name || "Officer";
    toast.success("Punch-In Recorded", `${targetEmpName} clocked in at ${time}`);
  };

  const handlePunchOut = () => {
    if (!simEmployeeId) { toast.error("Select an employee to punch-out"); return; }
    if (!clockInState[simEmployeeId]) { toast.error("Employee has not clocked in yet"); return; }

    setClockInState(prev => {
      const copy = { ...prev };
      delete copy[simEmployeeId];
      return copy;
    });

    const targetEmpName = employees.find(e => e.id === simEmployeeId)?.name || "Officer";
    toast.success("Punch-Out Recorded", `${targetEmpName} shift closed`);
  };

  const getStatusBadge = (status: string) => {
    if (status === "late") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  const filteredLogs = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      {/* PUNCH DESK */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Dynamic Punch Terminal</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Simulate standard office clock-ins. Select an active staff member below to authorize physical entry presence logging.
          </p>

          <div className="space-y-2 pt-2 text-xs">
            <label className="block text-slate-400 font-bold">Authorized Employee Node</label>
            <select
              value={simEmployeeId}
              onChange={(e) => setSimEmployeeId(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white font-semibold focus:outline-none"
            >
              <option value="">— Select Officer —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={handlePunchIn}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-white text-center cursor-pointer transition-all font-mono"
            >
              PUNCH IN
            </button>
            <button
              onClick={handlePunchOut}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-850 py-2.5 text-slate-400 hover:text-white text-center cursor-pointer transition-all font-mono"
            >
              PUNCH OUT
            </button>
          </div>
          <span className="block text-[10px] text-center text-slate-500 font-mono uppercase tracking-widest pt-1">
            <ShieldCheck className="h-3.5 w-3.5 inline mr-1 text-emerald-400" /> GPS & IP Authenticated Node
          </span>
        </div>
      </div>

      {/* TODAY LOGS DIRECTORY */}
      <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Roster Attendance logs</h3>
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 pl-8 pr-3 py-1 text-xs text-white focus:outline-none font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          {filteredLogs.map(emp => {
            const punch = clockInState[emp.id];
            const dept = departments.find(d => d.id === emp.departmentId);

            return (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs hover:border-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                  <UserCheck className={`h-4.5 w-4.5 shrink-0 ${punch ? "text-emerald-400" : "text-slate-500"}`} />
                  <div>
                    <strong className="text-slate-200 block font-bold">{emp.name}</strong>
                    <span className="text-[10px] text-slate-500 font-mono font-bold block">{dept?.name || "Corporate"} · {emp.employeeCode}</span>
                  </div>
                </div>
                {punch ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300 font-semibold">In at {punch.inTime} / Out at —</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${getStatusBadge(punch.status)}`}>
                      {punch.status.toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <span className="font-mono text-slate-600 italic">No entry logged</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

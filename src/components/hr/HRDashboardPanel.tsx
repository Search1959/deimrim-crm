import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, Cell, PieChart, Pie } from "recharts";
import { Users2, Calendar, Wallet, CheckCircle, Clock, AlertCircle, Building2, UserCheck } from "lucide-react";
import { Employee, LeaveRequest, Department, formatINR } from "../../types";

interface HRDashboardPanelProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  departments: Department[];
  onNavigateTab: (tab: any) => void;
  onSetRoleSuperAdmin: () => void;
}

export default function HRDashboardPanel({ 
  employees, 
  leaveRequests, 
  departments, 
  onNavigateTab,
  onSetRoleSuperAdmin
}: HRDashboardPanelProps) {
  
  // Calculate stats
  const totalEmployees = employees.length;
  const activeLeaves = leaveRequests.filter(l => l.status === "approved").length;
  const pendingLeaves = leaveRequests.filter(l => l.status === "pending").length;
  const totalSalaryCommitment = employees.reduce((sum, e) => sum + e.salary, 0);

  // Group headcount by department for bar chart
  const deptHeadcount = departments.map(dept => {
    const count = employees.filter(e => e.departmentId === dept.id).length;
    return { name: dept.name, code: dept.code, headcount: count };
  });

  // Sample data for monthly attendance trends
  const attendanceTrend = [
    { day: "Mon", rate: 98 },
    { day: "Tue", rate: 96 },
    { day: "Wed", rate: 97 },
    { day: "Thu", rate: 95 },
    { day: "Fri", rate: 94 },
  ];

  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Dynamic welcome / banner and switch back */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">HR Suite Central Console</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time statistics of staff directory, pending leave requests, attendance metrics, and payroll operations.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateTab("employees")}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Manage Workforce
          </button>
          <button
            onClick={onSetRoleSuperAdmin}
            className="px-3 py-1.5 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Admin Switcher
          </button>
        </div>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Total Staff Count</span>
            <strong className="text-base font-bold text-white font-mono block mt-0.5">{totalEmployees} Members</strong>
            <span className="text-[9px] text-indigo-400 font-bold font-mono">Active Workforce Directory</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Leave Pipeline</span>
            <strong className="text-base font-bold text-white font-mono block mt-0.5">{pendingLeaves} Pending</strong>
            <span className="text-[9px] text-amber-400 font-bold font-mono">Requires decision review</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">On Active Leave</span>
            <strong className="text-base font-bold text-white font-mono block mt-0.5">{activeLeaves} Members</strong>
            <span className="text-[9px] text-emerald-400 font-bold font-mono">Approved leave schedule</span>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-lg">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Monthly Payroll commitment</span>
            <strong className="text-base font-bold text-white font-mono block mt-0.5">{formatINR(totalSalaryCommitment)}</strong>
            <span className="text-[9px] text-rose-400 font-bold font-mono">Base salaries liability</span>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department headcount distribution */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
            Staff Distribution by Department (Headcount)
          </span>
          <div className="h-60 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptHeadcount} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: any) => [`${value} Members`, "Headcount"]}
                />
                <Bar dataKey="headcount" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {deptHeadcount.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Attendance Rate Trend */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
            Average Weekly Attendance Log Rate
          </span>
          <div className="h-60 w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(value: any) => [`${value}% Attendance`, "Rate"]}
                />
                <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#attendanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower section containing list of active leave requests or alerts */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
        <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">
          System Alerts & Actionable Requests
        </span>
        <div className="space-y-2">
          {pendingLeaves > 0 ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs font-semibold text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>You have {pendingLeaves} staff leave requests pending administrative clearance review!</span>
              </div>
              <button 
                onClick={() => onNavigateTab("leaves")} 
                className="text-amber-400 hover:text-white underline cursor-pointer"
              >
                Go Approve
              </button>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              <span>All staff leave requests are fully processed. Excellent workforce efficiency!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-2">
              <h4 className="text-[11px] text-slate-200 font-bold uppercase tracking-wider font-mono">Direct Operational Roster</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Headquarters attendance tracking is synchronized with IP-level location clock-ins. Ensure officers are checking in through the attendance terminal daily.</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-2">
              <h4 className="text-[11px] text-slate-200 font-bold uppercase tracking-wider font-mono">Tax & Remittance Advisory</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">EPF (12%) and ESIC (0.75%) calculation limits are set dynamically inside the integrated Payroll tab. Payslip sheets are formatted per standard regional auditing guidelines.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

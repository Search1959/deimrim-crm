import React, { useMemo } from "react";
import {
  Users2, Calendar, Wallet, Clock, CheckCircle, AlertCircle,
  TrendingUp, Gift, Briefcase, Target, UserCheck, PartyPopper,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Employee, LeaveRequest, Department, formatINR } from "../../types";

interface HRDashboardPanelProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  departments: Department[];
  onNavigateTab: (tab: any) => void;
  onSetRoleSuperAdmin: () => void;
}

const DEPT_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"];

export default function HRDashboardPanel({
  employees, leaveRequests, departments, onNavigateTab,
}: HRDashboardPanelProps) {
  const today = new Date().toISOString().split("T")[0];

  const totalEmployees   = employees.length;
  const pendingLeaves    = leaveRequests.filter(l => l.status === "pending").length;
  const onLeaveToday     = leaveRequests.filter(l => l.status === "approved" && l.startDate <= today && l.endDate >= today);
  const presentToday     = totalEmployees - onLeaveToday.length;
  const monthlySalary    = employees.reduce((s, e) => s + e.salary, 0);

  // Probation ending within 30 days (simulate from hire date + 90 days)
  const probationEnding = useMemo(() => employees.filter(e => {
    if (!e.joinDate) return false;
    const probEnd = new Date(e.joinDate);
    probEnd.setDate(probEnd.getDate() + 90);
    const diff = (probEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }), [employees]);

  // Birthdays / work anniversaries this month
  const thisMonth = new Date().getMonth() + 1;
  const celebrations = useMemo(() => employees.filter(e => {
    if (!e.joinDate) return false;
    const joinMonth = new Date(e.joinDate).getMonth() + 1;
    return joinMonth === thisMonth;
  }).map(e => ({ name: e.name, label: "Work Anniversary", date: e.joinDate })), [employees, thisMonth]);

  const deptHeadcount = departments.map((d, i) => ({
    name: d.name.length > 8 ? d.name.slice(0, 8) + "…" : d.name,
    count: employees.filter(e => e.departmentId === d.id).length,
    fill: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  const KPI_CARDS = [
    {
      label: "HEADCOUNT",
      value: totalEmployees,
      sub: `${probationEnding.length} on probation · ${onLeaveToday.length > 0 ? onLeaveToday.length + " serving notice" : "all confirmed"}`,
      icon: Users2, color: "text-indigo-600", bg: "bg-indigo-50",
    },
    {
      label: "PRESENT TODAY",
      value: `${presentToday} / ${totalEmployees}`,
      sub: `${onLeaveToday.length} on leave today`,
      icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50",
    },
    {
      label: "LEAVE APPROVALS",
      value: pendingLeaves,
      sub: pendingLeaves > 0 ? "waiting for a decision" : "all cleared",
      icon: Calendar, color: "text-amber-600", bg: "bg-amber-50",
    },
    {
      label: "MONTHLY SALARY COST",
      value: formatINR(monthlySalary),
      sub: "fixed pay, before incentives",
      icon: Wallet, color: "text-violet-600", bg: "bg-violet-50",
    },
    {
      label: "OPEN POSITIONS",
      value: 3,
      sub: "6 candidates in process",
      icon: Briefcase, color: "text-sky-600", bg: "bg-sky-50",
    },
    {
      label: "INCENTIVES TO APPROVE",
      value: 0,
      sub: "calculated from CRM data",
      icon: Target, color: "text-rose-600", bg: "bg-rose-50",
    },
  ];

  const QUICK_TABS = [
    { id: "employees",    label: "Employees" },
    { id: "attendance",   label: "Attendance" },
    { id: "leaves",       label: "Leave" },
    { id: "targets",      label: "Targets" },
    { id: "payroll",      label: "Payroll" },
    { id: "recruitment",  label: "Recruitment" },
    { id: "exits",        label: "Exits" },
    { id: "holidays",     label: "Holidays" },
  ];

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">HR Dashboard</h2>
        <p className="text-xs text-slate-400 mt-0.5">Live workforce, attendance, leave and payroll overview</p>
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-100 p-4 hover:border-indigo-100 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{kpi.label}</span>
              <div className={`${kpi.bg} p-1.5 rounded-lg shrink-0`}><kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} /></div>
            </div>
            <p className="text-xl font-black text-slate-900 leading-none">{kpi.value}</p>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick-nav tab bar */}
      <div className="bg-white rounded-xl border border-slate-100 px-4 py-2.5 flex items-center gap-1 flex-wrap">
        {QUICK_TABS.map(t => (
          <button key={t.id} onClick={() => onNavigateTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-1.5 border border-transparent hover:border-indigo-100">
            {t.label}
          </button>
        ))}
        <button onClick={() => onNavigateTab("employees")}
          className="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
          + New Employee
        </button>
      </div>

      {/* Main content: left 60% chart + requests, right 40% panels */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Left: Leave requests + dept chart */}
        <div className="lg:col-span-3 space-y-4">

          {/* Pending leave requests */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Leave requests waiting</h3>
              <button onClick={() => onNavigateTab("leaves")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">All leave</button>
            </div>
            {pendingLeaves === 0 ? (
              <div className="flex items-center gap-2 px-5 py-5 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                <span>No pending leave requests — everyone is confirmed.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {leaveRequests.filter(l => l.status === "pending").slice(0, 4).map(l => {
                  const emp = employees.find(e => e.id === l.employeeId);
                  const initials = emp ? emp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "??";
                  const start = l.startDate;
                  const end = l.endDate;
                  const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1);
                  return (
                    <div key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{emp?.name ?? "Unknown"} · <span className="font-normal text-slate-500">{l.leaveType ? l.leaveType.charAt(0).toUpperCase() + l.leaveType.slice(1) + " Leave" : "Leave"}</span></p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{start} – {end} · {days} day{days !== 1 ? "s" : ""}{l.reason ? ` · ${l.reason}` : ""}</p>
                      </div>
                      <button onClick={() => onNavigateTab("leaves")} className="shrink-0 text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors">Review</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Headcount by department */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Headcount by department</h3>
            {deptHeadcount.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No departments configured</p>
            ) : (
              <div className="space-y-2.5">
                {deptHeadcount.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 w-24 shrink-0 truncate">{d.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${totalEmployees > 0 ? (d.count / totalEmployees) * 100 : 0}%`, background: d.fill }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-6 text-right shrink-0">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: contextual panels */}
        <div className="lg:col-span-2 space-y-4">

          {/* On leave today */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">On leave today</h3>
            </div>
            <div className="px-4 py-3">
              {onLeaveToday.length === 0 ? (
                <p className="text-sm text-slate-400">Everyone is in today.</p>
              ) : (
                <div className="space-y-2">
                  {onLeaveToday.slice(0, 5).map(l => {
                    const emp = employees.find(e => e.id === l.employeeId);
                    return (
                      <div key={l.id} className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">
                          {emp?.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{emp?.name ?? "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{l.leaveType ?? "leave"} · until {l.endDate}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Probation ending */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Probation ending (30 days)</h3>
            </div>
            <div className="px-4 py-3">
              {probationEnding.length === 0 ? (
                <p className="text-sm text-slate-400">No probations ending soon.</p>
              ) : (
                <div className="space-y-2.5">
                  {probationEnding.map(e => {
                    const probEnd = new Date(e.joinDate!);
                    probEnd.setDate(probEnd.getDate() + 90);
                    return (
                      <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{e.name}</p>
                            <p className="text-[10px] text-slate-400">{e.designation ?? "Staff"}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600">{probEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Celebrations */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-800">Celebrations this month</h3>
            </div>
            <div className="px-4 py-3">
              {celebrations.length === 0 ? (
                <p className="text-sm text-slate-400">No anniversaries this month.</p>
              ) : (
                <div className="space-y-2.5">
                  {celebrations.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">{c.name[0]}</div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

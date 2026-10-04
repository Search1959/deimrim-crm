import React, { useState, useEffect, useCallback } from "react";
import {
  Clock, CheckCircle2, LogOut, Calendar, FileText, Wallet,
  Target, MapPin, ChevronRight, Plus, AlertCircle, TrendingUp, Building2
} from "lucide-react";
import { Employee, LeaveRequest, Department, Designation, User } from "../types";
import { toast } from "../utils/toast";

interface MyHRViewProps {
  currentUser: User;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  departments: Department[];
  designations: Designation[];
}

const HOLIDAYS = [
  { name: "Dussehra",  date: "Tue, 21 Oct" },
  { name: "Diwali",    date: "Thu, 23 Oct" },
  { name: "Christmas", date: "Thu, 25 Dec" },
  { name: "New Year",  date: "Thu, 01 Jan 2027" },
];

// Synthetic leave balance (would come from API in production)
function getLeaveBalance(empId: string, leaves: LeaveRequest[]) {
  const approved = leaves.filter(l => l.employeeId === empId && l.status === "approved");
  const used = { annual: 0, sick: 0, casual: 0 };
  approved.forEach(l => {
    const days = Math.max(1, Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / 86400000) + 1);
    if (l.leaveType === "annual")  used.annual  += days;
    if (l.leaveType === "sick")    used.sick    += days;
    if (l.leaveType === "casual")  used.casual  += days;
  });
  return {
    cl:  Math.max(0, 12 - used.casual),
    el:  Math.max(0, 15 - used.annual),
    sl:  Math.max(0, 12 - used.sick),
  };
}

// Build attendance log for this month (synthetic)
function buildAttendanceLog() {
  const today = new Date();
  const rows = [];
  for (let d = 1; d < today.getDate(); d++) {
    const dt = new Date(today.getFullYear(), today.getMonth(), d);
    const dow = dt.getDay();
    if (dow === 0 || dow === 6) { rows.push({ date: dt, status: "weekend" }); continue; }
    const r = Math.random();
    rows.push({ date: dt, status: r > 0.85 ? "absent" : r > 0.75 ? "late" : "present",
      inTime:  r > 0.85 ? "—" : r > 0.75 ? `09:${15 + Math.floor(r*100) % 30 < 10 ? "0" : ""}${15 + Math.floor(r*100) % 30} AM` : `08:${30 + Math.floor(r*100) % 25 < 10 ? "0" : ""}${30 + Math.floor(r*100) % 25} AM`,
      outTime: r > 0.85 ? "—" : `06:${Math.floor(r*60) < 10 ? "0" : ""}${Math.floor(r*60)} PM`,
    });
  }
  return rows.reverse();
}

const ATTENDANCE_LOG = buildAttendanceLog();

type Tab = "today" | "attendance" | "leave" | "payslips" | "target";

export default function MyHRView({
  currentUser, employees, leaveRequests, setLeaveRequests, departments, designations
}: MyHRViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [now, setNow]             = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [location, setLocation]   = useState<string | null>(null);

  // Leave application state
  const [showLeaveForm, setShowLeaveForm]   = useState(false);
  const [leaveType, setLeaveType]           = useState<LeaveRequest["leaveType"]>("casual");
  const [leaveStart, setLeaveStart]         = useState("");
  const [leaveEnd, setLeaveEnd]             = useState("");
  const [leaveReason, setLeaveReason]       = useState("");

  // Tick clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Find the employee record linked to the current user
  const emp = employees.find(e => e.userId === currentUser.id || e.email === currentUser.email);
  const dept = departments.find(d => d.id === emp?.departmentId);
  const desig = designations.find(d => d.id === emp?.designationId);

  const balance = getLeaveBalance(emp?.id ?? "", leaveRequests);
  const myLeaves = leaveRequests.filter(l => l.employeeId === emp?.id).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const handleCheckIn = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
      () => setLocation("Location declined")
    );
    const t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setCheckInTime(t);
    setCheckedIn(true);
    toast.success("Checked In", `Attendance recorded at ${t}`);
  }, [now]);

  const handleCheckOut = useCallback(() => {
    const t = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setCheckedIn(false);
    toast.success("Checked Out", `Shift closed at ${t}`);
  }, [now]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emp) { toast.error("Employee record not linked to your account"); return; }
    if (!leaveStart || !leaveEnd) { toast.error("Please select date range"); return; }
    const newLeave: LeaveRequest = {
      id: `lr-${Date.now()}`,
      employeeId: emp.id,
      leaveType,
      startDate: leaveStart,
      endDate:   leaveEnd,
      reason:    leaveReason,
      status:    "pending",
    };
    setLeaveRequests(prev => [newLeave, ...prev]);
    toast.success("Leave Applied", "Your request has been submitted for approval");
    setShowLeaveForm(false);
    setLeaveStart(""); setLeaveEnd(""); setLeaveReason("");
  };

  const statusColor = (s: string) =>
    s === "present" ? "text-emerald-600" : s === "late" ? "text-amber-600" : s === "weekend" ? "text-slate-400" : "text-red-600";

  const leaveStatusBadge = (s: string) =>
    s === "approved" ? "bg-emerald-50 text-emerald-700" : s === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";

  const todayStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const timeStr  = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const tabs: { id: Tab; label: string }[] = [
    { id: "today",      label: "Today"      },
    { id: "attendance", label: "Attendance" },
    { id: "leave",      label: "Leave"      },
    { id: "payslips",   label: "Payslips"   },
    { id: "target",     label: "My Target"  },
  ];

  // Payslip rows (synthetic last 6 months)
  const payslips = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    return {
      month: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      gross: emp?.salary ?? 30000,
      tds:   Math.round((emp?.salary ?? 30000) * 0.05),
      pf:    Math.round((emp?.salary ?? 30000) * 0.12),
      net:   Math.round((emp?.salary ?? 30000) * 0.83),
    };
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {/* ── Employee Banner Card ── */}
      <div data-theme="dark" className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white px-6 pt-6 pb-4 shadow">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono text-slate-400 tracking-widest uppercase mb-1">
            {emp?.employeeCode ?? "EMP-—"} · {desig?.name ?? currentUser.name.split(" ")[0]}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-white">{currentUser.name}</h1>
            <span className="text-sm text-slate-300">{todayStr.split(",")[0]}, {todayStr.split(",").slice(1).join(",").trim()}</span>
          </div>

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "THIS MONTH", value: ATTENDANCE_LOG.filter(r => r.status === "present" || r.status === "late").length, sub: "days present" },
              { label: "LEAVE LEFT", value: balance.el + balance.cl, sub: "days available" },
              { label: "DEPARTMENT", value: dept?.name?.split(" ")[0] ?? "—", sub: dept?.name ?? "—" },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white/10 rounded-xl px-3 py-3 text-center">
                <p className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">{label}</p>
                <p className="text-xl font-bold text-white mt-0.5">{value}</p>
                <p className="text-[10px] text-slate-400 truncate">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* TODAY TAB */}
        {activeTab === "today" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Check-in card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
              <p className="text-sm text-slate-500 mb-1">{todayStr}</p>
              <p className="text-4xl font-bold tracking-tight text-slate-800 mb-5">{timeStr}</p>
              {!checkedIn ? (
                <button onClick={handleCheckIn}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-semibold text-sm shadow-md transition-all">
                  <CheckCircle2 size={18} /> Check In
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium mb-3">
                    <CheckCircle2 size={15} />
                    <span>Checked in at {checkInTime}</span>
                  </div>
                  {location && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                      <MapPin size={12} /> {location}
                    </div>
                  )}
                  <button onClick={handleCheckOut}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-8 py-3 rounded-full font-semibold text-sm transition-all">
                    <LogOut size={15} /> Check Out
                  </button>
                </>
              )}
              <p className="text-xs text-slate-400 mt-4">
                {checkedIn ? "Tap Check Out when your shift ends." : "Your location may be captured with check-in."}
              </p>
            </div>

            {/* Leave balance */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Leave Balance</h3>
                <button onClick={() => { setActiveTab("leave"); setShowLeaveForm(true); }}
                  className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-0.5">
                  + Apply <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "CL left",  value: balance.cl, color: "text-indigo-600" },
                  { label: "EL left",  value: balance.el, color: "text-emerald-600" },
                  { label: "SL left",  value: balance.sl, color: "text-amber-600"  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Upcoming Holidays</h3>
              <div className="space-y-2">
                {HOLIDAYS.map(h => (
                  <div key={h.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{h.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Attendance — {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="flex gap-1 items-center"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Present</span>
                <span className="flex gap-1 items-center"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Late</span>
                <span className="flex gap-1 items-center"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Absent</span>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {ATTENDANCE_LOG.length === 0 && (
                <p className="text-center text-slate-400 py-10 text-sm">No attendance data yet for this month.</p>
              )}
              {ATTENDANCE_LOG.map((row, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 w-10">
                      {row.date.toLocaleDateString("en-IN", { day: "2-digit" })}
                    </span>
                    <span className="text-xs text-slate-400">
                      {row.date.toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                    <span className={`text-xs font-medium capitalize ${statusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </div>
                  <div className="flex gap-6 text-xs text-slate-400">
                    <span>{(row as any).inTime  ?? "—"}</span>
                    <span>{(row as any).outTime ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEAVE TAB */}
        {activeTab === "leave" && (
          <div className="space-y-4">
            {/* Leave balance strip */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-700">Leave Balance</h2>
                <button onClick={() => setShowLeaveForm(true)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                  <Plus size={13} /> Apply for Leave
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Casual Leave",  total: 12, used: 12 - balance.cl, left: balance.cl },
                  { label: "Earned Leave",  total: 15, used: 15 - balance.el, left: balance.el },
                  { label: "Sick Leave",    total: 12, used: 12 - balance.sl, left: balance.sl },
                ].map(b => (
                  <div key={b.label} className="border border-slate-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-1">{b.label}</p>
                    <p className="text-2xl font-bold text-indigo-600">{b.left}</p>
                    <p className="text-xs text-slate-400 mt-1">{b.used} used / {b.total} total</p>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.round((b.used / b.total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply form */}
            {showLeaveForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-5">
                <h3 className="font-semibold text-slate-700 mb-4">Apply for Leave</h3>
                <form onSubmit={handleApplyLeave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">Leave Type</label>
                      <select value={leaveType} onChange={e => setLeaveType(e.target.value as LeaveRequest["leaveType"])}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                        <option value="casual">Casual Leave</option>
                        <option value="annual">Earned Leave</option>
                        <option value="sick">Sick Leave</option>
                        <option value="maternity">Maternity Leave</option>
                        <option value="unpaid">Unpaid Leave</option>
                      </select>
                    </div>
                    <div />
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">From Date</label>
                      <input type="date" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} required
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1">To Date</label>
                      <input type="date" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} required
                        min={leaveStart}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Reason</label>
                    <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} rows={3}
                      placeholder="Brief reason for leave..." required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                      Submit Request
                    </button>
                    <button type="button" onClick={() => setShowLeaveForm(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Leave history */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700">Leave History</h3>
              </div>
              {myLeaves.length === 0 && (
                <p className="text-center text-slate-400 py-10 text-sm">No leave requests found.</p>
              )}
              {myLeaves.map(l => (
                <div key={l.id} className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700 capitalize">{l.leaveType.replace("_", " ")} Leave</p>
                    <p className="text-xs text-slate-400 mt-0.5">{l.startDate} → {l.endDate}</p>
                    <p className="text-xs text-slate-500 mt-0.5 italic">{l.reason}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${leaveStatusBadge(l.status)}`}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYSLIPS TAB */}
        {activeTab === "payslips" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Payslips — Last 6 Months</h2>
            </div>
            {payslips.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 rounded-lg p-2">
                    <Wallet size={16} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.month}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Gross ₹{p.gross.toLocaleString("en-IN")} · TDS ₹{p.tds.toLocaleString("en-IN")} · PF ₹{p.pf.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">₹{p.net.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-slate-400">Net Pay</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TARGET TAB */}
        {activeTab === "target" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-indigo-50 rounded-xl p-3">
                  <Target size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-700">Monthly Performance Target</h2>
                  <p className="text-xs text-slate-400">October 2026</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Revenue Target",   target: "₹5,00,000", achieved: "₹2,40,000", pct: 48, color: "bg-indigo-500" },
                  { label: "New Leads",         target: "20",         achieved: "12",         pct: 60, color: "bg-violet-500" },
                  { label: "Invoices Issued",   target: "15",         achieved: "9",          pct: 60, color: "bg-emerald-500" },
                  { label: "Attendance",        target: "25 days",    achieved: `${ATTENDANCE_LOG.filter(r => r.status !== "weekend" && r.status !== "absent").length} days`, pct: Math.round(ATTENDANCE_LOG.filter(r => r.status !== "weekend" && r.status !== "absent").length / 25 * 100), color: "bg-amber-500" },
                ].map(t => (
                  <div key={t.label} className="border border-slate-100 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2">{t.label}</p>
                    <p className="text-lg font-bold text-slate-800">{t.achieved}</p>
                    <p className="text-xs text-slate-400 mb-2">of {t.target}</p>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${t.color} rounded-full`} style={{ width: `${Math.min(100, t.pct)}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-right">{t.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Achievements this month</h3>
              <div className="space-y-2">
                {["Closed 3 deals above ₹50K", "Zero absent days this week", "9 invoices issued on time"].map(a => (
                  <div key={a} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">✓</span>
                    <span className="text-sm text-slate-600">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

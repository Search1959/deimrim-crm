import { toast } from "../utils/toast";
import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Users2, 
  Building2, 
  Clock, 
  Calendar, 
  Wallet, 
  Eye, 
  Sparkles,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Employee, LeaveRequest, Department, Designation, UserRole } from "../types";

// Import modular HR components
import HRDashboardPanel from "./hr/HRDashboardPanel";
import HREmployeesPanel from "./hr/HREmployeesPanel";
import HRDepartmentsPanel from "./hr/HRDepartmentsPanel";
import HRAttendancePanel from "./hr/HRAttendancePanel";
import HRLeavePanel from "./hr/HRLeavePanel";
import HRPayrollPanel from "./hr/HRPayrollPanel";

interface HRViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  departments: Department[];
  designations: Designation[];
  userRole: UserRole;
  companyId: string;
  onSalaryDisbursed?: (employeeId: string, employeeName: string, amount: number, month: string) => void;
}

export default function HRView({
  employees,
  setEmployees,
  leaveRequests,
  setLeaveRequests,
  departments,
  designations,
  userRole,
  companyId,
  onSalaryDisbursed,
}: HRViewProps) {
  // Local active menu subtab mapping to sidebar options
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "employees" | "departments" | "attendance" | "leaves" | "payroll"
  >("dashboard");

  const isHRManager = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.HR_MANAGER
  ].includes(userRole);

  const handleBackToSuperAdmin = () => {
    toast.info("SuperAdmin Mode", "Connected to admin control panel")
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden text-left bg-slate-950/20 text-slate-100">
      {/* Mobile tab bar */}
      <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-0 border-b border-slate-800 bg-slate-950/60 px-3 py-2">
        {[
          {id:'dashboard',label:'Dashboard'},
          {id:'employees',label:'Employees'},
          {id:'departments',label:'Departments'},
          {id:'attendance',label:'Attendance'},
          {id:'leaves',label:'Leaves'},
          {id:'payroll',label:'Payroll'}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${activeSubTab===tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>

      {/* 1. CUSTOM HR SUITE SUB-SIDEBAR (Matches Image 1 layout exactly) */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/60 flex flex-col justify-between shrink-0 font-sans hidden md:flex">
        <div className="flex flex-col">
          {/* Logo header matching 'HR Suite' branding in Image 1 */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-900">
            <div className="h-9 w-9 bg-[#f47521] rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md shadow-orange-500/10">
              HR
            </div>
            <div className="flex flex-col text-left">
              <span className="font-sans text-base font-extrabold tracking-tight text-white leading-tight">HR Suite</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Operations Console</span>
            </div>
          </div>



          {/* Custom sidebar navigation items mapped by groups */}
          <nav className="px-3 py-2 space-y-4 overflow-y-auto">
            {/* Dashboard (Ungrouped item) */}
            <div>
              <button
                onClick={() => setActiveSubTab("dashboard")}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                  activeSubTab === "dashboard"
                    ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className={`h-3.5 w-3.5 ${activeSubTab === "dashboard" ? "text-indigo-400" : "text-slate-500"}`} />
                  <span>Dashboard</span>
                </div>
                {activeSubTab === "dashboard" && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
              </button>
            </div>

            {/* Group: WORKFORCE */}
            <div className="space-y-1">
              <span className="block text-[8px] font-bold text-slate-600 tracking-widest font-mono uppercase px-2">
                WORKFORCE
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveSubTab("employees")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                    activeSubTab === "employees"
                      ? "bg-[#f47521]/10 border border-[#f47521]/30 text-orange-400"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users2 className={`h-3.5 w-3.5 ${activeSubTab === "employees" ? "text-[#f47521]" : "text-slate-500"}`} />
                    <span>Employees</span>
                  </div>
                  {activeSubTab === "employees" && <ChevronRight className="h-3 w-3 text-[#f47521]/80" />}
                </button>
                <button
                  onClick={() => setActiveSubTab("departments")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                    activeSubTab === "departments"
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className={`h-3.5 w-3.5 ${activeSubTab === "departments" ? "text-indigo-400" : "text-slate-500"}`} />
                    <span>Departments</span>
                  </div>
                  {activeSubTab === "departments" && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
                </button>
              </div>
            </div>

            {/* Group: TIME & LEAVE */}
            <div className="space-y-1">
              <span className="block text-[8px] font-bold text-slate-600 tracking-widest font-mono uppercase px-2">
                TIME & LEAVE
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveSubTab("attendance")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                    activeSubTab === "attendance"
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`h-3.5 w-3.5 ${activeSubTab === "attendance" ? "text-indigo-400" : "text-slate-500"}`} />
                    <span>Attendance</span>
                  </div>
                  {activeSubTab === "attendance" && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
                </button>
                <button
                  onClick={() => setActiveSubTab("leaves")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                    activeSubTab === "leaves"
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-3.5 w-3.5 ${activeSubTab === "leaves" ? "text-indigo-400" : "text-slate-500"}`} />
                    <span>Leave Management</span>
                  </div>
                  {activeSubTab === "leaves" && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
                </button>
              </div>
            </div>

            {/* Group: FINANCE */}
            <div className="space-y-1">
              <span className="block text-[8px] font-bold text-slate-600 tracking-widest font-mono uppercase px-2">
                FINANCE
              </span>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveSubTab("payroll")}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                    activeSubTab === "payroll"
                      ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className={`h-3.5 w-3.5 ${activeSubTab === "payroll" ? "text-indigo-400" : "text-slate-500"}`} />
                    <span>Payroll</span>
                  </div>
                  {activeSubTab === "payroll" && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Custom sidebar footer */}
        <div className="p-4 border-t border-slate-900 text-center text-slate-500 text-[10px] font-mono leading-relaxed bg-slate-950/20">
          <div>HR SUITE SYSTEM</div>
          <div className="text-indigo-400/80 font-bold uppercase tracking-wider mt-0.5">Double-Entry Linked</div>
        </div>
      </aside>

      {/* 2. DYNAMIC WORKSPACE PANEL (Right Side Panel) */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Render corresponding view */}
        {activeSubTab === "dashboard" && (
          <HRDashboardPanel 
            employees={employees}
            leaveRequests={leaveRequests}
            departments={departments}
            onNavigateTab={setActiveSubTab}
            onSetRoleSuperAdmin={handleBackToSuperAdmin}
          />
        )}

        {activeSubTab === "employees" && (
          <HREmployeesPanel 
            employees={employees}
            setEmployees={setEmployees}
            departments={departments}
            designations={designations}
          />
        )}

        {activeSubTab === "departments" && (
          <HRDepartmentsPanel 
            departments={departments}
            designations={designations}
            employees={employees}
          />
        )}

        {activeSubTab === "attendance" && (
          <HRAttendancePanel 
            employees={employees}
            departments={departments}
          />
        )}

        {activeSubTab === "leaves" && (
          <HRLeavePanel 
            employees={employees}
            leaveRequests={leaveRequests}
            setLeaveRequests={setLeaveRequests}
            isHRManager={isHRManager}
          />
        )}

        {activeSubTab === "payroll" && (
          <HRPayrollPanel
            employees={employees}
            companyId={companyId}
            onSalaryDisbursed={onSalaryDisbursed}
          />
        )}
      </main>
    </div>
  );
}

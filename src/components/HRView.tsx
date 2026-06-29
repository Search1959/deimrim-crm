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
}

export default function HRView({
  employees,
  setEmployees,
  leaveRequests,
  setLeaveRequests,
  departments,
  designations,
  userRole,
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
    alert("SuperAdmin connection established. Navigating back to the administrative control panel...");
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-900 text-slate-100">
      {/* 1. CUSTOM HR SUITE SUB-SIDEBAR (Matches Image 1 layout exactly) */}
      <aside className="w-64 border-r border-slate-800/80 bg-[#162235]/95 flex flex-col justify-between shrink-0">
        <div className="flex flex-col">
          {/* Logo header matching 'HR Suite' branding in Image 1 */}
          <div className="flex items-center gap-3 p-5 border-b border-slate-800/60">
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
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeSubTab === "dashboard"
                    ? "bg-indigo-600 text-white font-black"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="h-4.5 w-4.5" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Group: WORKFORCE */}
            <div className="space-y-1">
              <span className="block px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                WORKFORCE
              </span>
              <button
                onClick={() => setActiveSubTab("employees")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeSubTab === "employees"
                    ? "bg-[#3e2723] text-orange-400 border border-[#f47521]/20 font-black"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users2 className="h-4.5 w-4.5" />
                <span>Employees</span>
              </button>
              <button
                onClick={() => setActiveSubTab("departments")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeSubTab === "departments"
                    ? "bg-slate-800 text-white font-black"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Building2 className="h-4.5 w-4.5" />
                <span>Departments</span>
              </button>
            </div>

            {/* Group: TIME & LEAVE */}
            <div className="space-y-1">
              <span className="block px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                TIME & LEAVE
              </span>
              <button
                onClick={() => setActiveSubTab("attendance")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeSubTab === "attendance"
                    ? "bg-slate-800 text-white font-black"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="h-4.5 w-4.5" />
                <span>Attendance</span>
              </button>
              <button
                onClick={() => setActiveSubTab("leaves")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeSubTab === "leaves"
                    ? "bg-slate-800 text-white font-black"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Calendar className="h-4.5 w-4.5" />
                <span>Leave Management</span>
              </button>
            </div>

            {/* Group: FINANCE */}
            <div className="space-y-1">
              <span className="block px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                FINANCE
              </span>
              <button
                onClick={() => setActiveSubTab("payroll")}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 ${
                  activeSubTab === "payroll"
                    ? "bg-slate-800 text-white font-black"
                    : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Wallet className="h-4.5 w-4.5" />
                <span>Payroll</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Custom sidebar footer */}
        <div className="p-4 border-t border-slate-800/60 text-center text-slate-500 text-[10px] font-mono leading-relaxed bg-slate-950/20">
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
          />
        )}
      </main>
    </div>
  );
}

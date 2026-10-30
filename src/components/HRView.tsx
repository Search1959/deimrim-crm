import { toast } from "../utils/toast";
import React, { useState } from "react";
import {
  LayoutDashboard,
  Users2,
  Building2,
  Clock,
  Calendar,
  Wallet,
  ChevronRight,
  Target,
  Briefcase,
  LogOut,
  List,
  CalendarDays,
} from "lucide-react";
import { Employee, LeaveRequest, Department, Designation, UserRole, Company } from "../types";

// Import modular HR components
import HRDashboardPanel from "./hr/HRDashboardPanel";
import HREmployeesPanel from "./hr/HREmployeesPanel";
import HRDepartmentsPanel from "./hr/HRDepartmentsPanel";
import HRAttendancePanel from "./hr/HRAttendancePanel";
import HRLeavePanel from "./hr/HRLeavePanel";
import HRPayrollPanel from "./hr/HRPayrollPanel";
import HRTargetsPanel from "./hr/HRTargetsPanel";
import HRRecruitmentPanel from "./hr/HRRecruitmentPanel";
import HRExitsPanel from "./hr/HRExitsPanel";
import HRLeaveTypesPanel from "./hr/HRLeaveTypesPanel";
import HRHolidaysPanel from "./hr/HRHolidaysPanel";

interface HRViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  departments: Department[];
  designations: Designation[];
  userRole: UserRole;
  companyId: string;
  company?: Company;
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
  company,
  onSalaryDisbursed,
}: HRViewProps) {
  // Local active menu subtab mapping to sidebar options
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "employees" | "departments" | "attendance" | "leaves" | "payroll" | "targets" | "recruitment" | "exits" | "leave-types" | "holidays"
  >("dashboard");

  const isHRManager = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.HR_MANAGER
  ].includes(userRole);

  const handleBackToSuperAdmin = () => {
    toast.info("SuperAdmin Mode", "Connected to admin control panel")
  };

  const NAV_GROUPS = [
    {
      label: null,
      items: [{ id: "dashboard", label: "Dashboard", Icon: LayoutDashboard }],
    },
    {
      label: "WORKFORCE",
      items: [
        { id: "employees", label: "Employees", Icon: Users2 },
        { id: "departments", label: "Departments", Icon: Building2 },
      ],
    },
    {
      label: "TIME & LEAVE",
      items: [
        { id: "attendance", label: "Attendance", Icon: Clock },
        { id: "leaves", label: "Leave Management", Icon: Calendar },
      ],
    },
    {
      label: "PERFORMANCE",
      items: [{ id: "targets", label: "Targets & Incentives", Icon: Target }],
    },
    {
      label: "FINANCE",
      items: [{ id: "payroll", label: "Payroll", Icon: Wallet }],
    },
    {
      label: "TALENT",
      items: [
        { id: "recruitment", label: "Recruitment", Icon: Briefcase },
        { id: "exits", label: "Exits", Icon: LogOut },
      ],
    },
    {
      label: "CONFIG",
      items: [
        { id: "leave-types", label: "Leave Types", Icon: List },
        { id: "holidays", label: "Holidays", Icon: CalendarDays },
      ],
    },
  ];

  return (
    <div className="flex flex-1 h-full overflow-hidden text-left">
      {/* Mobile tab bar */}
      <div className="flex md:hidden gap-1 overflow-x-auto pb-2 border-b border-slate-100 bg-white px-3 py-2">
        {NAV_GROUPS.flatMap(g => g.items).map(tab => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${activeSubTab === tab.id ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-sidebar */}
      <aside className="w-56 border-r border-slate-100 bg-white flex flex-col shrink-0 hidden md:flex">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">HR</div>
          <div>
            <span className="text-sm font-bold text-slate-800 block leading-tight">HR Suite</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operations</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.label && (
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1">{group.label}</span>
              )}
              {group.items.map(({ id, label, Icon }) => {
                const isActive = activeSubTab === id;
                return (
                  <button key={id} onClick={() => setActiveSubTab(id as any)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer border-l-[3px] ${
                      isActive ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main workspace */}
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
            company={company}
            onSalaryDisbursed={onSalaryDisbursed}
          />
        )}

        {activeSubTab === "targets" && (
          <HRTargetsPanel employees={employees} />
        )}

        {activeSubTab === "recruitment" && (
          <HRRecruitmentPanel />
        )}

        {activeSubTab === "exits" && (
          <HRExitsPanel employees={employees} />
        )}

        {activeSubTab === "leave-types" && (
          <HRLeaveTypesPanel />
        )}

        {activeSubTab === "holidays" && (
          <HRHolidaysPanel />
        )}
      </main>
    </div>
  );
}


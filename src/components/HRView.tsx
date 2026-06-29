/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users2, 
  Calendar, 
  Wallet, 
  UserPlus, 
  Clock, 
  Check, 
  X, 
  ThumbsUp, 
  UserCheck,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Plus
} from "lucide-react";
import { Employee, LeaveRequest, Department, Designation, UserRole, formatINR } from "../types";

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
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "attendance" | "leaves">("directory");
  
  // Simulated dynamic check-in state
  const [hasClockedIn, setHasClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState("");

  // Employee CRUD states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    designationId: "",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: 5000,
  });

  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToView, setEmployeeToView] = useState<Employee | null>(null);

  // CSV Import States
  const [showImportEmployeesModal, setShowImportEmployeesModal] = useState(false);
  const [csvTextInput, setCsvTextInput] = useState("");
  const [importNotification, setImportNotification] = useState("");

  const isHRManager = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.COMPANY_ADMIN, 
    UserRole.HR_MANAGER
  ].includes(userRole);

  const handleClockIn = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHasClockedIn(true);
    setClockInTime(time);
    alert(`Attendance logged! Clock-in recorded at: ${time}`);
  };

  const handleClockOut = () => {
    setHasClockedIn(false);
    setClockInTime("");
    alert("Clock-out registered successfully.");
  };

  // Leave approval actions
  const handleLeaveDecision = (requestId: string, decision: "approved" | "rejected") => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: decision, approvedBy: "Simulated User" };
      }
      return req;
    }));
    alert(`Leave request has been marked as ${decision}.`);
  };

  // Create Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name) return;

    const dept = departments.find(d => d.id === newEmployee.departmentId) || departments[0];
    const deptPrefix = dept ? dept.code.slice(0, 3).toUpperCase() : "EMP";
    const employeeCode = `${deptPrefix}-2026-${employees.length + 101}`;

    const emp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode,
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      departmentId: newEmployee.departmentId || departments[0]?.id || "dept-it",
      designationId: newEmployee.designationId || designations[0]?.id || "des-se",
      joiningDate: newEmployee.joiningDate,
      salary: Number(newEmployee.salary),
      status: "active",
    };

    setEmployees(prev => [emp, ...prev]);
    setNewEmployee({
      name: "",
      email: "",
      phone: "",
      departmentId: "",
      designationId: "",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: 5000,
    });
    setShowAddEmployee(false);
    alert("Staff record saved and profile registered.");
  };

  // Save Employee edits
  const handleSaveEmployeeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeToEdit) return;

    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeToEdit.id) {
        return {
          ...emp,
          name: employeeToEdit.name,
          email: employeeToEdit.email,
          phone: employeeToEdit.phone,
          departmentId: employeeToEdit.departmentId,
          designationId: employeeToEdit.designationId,
          joiningDate: employeeToEdit.joiningDate,
          salary: Number(employeeToEdit.salary),
          status: employeeToEdit.status,
        };
      }
      return emp;
    }));
    setEmployeeToEdit(null);
    alert("Employee record updated successfully.");
  };

  // Delete Employee
  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete employee "${name}"?`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  // Export Staff Directory to CSV
  const handleExportEmployeesCSV = () => {
    const headers = ["ID", "Employee Code", "Name", "Email", "Phone", "Department", "Designation", "Joining Date", "Monthly Salary", "Status"];
    const csvRows = [headers.join(",")];
    employees.forEach(emp => {
      const dept = departments.find(d => d.id === emp.departmentId)?.name || "N/A";
      const des = designations.find(d => d.id === emp.designationId)?.name || "N/A";
      const row = [emp.id, emp.employeeCode, emp.name, emp.email, emp.phone, dept, des, emp.joiningDate, emp.salary, emp.status].map(val => `"${String(val).replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });
    triggerCsvDownload(csvRows.join("\n"), `staff_directory_${Date.now()}.csv`);
  };

  const triggerCsvDownload = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load Sample Employee CSV Template
  const handleLoadSampleEmployeesCSV = () => {
    const sample = `name,email,phone,departmentId,designationId,joiningDate,salary
Richard Hendriks,richard@deinrim.in,+1 (650) 555-0143,dept-it,des-se,2026-01-10,8500
Dinesh Chugtai,dinesh@deinrim.in,+1 (650) 555-0155,dept-it,des-se,2026-02-15,7500
Monica Hall,monica@deinrim.in,+1 (415) 555-0188,dept-hr,des-hr,2026-03-01,9000`;
    setCsvTextInput(sample);
  };

  // Parse and Import Employee CSV
  const handleImportEmployeesCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvTextInput.trim()) return alert("Please enter CSV content");

    const lines = csvTextInput.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return alert("CSV must contain a header row");

    let count = 0;
    const newEmps: Employee[] = [];
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 1) {
        const [name, email, phone, deptId, desId, joining, salary] = cols;
        const dept = departments.find(d => d.id === deptId) || departments[0];
        const deptPrefix = dept ? dept.code.slice(0, 3).toUpperCase() : "EMP";
        const employeeCode = `${deptPrefix}-IMP-${employees.length + count + 1}`;

        newEmps.push({
          id: `emp-imp-${Date.now()}-${count}`,
          employeeCode,
          name: name || "Imported Staff",
          email: email || "staff@deinrim.in",
          phone: phone || "N/A",
          departmentId: deptId || departments[0]?.id || "dept-it",
          designationId: desId || designations[0]?.id || "des-se",
          joiningDate: joining || new Date().toISOString().split("T")[0],
          salary: parseFloat(salary) || 4500,
          status: "active",
        });
        count++;
      }
    });

    if (newEmps.length > 0) {
      setEmployees(prev => [...newEmps, ...prev]);
      setImportNotification(`Successfully parsed and added ${count} staff directory profiles!`);
      setTimeout(() => {
        setImportNotification("");
        setShowImportEmployeesModal(false);
        setCsvTextInput("");
      }, 2500);
    }
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Title & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">HR Management Desk</h1>
          <p className="text-sm text-slate-400 mt-1">Nurture workforce directories, process leave workflows, and review dynamic employee attendance logs.</p>
        </div>

        {/* HR KPI stats */}
        <div className="flex gap-4 self-start bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total Employees</span>
            <div className="text-base font-bold text-white font-mono mt-1">{employees.length} Members</div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Active Leaves</span>
            <div className="text-base font-bold text-indigo-400 font-mono mt-1">
              {leaveRequests.filter(l => l.status === "approved").length} Approved
            </div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Monthly Salary Commitment</span>
            <div className="text-base font-bold text-rose-400 font-mono mt-1">
              {formatINR(employees.reduce((sum, e) => sum + e.salary, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs switch panel */}
      <div className="flex bg-slate-900 p-1 rounded-lg self-start flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab("directory")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "directory" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Staff Directory
        </button>
        <button
          onClick={() => setActiveSubTab("attendance")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "attendance" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Attendance Center
        </button>
        <button
          onClick={() => setActiveSubTab("leaves")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "leaves" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Leave Management ({leaveRequests.filter(l => l.status === "pending").length})
        </button>
      </div>

      {/* SUB-TAB: STAFF DIRECTORY */}
      {activeSubTab === "directory" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-300 font-mono">Workforce Profiles Registry</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddEmployee(!showAddEmployee)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Employee</span>
              </button>
              <button
                onClick={() => setShowImportEmployeesModal(true)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Import Staff</span>
              </button>
              <button
                onClick={handleExportEmployeesCSV}
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ADD EMPLOYEE FORM */}
          {showAddEmployee && (
            <form onSubmit={handleCreateEmployee} className="bg-slate-950 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3 border-b border-slate-800 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-sm text-white font-mono">Register New Staff Profile</h4>
                <button type="button" onClick={() => setShowAddEmployee(false)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Employee Name</label>
                <input
                  type="text"
                  required
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                <input
                  type="text"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Department</label>
                <select
                  value={newEmployee.departmentId}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Designation</label>
                <select
                  value={newEmployee.designationId}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, designationId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                >
                  <option value="">-- Choose Designation --</option>
                  {designations.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Joining Date</label>
                <input
                  type="date"
                  value={newEmployee.joiningDate}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Monthly Salary (₹)</label>
                <input
                  type="number"
                  value={newEmployee.salary}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, salary: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                />
              </div>
              <div className="md:col-span-3 text-right">
                <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                  Save Staff Record
                </button>
              </div>
            </form>
          )}

          {/* EDIT EMPLOYEE MODAL */}
          {employeeToEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <form onSubmit={handleSaveEmployeeEdit} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white font-mono">Edit Staff Record: {employeeToEdit.name}</h4>
                  <button type="button" onClick={() => setEmployeeToEdit(null)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Employee Name</label>
                    <input
                      type="text"
                      required
                      value={employeeToEdit.name}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email Address</label>
                    <input
                      type="email"
                      required
                      value={employeeToEdit.email}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                    <input
                      type="text"
                      value={employeeToEdit.phone}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={employeeToEdit.salary}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, salary: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Department</label>
                    <select
                      value={employeeToEdit.departmentId}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, departmentId: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Designation</label>
                    <select
                      value={employeeToEdit.designationId}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, designationId: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                    >
                      {designations.map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Joining Date</label>
                    <input
                      type="date"
                      value={employeeToEdit.joiningDate}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, joiningDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Status</label>
                    <select
                      value={employeeToEdit.status}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, status: e.target.value as Employee["status"] })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-hidden font-semibold"
                    >
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEmployeeToEdit(null)}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW EMPLOYEE PROFILE DETAIL MODAL */}
          {employeeToView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
                <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                  <h4 className="font-bold text-base text-white font-mono flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-indigo-400" />
                    <span>Staff Member Profile specifications</span>
                  </h4>
                  <button onClick={() => setEmployeeToView(null)} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-3 font-sans text-sm">
                  <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                    <div className="h-12 w-12 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-lg border border-indigo-500/20">
                      {employeeToView.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{employeeToView.name}</h4>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">{employeeToView.employeeCode}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800/60 space-y-2 text-slate-300">
                    <div><strong>Department:</strong> {departments.find(d => d.id === employeeToView.departmentId)?.name || "Corporate"}</div>
                    <div><strong>Designation:</strong> {designations.find(d => d.id === employeeToView.designationId)?.name || "Staff Member"}</div>
                    <div><strong>Email:</strong> <span className="font-mono text-indigo-400">{employeeToView.email}</span></div>
                    <div><strong>Phone:</strong> {employeeToView.phone}</div>
                    <div><strong>Joining Date:</strong> {employeeToView.joiningDate}</div>
                    <div><strong>Monthly Salary:</strong> {formatINR(employeeToView.salary)}</div>
                    <div><strong>Status:</strong> <span className="capitalize">{employeeToView.status}</span></div>
                  </div>
                </div>
                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setEmployeeToView(null)}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMPLOYEES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {employees.map(emp => {
              const dept = departments.find(d => d.id === emp.departmentId);
              const des = designations.find(d => d.id === emp.designationId);

              return (
                <div key={emp.id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xs relative hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-sm border border-indigo-500/20">
                      {emp.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm leading-tight">{emp.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{emp.employeeCode}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-b border-slate-800/60 py-3">
                    <div>Department: <strong className="text-slate-300 font-semibold">{dept?.name || "Corporate"}</strong></div>
                    <div>Designation: <span className="text-slate-300 font-medium">{des?.name}</span></div>
                    <div>Email: <span className="font-mono text-indigo-400 font-medium text-[11px]">{emp.email}</span></div>
                    <div>Joining: <span className="text-slate-300 font-medium">{emp.joiningDate}</span></div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Monthly Salary</span>
                    <strong className="text-slate-200 font-mono font-extrabold">{formatINR(emp.salary)}</strong>
                  </div>

                  <div className="flex justify-end gap-1 pt-2 border-t border-slate-800/40">
                    <button
                      onClick={() => setEmployeeToView(emp)}
                      className="rounded p-1 bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
                      title="View Profile Detail"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEmployeeToEdit(emp)}
                      className="rounded p-1 bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: ATTENDANCE TRACKER */}
      {activeSubTab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Punch/Clock desk */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Clock className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white font-mono">Dynamic Attendance Punch Desk</h3>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Simulate standard workplace logging. Clock-in dynamically to register on-site presence for the current simulation day.
              </p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-3 my-4">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block font-mono">Simulation State</span>
              
              {hasClockedIn ? (
                <>
                  <div className="text-sm font-bold text-emerald-400">Present (Active)</div>
                  <div className="text-xs text-slate-400 font-mono">In at: {clockInTime}</div>
                  <button
                    onClick={handleClockOut}
                    className="w-full rounded-lg bg-red-650/20 text-red-400 border border-red-500/20 hover:bg-red-600/30 py-2.5 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Punch Out (Close Shift)
                  </button>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-slate-500 font-mono">Absent / Idle</div>
                  <p className="text-[11px] text-slate-500 leading-none">No active shift registered</p>
                  <button
                    onClick={handleClockIn}
                    className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Punch In (Open Shift)
                  </button>
                </>
              )}
            </div>

            <p className="text-[10px] text-slate-500 leading-normal text-center font-mono uppercase">
              DEINRIM row level GPS authentication active
            </p>
          </div>

          {/* Current Day logs directory */}
          <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2.5 font-mono">Staff Today Duty Log</h3>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <strong className="text-slate-200 font-bold font-sans">Sarah Jenkins (OPS Admin)</strong>
                </div>
                <span className="font-mono text-slate-400">In at 08:31 AM / Out at --</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <strong className="text-slate-200 font-bold font-sans">Marcus Vance (Purchasing)</strong>
                </div>
                <span className="font-mono text-slate-400">In at 08:45 AM / Out at --</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <strong className="text-slate-200 font-bold font-sans">Harold Peters (HR)</strong>
                </div>
                <span className="font-mono text-slate-400">In at 09:12 AM (Late) / Out at --</span>
              </div>

              {hasClockedIn && (
                <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                    <strong className="text-indigo-200 font-bold font-sans">Alex Mercer (Active Simulator)</strong>
                  </div>
                  <span className="font-mono text-indigo-400 font-semibold">In at {clockInTime} / Out at --</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: LEAVE PLANNER MANAGER */}
      {activeSubTab === "leaves" && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs text-left">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Leave Entitlement Pipeline</h3>
            <span className="text-xs text-slate-500 font-semibold uppercase font-mono">Pending approvals: {leaveRequests.filter(l => l.status === "pending").length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950 font-semibold text-slate-300">
                <tr>
                  <th className="px-5 py-3 text-left">Employee Name</th>
                  <th className="px-5 py-3 text-left">Leave Type</th>
                  <th className="px-5 py-3 text-left">Span Dates</th>
                  <th className="px-5 py-3 text-left">Reason / Note</th>
                  <th className="px-5 py-3 text-left">Approval State</th>
                  <th className="px-5 py-3 text-right">Decisions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {leaveRequests.map(req => {
                  const emp = employees.find(e => e.id === req.employeeId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-200">{emp?.name || "Corporate Staff"}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp?.employeeCode}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                          {req.leaveType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-300">{req.startDate}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">thru {req.endDate}</div>
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-xs font-medium text-slate-400" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
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
                              className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-550/20 p-1"
                              title="Approve Leave"
                            >
                              <Check className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleLeaveDecision(req.id, "rejected")}
                              className="rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-550/20 p-1"
                              title="Reject Leave"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* IMPORT EMPLOYEES MODAL */}
      {showImportEmployeesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-1">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Employee Directories</span>
              </h4>
              <button onClick={() => setShowImportEmployeesModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotification && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotification}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 font-mono">Format:</span>
              <code className="block bg-slate-950 p-1.5 rounded text-indigo-300 overflow-x-auto text-[10px]">
                name,email,phone,departmentId,designationId,joiningDate,salary
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Staff CSV</span>
              <button onClick={handleLoadSampleEmployeesCSV} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Template
              </button>
            </div>
            <textarea
              rows={6}
              value={csvTextInput}
              onChange={(e) => setCsvTextInput(e.target.value)}
              placeholder="name,email,phone,departmentId,designationId,joiningDate,salary"
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-hidden"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowImportEmployeesModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button onClick={handleImportEmployeesCSV} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-colors">
                Import Staff Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

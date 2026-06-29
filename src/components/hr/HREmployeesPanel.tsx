import React, { useState } from "react";
import { 
  Users2, 
  UserPlus, 
  Check, 
  X, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload, 
  Plus,
  Mail,
  Phone,
  Search,
  Filter
} from "lucide-react";
import { Employee, Department, Designation, formatINR } from "../../types";

interface HREmployeesPanelProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  departments: Department[];
  designations: Designation[];
}

export default function HREmployeesPanel({
  employees,
  setEmployees,
  departments,
  designations
}: HREmployeesPanelProps) {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Detailed fields matching Image 2 exactly
  const initialFormState = {
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    departmentId: "",
    designationId: "",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: 0,
    // Bank Details
    bankAccountNumber: "",
    bankIfsc: "",
    bankName: "",
    // Emergency Contact
    emergencyName: "",
    emergencyPhone: "",
    emergencyAddress: ""
  };

  const [form, setForm] = useState(initialFormState);
  const [employeeToEdit, setEmployeeToEdit] = useState<any | null>(null);
  const [employeeToView, setEmployeeToView] = useState<any | null>(null);

  // CSV Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importNotice, setImportNotice] = useState("");

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert("Name and Email are required fields.");
      return;
    }

    const dept = departments.find(d => d.id === form.departmentId) || departments[0];
    const deptPrefix = dept ? dept.code.slice(0, 3).toUpperCase() : "EMP";
    const employeeCode = `${deptPrefix}-2026-${employees.length + 101}`;

    const emp: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode,
      name: form.name,
      email: form.email,
      phone: form.phone,
      departmentId: form.departmentId || departments[0]?.id || "dept-it",
      designationId: form.designationId || designations[0]?.id || "des-se",
      joiningDate: form.joiningDate,
      salary: Number(form.salary),
      status: "active",
      // Custom augmented fields
      ...({
        dob: form.dob,
        gender: form.gender,
        bankAccountNumber: form.bankAccountNumber,
        bankIfsc: form.bankIfsc,
        bankName: form.bankName,
        emergencyName: form.emergencyName,
        emergencyPhone: form.emergencyPhone,
        emergencyAddress: form.emergencyAddress
      } as any)
    };

    setEmployees(prev => [emp, ...prev]);
    setForm(initialFormState);
    setShowAddEmployee(false);
    alert(`Successfully registered profile for ${emp.name}!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
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
          // Custom properties
          dob: employeeToEdit.dob,
          gender: employeeToEdit.gender,
          bankAccountNumber: employeeToEdit.bankAccountNumber,
          bankIfsc: employeeToEdit.bankIfsc,
          bankName: employeeToEdit.bankName,
          emergencyName: employeeToEdit.emergencyName,
          emergencyPhone: employeeToEdit.emergencyPhone,
          emergencyAddress: employeeToEdit.emergencyAddress
        } as any;
      }
      return emp;
    }));

    setEmployeeToEdit(null);
    alert("Employee record updated successfully.");
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete employee "${name}"?`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "ID", "Employee Code", "Name", "Email", "Phone", "DOB", "Gender", 
      "Department", "Designation", "Joining Date", "Monthly Salary", "Status",
      "Bank Account No", "Bank IFSC", "Bank Name", "Emergency Contact Name", "Emergency Contact Phone"
    ];
    
    const csvRows = [headers.join(",")];
    employees.forEach(emp => {
      const dept = departments.find(d => d.id === emp.departmentId)?.name || "N/A";
      const des = designations.find(d => d.id === emp.designationId)?.name || "N/A";
      const custom = (emp as any);
      const row = [
        emp.id, emp.employeeCode, emp.name, emp.email, emp.phone, custom.dob || "", custom.gender || "",
        dept, des, emp.joiningDate, emp.salary, emp.status,
        custom.bankAccountNumber || "", custom.bankIfsc || "", custom.bankName || "",
        custom.emergencyName || "", custom.emergencyPhone || ""
      ].map(val => `"${String(val || "").replace(/"/g, '""')}"`);
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `staff_directory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return alert("Please paste or type CSV data");

    const lines = csvText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return alert("CSV must contain a header and at least one data row");

    let count = 0;
    const newEmps: Employee[] = [];
    
    // Header format: name,email,phone,departmentId,designationId,joiningDate,salary,dob,gender,bankAccountNumber,bankIfsc,bankName,emergencyName,emergencyPhone,emergencyAddress
    lines.slice(1).forEach(line => {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      if (cols.length >= 2) {
        const [
          name, email, phone, deptId, desId, joining, salary, dob, gender, 
          bankAccountNumber, bankIfsc, bankName, emergencyName, emergencyPhone, emergencyAddress
        ] = cols;

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
          ...({
            dob: dob || "",
            gender: gender || "",
            bankAccountNumber: bankAccountNumber || "",
            bankIfsc: bankIfsc || "",
            bankName: bankName || "",
            emergencyName: emergencyName || "",
            emergencyPhone: emergencyPhone || "",
            emergencyAddress: emergencyAddress || ""
          } as any)
        });
        count++;
      }
    });

    if (newEmps.length > 0) {
      setEmployees(prev => [...newEmps, ...prev]);
      setImportNotice(`Successfully imported ${count} staff records!`);
      setTimeout(() => {
        setImportNotice("");
        setShowImportModal(false);
        setCsvText("");
      }, 2000);
    }
  };

  const loadImportSample = () => {
    setCsvText(`name,email,phone,departmentId,designationId,joiningDate,salary,dob,gender,bankAccountNumber,bankIfsc,bankName,emergencyName,emergencyPhone,emergencyAddress
Peter Gregory,peter@raviga.com,+1 (415) 555-0101,dept-it,des-se,2026-04-12,25000,1975-08-15,Male,1234567890,SBIN0001234,State Bank,Monica,9876543210,Silicon Valley Drive`);
  };

  // Filtering Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesQuery = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "" || emp.departmentId === deptFilter;
    return matchesQuery && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-slate-300 font-mono">Workforce Profiles Registry</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowAddEmployee(!showAddEmployee)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-slate-400" />
            <span>Import Staff</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ADD EMPLOYEE FORM: Exactly matches fields in Image 2 */}
      {showAddEmployee && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Add Employee</span>
            </h3>
            <button 
              type="button" 
              onClick={() => setShowAddEmployee(false)} 
              className="p-1 text-slate-400 hover:text-white rounded-md bg-slate-900 border border-slate-800 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleCreateEmployee} className="p-6 space-y-6 text-left">
            {/* Base Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Employee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter employee full name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="Enter contact number"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm(prev => ({ ...prev, dob: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Department</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm(prev => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">— Select —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Designation</label>
                <select
                  value={form.designationId}
                  onChange={(e) => setForm(prev => ({ ...prev, designationId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">— Select —</option>
                  {designations.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Date of Joining</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => setForm(prev => ({ ...prev, joiningDate: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Basic Salary (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.salary || ""}
                  onChange={(e) => setForm(prev => ({ ...prev, salary: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* BANK DETAILS */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest font-mono">BANK DETAILS</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="Enter bank account number"
                    value={form.bankAccountNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="Enter bank IFSC branch code"
                    value={form.bankIfsc}
                    onChange={(e) => setForm(prev => ({ ...prev, bankIfsc: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Enter commercial bank name"
                    value={form.bankName}
                    onChange={(e) => setForm(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* EMERGENCY CONTACT */}
            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest font-mono">EMERGENCY CONTACT</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    placeholder="Contact person's name"
                    value={form.emergencyName}
                    onChange={(e) => setForm(prev => ({ ...prev, emergencyName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="Contact person's phone number"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Address</label>
                  <textarea
                    rows={2}
                    placeholder="Residential address details"
                    value={form.emergencyAddress}
                    onChange={(e) => setForm(prev => ({ ...prev, emergencyAddress: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowAddEmployee(false)}
                className="px-4 py-2 border border-slate-800 bg-slate-900 hover:bg-slate-850 rounded-lg text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                Save Staff Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND FILTERING PANEL */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Employee Code, Name, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* EMPLOYEES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const dept = departments.find(d => d.id === emp.departmentId);
          const des = designations.find(d => d.id === emp.designationId);

          return (
            <div key={emp.id} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 font-bold text-sm border border-indigo-500/20">
                  {emp.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-200 text-sm leading-tight">{emp.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">{emp.employeeCode}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400 border-t border-b border-slate-800/50 py-3 text-left">
                <div>Department: <strong className="text-slate-300 font-semibold">{dept?.name || "Corporate"}</strong></div>
                <div>Designation: <span className="text-slate-300 font-medium">{des?.name || "N/A"}</span></div>
                <div>Email: <span className="font-mono text-indigo-400 font-semibold text-[11px]">{emp.email}</span></div>
                <div>Phone: <span className="text-slate-300 font-medium">{emp.phone || "N/A"}</span></div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono">Monthly Salary</span>
                <strong className="text-slate-200 font-mono font-extrabold">{formatINR(emp.salary)}</strong>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                  emp.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  emp.status === "on_leave" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {emp.status.replace("_", " ")}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEmployeeToView(emp)}
                    className="rounded p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                    title="View Profile Specification"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEmployeeToEdit(emp)}
                    className="rounded p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                    title="Edit Profile"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                    className="rounded p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                    title="Delete Employee"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs">
            No matching employee records found in the registry.
          </div>
        )}
      </div>

      {/* VIEW EMPLOYEE DETAIL MODAL */}
      {employeeToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-2">
                <Users2 className="h-5 w-5 text-indigo-400" />
                <span>Employee Profile Sheet</span>
              </h4>
              <button 
                onClick={() => setEmployeeToView(null)} 
                className="p-1 text-slate-400 hover:text-white rounded-md bg-slate-900 border border-slate-850 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              {/* Header profile card */}
              <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800/80">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 font-extrabold text-xl border border-indigo-500/20">
                  {employeeToView.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-lg leading-tight">{employeeToView.name}</h4>
                  <span className="text-xs font-mono text-slate-400 font-bold block mt-1">{employeeToView.employeeCode}</span>
                </div>
              </div>

              {/* Base Details info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800/80">
                <div><strong>Email:</strong> <span className="font-mono text-indigo-400 block mt-0.5">{employeeToView.email}</span></div>
                <div><strong>Phone:</strong> <span className="text-slate-200 block mt-0.5">{employeeToView.phone || "—"}</span></div>
                <div><strong>DOB:</strong> <span className="text-slate-200 block mt-0.5 font-mono">{employeeToView.dob || "—"}</span></div>
                <div><strong>Gender:</strong> <span className="text-slate-200 block mt-0.5">{employeeToView.gender || "—"}</span></div>
                <div><strong>Department:</strong> <span className="text-slate-200 block mt-0.5 font-semibold">{departments.find(d => d.id === employeeToView.departmentId)?.name || "—"}</span></div>
                <div><strong>Designation:</strong> <span className="text-slate-200 block mt-0.5">{designations.find(d => d.id === employeeToView.designationId)?.name || "—"}</span></div>
                <div><strong>Joining Date:</strong> <span className="text-slate-200 block mt-0.5 font-mono">{employeeToView.joiningDate}</span></div>
                <div><strong>Basic Salary:</strong> <span className="text-slate-200 block mt-0.5 font-mono font-bold text-indigo-400">{formatINR(employeeToView.salary)}</span></div>
              </div>

              {/* Bank accounts view */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
                <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">BANK DETAILS</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div><strong className="text-slate-400">Account Number:</strong> <span className="font-mono text-slate-200 block mt-0.5">{employeeToView.bankAccountNumber || "—"}</span></div>
                  <div><strong className="text-slate-400">IFSC Code:</strong> <span className="font-mono text-slate-200 block mt-0.5 uppercase">{employeeToView.bankIfsc || "—"}</span></div>
                  <div className="md:col-span-2"><strong className="text-slate-400">Bank Name:</strong> <span className="text-slate-200 block mt-0.5">{employeeToView.bankName || "—"}</span></div>
                </div>
              </div>

              {/* Emergency Contact view */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
                <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">EMERGENCY CONTACT</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div><strong className="text-slate-400">Contact Person Name:</strong> <span className="text-slate-200 block mt-0.5">{employeeToView.emergencyName || "—"}</span></div>
                  <div><strong className="text-slate-400">Phone:</strong> <span className="text-slate-200 block mt-0.5">{employeeToView.emergencyPhone || "—"}</span></div>
                  <div className="md:col-span-2"><strong className="text-slate-400">Address:</strong> <span className="text-slate-200 block mt-0.5 leading-relaxed">{employeeToView.emergencyAddress || "—"}</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setEmployeeToView(null)}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Close Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {employeeToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono">Edit Staff: {employeeToEdit.name}</h4>
              <button 
                type="button" 
                onClick={() => setEmployeeToEdit(null)} 
                className="p-1 text-slate-400 hover:text-white rounded-md bg-slate-900 border border-slate-850 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 mb-1">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={employeeToEdit.name}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={employeeToEdit.email}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={employeeToEdit.phone || ""}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={employeeToEdit.dob || ""}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, dob: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Gender</label>
                  <select
                    value={employeeToEdit.gender || ""}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, gender: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <select
                    value={employeeToEdit.departmentId}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, departmentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Designation</label>
                  <select
                    value={employeeToEdit.designationId}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, designationId: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  >
                    {designations.map(ds => (
                      <option key={ds.id} value={ds.id}>{ds.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={employeeToEdit.salary}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, salary: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={employeeToEdit.joiningDate}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, joiningDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Employee Status</label>
                  <select
                    value={employeeToEdit.status}
                    onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>

              {/* Edit bank info */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">BANK DETAILS</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={employeeToEdit.bankAccountNumber || ""}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, bankAccountNumber: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={employeeToEdit.bankIfsc || ""}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, bankIfsc: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none font-mono uppercase"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={employeeToEdit.bankName || ""}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, bankName: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Edit emergency contact */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <span className="block text-[10px] text-indigo-400 uppercase tracking-widest font-mono font-bold">EMERGENCY CONTACT</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={employeeToEdit.emergencyName || ""}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, emergencyName: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={employeeToEdit.emergencyPhone || ""}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, emergencyPhone: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1">Address</label>
                    <textarea
                      rows={2}
                      value={employeeToEdit.emergencyAddress || ""}
                      onChange={(e) => setEmployeeToEdit({ ...employeeToEdit, emergencyAddress: e.target.value })}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-white focus:outline-none"
                    />
                  </div>
                </div>
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
              <button type="submit" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* IMPORT EMPLOYEES MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-scaleUp text-left space-y-4">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-base text-white font-mono flex items-center gap-2">
                <Upload className="h-4 w-4 text-indigo-400" />
                <span>Bulk Import Staff Profiles</span>
              </h4>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {importNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                {importNotice}
              </div>
            )}
            <div className="text-xs text-slate-400 space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-slate-300 font-mono">Header fields layout:</span>
              <code className="block bg-slate-950 p-2 rounded text-indigo-300 overflow-x-auto text-[10px] leading-relaxed">
                name,email,phone,departmentId,designationId,joiningDate,salary,dob,gender,bankAccountNumber,bankIfsc,bankName,emergencyName,emergencyPhone,emergencyAddress
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Paste Staff CSV Rows</span>
              <button onClick={loadImportSample} className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold" type="button">
                Load Sample Record
              </button>
            </div>
            <textarea
              rows={6}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste comma-separated employee text here..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-mono focus:outline-none"
            />
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800 font-bold">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button onClick={handleImportCSV} className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer">
                Import Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

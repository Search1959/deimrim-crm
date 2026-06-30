import { toast } from "../../utils/toast";
import React, { useState } from "react";
import { Plus, Building2, Network, Tag, Trash2, Edit2, X } from "lucide-react";
import { Department, Designation, Employee } from "../../types";

interface HRDepartmentsPanelProps {
  departments: Department[];
  designations: Designation[];
  employees: Employee[];
}

export default function HRDepartmentsPanel({
  departments,
  designations,
  employees
}: HRDepartmentsPanelProps) {
  const [depts, setDepts] = useState<Department[]>(departments);
  const [desigs, setDesigs] = useState<Designation[]>(designations);

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", code: "" });

  const [showAddDesig, setShowAddDesig] = useState(false);
  const [newDesig, setNewDesig] = useState({ name: "" });

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.name || !newDept.code) return;

    const dept: Department = {
      id: `dept-${Date.now()}`,
      name: newDept.name,
      code: newDept.code.toUpperCase()
    };

    setDepts(prev => [...prev, dept]);
    setNewDept({ name: "", code: "" });
    setShowAddDept(false);
    toast.success("Department Created", `${dept.name} added successfully`);
  };

  const handleCreateDesig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesig.name) return;

    const des: Designation = {
      id: `des-${Date.now()}`,
      name: newDesig.name
    };

    setDesigs(prev => [...prev, des]);
    setNewDesig({ name: "" });
    setShowAddDesig(false);
    toast.success("Designation Created", `${des.name} added successfully`);
  };

  const handleDeleteDept = (id: string, name: string) => {
    const deptEmployees = employees.filter(e => e.departmentId === id);
    if (deptEmployees.length > 0) {
      toast.warning("Cannot Delete", `"${name}" has ${deptEmployees.length} employee(s). Reassign them first`);
      return;
    }
    if (confirm(`Are you sure you want to remove the department "${name}"?`)) {
      setDepts(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleDeleteDesig = (id: string, name: string) => {
    const desEmployees = employees.filter(e => e.designationId === id);
    if (desEmployees.length > 0) {
      toast.warning("Cannot Delete", `"${name}" is assigned to ${desEmployees.length} employee(s)`);
      return;
    }
    if (confirm(`Are you sure you want to remove the designation "${name}"?`)) {
      setDesigs(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
      {/* DEPARTMENTS CARD */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Operational Departments</h3>
          </div>
          <button
            onClick={() => setShowAddDept(!showAddDept)}
            className="flex items-center gap-1 bg-indigo-650/20 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>New Dept</span>
          </button>
        </div>

        {showAddDept && (
          <form onSubmit={handleCreateDept} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-indigo-400 font-bold uppercase font-mono tracking-widest">Create Department</span>
              <button type="button" onClick={() => setShowAddDept(false)} className="text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 mb-1">Dept Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourcing"
                  value={newDept.name}
                  onChange={(e) => setNewDept(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Dept Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SRC"
                  value={newDept.code}
                  onChange={(e) => setNewDept(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-white focus:outline-none font-mono uppercase"
                />
              </div>
            </div>
            <div className="text-right">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded px-3 py-1 text-xs font-bold transition-all cursor-pointer">
                Save Department
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {depts.map(dept => {
            const headcount = employees.filter(e => e.departmentId === dept.id).length;
            return (
              <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs hover:border-slate-800 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 flex items-center justify-center rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
                    {dept.code}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{dept.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono block">ID: {dept.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                    {headcount} Officers
                  </span>
                  <button
                    onClick={() => handleDeleteDept(dept.id, dept.name)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                    title="Remove Department"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DESIGNATIONS CARD */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">Corporate Designations</h3>
          </div>
          <button
            onClick={() => setShowAddDesig(!showAddDesig)}
            className="flex items-center gap-1 bg-emerald-650/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            <span>New Post</span>
          </button>
        </div>

        {showAddDesig && (
          <form onSubmit={handleCreateDesig} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-400 font-bold uppercase font-mono tracking-widest">Create Designation</span>
              <button type="button" onClick={() => setShowAddDesig(false)} className="text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-xs font-semibold">
              <label className="block text-slate-400 mb-1">Designation Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Procurement Lead"
                value={newDesig.name}
                onChange={(e) => setNewDesig({ name: e.target.value })}
                className="w-full rounded border border-slate-700 bg-slate-950 p-1.5 text-white focus:outline-none"
              />
            </div>
            <div className="text-right">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1 text-xs font-bold transition-all cursor-pointer">
                Save Designation
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {desigs.map(des => {
            const headcount = employees.filter(e => e.designationId === des.id).length;
            return (
              <div key={des.id} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-850 rounded-lg text-xs hover:border-slate-800 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 flex items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    T
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{des.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono block">ID: {des.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                    {headcount} Officers
                  </span>
                  <button
                    onClick={() => handleDeleteDesig(des.id, des.name)}
                    className="p-1 text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                    title="Remove Designation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Settings, 
  Building, 
  ShieldAlert, 
  Users, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X, 
  Save, 
  Key,
  ShieldCheck,
  Building2
} from "lucide-react";
import { Company, Branch, User, UserRole } from "../types";

interface AdminViewProps {
  company: Company;
  setCompany: React.Dispatch<React.SetStateAction<Company>>;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  userRole: UserRole;
}

export default function AdminView({
  company,
  setCompany,
  branches,
  setBranches,
  users,
  setUsers,
  userRole,
}: AdminViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"company" | "permissions" | "users">("company");
  const [selectedPermissionRole, setSelectedPermissionRole] = useState<UserRole>(UserRole.PURCHASE_MANAGER);
  
  // Custom Local Dynamic Permission matrix state
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<UserRole, Record<string, boolean>>>({
    [UserRole.SYSTEM_ADMIN]: { create: true, read: true, update: true, delete: true, approve: true },
    [UserRole.COMPANY_ADMIN]: { create: true, read: true, update: true, delete: true, approve: true },
    [UserRole.PURCHASE_MANAGER]: { create: true, read: true, update: true, delete: false, approve: true },
    [UserRole.INVENTORY_MANAGER]: { create: true, read: true, update: true, delete: false, approve: false },
    [UserRole.SALES_MANAGER]: { create: true, text: true, update: true, delete: false, approve: true },
    [UserRole.CRM_EXECUTIVE]: { create: true, read: true, update: true, delete: false, approve: false },
    [UserRole.HR_MANAGER]: { create: true, read: true, update: true, delete: false, approve: true },
    [UserRole.FINANCE_MANAGER]: { create: true, read: true, update: true, delete: false, approve: true },
    [UserRole.EMPLOYEE]: { create: false, read: true, update: false, delete: false, approve: false },
    [UserRole.READ_ONLY]: { create: false, read: true, update: false, delete: false, approve: false },
  });

  const handleTogglePermission = (role: UserRole, action: string) => {
    setPermissionsMatrix(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [action]: !prev[role][action],
      }
    }));
  };

  const isSystemAdmin = userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.COMPANY_ADMIN;

  const handleToggleCompanySetting = (key: "whatsappEnabled" | "emailNotifications" | "smsNotifications") => {
    if (!isSystemAdmin) return alert("System Admin privileges required to edit parameters.");
    setCompany(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: !prev.settings[key],
      }
    }));
  };

  const handleUpdateCompanyDetails = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Company administration parameters updated successfully.");
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left">
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Administration</h1>
          <p className="text-sm text-slate-400 mt-1">Configure company profiles, manipulate RBAC permissions, and oversee system security profiles.</p>
        </div>

        {/* Dynamic status badges */}
        <div className="flex gap-4 bg-slate-950 border border-slate-800 p-3 rounded-xl self-start text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider leading-none">WhatsApp API Relay</span>
            <strong className={`block mt-1 ${company.settings.whatsappEnabled ? "text-emerald-400" : "text-slate-500"}`}>
              {company.settings.whatsappEnabled ? "ACTIVE (SMTP)" : "DISABLED"}
            </strong>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider leading-none">Tenant Branches</span>
            <strong className="block text-slate-200 font-bold mt-1">{branches.length} Registered</strong>
          </div>
        </div>
      </div>

      {/* Sub tabs switches */}
      <div className="flex bg-slate-900 p-1 rounded-lg self-start">
        <button
          onClick={() => setActiveSubTab("company")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "company" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Company Setup & Settings
        </button>
        <button
          onClick={() => setActiveSubTab("permissions")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "permissions" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Dynamic RBAC Permission Desk
        </button>
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "users" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          User Accounts Directory
        </button>
      </div>

      {/* SUB-TAB: COMPANY SETUP & SETTINGS */}
      {activeSubTab === "company" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Company details form */}
          <form onSubmit={handleUpdateCompanyDetails} className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 font-mono">Registered Company Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Entity Legal Name</label>
                <input
                  type="text"
                  required
                  disabled={!isSystemAdmin}
                  value={company.name}
                  onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Registered VAT Tax ID</label>
                <input
                  type="text"
                  disabled={!isSystemAdmin}
                  value={company.taxId}
                  onChange={(e) => setCompany(prev => ({ ...prev, taxId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Admin Contact Email</label>
                <input
                  type="email"
                  disabled={!isSystemAdmin}
                  value={company.email}
                  onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Branch Code Identifier</label>
                <input
                  type="text"
                  disabled
                  value={company.code}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-slate-500 font-mono disabled:opacity-50"
                />
              </div>
            </div>

            <div className="text-right border-t border-slate-800 pt-4">
              <button
                type="submit"
                disabled={!isSystemAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Save Company details</span>
              </button>
            </div>
          </form>

          {/* Integrations toggles & Branch mappings */}
          <div className="space-y-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 font-mono">Operational Integrations</h3>
              
              <div className="space-y-4 text-xs">
                {/* WhatsApp */}
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200 block font-semibold">WhatsApp API Messenger</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium font-mono">Automatic delivery reports notifications</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCompanySetting("whatsappEnabled")}
                    className="text-indigo-400 focus:outline-hidden hover:scale-105 transition-transform"
                  >
                    {company.settings.whatsappEnabled ? (
                      <ToggleRight className="h-8 w-8" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Email notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-slate-200 block font-semibold">Email Dispatch (SMTP Relay)</strong>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium font-mono">PO approvals and client invoices delivery</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleCompanySetting("emailNotifications")}
                    className="text-indigo-400 focus:outline-hidden hover:scale-105 transition-transform"
                  >
                    {company.settings.emailNotifications ? (
                      <ToggleRight className="h-8 w-8" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Active branch listings */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 font-mono">Multi-Tenant Divisions</h3>
              <div className="space-y-2 text-xs">
                {branches.map(br => (
                  <div key={br.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-800 bg-slate-900">
                    <Building className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
                    <div className="text-left">
                      <strong className="font-bold text-slate-200 block">{br.name}</strong>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{br.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: DYNAMIC RBAC PERMISSION DESK */}
      {activeSubTab === "permissions" && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 shadow-xs space-y-6 text-left">
          <div className="border-b border-slate-800 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-300 font-mono">Dynamic Security Matrix (RBAC)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Edit granular action authorizations instantly across the 10 role categories.</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">Target Role:</span>
              <select
                value={selectedPermissionRole}
                onChange={(e) => setSelectedPermissionRole(e.target.value as UserRole)}
                className="rounded-lg border border-slate-800 p-2 text-xs font-bold text-indigo-400 bg-slate-900"
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">Modify Permission Actions</span>
              
              <div className="space-y-3.5">
                {["create", "read", "update", "delete", "approve"].map(action => {
                  const isGranted = permissionsMatrix[selectedPermissionRole]?.[action];
                  return (
                    <div key={action} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">{action} Action</span>
                      <button
                        onClick={() => {
                          if (!isSystemAdmin) return alert("Requires Admin login.");
                          handleTogglePermission(selectedPermissionRole, action);
                        }}
                        disabled={!isSystemAdmin}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold tracking-wide transition-colors border ${
                          isGranted 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-550/20" 
                            : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-550/20"
                        }`}
                      >
                        {isGranted ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>{isGranted ? "GRANTED" : "DENIED"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-between p-2">
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Rule Engine Context</span>
                </h4>
                
                <p className="text-xs text-slate-400 leading-relaxed">
                  Permissions are compiled server-side into signed JWT access tokens. Toggling these check-marks changes permissions locally in this simulated environment. 
                </p>

                <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4">
                  <h5 className="font-bold text-xs text-indigo-400 uppercase font-mono">Enterprise Enforcement Mode</h5>
                  <p className="mt-1 text-xs text-indigo-300/80 leading-relaxed">
                    Read-only users are strictly forbidden from modifying state values across CRM, Finance, or Stock. System administrators bypass rule checks globally.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-mono mt-4">
                Active simulated role: <strong className="text-indigo-400 font-semibold">{userRole}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: USER DIRECTORY */}
      {activeSubTab === "users" && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Active System Operator Profiles</h3>
            <span className="text-xs text-slate-500 font-mono">Count: {users.length} logins</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950 font-semibold text-slate-300 text-left">
                <tr>
                  <th className="px-5 py-3">User Profile</th>
                  <th className="px-5 py-3">Mailing Address</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Login Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4 flex items-center gap-3">
                      <img src={u.avatarUrl} alt={u.name} className="h-8 w-8 rounded-full border border-slate-800" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-bold text-slate-200 leading-tight">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-0.5">Tenant: {company.code}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{u.email}</td>
                    <td className="px-5 py-4 font-bold text-xs text-indigo-400">{u.role}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border border-emerald-500/20 bg-emerald-500/10 text-emerald-400`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        <span>{u.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

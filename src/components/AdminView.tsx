import { toast } from "../utils/toast";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  Building2,
  UserPlus,
  Plus,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Clock,
  Send,
  Edit,
  Trash2
} from "lucide-react";
import { Company, Branch, User, UserRole, formatINR } from "../types";

interface AdminViewProps {
  company: Company;
  setCompany: React.Dispatch<React.SetStateAction<Company>>;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  userRole: UserRole;
}

export interface ClientSubscription {
  id: string;
  ownerName: string;
  email: string;
  companyName: string;
  companyCode: string;
  monthlyAmount: number;
  cycleStart: string;
  cycleEnd: string;
  status: "Paid" | "Pending" | "Overdue";
  lastPaymentDate?: string;
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
  const [activeSubTab, setActiveSubTab] = useState<"company" | "permissions" | "users" | "billing">("company");
  const [selectedPermissionRole, setSelectedPermissionRole] = useState<UserRole>(UserRole.PURCHASE_MANAGER);

  // Client subscription list state
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editCycleStart, setEditCycleStart] = useState("");
  const [editCycleEnd, setEditCycleEnd] = useState("");
  const [invoiceRemindedMsg, setInvoiceRemindedMsg] = useState<string | null>(null);

  useEffect(() => {
    const storedBilling = localStorage.getItem("deinrim_billing_subscriptions");
    let initialBilling: ClientSubscription[] = [];
    if (storedBilling) {
      try {
        initialBilling = JSON.parse(storedBilling);
      } catch (e) {
        console.error("Failed to parse billing subscriptions", e);
      }
    }

    const clientAdmins = users.filter(u => u.role === UserRole.COMPANY_ADMIN);
    
    const updatedBilling = clientAdmins.map(admin => {
      const existing = initialBilling.find(s => s.id === admin.id);
      if (existing) {
        return {
          ...existing,
          ownerName: admin.name,
          email: admin.email,
          companyName: admin.companyName || admin.name + " Enterprises",
        };
      }

      const isSarah = admin.email === "sarah.j@deinrim.com";
      return {
        id: admin.id,
        ownerName: admin.name,
        email: admin.email,
        companyName: admin.companyName || (isSarah ? "DEINRIM India Private Limited" : admin.name + " Enterprises"),
        companyCode: admin.companyId ? admin.companyId.replace("comp-", "").toUpperCase() : "OMS",
        monthlyAmount: 500,
        cycleStart: "2026-06-01",
        cycleEnd: "2026-06-30",
        status: (isSarah ? "Paid" : "Pending") as "Paid" | "Pending" | "Overdue",
        lastPaymentDate: isSarah ? "2026-06-01" : undefined,
      };
    });

    setSubscriptions(updatedBilling);
    localStorage.setItem("deinrim_billing_subscriptions", JSON.stringify(updatedBilling));
  }, [users]);

  const handleUpdateSubscriptionStatus = (id: string, newStatus: "Paid" | "Pending" | "Overdue", paymentDate?: string) => {
    const updated = subscriptions.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          status: newStatus,
          lastPaymentDate: paymentDate || (newStatus === "Paid" ? new Date().toISOString().split("T")[0] : sub.lastPaymentDate)
        };
      }
      return sub;
    });
    setSubscriptions(updated);
    localStorage.setItem("deinrim_billing_subscriptions", JSON.stringify(updated));
  };

  const handleUpdateSubscriptionDates = (id: string, cycleStart: string, cycleEnd: string) => {
    const updated = subscriptions.map(sub => {
      if (sub.id === id) {
        return { ...sub, cycleStart, cycleEnd };
      }
      return sub;
    });
    setSubscriptions(updated);
    localStorage.setItem("deinrim_billing_subscriptions", JSON.stringify(updated));
    setEditingSubId(null);
  };

  // System Admin Client Tenant Registration States
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("client123");
  const [clientCompanyName, setClientCompanyName] = useState("");
  const [clientCompanyCode, setClientCompanyCode] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Company Admin Staff Registration States
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [staffSuccessMsg, setStaffSuccessMsg] = useState("");

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [editStatus, setEditStatus] = useState<"active" | "inactive">("active");
  const [editPassword, setEditPassword] = useState("");

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditPassword("");
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editEmail || !editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? {
      ...u,
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      role: editRole,
      status: editStatus,
      ...(editPassword ? { password: editPassword.trim() } : {}),
    } : u));
    setEditingUser(null);
    toast.success("User Updated", `${editName} account updated successfully`);
  };

  const handleDeleteUser = (u: User) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    setUsers(prev => prev.filter(x => x.id !== u.id));
    toast.success("User Removed", `${u.name} has been deleted`);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientCompanyName || !clientCompanyCode) {
      return;
    }

    const cleanCode = clientCompanyCode.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    const newCompanyId = "comp-" + cleanCode;
    const newBranchId = "br-" + cleanCode + "-hq";

    // Create the new User
    const newClientUser: User = {
      id: "u-client-" + Date.now(),
      name: clientName.trim(),
      email: clientEmail.trim().toLowerCase(),
      role: UserRole.COMPANY_ADMIN, // Client starts as Company Admin for their own tenant!
      companyId: newCompanyId,
      branchId: newBranchId,
      status: "active",
      password: clientPassword.trim() || "client123",
      companyName: clientCompanyName.trim(),
    };

    setUsers(prev => [...prev, newClientUser]);
    setSuccessMsg(`Client account for "${clientName}" created successfully! Default password is "${clientPassword || "client123"}". They can now log in using email: ${clientEmail.toLowerCase()}`);
    
    // Clear form
    setClientName("");
    setClientEmail("");
    setClientPassword("client123");
    setClientCompanyName("");
    setClientCompanyCode("");
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      return;
    }

    // Create the new staff user
    const newStaffUser: User = {
      id: "u-staff-" + Date.now(),
      name: staffName.trim(),
      email: staffEmail.trim().toLowerCase(),
      role: staffRole,
      companyId: company.id,
      branchId: branches[0]?.id || "br-hq",
      status: "active",
      password: staffPassword.trim(),
      companyName: company.name,
    };

    setUsers(prev => [...prev, newStaffUser]);
    setStaffSuccessMsg(`Staff account for "${staffName}" as "${staffRole}" created successfully! They can log in immediately using: ${staffEmail.toLowerCase()}`);
    
    // Clear form
    setStaffName("");
    setStaffEmail("");
    setStaffPassword("");
    setStaffRole(UserRole.EMPLOYEE);
  };
  
  // Custom Local Dynamic Permission matrix state
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<UserRole, Record<string, boolean>>>({
    [UserRole.SYSTEM_ADMIN]: { create: true, read: true, update: true, delete: true, approve: true },
    [UserRole.COMPANY_ADMIN]: { create: true, read: true, update: true, delete: true, approve: true },
    [UserRole.PURCHASE_MANAGER]: { create: true, read: true, update: true, delete: false, approve: true },
    [UserRole.INVENTORY_MANAGER]: { create: true, read: true, update: true, delete: false, approve: false },
    [UserRole.SALES_MANAGER]: { create: true, read: true, update: true, delete: false, approve: true },
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
    if (!isSystemAdmin) { toast.error("System Admin privileges required"); return; }
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
    toast.success("Settings Saved", "Company parameters updated")
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
        <button
          onClick={() => setActiveSubTab("billing")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeSubTab === "billing" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
          }`}
        >
          Billing & Subscription
        </button>
      </div>

      {/* SUB-TAB: COMPANY SETUP & SETTINGS */}
      {activeSubTab === "company" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Company details form */}
          <form onSubmit={handleUpdateCompanyDetails} className="lg:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 font-mono">Registered Company Settings</h3>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Entity Legal Name</label>
                <input type="text" required disabled={!isSystemAdmin} value={company.name}
                  onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GSTIN</label>
                <input type="text" value={company.gstin || ""}
                  onChange={(e) => setCompany(prev => ({ ...prev, gstin: e.target.value }))}
                  placeholder="e.g. 19AABCB1234A1ZX"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">State</label>
                <input type="text" value={company.state || ""}
                  onChange={(e) => setCompany(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="e.g. West Bengal"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Phone</label>
                <input type="text" value={company.phone || ""}
                  onChange={(e) => setCompany(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98361-30393"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Admin Contact Email</label>
                <input type="email" disabled={!isSystemAdmin} value={company.email}
                  onChange={(e) => setCompany(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Branch Code Identifier</label>
                <input type="text" disabled value={company.code}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-slate-500 font-mono disabled:opacity-50" />
              </div>
            </div>

            {/* Office Address */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Office / Billing Address</label>
              <textarea value={company.address || ""}
                onChange={(e) => setCompany(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                placeholder="Full office address (appears on GST invoices)"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden resize-none" />
            </div>

            {/* Bank Details */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono border-t border-slate-800 pt-4">Bank Details (for Invoice Payment Section)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Bank Name</label>
                  <input type="text" value={company.bankName || ""}
                    onChange={(e) => setCompany(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. State Bank of India"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Account Holder Name</label>
                  <input type="text" value={company.bankAccountName || ""}
                    onChange={(e) => setCompany(prev => ({ ...prev, bankAccountName: e.target.value }))}
                    placeholder="As on bank records"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Account Number</label>
                  <input type="text" value={company.bankAccountNumber || ""}
                    onChange={(e) => setCompany(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                    placeholder="Account number"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">IFSC Code</label>
                  <input type="text" value={company.bankIFSC || ""}
                    onChange={(e) => setCompany(prev => ({ ...prev, bankIFSC: e.target.value }))}
                    placeholder="e.g. SBIN0001234"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Account Type</label>
                  <select value={company.bankAccountType || "Current"}
                    onChange={(e) => setCompany(prev => ({ ...prev, bankAccountType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white focus:outline-hidden">
                    <option>Current</option><option>Savings</option><option>OD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">UPI ID (optional)</label>
                  <input type="text" value={company.bankUPI || ""}
                    onChange={(e) => setCompany(prev => ({ ...prev, bankUPI: e.target.value }))}
                    placeholder="e.g. business@upi"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                </div>
              </div>
            </div>

            {/* e-Invoice GSP Settings */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider font-mono">e-Invoice GSP Settings</h4>
              <p className="text-[10px] text-slate-500">Required for generating IRN from your GSP (ClearTax, Masters India, IRIS, etc.)</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GSP API Base URL</label>
                  <input type="text" value={company.gspApiUrl || ""}
                    onChange={(e) => setCompany(prev => ({ ...prev, gspApiUrl: e.target.value }))}
                    placeholder="https://gsp.example.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Client ID</label>
                    <input type="text" value={company.gspClientId || ""}
                      onChange={(e) => setCompany(prev => ({ ...prev, gspClientId: e.target.value }))}
                      placeholder="GSP Client ID"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Client Secret</label>
                    <input type="password" value={company.gspClientSecret || ""}
                      onChange={(e) => setCompany(prev => ({ ...prev, gspClientSecret: e.target.value }))}
                      placeholder="GSP Client Secret"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GSP Username</label>
                    <input type="text" value={company.gspUsername || ""}
                      onChange={(e) => setCompany(prev => ({ ...prev, gspUsername: e.target.value }))}
                      placeholder="GSP portal username"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">GSP Password</label>
                    <input type="password" value={company.gspPassword || ""}
                      onChange={(e) => setCompany(prev => ({ ...prev, gspPassword: e.target.value }))}
                      placeholder="GSP portal password"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-sm text-white font-mono focus:outline-hidden" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right border-t border-slate-800 pt-4">
              <button type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors">
                <Save className="h-4 w-4" />
                <span>Save Company Details</span>
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
                          if (!isSystemAdmin) { toast.error("Admin login required"); return; }
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
        <div className="space-y-6">
          {/* SYSTEM ADMIN SPECIAL PERMISSION FORM */}
          {userRole === UserRole.SYSTEM_ADMIN && (
            <div className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-400">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">System Admin Desk: Provision Whitelabel Client Tenant</h3>
                  <p className="text-xs text-slate-400">Register active clients to start with blank custom workspaces on a flat-rate billing model</p>
                </div>
              </div>

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-lg text-xs relative flex items-start gap-2 animate-fadeIn">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-white">Tenant Created Successfully</p>
                    <p className="mt-0.5 leading-relaxed">{successMsg}</p>
                  </div>
                  <button 
                    onClick={() => setSuccessMsg("")} 
                    className="absolute right-2 top-2 text-slate-400 hover:text-white font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  {/* Owner Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Client Owner Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Rajesh Kumar"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  {/* Owner Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Client Owner Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., rajesh@kumartech.in"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Account Password <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Default: client123"
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono font-semibold"
                    />
                  </div>

                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Client Company Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Kumar Tech Solutions"
                      value={clientCompanyName}
                      onChange={(e) => setClientCompanyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  {/* Company Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Company Code <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., KUMAR (3-6 chars)"
                      value={clientCompanyCode}
                      onChange={(e) => setClientCompanyCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono font-bold uppercase"
                    />
                  </div>

                  {/* Plan & Charge */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 font-mono">Monthly Subscription Fee</label>
                    <input
                      type="text"
                      disabled
                      value="₹500 INR (Standard Flat Charge)"
                      className="w-full bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-2 text-xs text-slate-400 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors font-bold text-xs rounded-lg text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    <Plus className="h-4 w-4" /> Provision Whitelabel Client Tenant
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* COMPANY ADMIN WORKSPACE STAFF REGISTRATION FORM */}
          {userRole === UserRole.COMPANY_ADMIN && (
            <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-400">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Workspace Desk: Register Staff Logins</h3>
                  <p className="text-xs text-slate-400">Create custom credentials for your team and operators inside "{company.name}"</p>
                </div>
              </div>

              {staffSuccessMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-lg text-xs relative flex items-start gap-2 animate-fadeIn">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-white">Staff Login Provisioned</p>
                    <p className="mt-0.5 leading-relaxed">{staffSuccessMsg}</p>
                  </div>
                  <button 
                    onClick={() => setStaffSuccessMsg("")} 
                    className="absolute right-2 top-2 text-slate-400 hover:text-white font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  {/* Staff Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Full Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Jane Doe"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  {/* Staff Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Email Address <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., jane@company.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  {/* Staff Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Login Password <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., securepass123"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono font-semibold"
                    />
                  </div>

                  {/* Staff Role selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 font-mono">Assigned Role <span className="text-rose-500">*</span></label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono font-semibold"
                    >
                      {Object.values(UserRole)
                        .filter(role => role !== UserRole.SYSTEM_ADMIN) // Client can't create global system admins
                        .map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 transition-colors font-bold text-xs rounded-lg text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
                  >
                    <Plus className="h-4 w-4" /> Provision Staff Workspace Login
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Active System Operator Profiles</h3>
              <span className="text-xs text-slate-500 font-mono">Count: {(userRole === UserRole.SYSTEM_ADMIN ? users : users.filter(u => u.companyId === company.id)).length} logins</span>
            </div>

            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950 font-semibold text-slate-300 text-left">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {(userRole === UserRole.SYSTEM_ADMIN ? users : users.filter(u => u.companyId === company.id)).map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-200 leading-tight">{u.name}</div>
                      <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase mt-0.5">Tenant: {u.companyId.replace("comp-", "").toUpperCase()}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">{u.email}</td>
                    <td className="px-5 py-4 font-bold text-xs text-indigo-400">{u.role}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${u.status === "active" ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border border-slate-700 bg-slate-800 text-slate-400"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                        <span>{u.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveEditUser} className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white font-mono">Edit User — {editingUser.name}</h3>
              </div>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white font-bold text-lg leading-none cursor-pointer">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Full Name *</label>
                <input required type="text" value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Email *</label>
                <input required type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Role</label>
                  <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                    {Object.values(UserRole).filter(r => userRole === UserRole.SYSTEM_ADMIN || r !== UserRole.SYSTEM_ADMIN).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Status</label>
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value as "active" | "inactive")}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">New Password <span className="text-slate-600 font-normal lowercase">(leave blank to keep current)</span></label>
                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setEditingUser(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                <Check className="h-3.5 w-3.5" /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB: BILLING & SUBSCRIPTION */}
      {activeSubTab === "billing" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-400" />
                <span>Enterprise Billing & Subscriptions Desk</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl">
                {userRole === UserRole.SYSTEM_ADMIN 
                  ? "Global financial overview of enterprise clients, monthly flat ₹500/month cycle limits, and payment receivables." 
                  : "View organization active enterprise licenses, active ₹500/month cycle limits, and ledger logs."}
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-500/20">
                Flat Charge Plan
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/20">
                ₹500 / Month
              </span>
            </div>
          </div>

          {invoiceRemindedMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-lg text-xs relative flex items-start gap-2 animate-fadeIn text-left">
              <span className="text-emerald-400 font-bold">✓</span>
              <div className="flex-1 pr-4">
                <p className="font-semibold text-white">Invoice Reminder Sent</p>
                <p className="mt-0.5 leading-relaxed">{invoiceRemindedMsg}</p>
              </div>
              <button 
                onClick={() => setInvoiceRemindedMsg(null)} 
                className="absolute right-2 top-2 text-slate-400 hover:text-white font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* SYSTEM ADMINISTRATOR PERSPECTIVE */}
          {userRole === UserRole.SYSTEM_ADMIN ? (
            <div className="space-y-6">
              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Total Managed Tenants</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">{subscriptions.length}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">Nodes Active</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Fully Paid cycles</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-emerald-400">
                      {subscriptions.filter(s => s.status === "Paid").length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">
                      / {subscriptions.length} Clients
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">Pending / Overdue</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-amber-400">
                      {subscriptions.filter(s => s.status !== "Paid").length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">Requires Attention</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5 shadow-xs">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Monthly Recurring Rev.</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-white">
                      {formatINR(subscriptions.length * 500)}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono font-semibold">Flat Rate</span>
                  </div>
                </div>
              </div>

              {/* Warnings Panel */}
              {subscriptions.some(s => s.status === "Overdue") && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-4 rounded-xl text-xs flex items-start gap-3 text-left">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">Action Required: Overdue Accounts Detected</h4>
                    <p className="mt-1 leading-relaxed text-red-300/90">
                      There are currently client tenant nodes with overdue subscription status. You can issue manual reminder notifications or contact administrative owners directly to avoid service disruptions.
                    </p>
                  </div>
                </div>
              )}

              {/* Client subscriptions registry */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Client Subscriptions Registry</h3>
                  <span className="text-xs text-slate-500 font-mono">Count: {subscriptions.length} active licenses</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-950 font-semibold text-slate-300 text-left">
                      <tr>
                        <th className="px-5 py-3">Client Workspace / Code</th>
                        <th className="px-5 py-3">Administrative Owner</th>
                        <th className="px-5 py-3">Monthly Flat Rate</th>
                        <th className="px-5 py-3">Active 30-Day Cycle</th>
                        <th className="px-5 py-3">Subscription Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                      {subscriptions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors text-left">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-200 leading-tight flex items-center gap-2">
                              <span>🏢 {sub.companyName}</span>
                            </div>
                            <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase mt-1">Tenant Code: {sub.companyCode}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-200">{sub.ownerName}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{sub.email}</div>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-300">{formatINR(sub.monthlyAmount)}</td>
                          <td className="px-5 py-4">
                            {editingSubId === sub.id ? (
                              <div className="space-y-2 py-1">
                                <div className="flex gap-2 items-center">
                                  <input 
                                    type="date" 
                                    value={editCycleStart} 
                                    onChange={(e) => setEditCycleStart(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-1 focus:outline-hidden"
                                  />
                                  <span className="text-slate-500 text-xs">to</span>
                                  <input 
                                    type="date" 
                                    value={editCycleEnd} 
                                    onChange={(e) => setEditCycleEnd(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded p-1 focus:outline-hidden"
                                  />
                                </div>
                                <div className="flex gap-1.5">
                                  <button 
                                    type="button"
                                    onClick={() => handleUpdateSubscriptionDates(sub.id, editCycleStart, editCycleEnd)}
                                    className="bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded text-[10px] font-bold text-white transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setEditingSubId(null)}
                                    className="bg-slate-850 hover:bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-mono text-xs text-slate-300">{sub.cycleStart} to {sub.cycleEnd}</div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubId(sub.id);
                                    setEditCycleStart(sub.cycleStart);
                                    setEditCycleEnd(sub.cycleEnd);
                                  }}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mt-1 font-mono uppercase cursor-pointer"
                                >
                                  <Calendar className="h-3 w-3" /> Adjust Cycle Dates
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              sub.status === "Paid" 
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
                                : sub.status === "Pending"
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                : "border-rose-500/20 bg-rose-500/10 text-rose-400"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                sub.status === "Paid" 
                                  ? "bg-emerald-400" 
                                  : sub.status === "Pending"
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}></span>
                              <span>{sub.status}</span>
                            </span>
                            {sub.lastPaymentDate && sub.status === "Paid" && (
                              <div className="text-[9px] text-slate-500 font-mono mt-1">Paid on: {sub.lastPaymentDate}</div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-1.5 flex-wrap max-w-xs">
                              {sub.status !== "Paid" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscriptionStatus(sub.id, "Paid")}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer"
                                >
                                  Mark Paid
                                </button>
                              )}
                              {sub.status !== "Pending" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscriptionStatus(sub.id, "Pending")}
                                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                                >
                                  Mark Pending
                                </button>
                              )}
                              {sub.status !== "Overdue" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateSubscriptionStatus(sub.id, "Overdue")}
                                  className="bg-slate-800 hover:bg-slate-750 text-rose-400 text-[10px] font-bold px-2 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                                >
                                  Mark Overdue
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setInvoiceRemindedMsg(`Manual billing statement and email invoice reminder successfully dispatched via SMTP to ${sub.ownerName} (${sub.email}).`)}
                                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded border border-indigo-500/10 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="h-2.5 w-2.5" /> Remind
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* CLIENT / TENANT PERSPECTIVE */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Active Plan Detail Box */}
              <div className="lg:col-span-2 space-y-6">
                <ClientSubscribedSection 
                  company={company}
                  subscriptions={subscriptions}
                  handleUpdateSubscriptionStatus={handleUpdateSubscriptionStatus}
                />

                {/* Simulated Ledger Receipt download */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Payment ledger & Receipts</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Currency: INR</span>
                  </div>

                  <div className="overflow-x-auto font-medium">
                    <table className="min-w-full divide-y divide-slate-850 text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-bold text-left uppercase tracking-wider font-mono">
                        <tr>
                          <th className="px-5 py-3 text-[10px]">Invoice ID</th>
                          <th className="px-5 py-3 text-[10px]">Billing period</th>
                          <th className="px-5 py-3 text-[10px]">Charge amount</th>
                          <th className="px-5 py-3 text-[10px]">Payment status</th>
                          <th className="px-5 py-3 text-[10px] text-right">Receipt download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        <tr className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-5 py-3 font-mono">INV-2026-06</td>
                          <td className="px-5 py-3 text-slate-400">June 1, 2026 - June 30, 2026</td>
                          <td className="px-5 py-3 font-mono">₹500.00</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-wide text-[9px]">PAID</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => toast.info("PDF Download", "Receipt INV-2026-06 downloading...")} className="text-indigo-400 hover:text-indigo-300 font-semibold uppercase text-[10px] cursor-pointer">PDF Download</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-5 py-3 font-mono">INV-2026-05</td>
                          <td className="px-5 py-3 text-slate-400">May 1, 2026 - May 31, 2026</td>
                          <td className="px-5 py-3 font-mono">₹500.00</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-wide text-[9px]">PAID</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => toast.info("PDF Download", "Receipt INV-2026-05 downloading...")} className="text-indigo-400 hover:text-indigo-300 font-semibold uppercase text-[10px] cursor-pointer">PDF Download</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-5 py-3 font-mono">INV-2026-04</td>
                          <td className="px-5 py-3 text-slate-400">April 1, 2026 - April 30, 2026</td>
                          <td className="px-5 py-3 font-mono">₹500.00</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-wide text-[9px]">PAID</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => toast.info("PDF Download", "Receipt INV-2026-04 downloading...")} className="text-indigo-400 hover:text-indigo-300 font-semibold uppercase text-[10px] cursor-pointer">PDF Download</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Side context cards */}
              <div className="space-y-6">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 font-mono">Pricing Scheme Terms</h3>
                  <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                    <p>
                      <strong>Standard Whitelabel rate:</strong> Our licensing plan is extremely simplified. Symmetrical flat ₹500 per calendar month per client node.
                    </p>
                    <p>
                      <strong>Included services:</strong> Full CRM lead integration, custom purchase order registries, triple-entry database ledgers, WhatsApp automated routing, and unlimited custom operator login profiles.
                    </p>
                  </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-5 shadow-xs space-y-3">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider block text-xs font-mono">Secure Payment Desk</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All payment processing interfaces follow strict compliance rules. Invoices are dispatched to the organization's designated administrator email.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-component for client checkout block to manage intermediate states locally
function ClientSubscribedSection({ 
  company, 
  subscriptions, 
  handleUpdateSubscriptionStatus 
}: { 
  company: Company, 
  subscriptions: ClientSubscription[], 
  handleUpdateSubscriptionStatus: (id: string, status: "Paid" | "Pending" | "Overdue") => void
}) {
  const mySub = subscriptions.find(s => s.email === company.email || s.companyCode === company.code) || {
    id: "default-sub",
    ownerName: "Administrator",
    email: company.email,
    companyName: company.name,
    companyCode: company.code,
    monthlyAmount: 500,
    cycleStart: "2026-06-01",
    cycleEnd: "2026-06-30",
    status: "Paid" as const
  };

  const [checkoutCardholder, setCheckoutCardholder] = useState("");
  const [checkoutCardNumber, setCheckoutCardNumber] = useState("");
  const [checkoutExpiry, setCheckoutExpiry] = useState("");
  const [checkoutCVV, setCheckoutCVV] = useState("");
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleClientPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutCardholder || !checkoutCardNumber || !checkoutExpiry || !checkoutCVV) {
      toast.error("Complete all bank card parameters")
      return;
    }
    handleUpdateSubscriptionStatus(mySub.id, "Paid");
    setCheckoutSuccess(true);
    setCheckoutCardholder("");
    setCheckoutCardNumber("");
    setCheckoutExpiry("");
    setCheckoutCVV("");
    setTimeout(() => setCheckoutSuccess(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Subscription Status Callout */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Service Category</span>
            <strong className="text-sm font-bold text-slate-200">Whitelabel ERP Enterprise Suite</strong>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            mySub.status === "Paid" 
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
              : "border-amber-500/20 bg-amber-500/10 text-amber-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${mySub.status === "Paid" ? "bg-emerald-400" : "bg-amber-400"}`}></span>
            <span>{mySub.status === "Paid" ? "Fully Active" : "Payment Pending"}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Billing Cycle Duration</span>
            <span className="text-slate-200 font-semibold">{mySub.cycleStart} to {mySub.cycleEnd}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Subscription Price</span>
            <span className="text-slate-200 font-bold text-sm">₹500.00 / month flat</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase mb-1">Assigned Tenant Code</span>
            <span className="text-indigo-400 font-bold uppercase">{mySub.companyCode}</span>
          </div>
        </div>

        {mySub.status === "Paid" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-xs text-slate-300 leading-relaxed">
            <span className="text-emerald-400 font-bold block mb-1 font-mono uppercase tracking-wide">✓ Service Status Green</span>
            Your monthly flat-rate whitelabel subscription is fully paid. No action required. Next billing cycle auto-renews on July 1, 2026. Enjoy unrestricted access to isolated enterprise modules.
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-xs text-slate-300 leading-relaxed">
            <span className="text-amber-400 font-bold block mb-1 font-mono uppercase tracking-wide">⚠ Payment Statement Issued</span>
            Your subscription invoice for the active cycle period is pending. Standard subscription fee is ₹500/month. Please settle the pending amount via our secure payment gateway below to maintain fully automated accounting operations.
          </div>
        )}
      </div>

      {/* Checkout Gateway (Only display if payment is pending) */}
      {mySub.status !== "Paid" && (
        <form onSubmit={handleClientPayment} className="bg-slate-950/80 border border-indigo-500/20 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-3 font-mono flex items-center gap-1.5">
            <CreditCard className="h-4.5 w-4.5 text-indigo-400" />
            <span>Secure Payment Gateway (Simulated checkout)</span>
          </h3>

          {checkoutSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-xs font-semibold animate-fadeIn">
              ✓ Flat-rate ₹500 subscription successfully processed! Thank you for choosing DEINRIM whitelabel solutions.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-1.5 font-medium">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Cardholder Name <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="e.g., Sarah Jenkins"
                value={checkoutCardholder}
                onChange={(e) => setCheckoutCardholder(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 font-medium">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Debit or Credit Card Number <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                required
                maxLength={19}
                placeholder="4111 2222 3333 4444"
                value={checkoutCardNumber}
                onChange={(e) => setCheckoutCardNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 font-medium">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Expiry Date <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                required
                maxLength={5}
                placeholder="MM/YY"
                value={checkoutExpiry}
                onChange={(e) => setCheckoutExpiry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1.5 font-medium">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Security CVV <span className="text-rose-500">*</span></label>
              <input 
                type="password"
                required
                maxLength={4}
                placeholder="•••"
                value={checkoutCVV}
                onChange={(e) => setCheckoutCVV(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between font-medium">
            <span className="text-[10px] text-slate-500 font-mono">Settle Pending: <strong className="text-slate-300 font-semibold">₹500.00 Flat</strong></span>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Authorize & Pay ₹500
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

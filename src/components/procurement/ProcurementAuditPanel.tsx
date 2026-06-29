import React, { useState, useEffect } from "react";
import { Search, Shield, RefreshCw, AlertCircle, FileSpreadsheet } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export default function ProcurementAuditPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = () => {
    const stored = localStorage.getItem("deinrim_auditLogs_comp-1");
    if (stored) {
      try {
        setLogs(JSON.parse(stored));
      } catch (e) {}
    } else {
      const defaultLogs: AuditLog[] = [
        {
          id: "audit-1",
          userId: "user-1",
          userName: "Finance Administrator",
          userRole: "COMPANY_ADMIN",
          action: "APPROVED",
          module: "PURCHASE_REQUISITION",
          details: "Approved Purchase Requisition PR-2026-0001 for high-capacity SSD nodes",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          ipAddress: "192.168.4.15"
        },
        {
          id: "audit-2",
          userId: "user-1",
          userName: "Finance Administrator",
          userRole: "COMPANY_ADMIN",
          action: "CREATED",
          module: "PURCHASE_ORDER",
          details: "Generated and published Purchase Order PO-2026-0001 to PowerCell Systems",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          ipAddress: "192.168.4.15"
        },
        {
          id: "audit-3",
          userId: "user-2",
          userName: "Logistics Officer",
          userRole: "WAREHOUSE_MANAGER",
          action: "INSPECTED",
          module: "GOODS_RECEIPT",
          details: "Cleared Quality Check for GRN-2026-0001 (5/5 servers received in Good condition)",
          timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
          ipAddress: "192.168.5.101"
        }
      ];
      setLogs(defaultLogs);
      localStorage.setItem("deinrim_auditLogs_comp-1", JSON.stringify(defaultLogs));
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExportCSV = () => {
    const headers = "Timestamp,User Name,Role,Action,Module,Details,IP Address\n";
    const rows = logs.map(l => 
      `"${l.timestamp}","${l.userName}","${l.userRole}","${l.action}","${l.module}","${l.details}","${l.ipAddress}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `procurement_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    a.click();
  };

  const filtered = logs.filter(l => {
    return l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           l.module.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Search and control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search audit trail logs (user, description, module)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 font-semibold"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh logs ledger"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-indigo-600/15 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export CSV Trail</span>
          </button>
        </div>
      </div>

      {/* Compliance Advisory */}
      <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-3 flex items-start gap-2.5 text-[10px] text-indigo-300 leading-relaxed font-semibold">
        <Shield className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong>COMPLIANCE SECURITY INFORMATION:</strong> This log ledger records read/write transactions performed across authorized cost-centres in Kolkata operations. Deletion or modification of posted entries is strictly restricted under standard audit validation protocols.
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950 text-slate-300 font-semibold uppercase font-mono tracking-wider">
              <tr>
                <th className="px-5 py-3 text-left">Timestamp</th>
                <th className="px-5 py-3 text-left">User Profile</th>
                <th className="px-5 py-3 text-left">Action Code</th>
                <th className="px-5 py-3 text-left">Target Module</th>
                <th className="px-5 py-3 text-left">Transaction Details</th>
                <th className="px-5 py-3 text-right">IP Routing Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-semibold">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                    {new Date(l.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-200">{l.userName}</div>
                    <div className="text-[9px] text-slate-500 font-mono tracking-wider">{l.userRole}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                      l.action === "APPROVED" || l.action === "INSPECTED" ? "bg-emerald-500/10 text-emerald-400" :
                      l.action === "CREATED" || l.action === "PUBLISHED" ? "bg-indigo-500/10 text-indigo-400" :
                      "bg-amber-500/10 text-amber-300"
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300 font-mono text-[10px] uppercase">
                    {l.module.replace("_", " ")}
                  </td>
                  <td className="px-5 py-4 text-slate-200 leading-relaxed text-xs">
                    {l.details}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-500 text-[11px]">
                    {l.ipAddress}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                    No matching audit trails captured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

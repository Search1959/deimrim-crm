import { toast } from "../utils/toast";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FolderOpen, 
  UploadCloud, 
  FileText, 
  Trash2, 
  Download, 
  Paperclip, 
  Check, 
  Plus,
  X
} from "lucide-react";
import { AppDocument, Supplier, Customer, Employee, Asset, UserRole } from "../types";

interface DocumentViewProps {
  documents: AppDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<AppDocument[]>>;
  suppliers: Supplier[];
  customers: Customer[];
  employees: Employee[];
  assets: Asset[];
  userRole: UserRole;
  currentUserName: string;
}

export default function DocumentView({
  documents,
  setDocuments,
  suppliers,
  customers,
  employees,
  assets,
  userRole,
  currentUserName,
}: DocumentViewProps) {
  const canWrite = userRole !== UserRole.READ_ONLY;
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: "",
    fileSize: "1.2 MB",
    fileType: "PDF",
    attachedToType: "SUPPLIER" as AppDocument["attachedToType"],
    attachedToId: "",
  });

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.attachedToId) { toast.error("Specify document name and attachment"); return; }

    const document: AppDocument = {
      id: `doc-${Date.now()}`,
      name: newDoc.name,
      fileSize: newDoc.fileSize,
      fileType: newDoc.fileType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUserName,
      attachedToType: newDoc.attachedToType,
      attachedToId: newDoc.attachedToId,
      url: "#",
    };

    setDocuments(prev => [document, ...prev]);
    setNewDoc({
      name: "",
      fileSize: "1.2 MB",
      fileType: "PDF",
      attachedToType: "SUPPLIER",
      attachedToId: "",
    });
    setShowUploadForm(false);
    toast.success("Document Uploaded", "File attached to record")
  };

  const handleDeleteDoc = (id: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.warning("Document Deleted", "Removed from archive")
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6 text-left animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Document Vault</h1>
          <p className="text-sm text-slate-400 mt-1">Upload and attach legal agreements, sheets, or physical cargo logs to target accounts.</p>
        </div>

        {canWrite && (<button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 self-start cursor-pointer"
        >
          <UploadCloud className="h-4.5 w-4.5" />
          <span>Upload File</span>
        </button>)}
      </div>

      {/* DYNAMIC UPLOAD FORM */}
      {showUploadForm && (
        <form onSubmit={handleUploadDoc} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 space-y-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 border-b border-gray-50 pb-2 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <Paperclip className="h-4.5 w-4.5 text-indigo-400" />
              <span>Upload & Anchor Document</span>
            </h4>
            <button type="button" onClick={() => setShowUploadForm(false)} className="text-slate-500 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase">Document / File Name</label>
            <input
              type="text"
              required
              placeholder="Ex: Supplier_Agreement_TechDistributors_2026.pdf"
              value={newDoc.name}
              onChange={(e) => setNewDoc(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded bg-slate-800 border border-slate-700 text-white p-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase">File Form Extension</label>
            <select
              value={newDoc.fileType}
              onChange={(e) => setNewDoc(prev => ({ ...prev, fileType: e.target.value }))}
              className="mt-1 block w-full rounded bg-slate-800 border border-slate-700 text-white p-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="PDF">PDF Agreement (.pdf)</option>
              <option value="XLSX">Excel Spreadsheet (.xlsx)</option>
              <option value="DOCX">Word Document (.docx)</option>
              <option value="IMG">Image Attachment (.jpg / .png)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase">Attach To Model Category</label>
            <select
              value={newDoc.attachedToType}
              onChange={(e) => setNewDoc(prev => ({
                ...prev,
                attachedToType: e.target.value as any,
                attachedToId: "", // Reset target id when anchor type swaps
              }))}
              className="mt-1 block w-full rounded bg-slate-800 border border-slate-700 text-white p-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="SUPPLIER">Supplier Profile</option>
              <option value="CUSTOMER">Customer Profile</option>
              <option value="EMPLOYEE">HR Employee</option>
              <option value="ASSET">Company Asset</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase">Target Record anchor</label>
            <select
              required
              value={newDoc.attachedToId}
              onChange={(e) => setNewDoc(prev => ({ ...prev, attachedToId: e.target.value }))}
              className="mt-1 block w-full rounded bg-slate-800 border border-slate-700 text-white p-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Target record --</option>
              {newDoc.attachedToType === "SUPPLIER" && suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
              {newDoc.attachedToType === "CUSTOMER" && customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
              {newDoc.attachedToType === "EMPLOYEE" && employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeCode})</option>
              ))}
              {newDoc.attachedToType === "ASSET" && assets.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 text-right">
            <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
              Complete Upload & Attach
            </button>
          </div>
        </form>
      )}

      {/* DOCUMENT GRID ARCHIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          let anchorName = "Unanchored";
          if (doc.attachedToType === "SUPPLIER") anchorName = suppliers.find(s => s.id === doc.attachedToId)?.name || "Supplier";
          if (doc.attachedToType === "CUSTOMER") anchorName = customers.find(c => c.id === doc.attachedToId)?.name || "Customer";
          if (doc.attachedToType === "EMPLOYEE") anchorName = employees.find(e => e.id === doc.attachedToId)?.name || "Employee";
          if (doc.attachedToType === "ASSET") anchorName = assets.find(a => a.id === doc.attachedToId)?.name || "Asset";

          return (
            <div key={doc.id} className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-5 space-y-4 relative hover:border-indigo-100 transition-colors">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg bg-indigo-900/30 text-indigo-300 font-bold">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-bold text-slate-100 text-xs truncate max-w-[200px]" title={doc.name}>{doc.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono font-bold mt-1 block">Size: {doc.fileSize} / {doc.fileType}</span>
                </div>
              </div>

              <div className="bg-slate-800/30 p-2.5 rounded-lg border border-slate-700/50/50 text-[11px] text-slate-400 space-y-1">
                <div>Attached To: <strong className="text-slate-300 font-semibold">{doc.attachedToType}</strong></div>
                <div className="truncate font-medium text-indigo-400">Ref: {anchorName}</div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-gray-50 pt-2.5">
                <span>By: {doc.uploadedBy}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toast.info("Download", `Downloading ${doc.name}...`)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
                    title="Download File"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {canWrite && (<button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="rounded p-1 text-red-500 hover:bg-red-50"
                    title="Delete File"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

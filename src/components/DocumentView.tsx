import { toast } from "../utils/toast";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  FolderOpen, FolderPlus, UploadCloud, FileText, Trash2,
  Download, Plus, X, ChevronRight, Home, File,
  FileImage, FileSpreadsheet, Folder, Search
} from "lucide-react";
import { AppDocument, DocFolder, Supplier, Customer, Employee, Asset, UserRole } from "../types";

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

function fileIcon(type: string) {
  const t = type.toUpperCase();
  if (["JPG","JPEG","PNG","GIF","SVG","WEBP"].includes(t)) return <FileImage className="h-5 w-5 text-pink-400" />;
  if (["XLSX","XLS","CSV"].includes(t)) return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
  if (t === "PDF") return <FileText className="h-5 w-5 text-red-400" />;
  return <File className="h-5 w-5 text-indigo-400" />;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DocumentView({
  documents, setDocuments,
  suppliers, customers, employees, assets,
  userRole, currentUserName,
}: DocumentViewProps) {
  const canWrite = userRole !== UserRole.READ_ONLY;

  // Folder state (session-scoped)
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // UI state
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [search, setSearch] = useState("");
  const [attachType, setAttachType] = useState<AppDocument["attachedToType"]>("GENERAL");
  const [attachId, setAttachId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Breadcrumb path
  const buildPath = (fid: string | null): DocFolder[] => {
    const path: DocFolder[] = [];
    let id = fid;
    while (id) {
      const f = folders.find(x => x.id === id);
      if (!f) break;
      path.unshift(f);
      id = f.parentId;
    }
    return path;
  };
  const breadcrumb = buildPath(currentFolderId);

  // Current folder's subfolders + files
  const subFolders = folders.filter(f => f.parentId === currentFolderId);
  const currentDocs = documents.filter(d =>
    (d.folderId ?? null) === currentFolderId &&
    (search === "" || d.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Create folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const folder: DocFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
      createdBy: currentUserName,
    };
    setFolders(prev => [...prev, folder]);
    setNewFolderName("");
    setShowNewFolder(false);
    toast.success("Folder created");
  };

  const handleDeleteFolder = (id: string) => {
    if (!confirm("Delete folder and all its files?")) return;
    const collectIds = (fid: string): string[] => {
      const children = folders.filter(f => f.parentId === fid).map(f => f.id);
      return [fid, ...children.flatMap(collectIds)];
    };
    const ids = collectIds(id);
    setFolders(prev => prev.filter(f => !ids.includes(f.id)));
    setDocuments(prev => prev.filter(d => !ids.includes(d.folderId ?? "")));
    toast.warning("Folder deleted");
  };

  // File picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  // Upload multiple files
  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) { toast.error("Select at least one file"); return; }

    const now = new Date().toISOString();
    const newDocs: AppDocument[] = selectedFiles.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      fileSize: formatBytes(file.size),
      fileType: file.name.split(".").pop()?.toUpperCase() || "FILE",
      uploadedAt: now,
      uploadedBy: currentUserName,
      attachedToType: attachType,
      attachedToId: attachId || "none",
      url: URL.createObjectURL(file),
      folderId: currentFolderId,
    }));

    setDocuments(prev => [...newDocs, ...prev]);
    setSelectedFiles([]);
    setAttachType("GENERAL");
    setAttachId("");
    setShowUpload(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success(`${newDocs.length} file${newDocs.length > 1 ? "s" : ""} uploaded`);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this file?")) return;
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.warning("File deleted");
  };

  const anchorName = (doc: AppDocument) => {
    if (doc.attachedToType === "SUPPLIER")  return suppliers.find(s => s.id === doc.attachedToId)?.name;
    if (doc.attachedToType === "CUSTOMER")  return customers.find(c => c.id === doc.attachedToId)?.name;
    if (doc.attachedToType === "EMPLOYEE")  return employees.find(e => e.id === doc.attachedToId)?.name;
    if (doc.attachedToType === "ASSET")     return assets.find(a => a.id === doc.attachedToId)?.name;
    return null;
  };

  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-6 text-left animate-fadeIn">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Document Vault</h1>
          <p className="text-xs text-slate-400 mt-0.5">{documents.length} files · {folders.length} folders</p>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowNewFolder(true); setShowUpload(false); }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 cursor-pointer transition-all">
              <FolderPlus className="h-3.5 w-3.5 text-amber-400" /> New Folder
            </button>
            <button onClick={() => { setShowUpload(true); setShowNewFolder(false); }}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-xs font-bold text-white cursor-pointer transition-all">
              <UploadCloud className="h-3.5 w-3.5" /> Upload Files
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <button onClick={() => setCurrentFolderId(null)}
          className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
          <Home className="h-3.5 w-3.5" /> Root
        </button>
        {breadcrumb.map(f => (
          <React.Fragment key={f.id}>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <button onClick={() => setCurrentFolderId(f.id)}
              className="hover:text-white cursor-pointer transition-colors">{f.name}</button>
          </React.Fragment>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search files…"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
      </div>

      {/* New Folder inline */}
      {showNewFolder && (
        <div className="flex items-center gap-2 bg-slate-900/60 border border-amber-500/30 rounded-xl p-3">
          <Folder className="h-4 w-4 text-amber-400 shrink-0" />
          <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
            placeholder="Folder name…"
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500" />
          <button onClick={handleCreateFolder}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg cursor-pointer">Create</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
            className="text-slate-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Upload form */}
      {showUpload && (
        <form onSubmit={handleUpload} className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-indigo-400" /> Upload Files
              {currentFolderId && <span className="text-xs text-slate-400 font-normal">→ {breadcrumb[breadcrumb.length - 1]?.name}</span>}
            </p>
            <button type="button" onClick={() => { setShowUpload(false); setSelectedFiles([]); }}
              className="text-slate-500 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
          </div>

          {/* Drop zone */}
          <div onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors group">
            <UploadCloud className="h-8 w-8 text-slate-600 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
            <p className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">Click to select files</p>
            <p className="text-[10px] text-slate-600 mt-1">PDF, DOCX, XLSX, images — multiple files supported</p>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {fileIcon(f.name.split(".").pop() || "")}
                      <span className="text-xs text-slate-200 truncate max-w-[240px]">{f.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{formatBytes(f.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Attach To (optional)</label>
              <select value={attachType} onChange={e => { setAttachType(e.target.value as AppDocument["attachedToType"]); setAttachId(""); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                <option value="GENERAL">General / No attachment</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="CUSTOMER">Customer</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="ASSET">Asset</option>
              </select>
            </div>
            {attachType !== "GENERAL" && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Record</label>
                <select value={attachId} onChange={e => setAttachId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="">— choose —</option>
                  {attachType === "SUPPLIER"  && suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  {attachType === "CUSTOMER"  && customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {attachType === "EMPLOYEE"  && employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  {attachType === "ASSET"     && assets.map(a    => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowUpload(false); setSelectedFiles([]); }}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-all">
              Upload {selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </form>
      )}

      {/* Folders grid */}
      {subFolders.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Folders</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {subFolders.map(f => {
              const fileCount = documents.filter(d => d.folderId === f.id).length;
              return (
                <div key={f.id} className="group relative bg-slate-900/50 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 cursor-pointer transition-all"
                  onClick={() => setCurrentFolderId(f.id)}>
                  <Folder className="h-8 w-8 text-amber-400 mb-2" />
                  <p className="text-xs font-bold text-white truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fileCount} file{fileCount !== 1 ? "s" : ""}</p>
                  {canWrite && (
                    <button onClick={e => { e.stopPropagation(); handleDeleteFolder(f.id); }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded cursor-pointer transition-all">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files grid */}
      {currentDocs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Files</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDocs.map(doc => (
              <div key={doc.id} className="bg-slate-900/40 border border-slate-800 hover:border-slate-600 rounded-xl p-4 space-y-3 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-slate-800">
                    {fileIcon(doc.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-100 truncate" title={doc.name}>{doc.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.fileSize} · {doc.fileType}</p>
                  </div>
                </div>

                {anchorName(doc) && (
                  <div className="bg-slate-800/40 rounded-lg px-3 py-1.5 text-[10px] text-slate-400">
                    📎 {doc.attachedToType} · <span className="text-indigo-400">{anchorName(doc)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-600 border-t border-slate-800 pt-2">
                  <span>{doc.uploadedBy} · {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}</span>
                  <div className="flex gap-1">
                    <a href={doc.url} download={doc.name}
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    {canWrite && (
                      <button onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {subFolders.length === 0 && currentDocs.length === 0 && !showUpload && !showNewFolder && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="p-5 bg-indigo-500/10 rounded-2xl">
            <FolderOpen className="h-10 w-10 text-indigo-400" />
          </div>
          <div>
            <p className="text-slate-300 font-bold text-sm">
              {currentFolderId ? "This folder is empty" : "No documents yet"}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Use <strong className="text-indigo-400">Upload Files</strong> to add files or <strong className="text-amber-400">New Folder</strong> to organise.
            </p>
          </div>
          {canWrite && (
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold rounded-xl cursor-pointer transition-all">
                <FolderPlus className="h-4 w-4" /> New Folder
              </button>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all">
                <UploadCloud className="h-4 w-4" /> Upload Files
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Briefcase, Plus, User, Calendar, MapPin, X, ChevronDown } from "lucide-react";

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  status: "open" | "on-hold" | "closed";
  postedDate: string;
  applicants: number;
  shortlisted: number;
}

interface Applicant {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  stage: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
  appliedDate: string;
  resumeNote: string;
}

const SEED_JOBS: JobOpening[] = [
  { id: "j1", title: "Sales Executive", department: "Sales", location: "Kolkata", type: "full-time", status: "open", postedDate: "2026-10-01", applicants: 12, shortlisted: 4 },
  { id: "j2", title: "HR Coordinator", department: "HR", location: "Kolkata", type: "full-time", status: "open", postedDate: "2026-10-10", applicants: 8, shortlisted: 2 },
  { id: "j3", title: "Accounts Assistant", department: "Finance", location: "Remote", type: "part-time", status: "on-hold", postedDate: "2026-09-20", applicants: 5, shortlisted: 1 },
];

const SEED_APPLICANTS: Applicant[] = [
  { id: "a1", jobId: "j1", name: "Arjun Das", email: "arjun@mail.com", phone: "+91 98300 11111", stage: "interview", appliedDate: "2026-10-05", resumeNote: "3 yrs FMCG sales" },
  { id: "a2", jobId: "j1", name: "Meena Ghosh", email: "meena@mail.com", phone: "+91 98300 22222", stage: "screening", appliedDate: "2026-10-08", resumeNote: "Fresh graduate, MBA" },
  { id: "a3", jobId: "j2", name: "Ravi Patel", email: "ravi@mail.com", phone: "+91 98300 33333", stage: "offer", appliedDate: "2026-10-12", resumeNote: "2 yrs HR experience" },
  { id: "a4", jobId: "j1", name: "Sonia Banerjee", email: "sonia@mail.com", phone: "+91 98300 44444", stage: "hired", appliedDate: "2026-10-03", resumeNote: "5 yrs B2B sales, Kolkata" },
];

const STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
const STAGE_COLORS: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700",
  screening: "bg-sky-100 text-sky-700",
  interview: "bg-indigo-100 text-indigo-700",
  offer: "bg-amber-100 text-amber-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default function HRRecruitmentPanel() {
  const [jobs, setJobs] = useState<JobOpening[]>(SEED_JOBS);
  const [applicants, setApplicants] = useState<Applicant[]>(SEED_APPLICANTS);
  const [selectedJob, setSelectedJob] = useState<string | null>("j1");
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplicantForm, setShowApplicantForm] = useState(false);
  const [jForm, setJForm] = useState({ title: "", department: "", location: "Kolkata", type: "full-time" as JobOpening["type"] });
  const [aForm, setAForm] = useState({ name: "", email: "", phone: "", resumeNote: "" });

  const jobApplicants = applicants.filter(a => a.jobId === selectedJob);

  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault();
    setJobs(prev => [{ id: `j-${Date.now()}`, ...jForm, status: "open", postedDate: new Date().toISOString().split("T")[0], applicants: 0, shortlisted: 0 }, ...prev]);
    setShowJobForm(false);
    setJForm({ title: "", department: "", location: "Kolkata", type: "full-time" });
  };

  const handleAddApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setApplicants(prev => [{ id: `a-${Date.now()}`, jobId: selectedJob, ...aForm, stage: "applied", appliedDate: new Date().toISOString().split("T")[0] }, ...prev]);
    setJobs(prev => prev.map(j => j.id === selectedJob ? { ...j, applicants: j.applicants + 1 } : j));
    setShowApplicantForm(false);
    setAForm({ name: "", email: "", phone: "", resumeNote: "" });
  };

  const moveStage = (id: string, dir: 1 | -1) => {
    setApplicants(prev => prev.map(a => {
      if (a.id !== id) return a;
      const idx = STAGES.indexOf(a.stage);
      const newIdx = Math.max(0, Math.min(STAGES.length - 1, idx + dir));
      return { ...a, stage: STAGES[newIdx] };
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recruitment</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage job openings and applicant pipeline</p>
        </div>
        <button onClick={() => setShowJobForm(true)} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
          <Plus className="h-3.5 w-3.5" /> Post Job
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Open Positions", value: jobs.filter(j => j.status === "open").length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Applicants", value: applicants.length, color: "text-sky-600", bg: "bg-sky-50" },
          { label: "Hired This Month", value: applicants.filter(a => a.stage === "hired").length, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-xl p-4 border border-white`}>
            <p className="text-xs font-semibold text-slate-600">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {/* Job list */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Job Openings</span>
          </div>
          <div className="divide-y divide-slate-50">
            {jobs.map(j => (
              <button key={j.id} onClick={() => setSelectedJob(j.id)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedJob === j.id ? "bg-indigo-50 border-l-2 border-indigo-500" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{j.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location} · {j.department}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${j.status === "open" ? "bg-emerald-100 text-emerald-700" : j.status === "on-hold" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{j.status}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{j.applicants} applicants · {j.shortlisted} shortlisted</p>
              </button>
            ))}
          </div>
        </div>

        {/* Applicant pipeline */}
        <div className="md:col-span-3 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Applicants {selectedJob ? `— ${jobs.find(j => j.id === selectedJob)?.title}` : ""}</span>
            {selectedJob && <button onClick={() => setShowApplicantForm(true)} className="flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:text-indigo-800"><Plus className="h-3.5 w-3.5" /> Add</button>}
          </div>
          <div className="divide-y divide-slate-50">
            {jobApplicants.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Select a job or add applicants</p>
            ) : jobApplicants.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">{a.name[0]}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                    <p className="text-[10px] text-slate-400">{a.resumeNote}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STAGE_COLORS[a.stage]}`}>{a.stage}</span>
                  <div className="flex gap-0.5">
                    <button onClick={() => moveStage(a.id, -1)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><ChevronDown className="h-3 w-3 rotate-90" /></button>
                    <button onClick={() => moveStage(a.id, 1)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><ChevronDown className="h-3 w-3 -rotate-90" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Job Modal */}
      {showJobForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Post New Job</h3>
              <button onClick={() => setShowJobForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddJob} className="space-y-3">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Job Title</label><input required value={jForm.title} onChange={e => setJForm(p => ({ ...p, title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Department</label><input required value={jForm.department} onChange={e => setJForm(p => ({ ...p, department: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-semibold text-slate-600 mb-1">Location</label><input value={jForm.location} onChange={e => setJForm(p => ({ ...p, location: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select value={jForm.type} onChange={e => setJForm(p => ({ ...p, type: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="full-time">Full-Time</option><option value="part-time">Part-Time</option><option value="contract">Contract</option><option value="internship">Internship</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowJobForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Post Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Applicant Modal */}
      {showApplicantForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Add Applicant</h3>
              <button onClick={() => setShowApplicantForm(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddApplicant} className="space-y-3">
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label><input required value={aForm.name} onChange={e => setAForm(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Email</label><input type="email" required value={aForm.email} onChange={e => setAForm(p => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label><input value={aForm.phone} onChange={e => setAForm(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 mb-1">Resume Note</label><input value={aForm.resumeNote} onChange={e => setAForm(p => ({ ...p, resumeNote: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="e.g. 3 yrs FMCG sales" /></div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowApplicantForm(false)} className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

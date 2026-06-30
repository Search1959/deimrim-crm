import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { toast as toastEmitter, ToastItem } from "../utils/toast";

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
  error:   <XCircle     className="h-4 w-4 text-red-400    shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
  info:    <Info        className="h-4 w-4 text-indigo-400  shrink-0" />,
};

const bars = {
  success: "bg-emerald-500",
  error:   "bg-red-500",
  warning: "bg-amber-500",
  info:    "bg-indigo-500",
};

const DURATION = 4000;

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastEmitter.subscribe((t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, DURATION);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden pointer-events-auto animate-fadeIn"
        >
          {/* Progress bar */}
          <div
            className={`absolute top-0 left-0 h-0.5 ${bars[t.type]}`}
            style={{ animation: `shrink ${DURATION}ms linear forwards` }}
          />
          <div className="flex items-start gap-3 p-4">
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-snug">{t.title}</p>
              {t.message && (
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{t.message}</p>
              )}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-slate-500 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

type Listener = (toast: ToastItem) => void;
const listeners: Listener[] = [];

function emit(t: Omit<ToastItem, "id">) {
  const toast: ToastItem = { ...t, id: `${Date.now()}-${Math.random()}` };
  listeners.forEach(fn => fn(toast));
}

export const toast = {
  success: (title: string, message?: string) => emit({ type: "success", title, message }),
  error:   (title: string, message?: string) => emit({ type: "error",   title, message }),
  warning: (title: string, message?: string) => emit({ type: "warning", title, message }),
  info:    (title: string, message?: string) => emit({ type: "info",    title, message }),
  subscribe: (fn: Listener) => {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i > -1) listeners.splice(i, 1);
    };
  },
};

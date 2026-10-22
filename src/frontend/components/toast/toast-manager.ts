export type ToastTone = 'success' | 'error' | 'info';
export type ToastType = { id: number; tone: ToastTone; title: string; message?: string };

let toasts: ToastType[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const push = (tone: ToastTone, title: string, message?: string) => {
  const id = nextId++;
  toasts = [...toasts.slice(-3), { id, tone, title, message }];
  emit();
  window.setTimeout(() => ToastManager.Dismiss(id), tone === 'error' ? 7000 : 4500);
  return id;
};

/** Global toast queue — callable from services, components or plain functions. */
export const ToastManager = {
  Success: (title: string, message?: string) => push('success', title, message),
  Error: (title: string, message?: string) => push('error', title, message),
  Info: (title: string, message?: string) => push('info', title, message),
  Dismiss: (id: number) => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  },
  Get: () => toasts,
  Subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

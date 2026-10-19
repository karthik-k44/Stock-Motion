import type { ReactNode } from 'react';

export type ConfirmOptions = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let pending: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** `await ConfirmManager.Ask({...})` resolves true when the user confirms. Rendered by `<ConfirmHost />`. */
export const ConfirmManager = {
  Ask(options: ConfirmOptions): Promise<boolean> {
    pending?.resolve(false);
    return new Promise((resolve) => {
      pending = { ...options, resolve };
      emit();
    });
  },
  Resolve(ok: boolean) {
    pending?.resolve(ok);
    pending = null;
    emit();
  },
  Get: () => pending,
  Subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

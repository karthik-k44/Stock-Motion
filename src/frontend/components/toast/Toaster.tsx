import { useSyncExternalStore } from 'react';
import { Icon } from '@/frontend/components/icon';
import { ToastManager } from './toast-manager';

const ICON = { success: 'check', error: 'alert', info: 'truck' } as const;

export const Toaster = () => {
  const toasts = useSyncExternalStore(ToastManager.Subscribe, ToastManager.Get);
  return (
    <div className="toaster" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : 'status'}>
          <span className="toast-icon" aria-hidden>
            <Icon name={ICON[t.tone]} size={16} />
          </span>
          <div className="toast-text">
            <p className="toast-title">{t.title}</p>
            {t.message && <p className="toast-message">{t.message}</p>}
          </div>
          <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => ToastManager.Dismiss(t.id)}>
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

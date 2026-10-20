import type { ReactNode } from 'react';

/** Centred status for the moments before the app shell can render (restoring a session, loading a business). */
export const FullPageStatus = ({ title, children }: { title: string; children?: ReactNode }) => {
  return (
    <div className="full-status" role="status" aria-live="polite">
      <span className="spinner spinner-lg" aria-hidden />
      <p className="strong">{title}</p>
      {children}
    </div>
  );
};

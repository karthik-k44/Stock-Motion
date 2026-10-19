import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/frontend/components/button';
import { useOverlay } from '@/frontend/hooks/use-overlay';

type DrawerProps = {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Right-hand side panel (full screen on phones). */
export function Drawer({ open, title, subtitle, onClose, children, footer }: DrawerProps) {
  const ref = useOverlay<HTMLElement>(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return createPortal(
    <div className="overlay overlay-drawer" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="drawer">
        <header className="drawer-head">
          <div className="drawer-heading">
            <h2 id={titleId} className="drawer-title">
              {title}
            </h2>
            {subtitle && <div className="drawer-subtitle">{subtitle}</div>}
          </div>
          <Button variant="ghost" size="sm" icon="x" aria-label="Close panel" onClick={onClose} />
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}

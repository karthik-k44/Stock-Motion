import { useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/frontend/components/button';
import { useOverlay } from '@/frontend/hooks/use-overlay';
import { Cn } from '@/frontend/lib/utils';

type ModalProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
};

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }: ModalProps) {
  const ref = useOverlay<HTMLDivElement>(open, onClose);
  const titleId = useId();
  const descId = useId();
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={Cn('modal', size === 'sm' && 'modal-sm')}
      >
        <header className="modal-head">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          <Button variant="ghost" size="sm" icon="x" aria-label="Close dialog" onClick={onClose} />
        </header>
        {description && (
          <div id={descId} className="modal-desc">
            {description}
          </div>
        )}
        {children && <div className="modal-body">{children}</div>}
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

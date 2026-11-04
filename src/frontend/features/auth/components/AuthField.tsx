import { CircleCheck, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Cn } from '@/frontend/lib/utils';

type AuthFieldProps = {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
  /** Shows the green tick once the value is good */
  valid?: boolean;
  children: ReactNode;
};

/** The look of an input inside AuthField: the box around it carries the border and the focus ring. */
export const AUTH_INPUT = 'block w-full border-0 bg-transparent py-0 pl-0 text-sm font-medium text-ink outline-none';

/** A sign-in field: icon, divider, then the label and input stacked inside one rounded box. */
export const AuthField = ({ id, label, icon: FieldIcon, error, hint, valid, children }: AuthFieldProps) => (
  <div>
    <div
      className={Cn(
        'relative flex items-center rounded-xl border bg-surface transition-[border-color,box-shadow] focus-within:ring-[3px]',
        error ? 'border-danger focus-within:ring-danger/15' : 'border-line-strong focus-within:border-primary-600 focus-within:ring-primary-200',
      )}
    >
      <FieldIcon className="ml-3.5 size-[18px] flex-none text-ink-2" strokeWidth={1.8} aria-hidden />
      <span className="mx-3 h-8 w-px flex-none bg-line" aria-hidden />
      <div className="min-w-0 flex-1 py-2 pr-3">
        <label htmlFor={id} className="block text-[11px] leading-4 text-muted-foreground">
          {label}
        </label>
        {children}
      </div>
      {valid && <CircleCheck className="mr-3 size-[18px] flex-none text-success" strokeWidth={2.2} aria-hidden />}
    </div>
    {error ? (
      <p id={`${id}-error`} className="field-error mt-1.5" role="alert">
        {error}
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="field-hint mt-1.5">
        {hint}
      </p>
    ) : null}
  </div>
);

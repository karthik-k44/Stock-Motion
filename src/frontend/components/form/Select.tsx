import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { Cn } from '@/frontend/lib/utils';

type Option = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

/** Radix forbids an empty item value; "All …" / "None" options use '' in the app, so they travel as this. */
const EMPTY = '__none__';
const toUi = (v: string) => (v === '' ? EMPTY : v);
const fromUi = (v: string) => (v === EMPTY ? '' : v);

/** The app's select: shadcn/ui's Select (Radix) behind the same `options` / `onChange(value)` API as before. */
export const Select = ({ options, value, onChange, id, disabled, className, ...aria }: SelectProps) => (
  <UiSelect value={toUi(value)} onValueChange={(v) => onChange(fromUi(v))} disabled={disabled}>
    <SelectTrigger id={id} className={Cn('w-full bg-surface', className)} {...aria}>
      <SelectValue />
    </SelectTrigger>
    {/* Above modals and drawers (z-index 100–150 in overlay.css) */}
    <SelectContent position="popper" className="z-300 max-h-80">
      {options.map((o) => (
        <SelectItem key={toUi(o.value)} value={toUi(o.value)} disabled={o.disabled}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </UiSelect>
);

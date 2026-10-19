import type { SelectHTMLAttributes } from 'react';
import { Cn } from '@/frontend/lib/utils';

type Option = { value: string; label: string; disabled?: boolean };

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  options: Option[];
  onChange: (value: string) => void;
};

export function Select({ options, onChange, className, ...rest }: SelectProps) {
  return (
    <select className={Cn('input', 'select', className)} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

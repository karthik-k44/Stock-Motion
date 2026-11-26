import { Minus, Plus } from 'lucide-react';
import { Button as UiButton } from '@/frontend/components/ui/button';

type Props = {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Read out with the number, e.g. "inventories" */
  label: string;
};

/** A whole number between `min` and `max`: minus and plus buttons around a box you can also type into. */
export const InventoryStepper = ({ id, value, min, max, onChange, label }: Props) => {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : min)));
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-surface p-1">
      <UiButton type="button" variant="ghost" size="icon" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => set(value - 1)}>
        <Minus aria-hidden />
      </UiButton>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(e.target.valueAsNumber)}
        className="h-9 w-14 border-0 bg-transparent text-center text-lg font-bold text-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        aria-label={`Number of ${label}`}
      />
      <UiButton type="button" variant="ghost" size="icon" aria-label={`More ${label}`} disabled={value >= max} onClick={() => set(value + 1)}>
        <Plus aria-hidden />
      </UiButton>
    </div>
  );
};

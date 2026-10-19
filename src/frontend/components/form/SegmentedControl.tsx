import { Cn } from '@/frontend/lib/utils';

type Segment<T extends string> = { value: T; label: string; count?: number };

type SegmentedControlProps<T extends string> = {
  label: string;
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
};

/** A radio group styled as segmented tabs; arrow keys move between options. */
export function SegmentedControl<T extends string>({ label, value, options, onChange, size = 'md' }: SegmentedControlProps<T>) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.value === value);
    onChange(options[(i + dir + options.length) % options.length].value);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={Cn('segmented', size === 'sm' && 'segmented-sm')}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          move(1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={Cn('segment', active && 'segment-active')}
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.count !== undefined && <span className="segment-count">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

import { Text } from '@/frontend/components/text';
import { Cn } from '@/frontend/lib/utils';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import { TONE_CLASSES } from '../lib/tones';
import type { WorldBinType, WorldFactType, WorldSelectionType, WorldStatType } from '../types';
import { AnimatedNumber } from './AnimatedNumber';

const BIN: Record<WorldBinType['status'], string> = {
  IN_STOCK: 'bg-[#f1dcc0] text-[#6b4318]',
  LOW: 'bg-warning-bg text-warning ring-1 ring-inset ring-warning/40',
  OUT: 'bg-danger-bg text-danger ring-1 ring-inset ring-danger/40',
  EMPTY: 'bg-sunken text-muted-foreground',
};

const LEGEND: { status: WorldBinType['status']; label: string }[] = [
  { status: 'IN_STOCK', label: 'Stocked' },
  { status: 'LOW', label: 'Low' },
  { status: 'OUT', label: 'Out' },
  { status: 'EMPTY', label: 'Empty' },
];

/** The zone's shelves as a map: one cell per real slot (top level first), coloured by what it holds. */
export const BinMap = ({ columns, cells, label }: { columns: number; cells: WorldBinType[]; label: string }) => {
  const counts = LEGEND.map((l) => `${cells.filter((c) => c.status === l.status).length} ${l.label.toLowerCase()}`).join(', ');
  return (
    <div className="grid gap-2">
      <div className="grid gap-1.5" role="img" aria-label={`${label}: ${counts}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {cells.map((c) => (
          <span key={c.code} title={c.label} className={Cn('grid h-7 min-w-0 place-items-center overflow-hidden rounded-lg px-0.5 font-mono text-[10px] font-semibold', BIN[c.status])}>
            <span className="truncate">{c.code}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1" aria-hidden>
        {LEGEND.map((l) => (
          <Text key={l.status} as="span" variant="caption" className="inline-flex items-center gap-1.5">
            <span className={Cn('size-2.5 rounded-sm', BIN[l.status])} />
            {l.label}
          </Text>
        ))}
      </div>
    </div>
  );
};

export const StatTiles = ({ stats, currency, animate }: { stats: WorldStatType[]; currency: string; animate: boolean }) => (
  <dl className="m-0 grid grid-cols-2 gap-2">
    {stats.map((s) => (
      <div key={s.label} className="min-w-0 rounded-xl bg-sunken px-3 py-2.5">
        <Text variant="caption" as="dt" truncate title={s.label}>
          {s.label}
        </Text>
        <Text
          as="dd"
          variant="subheading"
          weight="bold"
          className="mt-0.5 tabular-nums"
          tone={s.tone === 'critical' ? 'danger' : s.tone === 'warning' ? 'warning' : s.tone === 'good' ? 'success' : 'ink'}
        >
          <AnimatedNumber value={s.value} animate={animate} format={(n) => (s.format === 'money' ? FormatMoney(n, currency) : FormatNumber(Math.round(n)))} />
          {s.suffix && (
            <Text as="span" variant="caption" className="ml-1">
              {s.suffix}
            </Text>
          )}
        </Text>
      </div>
    ))}
  </dl>
);

type FactsProps = { facts: WorldFactType[]; empty?: string; onSelect: (s: WorldSelectionType) => void };

/** Label / value rows. A row that stands for a record opens it in the inspector. */
export const FactList = ({ facts, empty, onSelect }: FactsProps) => {
  if (!facts.length) {
    return empty ? (
      <Text variant="small" tone="muted" className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-center">
        {empty}
      </Text>
    ) : null;
  }
  return (
    <ul className="m-0 grid">
      {facts.map((f) => {
        const value = (
          <Text as="span" variant="small" weight="semibold" tone="inherit" className={Cn('text-right', f.tone ? TONE_CLASSES[f.tone].text : 'text-ink')}>
            {f.value}
          </Text>
        );
        const label = (
          <Text as="span" variant="small" tone="secondary" truncate className="flex-1 text-left">
            {f.label}
          </Text>
        );
        return (
          <li key={f.key} className="border-b border-line last:border-b-0">
            {f.select ? (
              <button
                type="button"
                onClick={() => onSelect(f.select!)}
                className="flex w-full items-center gap-3 rounded-lg border-0 bg-transparent px-1 py-2.5 hover:bg-primary-50"
              >
                {label}
                {value}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-1 py-2.5">
                {label}
                {value}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

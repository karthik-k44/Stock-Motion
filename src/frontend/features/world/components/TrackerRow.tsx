import type { CSSProperties } from 'react';
import { Icon } from '@/frontend/components/icon';
import { Text } from '@/frontend/components/text';
import { Clamp, Cn } from '@/frontend/lib/utils';
import { TONE_CLASSES } from '../lib/tones';
import type { WorldRowType } from '../types';

type Props = { row: WorldRowType; index: number; selected: boolean; onSelect: () => void };

/** One record: its number and place, what it is, its status, and progress or timing. */
export const TrackerRow = ({ row, index, selected, onSelect }: Props) => (
  <li className="world-row-in" style={{ '--i': Math.min(index, 12) } as CSSProperties}>
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected || undefined}
      aria-label={`${row.id}, ${row.text}, ${row.status.label}, ${row.note}`}
      className={Cn(
        'grid w-full grid-cols-[minmax(84px,130px)_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border-0 px-2.5 py-2 text-left transition-colors @3xl:grid-cols-[130px_minmax(0,1fr)_120px_130px_16px]',
        selected ? 'bg-primary-50' : 'bg-transparent hover:bg-sunken',
      )}
    >
      <span className="min-w-0">
        <Text as="span" variant="code" className="block" truncate>
          {row.id}
        </Text>
        <Text as="span" variant="caption" className="block" truncate>
          {row.where}
        </Text>
      </span>
      <Text as="span" variant="small" tone="secondary" truncate>
        {row.text}
      </Text>
      <span>
        <Text as="span" variant="caption" weight="semibold" tone="inherit" className={Cn('inline-block whitespace-nowrap rounded-full px-2.5 py-1', TONE_CLASSES[row.status.tone].soft)}>
          {row.status.label}
        </Text>
      </span>
      <span className="hidden min-w-0 gap-1 @3xl:grid">
        {row.progress && (
          <span className="block h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <span
              className={Cn('block h-full rounded-full', TONE_CLASSES[row.status.tone].bar)}
              style={{ width: `${row.progress.max ? Clamp((row.progress.value / row.progress.max) * 100, 0, 100) : 0}%` }}
            />
          </span>
        )}
        <Text as="span" variant="caption" truncate>
          {row.note}
        </Text>
      </span>
      <Icon name="chevronRight" size={15} className="hidden text-muted-foreground @3xl:block" />
    </button>
  </li>
);

import { Link } from 'react-router';
import { Icon } from '@/frontend/components/icon';
import { ProgressBar } from '@/frontend/components/progress';
import { Text } from '@/frontend/components/text';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { Cn } from '@/frontend/lib/utils';
import { TONE_CLASSES } from '../lib/tones';
import type { WorldActionType, WorldInspectorType, WorldSelectionType } from '../types';
import { BinMap, FactList, StatTiles } from './InspectorParts';

type Props = {
  model: WorldInspectorType;
  currency: string;
  animate: boolean;
  onSelect: (s: WorldSelectionType) => void;
  onClose: () => void;
};

const ACTION = 'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold no-underline transition-colors';

const Action = ({ action }: { action: WorldActionType }) => {
  const drawer = useItemDrawer();
  const look = action.primary
    ? Cn(ACTION, 'bg-linear-to-br from-cta-from to-cta-to text-primary-foreground hover:brightness-95')
    : Cn(ACTION, 'border border-primary bg-surface text-cta-ink hover:bg-accent');
  if ('item' in action) {
    return (
      <button type="button" className={look} onClick={() => drawer.open(action.item)}>
        {action.label}
      </button>
    );
  }
  return (
    <Link className={look} to={action.to}>
      {action.label}
    </Link>
  );
};

/** The selected object or record, in full: status, progress, the shelves it holds, its numbers and its records. */
export const Inspector = ({ model, currency, animate, onSelect, onClose }: Props) => (
  <div className="flex min-h-0 flex-1 flex-col gap-4">
    <header className="flex items-start gap-3">
      <span className="grid size-11 flex-none place-items-center rounded-xl bg-primary-50 text-primary-700" aria-hidden>
        <Icon name={model.icon} size={21} />
      </span>
      <div className="min-w-0 flex-1">
        <Text variant="eyebrow" truncate>
          {model.eyebrow}
        </Text>
        <Text variant="heading" as="h2" className="mt-1 break-words">
          {model.title}
        </Text>
        {model.subtitle && (
          <Text variant="caption" className="mt-0.5">
            {model.subtitle}
          </Text>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close details"
        className="grid size-9 flex-none place-items-center rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-sunken hover:text-ink"
      >
        <Icon name="x" size={16} />
      </button>
    </header>

    {model.status && (
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Text as="span" variant="caption" weight="semibold" tone="inherit" className={Cn('rounded-full px-2.5 py-1', TONE_CLASSES[model.status.tone].soft)}>
            {model.status.label}
          </Text>
          {model.status.note && (
            <Text variant="caption" className="text-right">
              {model.status.note}
            </Text>
          )}
        </div>
        {model.progress && (
          <>
            <ProgressBar value={model.progress.value} max={model.progress.max} label={model.progress.label} />
            <Text variant="caption">{model.progress.label}</Text>
          </>
        )}
      </div>
    )}

    {model.alert && (
      <Text role="alert" variant="small" weight="medium" tone="danger" className="flex items-start gap-2 rounded-xl bg-danger-bg px-3 py-2.5">
        <Icon name="alert" size={15} className="mt-0.5 flex-none" />
        {model.alert}
      </Text>
    )}

    {model.bins && <BinMap columns={model.bins.columns} cells={model.bins.cells} label={`${model.title}: shelf map, ${model.bins.cells.length} slots`} />}
    {model.stats.length > 0 && <StatTiles stats={model.stats} currency={currency} animate={animate} />}
    <FactList facts={model.facts} empty={model.emptyFacts} onSelect={onSelect} />

    {model.actions.length > 0 && (
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {model.actions.map((a) => (
          <Action key={a.label} action={a} />
        ))}
      </div>
    )}
  </div>
);

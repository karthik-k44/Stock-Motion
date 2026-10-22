import type { Ref } from 'react';
import { Icon } from '@/frontend/components/icon';
import { Text } from '@/frontend/components/text';
import { Cn } from '@/frontend/lib/utils';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import { TONE_CLASSES } from '../lib/tones';
import type { WorldKpiType } from '../types';
import { AnimatedNumber } from './AnimatedNumber';

type Props = { kpis: WorldKpiType[]; currency: string; animate: boolean; ref?: Ref<HTMLElement> };

/** Today at a glance: four live numbers above the scene. */
export const KpiBar = ({ kpis, currency, animate, ref }: Props) => (
  <section ref={ref} aria-label="Today at a glance" className="world-kpis grid grid-cols-2 gap-3 lg:grid-cols-4">
    {kpis.map((k) => (
      <div key={k.key} className="flex min-w-0 items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card">
        <span className={Cn('grid size-10 flex-none place-items-center rounded-xl', TONE_CLASSES[k.tone].soft)} aria-hidden>
          <Icon name={k.icon} size={19} />
        </span>
        <div className="min-w-0">
          <Text variant="caption" weight="semibold" className="line-clamp-2" title={k.label}>
            {k.label}
          </Text>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Text variant="metric" as="span">
              <AnimatedNumber value={k.value} animate={animate} format={(n) => (k.format === 'money' ? FormatMoney(n, currency) : FormatNumber(Math.round(n)))} />
            </Text>
            {k.chip && (
              <Text variant="caption" weight="semibold" tone="inherit" as="span" className={Cn('rounded-full px-2 py-0.5', TONE_CLASSES[k.chip.tone].soft)}>
                {k.chip.text}
              </Text>
            )}
          </div>
          <Text variant="caption" className="mt-1 line-clamp-2" title={k.sub}>
            {k.sub}
          </Text>
        </div>
      </div>
    ))}
  </section>
);

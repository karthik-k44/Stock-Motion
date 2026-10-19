import { forwardRef } from 'react';
import { Link } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Icon } from '@/frontend/components/icon';
import { Cn } from '@/frontend/lib/utils';
import { FormatMoney, FormatNumber } from '@/frontend/utils/format';
import type { WorldContextType, WorldObjectSpecType } from '../types';
import { AnimatedNumber } from './AnimatedNumber';

type Props = { spec: WorldObjectSpecType; ctx: WorldContextType; animate: boolean; onClose: () => void };

/** Frosted-glass card with the object's live numbers. Positioned next to it by CardTracker. */
export const StatsCard = forwardRef<HTMLElement, Props>(function StatsCard({ spec, ctx, animate, onClose }, ref) {
  const stats = spec.stats(ctx);
  const alert = spec.alert?.(ctx);
  return (
    <section ref={ref} className="world-card" role="region" aria-label={`${spec.label} — live numbers`} aria-live="polite">
      <header className="world-card-head">
        <h2 className="world-card-title">{spec.label}</h2>
        <Button size="sm" variant="ghost" icon="x" aria-label="Close" onClick={onClose} />
      </header>
      {alert && (
        <p className="world-card-alert" role="alert">
          <Icon name="alert" size={14} /> {alert}
        </p>
      )}
      <dl className="world-stats">
        {stats.map((s) => (
          <div key={s.label} className={Cn('world-stat', s.tone && `world-stat-${s.tone}`)}>
            <dt>{s.label}</dt>
            <dd>
              <AnimatedNumber value={s.value} animate={animate} format={(n) => (s.format === 'money' ? FormatMoney(n, ctx.currency) : FormatNumber(Math.round(n)))} />
              {s.suffix && <span className="muted small"> {s.suffix}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {spec.link && (
        <Link className="link small" to={spec.link.to}>
          {spec.link.label} →
        </Link>
      )}
    </section>
  );
});

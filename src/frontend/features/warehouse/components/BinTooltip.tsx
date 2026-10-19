import { StockStatusBadge } from '@/frontend/features/inventory/components/StockStatusBadge';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { FormatNumber } from '@/frontend/utils/format';
import { describeLocation } from '../lib/layout';

export type TooltipState = { item: ItemResponseType; x: number; y: number; below: boolean };

/** Hover / focus card for a bin. Positioned in viewport pixels so text stays crisp at any zoom. */
export function BinTooltip({ state }: { state: TooltipState | null }) {
  if (!state) return null;
  const { item, x, y, below } = state;
  return (
    <div
      className={below ? 'bin-tip bin-tip-below' : 'bin-tip'}
      style={{ left: x, top: y }}
      role="tooltip"
    >
      <p className="bin-tip-name">{item.name}</p>
      <p className="mono muted small">
        {item.sku} · {item.location ? describeLocation(item.location) : 'Unassigned'}
      </p>
      <dl className="bin-tip-grid">
        <dt>On hand</dt>
        <dd>{FormatNumber(item.onHand)}</dd>
        <dt>Available</dt>
        <dd>{FormatNumber(item.available)}</dd>
        {item.reserved > 0 && (
          <>
            <dt>Reserved</dt>
            <dd>{FormatNumber(item.reserved)}</dd>
          </>
        )}
        {item.incoming > 0 && (
          <>
            <dt>Incoming</dt>
            <dd>+{FormatNumber(item.incoming)}</dd>
          </>
        )}
      </dl>
      <StockStatusBadge item={item} />
      <p className="bin-tip-hint">Click for details &amp; actions</p>
    </div>
  );
}

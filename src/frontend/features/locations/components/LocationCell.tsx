import { Cn } from '@/frontend/lib/utils';
import { CATEGORY_COLOR } from '@/frontend/utils/category';
import type { LocationResponseType } from '../types';

type Props = { location: LocationResponseType; dimmed: boolean; onOpen: (sku: string) => void };

export function LocationCell({ location, dimmed, onOpen }: Props) {
  const { item, code } = location;
  if (!item) {
    return (
      <div className={Cn('loc-cell', 'loc-empty', dimmed && 'loc-dim')} role="gridcell" aria-label={`${code}, empty`}>
        <span className="loc-code">{code}</span>
        <span className="muted small">Empty</span>
      </div>
    );
  }
  return (
    <div role="gridcell" className={Cn(dimmed && 'loc-dim')}>
      <button
        type="button"
        className={Cn('loc-cell', `loc-${item.status.toLowerCase()}`)}
        onClick={() => onOpen(item.sku)}
        aria-label={`${code}: ${item.name}, ${item.onHand} on hand, ${item.available} available`}
      >
        <span className="loc-code">
          <span className="cat-swatch" style={{ background: CATEGORY_COLOR[item.category] }} aria-hidden />
          {code}
        </span>
        <span className="loc-name">{item.name}</span>
        <span className="loc-qty">
          <strong>{item.onHand}</strong> on hand
          {item.reserved > 0 && <span className="tag tag-reserved">{item.reserved} res.</span>}
          {item.incoming > 0 && <span className="tag tag-incoming">+{item.incoming}</span>}
        </span>
        {item.status !== 'IN_STOCK' && <span className={`loc-flag loc-flag-${item.status.toLowerCase()}`}>{item.status === 'OUT' ? 'Out' : 'Low'}</span>}
      </button>
    </div>
  );
}

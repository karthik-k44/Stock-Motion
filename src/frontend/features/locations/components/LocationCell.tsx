import { Cn } from '@/frontend/lib/utils';
import { FormatQty } from '@/frontend/utils/format';
import type { LocationResponseType } from '../types';

type Props = { location: LocationResponseType; dimmed: boolean; onOpen: (sku: string) => void };

const worst = (l: LocationResponseType) =>
  l.items.some((i) => i.status === 'OUT') ? 'out' : l.items.some((i) => i.status === 'LOW') ? 'low' : 'in_stock';

/** One bin / shelf: empty, a single product (warehouse bins) or several items (shared shelves). */
export const LocationCell = ({ location, dimmed, onOpen }: Props) => {
  const { items, code, name } = location;
  if (!items.length) {
    return (
      <div className={Cn('loc-cell', 'loc-empty', dimmed && 'loc-dim')} role="gridcell" aria-label={`${name}, empty`}>
        <span className="loc-code">{code}</span>
        <span className="muted small">Empty</span>
      </div>
    );
  }
  const status = worst(location);
  return (
    <div role="gridcell" className={Cn('loc-cell', `loc-${status}`, 'loc-multi', dimmed && 'loc-dim')} aria-label={`${name}: ${items.length} item${items.length === 1 ? '' : 's'}`}>
      <span className="loc-code">{code}</span>
      <ul className="loc-items">
        {items.map((i) => (
          <li key={i.sku}>
            <button type="button" className="loc-item" onClick={() => onOpen(i.sku)}>
              <span className="loc-name">{i.name}</span>
              <span className="loc-qty">
                <strong>{FormatQty(i.onHand, i.unit)}</strong>
                {i.reserved > 0 && <span className="tag tag-reserved">{FormatQty(i.reserved, i.unit)} res.</span>}
                {i.status !== 'IN_STOCK' && <span className={`tag tag-${i.status === 'OUT' ? 'critical' : 'warning'}`}>{i.status === 'OUT' ? 'Out' : 'Low'}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

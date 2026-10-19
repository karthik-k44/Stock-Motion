import { FormatNumber } from '@/frontend/utils/format';
import type { ItemResponseType } from '../types';

export function ItemStats({ item }: { item: ItemResponseType }) {
  const stats = [
    { label: 'On hand', value: item.onHand, hint: item.unit },
    { label: 'Reserved', value: item.reserved, hint: 'for orders being picked' },
    { label: 'Available', value: item.available, hint: 'on hand − reserved', strong: true },
    { label: 'Reorder level', value: item.reorderLevel, hint: item.available <= item.reorderLevel ? 'at or below — reorder' : 'healthy' },
    { label: 'Incoming', value: item.incoming, hint: 'on open deliveries' },
  ];
  return (
    <dl className="item-stats">
      {stats.map((s) => (
        <div key={s.label} className={s.strong ? 'item-stat item-stat-strong' : 'item-stat'}>
          <dt>{s.label}</dt>
          <dd>
            <span className="item-stat-value">{FormatNumber(s.value)}</span>
            <span className="item-stat-hint">{s.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

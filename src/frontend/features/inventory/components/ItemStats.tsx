import { businessesService } from '@/frontend/features/businesses/services';
import { FormatMoney, FormatQty } from '@/frontend/utils/format';
import { ItemKindTypeEnum, type ItemResponseType } from '../types';

export function ItemStats({ item }: { item: ItemResponseType }) {
  const business = businessesService.useBusiness();
  const money = (n: number) => FormatMoney(n, business.currency);
  const q = (n: number) => FormatQty(n, item.unit);
  const stats =
    item.kind === ItemKindTypeEnum.STOCK
      ? [
          { label: 'On hand', value: q(item.onHand), hint: `worth ${money(item.onHand * item.cost)}` },
          { label: 'Reserved', value: q(item.reserved), hint: `for open ${business.template.labels.orders.toLowerCase()}` },
          { label: 'Available', value: q(item.available), hint: 'on hand − reserved', strong: true },
          { label: 'Reorder at', value: q(item.reorderLevel), hint: item.available <= item.reorderLevel ? 'at or below — reorder' : 'healthy' },
          { label: 'Incoming', value: q(item.incoming), hint: `on open ${business.template.labels.deliveries.toLowerCase()}` },
        ]
      : item.kind === ItemKindTypeEnum.MADE
        ? [
            { label: 'Can make now', value: String(item.available), hint: 'from available components', strong: true },
            { label: 'Price', value: money(item.price), hint: `per ${item.unit}` },
            { label: 'Warn below', value: String(item.reorderLevel), hint: 'shown as “few left”' },
          ]
        : [{ label: 'Price', value: money(item.price), hint: `per ${item.unit}`, strong: true }];
  return (
    <dl className="item-stats">
      {stats.map((s) => (
        <div key={s.label} className={s.strong ? 'item-stat item-stat-strong' : 'item-stat'}>
          <dt>{s.label}</dt>
          <dd>
            <span className="item-stat-value">{s.value}</span>
            <span className="item-stat-hint">{s.hint}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

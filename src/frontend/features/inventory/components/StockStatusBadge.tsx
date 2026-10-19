import { Badge } from '@/frontend/components/badge';
import { HumanizeStockStatus } from '@/frontend/utils/humanize';
import { ItemKindTypeEnum, type ItemResponseType } from '../types';

const TONE = { IN_STOCK: 'good', LOW: 'warning', OUT: 'critical' } as const;
const ICON = { IN_STOCK: 'check', LOW: 'alert', OUT: 'x' } as const;

export function StockStatusBadge({ item, withExtras = false }: { item: ItemResponseType; withExtras?: boolean }) {
  if (item.kind === ItemKindTypeEnum.SERVICE) return <Badge tone="info" icon="clock">Service</Badge>;
  const made = item.kind === ItemKindTypeEnum.MADE;
  return (
    <span className="badge-group">
      <Badge tone={TONE[item.status]} icon={ICON[item.status]}>
        {made && item.status === 'OUT' ? 'Can’t make' : made && item.status === 'LOW' ? 'Few left' : HumanizeStockStatus(item.status)}
      </Badge>
      {withExtras && item.reserved > 0 && (
        <Badge tone="reserved" icon="package">
          {item.reserved} reserved
        </Badge>
      )}
      {withExtras && item.incoming > 0 && (
        <Badge tone="incoming" icon="truck">
          {item.incoming} incoming
        </Badge>
      )}
    </span>
  );
}

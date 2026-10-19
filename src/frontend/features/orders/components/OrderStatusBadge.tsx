import { Badge } from '@/frontend/components/badge';
import { HumanizeOrderStatus } from '@/frontend/utils/humanize';
import { STATUS_TONE } from '../lib/order-flow';
import type { OrderStatusTypeEnum } from '../types';

const ICON = { NEW: 'orders', PICKING: 'box', PACKED: 'package', SHIPPED: 'check' } as const;

export function OrderStatusBadge({ status }: { status: OrderStatusTypeEnum }) {
  return (
    <Badge tone={STATUS_TONE[status]} icon={ICON[status]}>
      {HumanizeOrderStatus(status)}
    </Badge>
  );
}

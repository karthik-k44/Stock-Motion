import { Badge } from '@/frontend/components/badge';
import { HumanizeDeliveryStatus } from '@/frontend/utils/humanize';
import type { DeliveryStatusTypeEnum } from '../types';

const TONE = { SCHEDULED: 'neutral', IN_TRANSIT: 'info', UNLOADING: 'incoming', RECEIVED: 'good' } as const;
const ICON = { SCHEDULED: 'clock', IN_TRANSIT: 'truck', UNLOADING: 'box', RECEIVED: 'check' } as const;

export function DeliveryStatusBadge({ status }: { status: DeliveryStatusTypeEnum }) {
  return (
    <Badge tone={TONE[status]} icon={ICON[status]}>
      {HumanizeDeliveryStatus(status)}
    </Badge>
  );
}

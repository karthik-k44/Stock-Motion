import { Badge } from '@/frontend/components/badge';
import { HumanizeDeliveryStatus } from '@/frontend/utils/humanize';
import type { DeliveryStatusTypeEnum } from '../types';

const TONE = { SCHEDULED: 'neutral', IN_TRANSIT: 'info', ARRIVED: 'incoming', RECEIVED: 'good' } as const;
const ICON = { SCHEDULED: 'clock', IN_TRANSIT: 'truck', ARRIVED: 'box', RECEIVED: 'check' } as const;

export const DeliveryStatusBadge = ({ status }: { status: DeliveryStatusTypeEnum }) => {
  return (
    <Badge tone={TONE[status]} icon={ICON[status]}>
      {HumanizeDeliveryStatus(status)}
    </Badge>
  );
};

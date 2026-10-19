import { Badge } from '@/frontend/components/badge';
import { businessesService } from '@/frontend/features/businesses/services';
import { StatusLabel, StatusLook } from '../lib/order-flow';

export function OrderStatusBadge({ status }: { status: string }) {
  const { template } = businessesService.useBusiness();
  const look = StatusLook(template.orderFlow, status);
  return (
    <Badge tone={look.tone} icon={look.icon}>
      {StatusLabel(template.orderFlow, status)}
    </Badge>
  );
}

import { HumanizeOrderStatus } from '@/frontend/utils/humanize';
import { ORDER_STEPS } from '../lib/order-flow';
import type { OrderStatusTypeEnum } from '../types';

export function OrderStepper({ status }: { status: OrderStatusTypeEnum }) {
  const at = ORDER_STEPS.indexOf(status);
  return (
    <ol className="steps steps-lg" aria-label="Order progress">
      {ORDER_STEPS.map((s, i) => {
        const state = i < at || status === 'SHIPPED' ? 'done' : i === at ? 'current' : 'todo';
        return (
          <li key={s} className={`step step-${state}`} aria-current={i === at ? 'step' : undefined}>
            {HumanizeOrderStatus(s)}
          </li>
        );
      })}
    </ol>
  );
}

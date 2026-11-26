import { businessesService } from '@/frontend/features/businesses/services';
import { OrderStatusTypeEnum } from '../types';

export const OrderStepper = ({ status }: { status: string }) => {
  const { orderFlow } = businessesService.useBusiness().template;
  const at = orderFlow.findIndex((s) => s.status === status);
  const finished = orderFlow[at]?.closed;
  return (
    <ol className="steps steps-lg" aria-label="Progress">
      {orderFlow.map((s, i) => {
        const state = status === OrderStatusTypeEnum.CANCELLED ? 'todo' : i < at || finished ? 'done' : i === at ? 'current' : 'todo';
        return (
          <li key={s.status} className={`step step-${state}`} aria-current={i === at ? 'step' : undefined}>
            {s.label}
          </li>
        );
      })}
    </ol>
  );
};

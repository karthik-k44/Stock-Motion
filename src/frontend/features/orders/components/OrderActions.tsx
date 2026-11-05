import { Button } from '@/frontend/components/button';
import { ConfirmManager } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { NextStage, OpenLines, OpenUnits, ShortagesFromError, StageOf } from '../lib/order-flow';
import { ordersService } from '../services';
import type { OrderResponseType } from '../types';

/**
 * The next step in this business's flow (Release to picking / Start preparing / Book job …).
 * The badge, stepper and lists move on immediately; if the server refuses, they move back and the
 * reason (e.g. which stock is short) shows here.
 */
export const OrderActions = ({ order, onEditLines }: { order: OrderResponseType; onEditLines: () => void }) => {
  const business = businessesService.useBusiness();
  const { orderFlow, labels } = business.template;
  const advance = ordersService.useAdvanceOrder();
  const consume = ordersService.useConsumeOrder();
  const cancel = ordersService.useCancelOrder();
  const stage = StageOf(orderFlow, order.status);
  const next = NextStage(orderFlow, order.status);
  const shortages = advance.error ? ShortagesFromError(advance.error.details) : [];
  const open = OpenLines(order);

  if (order.closed) {
    return <p className="muted">{order.cancelled ? 'This was cancelled.' : `This ${labels.order.toLowerCase()} is finished.`}</p>;
  }

  const blocked = next?.requiresAllDone && open.length > 0;
  const move = async () => {
    if (!next) return;
    const effect = next.consumeOnEnter
      ? `Takes everything still open (${OpenUnits(order)} units) out of stock.`
      : next.reserves && !order.reserves
        ? `Reserves ${OpenUnits(order)} units so nobody else can use them.`
        : next.closed
          ? 'Closes it and counts it towards revenue. Anything not used is released.'
          : `Moves it to ${next.label.toLowerCase()}.`;
    if (await ConfirmManager.Ask({ title: `${next.action ?? next.label} · ${order.number}?`, message: effect, confirmLabel: next.action ?? next.label })) {
      advance.reset();
      advance.mutate({ number: order.number, stage: next });
    }
  };

  return (
    <div className="order-actions">
      {advance.error && (
        <div className="alert alert-critical" role="alert">
          <p className="strong">{advance.error.message}</p>
          {shortages.length > 0 && (
            <ul>
              {shortages.map((s) => (
                <li key={s.sku}>{s.name}: need {s.needed} {s.unit}, {s.available} available</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {stage?.consumeLines && open.length > 0 && (
        <Button icon="box" loading={consume.isPending} onClick={() => consume.mutate({ number: order.number })}>
          {labels.consume} all remaining
        </Button>
      )}
      {next && (
        <Button variant="primary" icon="play" disabled={blocked} title={blocked ? `${labels.consume} every line first` : undefined} onClick={move}>
          {next.action ?? next.label}
        </Button>
      )}
      {!order.reserves && order.doneUnits === 0 && <Button icon="edit" onClick={onEditLines}>Edit lines</Button>}
      {IsManagementRole(business.role) && (
        <Button
          variant="ghost"
          icon="x"
          loading={cancel.isPending}
          onClick={async () => {
            const ok = await ConfirmManager.Ask({ title: `Cancel ${order.number}?`, message: 'Reserved stock is released. Anything already used stays used.', confirmLabel: 'Cancel it', tone: 'danger' });
            if (ok) cancel.mutate(order.number);
          }}
        >
          Cancel
        </Button>
      )}
    </div>
  );
};

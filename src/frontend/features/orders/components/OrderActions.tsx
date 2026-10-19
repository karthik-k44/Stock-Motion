import { Button } from '@/frontend/components/button';
import { ConfirmManager } from '@/frontend/components/modal';
import { AllPicked, OpenUnits, ShortagesFromError } from '../lib/order-flow';
import { ordersService } from '../services';
import type { OrderResponseType, OrderShortageType } from '../types';

type Props = { order: OrderResponseType; preview: OrderShortageType[] };

/** The next status change for an order, each behind a confirmation. */
export function OrderActions({ order, preview }: Props) {
  const start = ordersService.useStartPickingMutation();
  const pickAll = ordersService.usePickAllMutation();
  const pack = ordersService.usePackMutation();
  const ship = ordersService.useShipMutation();
  const serverShortages = start.error ? ShortagesFromError(start.error.details) : [];
  const shortages = serverShortages.length ? serverShortages : preview;

  const ask = (title: string, message: string, confirmLabel: string) => ConfirmManager.Ask({ title, message, confirmLabel });

  return (
    <div className="order-actions">
      {order.status === 'NEW' && shortages.length > 0 && (
        <div className="alert alert-critical" role="alert">
          <p className="strong">Not enough available stock to release this order</p>
          <ul>
            {shortages.map((s) => (
              <li key={s.sku}>
                {s.name}: need {s.needed}, {s.available} available
              </li>
            ))}
          </ul>
        </div>
      )}
      {order.status === 'NEW' && (
        <Button
          variant="primary"
          icon="play"
          loading={start.isPending}
          disabled={preview.length > 0}
          onClick={async () => {
            if (await ask(`Release ${order.id} to picking?`, `Allocates ${OpenUnits(order)} units — they become reserved and leave available stock.`, 'Release to picking'))
              start.mutate(order.id);
          }}
        >
          Release to picking
        </Button>
      )}
      {order.status === 'PICKING' && (
        <>
          <Button
            icon="box"
            loading={pickAll.isPending}
            disabled={AllPicked(order)}
            onClick={async () => {
              if (await ask(`Pick all remaining lines?`, `${OpenUnits(order)} units will be taken from their bins for ${order.customer}.`, 'Pick all'))
                pickAll.mutate(order.id);
            }}
          >
            Pick all remaining
          </Button>
          <Button
            variant="primary"
            icon="package"
            loading={pack.isPending}
            disabled={!AllPicked(order)}
            title={AllPicked(order) ? undefined : 'Pick every line first'}
            onClick={async () => {
              if (await ask(`Mark ${order.id} packed?`, 'Confirms every line is boxed and labelled at the packing bench.', 'Mark packed')) pack.mutate(order.id);
            }}
          >
            Mark packed
          </Button>
        </>
      )}
      {order.status === 'PACKED' && (
        <Button
          variant="primary"
          icon="arrowUp"
          loading={ship.isPending}
          onClick={async () => {
            if (await ask(`Ship ${order.id}?`, `Hands the parcel for ${order.customer} to the carrier at the outbound door.`, 'Ship order')) ship.mutate(order.id);
          }}
        >
          Ship order
        </Button>
      )}
      {order.status === 'SHIPPED' && <p className="muted">This order has shipped. Nothing left to do.</p>}
    </div>
  );
}

import { Button } from '@/frontend/components/button';
import { businessesService } from '@/frontend/features/businesses/services';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { FormatMoney, FormatQty } from '@/frontend/utils/format';
import { StageOf } from '../lib/order-flow';
import { ordersService } from '../services';
import type { OrderResponseType } from '../types';

type Props = { order: OrderResponseType; stock: Map<string, ItemResponseType> };

/** Lines with what's available (before reserving) or what's done, and a per-line pick / use button. */
export const OrderLines = ({ order, stock }: Props) => {
  const business = businessesService.useBusiness();
  const { labels, orderFlow } = business.template;
  const drawer = useItemDrawer();
  const consume = ordersService.useConsumeMutation();
  const stage = StageOf(orderFlow, order.status);
  const working = Boolean(stage?.consumeLines) && !order.closed;
  const before = !order.reserves && !order.closed;

  return (
    <div className="table-wrap">
      <table className="table table-compact">
        <caption className="sr-only">Lines on {order.number}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">{labels.location}</th>
            <th scope="col" className="num">Qty</th>
            <th scope="col" className="num">{before ? 'Available' : labels.consumed}</th>
            <th scope="col" className="num">Amount</th>
            {working && <th scope="col"><span className="sr-only">Action</span></th>}
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l) => {
            const item = stock.get(l.sku);
            const done = l.done >= l.qty;
            const short = before && l.kind !== 'SERVICE' && (item?.available ?? 0) < l.qty;
            return (
              <tr key={l.sku}>
                <th scope="row">
                  <button type="button" className="row-title" onClick={() => drawer.open(l.sku)}>
                    <span className="cell-strong">{l.name}</span>
                    <span className="cell-sub mono">{l.sku}{l.kind === 'MADE' ? ` · ${labels.made.toLowerCase()}` : ''}</span>
                  </button>
                </th>
                <td className="mono">{l.location ?? '—'}</td>
                <td className="num">{FormatQty(l.qty, l.unit)}</td>
                <td className={short ? 'num text-critical' : 'num'}>
                  {before ? (l.kind === 'SERVICE' ? '—' : (item?.available ?? '—')) : done ? `✓ ${l.done}` : `${l.done} / ${l.qty}`}
                </td>
                <td className="num">{FormatMoney(l.qty * l.unitPrice, business.currency)}</td>
                {working && (
                  <td className="cell-actions">
                    {done ? (
                      <span className="tag tag-good">{labels.consumed}</span>
                    ) : (
                      <Button size="sm" icon="box" onClick={() => consume.mutate({ number: order.number, sku: l.sku })}>
                        {labels.consume}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={4} className="num">Total</th>
            <td className="num strong">{FormatMoney(order.total, business.currency)}</td>
            {working && <td />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

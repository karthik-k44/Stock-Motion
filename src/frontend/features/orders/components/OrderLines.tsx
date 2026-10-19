import { Button } from '@/frontend/components/button';
import { ConfirmManager } from '@/frontend/components/modal';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { ordersService } from '../services';
import type { OrderResponseType } from '../types';

type Props = { order: OrderResponseType; stock: Map<string, ItemResponseType> };

export function OrderLines({ order, stock }: Props) {
  const drawer = useItemDrawer();
  const pick = ordersService.usePickLineMutation();
  const picking = order.status === 'PICKING';

  return (
    <div className="table-wrap">
      <table className="table table-compact">
        <caption className="sr-only">Lines on {order.id}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Bin</th>
            <th scope="col" className="num">Qty</th>
            <th scope="col" className="num">{order.status === 'NEW' ? 'Available' : 'Picked'}</th>
            {picking && <th scope="col"><span className="sr-only">Action</span></th>}
          </tr>
        </thead>
        <tbody>
          {order.lines.map((l) => {
            const item = stock.get(l.sku);
            const done = l.picked >= l.qty;
            const short = order.status === 'NEW' && (item?.available ?? 0) < l.qty;
            return (
              <tr key={l.sku}>
                <th scope="row">
                  <button type="button" className="row-title" onClick={() => drawer.open(l.sku)}>
                    <span className="cell-strong">{l.name}</span>
                    <span className="cell-sub mono">{l.sku}</span>
                  </button>
                </th>
                <td className="mono">{l.location ?? '—'}</td>
                <td className="num">{l.qty}</td>
                <td className={short ? 'num text-critical' : 'num'}>
                  {order.status === 'NEW' ? (item?.available ?? '—') : done ? `✓ ${l.picked}` : `${l.picked} / ${l.qty}`}
                </td>
                {picking && (
                  <td className="cell-actions">
                    {done ? (
                      <span className="tag tag-good">Picked</span>
                    ) : (
                      <Button
                        size="sm"
                        icon="box"
                        loading={pick.isPending && pick.variables?.sku === l.sku}
                        disabled={pick.isPending}
                        onClick={async () => {
                          const ok = await ConfirmManager.Ask({
                            title: `Pick ${l.qty - l.picked} × ${l.name}?`,
                            message: `Takes ${l.qty - l.picked} from bin ${l.location} (${item?.onHand ?? '?'} on hand) for ${order.customer}.`,
                            confirmLabel: 'Confirm pick',
                          });
                          if (ok) pick.mutate({ id: order.id, sku: l.sku });
                        }}
                      >
                        Pick
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

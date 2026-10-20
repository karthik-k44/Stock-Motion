import { Card } from '@/frontend/components/card';
import { EmptyState } from '@/frontend/components/feedback';
import { StockStatusBadge } from '@/frontend/features/inventory/components/StockStatusBadge';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { FormatQty } from '@/frontend/utils/format';

export const LowStockList = ({ items }: { items: ItemResponseType[] }) => {
  const drawer = useItemDrawer();
  return (
    <Card title="Low stock" subtitle="Lowest cover against reorder level">
      {!items.length ? (
        <EmptyState icon="check" title="Nothing below reorder level" />
      ) : (
        <ul className="mini-list">
          {items.map((i) => (
            <li key={i.sku}>
              <button type="button" className="mini-row" onClick={() => drawer.open(i.sku)}>
                <span>
                  <span className="strong">{i.name}</span>
                  <span className="muted small block">
                    <span className="mono">{i.sku}</span> · {FormatQty(i.available, i.unit)} available / reorder at {FormatQty(i.reorderLevel, i.unit)}
                    {i.incoming > 0 && ` · +${FormatQty(i.incoming, i.unit)} incoming`}
                  </span>
                </span>
                <StockStatusBadge item={i} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

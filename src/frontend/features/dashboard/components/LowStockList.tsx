import { Card } from '@/frontend/components/card';
import { EmptyState } from '@/frontend/components/feedback';
import { StockStatusBadge } from '@/frontend/features/inventory/components/StockStatusBadge';
import type { ItemResponseType } from '@/frontend/features/inventory/types';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';

export function LowStockList({ items }: { items: ItemResponseType[] }) {
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
                  <span className="muted small block mono">
                    {i.sku} · {i.location} · {i.available} available / reorder {i.reorderLevel}
                    {i.incoming > 0 && ` · +${i.incoming} incoming`}
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
}

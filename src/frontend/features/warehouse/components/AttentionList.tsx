import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { EmptyState, SkeletonRows } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { StockStatusBadge } from '@/frontend/features/inventory/components/StockStatusBadge';
import { inventoryService } from '@/frontend/features/inventory/services';

/** Low and out-of-stock bins, each one click from its spot on the floor. */
export function AttentionList() {
  const navigate = useNavigate();
  const { data, isPending } = inventoryService.useItems();
  const needs = (data ?? []).filter((i) => i.status !== 'IN_STOCK').slice(0, 6);
  return (
    <Card title="Needs attention" subtitle="Low or out of stock">
      {isPending ? (
        <SkeletonRows rows={4} height={36} />
      ) : !needs.length ? (
        <EmptyState icon="check" title="Every bin is healthy" />
      ) : (
        <ul className="attention">
          {needs.map((i) => (
            <li key={i.sku} className="attention-row">
              <div>
                <p className="strong">{i.name}</p>
                <p className="muted small mono">
                  {i.location} · {i.available} available · reorder at {i.reorderLevel}
                </p>
              </div>
              <StockStatusBadge item={i} />
              <Button size="sm" variant="ghost" icon="locate" aria-label={`Locate ${i.name}`} onClick={() => navigate(paths.locateItem(i.sku))} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

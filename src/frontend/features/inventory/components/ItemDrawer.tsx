import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Drawer } from '@/frontend/components/drawer';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { paths } from '@/frontend/config/paths';
import { describeLocation } from '@/frontend/features/warehouse/lib/layout';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { CATEGORY_COLOR } from '@/frontend/utils/category';
import { HumanizeCategory } from '@/frontend/utils/humanize';
import { inventoryService } from '../services';
import { AdjustStockModal } from './AdjustStockModal';
import { ItemMovements } from './ItemMovements';
import { ItemOpenWork } from './ItemOpenWork';
import { ItemStats } from './ItemStats';
import { LocationMiniMap } from './LocationMiniMap';
import { RelocateModal } from './RelocateModal';
import { StockStatusBadge } from './StockStatusBadge';

/** The one item detail panel — opened from any screen via `?item=SKU`. */
export function ItemDrawer() {
  const { sku, close } = useItemDrawer();
  const navigate = useNavigate();
  const { data: item, isPending, isError, error, refetch } = inventoryService.useItem(sku);
  const [dialog, setDialog] = useState<'adjust' | 'relocate' | null>(null);

  return (
    <Drawer
      open={Boolean(sku)}
      onClose={close}
      title={item?.name ?? sku ?? ''}
      subtitle={
        item && (
          <>
            <span className="mono">{item.sku}</span>
            <span className="cat">
              <span className="cat-swatch" style={{ background: CATEGORY_COLOR[item.category] }} aria-hidden />
              {HumanizeCategory(item.category)}
            </span>
            <StockStatusBadge item={item} />
          </>
        )
      }
      footer={
        item && (
          <>
            <Button variant="primary" icon="sliders" onClick={() => setDialog('adjust')}>
              Adjust stock
            </Button>
            <Button icon="move" onClick={() => setDialog('relocate')}>
              Relocate
            </Button>
            <Button icon="locate" onClick={() => navigate(paths.locateItem(item.sku))}>
              Show in warehouse
            </Button>
          </>
        )
      }
    >
      {isPending ? (
        <SkeletonRows rows={5} height={56} label="Loading item" />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : (
        <>
          <ItemStats item={item} />
          <section className="drawer-section" aria-labelledby="loc-h">
            <h3 id="loc-h" className="section-title">
              Storage location
            </h3>
            <p>
              <span className="mono strong">{item.location ?? 'Unassigned'}</span>
              {item.location && <span className="muted"> · {describeLocation(item.location)}</span>}
            </p>
            <LocationMiniMap highlight={item.location} />
          </section>
          <section className="drawer-section" aria-labelledby="work-h">
            <h3 id="work-h" className="section-title">
              Open work
            </h3>
            <ItemOpenWork item={item} />
          </section>
          <section className="drawer-section" aria-labelledby="mv-h">
            <h3 id="mv-h" className="section-title">
              Stock movements
            </h3>
            <ItemMovements movements={item.movements} />
          </section>
          {dialog === 'adjust' && <AdjustStockModal item={item} open onClose={() => setDialog(null)} onDone={() => setDialog(null)} />}
          {dialog === 'relocate' && <RelocateModal item={item} open onClose={() => setDialog(null)} onDone={() => setDialog(null)} />}
        </>
      )}
    </Drawer>
  );
}

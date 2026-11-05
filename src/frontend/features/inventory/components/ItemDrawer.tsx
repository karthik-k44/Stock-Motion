import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Drawer } from '@/frontend/components/drawer';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { ConfirmManager } from '@/frontend/components/modal';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { useItemDrawer } from '@/frontend/hooks/use-item-drawer';
import { CategoryColor } from '@/frontend/utils/category';
import { categoriesService, inventoryService } from '../services';
import { ItemKindTypeEnum } from '../types';
import { AdjustStockModal } from './AdjustStockModal';
import { ItemFormModal } from './ItemFormModal';
import { ItemMovements } from './ItemMovements';
import { ItemOpenWork } from './ItemOpenWork';
import { ItemStats } from './ItemStats';
import { RecipeSection } from './RecipeSection';
import { RelocateModal } from './RelocateModal';
import { StockStatusBadge } from './StockStatusBadge';

/** The one item detail panel — opened from any screen via `?item=SKU`. */
export const ItemDrawer = () => {
  const { sku, open, close } = useItemDrawer();
  const navigate = useNavigate();
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  const { data: categories } = categoriesService.useGetCategories();
  const { data: item, isPending, isError, error, refetch } = inventoryService.useGetItem(sku);
  const archive = inventoryService.useArchiveItem();
  const [dialog, setDialog] = useState<'adjust' | 'relocate' | 'edit' | null>(null);
  const manager = IsManagementRole(business.role);
  const stocked = item?.kind === ItemKindTypeEnum.STOCK;

  const archiveItem = async () => {
    if (!item) return;
    const ok = await ConfirmManager.Ask({ title: `Archive ${item.name}?`, message: 'It disappears from lists and frees its location. Its history is kept.', confirmLabel: 'Archive', tone: 'danger' });
    if (ok) archive.mutate(item.sku, { onSuccess: close });
  };

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
              <span className="cat-swatch" style={{ background: CategoryColor(categories, item.category) }} aria-hidden />
              {categoriesService.CategoryName(categories, item.category)}
            </span>
            <StockStatusBadge item={item} />
          </>
        )
      }
      footer={
        item && (
          <>
            {stocked && <Button variant="primary" icon="sliders" onClick={() => setDialog('adjust')}>Adjust stock</Button>}
            {stocked && <Button icon="move" onClick={() => setDialog('relocate')}>Move</Button>}
            {stocked && <Button icon="locate" onClick={() => navigate(paths.locateItem(item.sku))}>Show in world</Button>}
            {manager && <Button icon="edit" onClick={() => setDialog('edit')}>Edit</Button>}
            {manager && <Button variant="danger-ghost" icon="trash" aria-label="Archive" title="Archive" loading={archive.isPending} onClick={archiveItem} />}
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
          {item.kind === ItemKindTypeEnum.MADE && (
            <section className="drawer-section" aria-labelledby="recipe-h">
              <h3 id="recipe-h" className="section-title">Made from</h3>
              <RecipeSection key={item.sku} item={item} canEdit={manager} onOpen={open} />
            </section>
          )}
          {stocked && (
            <section className="drawer-section" aria-labelledby="loc-h">
              <h3 id="loc-h" className="section-title">{labels.location} &amp; {labels.supplier.toLowerCase()}</h3>
              <p>
                <span className="mono strong">{item.location ?? 'Not stored yet'}</span>
                <span className="muted"> · {item.supplierName ?? `no ${labels.supplier.toLowerCase()}`}</span>
              </p>
              {item.usedIn.length > 0 && (
                <p className="muted small">
                  Used in {item.usedIn.map((u, i) => (
                    <span key={u.sku}>{i > 0 && ', '}<button type="button" className="link" onClick={() => open(u.sku)}>{u.name}</button> ({u.qty} {item.unit})</span>
                  ))}
                </p>
              )}
            </section>
          )}
          <section className="drawer-section" aria-labelledby="work-h">
            <h3 id="work-h" className="section-title">Open work</h3>
            <ItemOpenWork item={item} />
          </section>
          {stocked && (
            <section className="drawer-section" aria-labelledby="mv-h">
              <h3 id="mv-h" className="section-title">Stock movements</h3>
              <ItemMovements movements={item.movements} unit={item.unit} />
            </section>
          )}
          {dialog === 'adjust' && <AdjustStockModal item={item} onClose={() => setDialog(null)} />}
          {dialog === 'relocate' && <RelocateModal item={item} onClose={() => setDialog(null)} />}
          {dialog === 'edit' && <ItemFormModal item={item} onClose={() => setDialog(null)} onSaved={() => setDialog(null)} />}
        </>
      )}
    </Drawer>
  );
};

import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { EmptyState, ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { PageHeader } from '@/frontend/components/layout';
import { ConfirmManager } from '@/frontend/components/modal';
import { paths } from '@/frontend/config/paths';
import { businessesService } from '@/frontend/features/businesses/services';
import { IsManagementRole } from '@/frontend/features/businesses/types';
import { deliveriesService } from '@/frontend/features/deliveries/services';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { SupplierModal } from './components/SupplierModal';
import { suppliersService } from './services';
import type { SupplierResponseType } from './types';

export const Suppliers = () => {
  const business = businessesService.useBusiness();
  const { labels } = business.template;
  useDocumentTitle(labels.suppliers);
  const { data, isPending, isError, error, refetch } = suppliersService.useSuppliers();
  const remove = suppliersService.useDeleteSupplierMutation();
  const reorder = deliveriesService.useReorderMutation();
  const [editing, setEditing] = useState<SupplierResponseType | 'new' | null>(null);
  const manager = IsManagementRole(business.role);

  return (
    <div className="page">
      <PageHeader
        title={labels.suppliers}
        description={`Who you buy from, how long they take, and what's on the way from them.`}
        actions={manager && <Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add {labels.supplier.toLowerCase()}</Button>}
      />
      <Card flush>
        {isPending ? (
          <SkeletonRows rows={5} label="Loading" />
        ) : isError ? (
          <ErrorState message={error.message} onRetry={() => refetch()} />
        ) : !data.length ? (
          <EmptyState icon="store" title={`No ${labels.suppliers.toLowerCase()} yet`} action={manager && <Button size="sm" onClick={() => setEditing('new')}>Add one</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="table table-cards">
              <caption className="sr-only">{labels.suppliers}</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Contact</th>
                  <th scope="col" className="num">Lead time</th>
                  <th scope="col" className="num">Items</th>
                  <th scope="col" className="num">On the way</th>
                  {manager && <th scope="col"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" data-label="Name"><span className="cell-strong">{s.name}</span></th>
                    <td data-label="Contact">
                      {s.contact || '—'}
                      <span className="cell-sub">{[s.email, s.phone].filter(Boolean).join(' · ')}</span>
                    </td>
                    <td data-label="Lead time" className="num">{s.leadDays} day{s.leadDays === 1 ? '' : 's'}</td>
                    <td data-label="Items" className="num">{s.itemCount}</td>
                    <td data-label="On the way" className="num">{s.openDeliveries ? <Link className="link" to={paths.deliveries}>{s.openDeliveries}</Link> : '—'}</td>
                    {manager && (
                      <td className="cell-actions">
                        <Button size="sm" variant="ghost" icon="refresh" title="Reorder low stock from them" aria-label={`Reorder low stock from ${s.name}`} disabled={s.id.startsWith('pending')} onClick={() => reorder.mutate(s.id)} />
                        <Button size="sm" variant="ghost" icon="edit" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)} />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon="trash"
                          aria-label={`Delete ${s.name}`}
                          onClick={async () => {
                            const ok = await ConfirmManager.Ask({ title: `Delete ${s.name}?`, message: 'Items keep their stock; they just lose the link to this supplier.', confirmLabel: 'Delete', tone: 'danger' });
                            if (ok) remove.mutate(s.id);
                          }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <SupplierModal supplier={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

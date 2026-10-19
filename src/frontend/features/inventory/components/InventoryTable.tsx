import { useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { paths } from '@/frontend/config/paths';
import { Cn } from '@/frontend/lib/utils';
import { CATEGORY_COLOR } from '@/frontend/utils/category';
import { FormatNumber } from '@/frontend/utils/format';
import { HumanizeCategory } from '@/frontend/utils/humanize';
import type { ItemResponseType } from '../types';
import { StockStatusBadge } from './StockStatusBadge';

type Props = { items: ItemResponseType[]; selectedSku: string | null; onSelect: (sku: string) => void };

export function InventoryTable({ items, selectedSku, onSelect }: Props) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table className="table table-cards">
        <caption className="sr-only">Inventory items. Select a row to see details.</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Category</th>
            <th scope="col">Location</th>
            <th scope="col" className="num">On hand</th>
            <th scope="col" className="num">Reserved</th>
            <th scope="col" className="num">Available</th>
            <th scope="col" className="num">Reorder at</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.sku}
              className={Cn('row-click', selectedSku === item.sku && 'row-selected')}
              onClick={() => onSelect(item.sku)}
            >
              <th scope="row" data-label="Item">
                <button type="button" className="row-title" onClick={(e) => (e.stopPropagation(), onSelect(item.sku))}>
                  <span className="cell-strong">{item.name}</span>
                  <span className="cell-sub mono">{item.sku}</span>
                </button>
              </th>
              <td data-label="Category">
                <span className="cat">
                  <span className="cat-swatch" style={{ background: CATEGORY_COLOR[item.category] }} aria-hidden />
                  {HumanizeCategory(item.category)}
                </span>
              </td>
              <td data-label="Location" className="mono">{item.location ?? '—'}</td>
              <td data-label="On hand" className="num">{FormatNumber(item.onHand)}</td>
              <td data-label="Reserved" className="num">{item.reserved ? FormatNumber(item.reserved) : '—'}</td>
              <td data-label="Available" className="num cell-strong">{FormatNumber(item.available)}</td>
              <td data-label="Reorder at" className="num muted">{FormatNumber(item.reorderLevel)}</td>
              <td data-label="Status">
                <StockStatusBadge item={item} withExtras />
              </td>
              <td className="cell-actions">
                <Button
                  size="sm"
                  variant="ghost"
                  icon="locate"
                  aria-label={`Show ${item.name} in the warehouse`}
                  title="Show in warehouse"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(paths.locateItem(item.sku));
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

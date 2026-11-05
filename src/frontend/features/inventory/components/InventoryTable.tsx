import { businessesService } from '@/frontend/features/businesses/services';
import { Cn } from '@/frontend/lib/utils';
import { CategoryColor } from '@/frontend/utils/category';
import { FormatMoney, FormatQty } from '@/frontend/utils/format';
import { categoriesService } from '../services';
import { ItemKindTypeEnum, type ItemResponseType } from '../types';
import { StockStatusBadge } from './StockStatusBadge';

type Props = { kind: ItemKindTypeEnum; items: ItemResponseType[]; selectedSku: string | null; onSelect: (sku: string) => void };

const initials = (name: string) => name.slice(0, 2).toUpperCase();

/** Stock items show on hand / reserved / available; made items how many can be made; services just a price. */
export const InventoryTable = ({ kind, items, selectedSku, onSelect }: Props) => {
  const business = businessesService.useBusiness();
  const { data: categories } = categoriesService.useGetCategories();
  const stocked = kind === ItemKindTypeEnum.STOCK;
  const made = kind === ItemKindTypeEnum.MADE;
  return (
    <div className="table-wrap table-strips-wrap">
      <table className="table table-cards table-strips">
        <caption className="sr-only">Select a row to see details.</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Category</th>
            {stocked && <th scope="col">{business.template.labels.location}</th>}
            {stocked && <th scope="col" className="num">On hand</th>}
            {stocked && <th scope="col" className="num">Reserved</th>}
            {kind !== ItemKindTypeEnum.SERVICE && <th scope="col" className="num">{made ? 'Can make' : 'Available'}</th>}
            <th scope="col" className="num">{stocked ? 'Unit cost' : 'Price'}</th>
            {kind !== ItemKindTypeEnum.SERVICE && <th scope="col">Status</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const color = CategoryColor(categories, item.category);
            return (
            <tr key={item.sku} className={Cn('row-click', selectedSku === item.sku && 'row-selected')} onClick={() => onSelect(item.sku)}>
              <th scope="row" data-label="Item">
                <button type="button" className="row-item" onClick={(e) => (e.stopPropagation(), onSelect(item.sku))}>
                  <span className="item-thumb" style={{ background: `color-mix(in srgb, ${color} 18%, white)` }} aria-hidden>
                    {initials(item.name)}
                  </span>
                  <span className="row-title">
                    <span className="cell-strong">{item.name}</span>
                    <span className="cell-sub mono">{item.sku}</span>
                  </span>
                </button>
              </th>
              <td data-label="Category">
                <span className="cat">
                  <span className="cat-swatch" style={{ background: color }} aria-hidden />
                  {categoriesService.CategoryName(categories, item.category)}
                </span>
              </td>
              {stocked && <td data-label={business.template.labels.location} className="mono">{item.location ?? '—'}</td>}
              {stocked && <td data-label="On hand" className="num">{FormatQty(item.onHand, item.unit)}</td>}
              {stocked && <td data-label="Reserved" className="num">{item.reserved ? FormatQty(item.reserved, item.unit) : '—'}</td>}
              {kind !== ItemKindTypeEnum.SERVICE && (
                <td data-label={made ? 'Can make' : 'Available'} className="num cell-strong">
                  {made ? item.available : FormatQty(item.available, item.unit)}
                </td>
              )}
              <td data-label={stocked ? 'Unit cost' : 'Price'} className="num">
                {FormatMoney(stocked ? item.cost : item.price, business.currency)}
                {stocked && item.price > 0 && <span className="cell-sub">sells {FormatMoney(item.price, business.currency)}</span>}
              </td>
              {kind !== ItemKindTypeEnum.SERVICE && (
                <td data-label="Status">
                  <StockStatusBadge item={item} withExtras={stocked} />
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

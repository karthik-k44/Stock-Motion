import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Select } from '@/frontend/components/form';
import { FormatQty } from '@/frontend/utils/format';
import { inventoryService } from '../services';
import { ItemKindTypeEnum, type ComponentInput } from '../types';

type Props = { value: ComponentInput[]; onChange: (next: ComponentInput[]) => void; error?: string };

/** What a made item (menu item, job kit, bundle) is built from: stock items × quantity in their unit. */
export const RecipeEditor = ({ value, onChange, error }: Props) => {
  const { data: stock = [] } = inventoryService.useGetItems({ kind: ItemKindTypeEnum.STOCK });
  const [adding, setAdding] = useState('');
  const unused = stock.filter((s) => !value.some((c) => c.sku === s.sku));
  const canMake = value.length
    ? Math.min(...value.map((c) => Math.floor((stock.find((s) => s.sku === c.sku)?.available ?? 0) / Math.max(1, c.qty))))
    : 0;

  return (
    <div className="recipe">
      {value.length > 0 && (
        <ul className="recipe-list">
          {value.map((c) => {
            const item = stock.find((s) => s.sku === c.sku);
            return (
              <li key={c.sku} className="recipe-row">
                <span>
                  <span className="strong">{item?.name ?? c.sku}</span>
                  <span className="muted small block">{item ? `${FormatQty(item.available, item.unit)} available` : c.sku}</span>
                </span>
                <label className="recipe-qty">
                  <span className="sr-only">Quantity of {item?.name ?? c.sku}</span>
                  <input
                    className="input input-num"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={c.qty}
                    onChange={(e) => onChange(value.map((x) => (x.sku === c.sku ? { ...x, qty: Math.max(1, Math.round(Number(e.target.value) || 1)) } : x)))}
                  />
                  <span className="muted small">{item?.unit}</span>
                </label>
                <Button size="sm" variant="danger-ghost" icon="x" aria-label={`Remove ${item?.name ?? c.sku}`} onClick={() => onChange(value.filter((x) => x.sku !== c.sku))} />
              </li>
            );
          })}
        </ul>
      )}
      <div className="recipe-add">
        <Select
          aria-label="Add a component"
          value={adding}
          options={[{ value: '', label: unused.length ? 'Add a component…' : 'Every stock item is used' }, ...unused.map((s) => ({ value: s.sku, label: `${s.name} (${s.unit})` }))]}
          onChange={setAdding}
        />
        <Button size="sm" icon="plus" disabled={!adding} onClick={() => (onChange([...value, { sku: adding, qty: 1 }]), setAdding(''))}>
          Add
        </Button>
      </div>
      {error ? <p className="field-error" role="alert">{error}</p> : value.length > 0 && <p className="muted small">With today’s stock you can make {canMake}.</p>}
    </div>
  );
};

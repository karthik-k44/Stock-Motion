import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field, Select } from '@/frontend/components/form';
import { businessesService } from '@/frontend/features/businesses/services';
import { inventoryService } from '@/frontend/features/inventory/services';
import { FormatMoney } from '@/frontend/utils/format';

export type LineDraftType = { sku: string; qty: string };

type Props = { lines: LineDraftType[]; onChange: (lines: LineDraftType[]) => void; error?: string };

/** Pick what's on the order: anything you sell (stock, made items, services) × quantity. */
export function OrderLinesEditor({ lines, onChange, error }: Props) {
  const business = businessesService.useBusiness();
  const { data: items = [] } = inventoryService.useItems();
  const [adding, setAdding] = useState('');
  const sellable = items.filter((i) => i.kind !== 'STOCK' || i.price > 0);
  const priceOf = (sku: string) => items.find((i) => i.sku === sku)?.price ?? 0;
  const total = lines.reduce((s, l) => s + priceOf(l.sku) * (Number(l.qty) || 0), 0);

  return (
    <Field id="order-add" label="Lines" error={error}>
      {lines.length > 0 && (
        <ul className="recipe-list">
          {lines.map((l) => {
            const item = items.find((i) => i.sku === l.sku);
            return (
              <li key={l.sku} className="recipe-row">
                <span>
                  <span className="strong">{item?.name ?? l.sku}</span>
                  <span className="muted small block">
                    {FormatMoney(priceOf(l.sku), business.currency)} / {item?.unit}
                    {item && item.kind !== 'SERVICE' && ` · ${item.available} available`}
                  </span>
                </span>
                <label className="recipe-qty">
                  <span className="sr-only">Quantity of {item?.name}</span>
                  <input className="input input-num" type="number" min={1} inputMode="numeric" value={l.qty} onChange={(e) => onChange(lines.map((x) => (x.sku === l.sku ? { ...x, qty: e.target.value } : x)))} />
                </label>
                <Button size="sm" variant="ghost" icon="x" aria-label={`Remove ${item?.name ?? l.sku}`} onClick={() => onChange(lines.filter((x) => x.sku !== l.sku))} />
              </li>
            );
          })}
        </ul>
      )}
      <div className="recipe-add">
        <Select
          id="order-add"
          value={adding}
          options={[
            { value: '', label: 'Add an item…' },
            ...sellable.filter((i) => !lines.some((l) => l.sku === i.sku)).map((i) => ({ value: i.sku, label: `${i.name} · ${FormatMoney(i.price, business.currency)}` })),
          ]}
          onChange={setAdding}
        />
        <Button size="sm" icon="plus" disabled={!adding} onClick={() => (onChange([...lines, { sku: adding, qty: '1' }]), setAdding(''))}>
          Add
        </Button>
      </div>
      {lines.length > 0 && <p className="strong">Total {FormatMoney(total, business.currency)}</p>}
    </Field>
  );
}

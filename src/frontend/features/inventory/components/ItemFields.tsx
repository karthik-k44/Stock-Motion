import { describedBy, Field, Select } from '@/frontend/components/form';
import { businessesService } from '@/frontend/features/businesses/services';
import { locationsService } from '@/frontend/features/locations/services';
import { suppliersService } from '@/frontend/features/suppliers/services';
import { categoriesService } from '../services';
import { ItemKindTypeEnum } from '../types';

export type ItemFieldValuesType = Record<
  'sku' | 'name' | 'category' | 'unit' | 'onHand' | 'reorderLevel' | 'cost' | 'price' | 'location' | 'supplierId',
  string
>;

type Props = {
  kind: ItemKindTypeEnum;
  values: ItemFieldValuesType;
  errors: Record<string, string>;
  onChange: (key: keyof ItemFieldValuesType, value: string) => void;
  editing: boolean;
};

/** The form fields for an item; which ones show depends on the kind (stock / made / service). */
export const ItemFields = ({ kind, values, errors, onChange, editing }: Props) => {
  const business = businessesService.useBusiness();
  const { template } = business;
  const { data: categories = [] } = categoriesService.useCategories();
  const { data: locations = [] } = locationsService.useLocations();
  const { data: suppliers = [] } = suppliersService.useSuppliers();
  const stocked = kind === ItemKindTypeEnum.STOCK;
  const free = locations.filter((l) => !template.exclusiveLocations || !l.items.length);
  // The template's units, plus the item's own if it came in with another one (CSV import accepts any unit).
  const units = [...new Set([...template.units, values.unit].filter(Boolean))];

  const input = (key: keyof ItemFieldValuesType, label: string, opts: { type?: string; hint?: string; disabled?: boolean } = {}) => (
    <Field id={`item-${key}`} label={label} error={errors[key]} hint={opts.hint}>
      <input
        id={`item-${key}`}
        className="input"
        type={opts.type ?? 'text'}
        inputMode={opts.type === 'number' ? 'decimal' : undefined}
        step="any"
        min={opts.type === 'number' ? 0 : undefined}
        disabled={opts.disabled}
        value={values[key]}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={describedBy(`item-${key}`, errors[key], opts.hint)}
        onChange={(e) => onChange(key, e.target.value)}
      />
    </Field>
  );

  return (
    <div className="form-grid">
      {input('sku', 'SKU / code', { disabled: editing, hint: editing ? 'SKUs can’t change' : 'e.g. MUG-001' })}
      {input('name', 'Name')}
      <Field id="item-category" label="Category" error={errors.category}>
        <Select id="item-category" value={values.category} options={[{ value: '', label: 'Choose…' }, ...categories.map((c) => ({ value: c.code, label: c.name }))]} onChange={(v) => onChange('category', v)} />
      </Field>
      <Field id="item-unit" label="Unit" error={errors.unit} hint={stocked ? 'Counted in this unit everywhere' : undefined}>
        <Select id="item-unit" value={values.unit} options={units.map((u) => ({ value: u, label: u }))} onChange={(v) => onChange('unit', v)} aria-invalid={Boolean(errors.unit)} />
      </Field>
      {stocked && !editing && input('onHand', 'On hand now', { type: 'number', hint: 'Recorded as opening stock' })}
      {kind !== ItemKindTypeEnum.SERVICE && input('reorderLevel', stocked ? 'Reorder at' : 'Warn when fewer than', { type: 'number' })}
      {stocked && input('cost', `Cost per ${values.unit || 'unit'}`, { type: 'number', hint: business.currency })}
      {input('price', stocked ? 'Sell price (0 if not sold)' : 'Price', { type: 'number', hint: business.currency })}
      {stocked && !editing && (
        <Field id="item-location" label={template.labels.location} error={errors.location}>
          <Select id="item-location" value={values.location} options={[{ value: '', label: 'Not stored yet' }, ...free.map((l) => ({ value: l.code, label: `${l.code} — ${l.name}` }))]} onChange={(v) => onChange('location', v)} />
        </Field>
      )}
      {stocked && (
        <Field id="item-supplier" label={template.labels.supplier} error={errors.supplierId}>
          <Select id="item-supplier" value={values.supplierId} options={[{ value: '', label: 'None' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]} onChange={(v) => onChange('supplierId', v)} />
        </Field>
      )}
    </div>
  );
};

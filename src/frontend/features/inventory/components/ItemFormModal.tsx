import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { FieldErrors, ToNumber } from '@/frontend/lib/form';
import { KindLabel } from '../lib/inventory-options';
import { inventoryService } from '../services';
import { ItemFormSchema, ItemKindTypeEnum, type ComponentInput, type ItemResponseType } from '../types';
import { ItemFields, type ItemFieldValuesType } from './ItemFields';
import { RecipeEditor } from './RecipeEditor';

type Props =
  | { kind: ItemKindTypeEnum; item?: undefined; onClose: () => void; onSaved: (sku: string) => void }
  | { kind?: undefined; item: ItemResponseType; onClose: () => void; onSaved: (sku: string) => void };

const toValues = (item: ItemResponseType | undefined, unit: string): ItemFieldValuesType => ({
  sku: item?.sku ?? '',
  name: item?.name ?? '',
  category: item?.category ?? '',
  unit: item?.unit ?? unit,
  onHand: '0',
  reorderLevel: String(item?.reorderLevel ?? 0),
  cost: String(item?.cost ?? 0),
  price: String(item?.price ?? 0),
  location: item?.location ?? '',
  supplierId: item?.supplierId ?? '',
});

/** Add a stock item, made item or service — or edit one. */
export function ItemFormModal(props: Props) {
  const { template } = businessesService.useBusiness();
  const kind = props.item?.kind ?? props.kind!;
  const editing = Boolean(props.item);
  const [values, setValues] = useState(() => toValues(props.item, template.units[0] ?? 'ea'));
  const [components, setComponents] = useState<ComponentInput[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = inventoryService.useCreateItemMutation();
  const update = inventoryService.useUpdateItemMutation();
  const label = KindLabel(template.labels, kind);

  const submit = () => {
    const parsed = ItemFormSchema.safeParse({
      ...values,
      kind,
      onHand: ToNumber(values.onHand),
      reorderLevel: ToNumber(values.reorderLevel),
      cost: kind === ItemKindTypeEnum.STOCK ? ToNumber(values.cost) : 0,
      price: ToNumber(values.price),
      location: values.location || null,
      supplierId: values.supplierId || null,
    });
    const errs = parsed.success ? {} : FieldErrors(parsed.error);
    if (!editing && kind === ItemKindTypeEnum.MADE && !components.length) errs.components = 'Add what it is made from';
    setErrors(errs);
    if (!parsed.success || Object.keys(errs).length) return;
    const onError = (err: { message: string; fieldErrors: () => Record<string, string> }) => setErrors({ form: err.message, ...err.fieldErrors() });
    const d = parsed.data;
    if (editing) {
      const input = { name: d.name, category: d.category, unit: d.unit, reorderLevel: d.reorderLevel, cost: d.cost, price: d.price, supplierId: d.supplierId };
      update.mutate({ sku: d.sku, input }, { onSuccess: () => props.onSaved(d.sku), onError });
    } else {
      create.mutate({ ...parsed.data, components }, { onSuccess: (item) => props.onSaved(item.sku), onError });
    }
  };

  return (
    <Modal
      open
      onClose={props.onClose}
      title={editing ? `Edit ${props.item!.name}` : `Add a ${label.toLowerCase()}`}
      footer={
        <>
          <Button onClick={props.onClose}>Cancel</Button>
          <Button variant="primary" loading={create.isPending || update.isPending} onClick={submit}>
            {editing ? 'Save changes' : `Add ${label.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <ItemFields kind={kind} values={values} errors={errors} editing={editing} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
        {kind === ItemKindTypeEnum.MADE && !editing && (
          <fieldset className="fieldset">
            <legend className="field-label">Made from</legend>
            <RecipeEditor value={components} onChange={setComponents} error={errors.components} />
          </fieldset>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

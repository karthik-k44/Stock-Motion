import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field, SegmentedControl, Select } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { inventoryService } from '@/frontend/features/inventory/services';
import { ItemKindTypeEnum } from '@/frontend/features/inventory/types';
import { suppliersService } from '@/frontend/features/suppliers/services';
import { FieldErrors, ToNumber } from '@/frontend/lib/form';
import { deliveriesService } from '../services';
import { DeliveryStatusTypeEnum, NewDeliverySchema } from '../types';

const STATUS = [
  { value: DeliveryStatusTypeEnum.SCHEDULED, label: 'Scheduled' },
  { value: DeliveryStatusTypeEnum.IN_TRANSIT, label: 'Already on the way' },
];

/** Book stock coming in from a supplier. */
export const NewDeliveryModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: (number: string) => void }) => {
  const { labels } = businessesService.useBusiness().template;
  const { data: suppliers = [] } = suppliersService.useGetSuppliers();
  const { data: stock = [] } = inventoryService.useGetItems({ kind: ItemKindTypeEnum.STOCK });
  const create = deliveriesService.useCreateDelivery();
  const [supplierId, setSupplierId] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState<typeof STATUS[number]['value']>(DeliveryStatusTypeEnum.SCHEDULED);
  const [lines, setLines] = useState<{ sku: string; expected: string }[]>([]);
  const [adding, setAdding] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Suggest the chosen supplier's own items first.
  const choices = [...stock].sort((a, b) => Number(b.supplierId === supplierId) - Number(a.supplierId === supplierId)).filter((i) => !lines.some((l) => l.sku === i.sku));

  const submit = () => {
    const parsed = NewDeliverySchema.safeParse({ supplierId, expectedAt, vehicle, reference, status, lines: lines.map((l) => ({ sku: l.sku, expected: ToNumber(l.expected) })) });
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    setErrors({});
    create.mutate(parsed.data, { onSuccess: (d) => onSaved(d.number), onError: (err) => setErrors({ form: err.message }) });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Book a ${labels.delivery.toLowerCase()}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={create.isPending} onClick={submit}>Book</Button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <div className="form-grid">
          <Field id="dlv-supplier" label={labels.supplier} error={errors.supplierId}>
            <Select id="dlv-supplier" value={supplierId} options={[{ value: '', label: 'Choose…' }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]} onChange={setSupplierId} />
          </Field>
          <Field id="dlv-at" label="Expected" error={errors.expectedAt}>
            <input id="dlv-at" className="input" type="datetime-local" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} aria-invalid={Boolean(errors.expectedAt)} />
          </Field>
          <Field id="dlv-vehicle" label={`${labels.vehicle} (optional)`}>
            <input id="dlv-vehicle" className="input" maxLength={40} value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          </Field>
          <Field id="dlv-ref" label="Reference (optional)">
            <input id="dlv-ref" className="input" maxLength={40} value={reference} onChange={(e) => setReference(e.target.value)} />
          </Field>
        </div>
        <SegmentedControl label="Status" size="sm" value={status} options={STATUS} onChange={setStatus} />
        <Field id="dlv-add" label="What’s coming" error={errors.lines}>
          {lines.length > 0 && (
            <ul className="recipe-list">
              {lines.map((l) => {
                const item = stock.find((s) => s.sku === l.sku);
                return (
                  <li key={l.sku} className="recipe-row">
                    <span className="strong">{item?.name ?? l.sku}</span>
                    <label className="recipe-qty">
                      <span className="sr-only">Quantity of {item?.name}</span>
                      <input className="input input-num" type="number" min={1} value={l.expected} onChange={(e) => setLines(lines.map((x) => (x.sku === l.sku ? { ...x, expected: e.target.value } : x)))} />
                      <span className="muted small">{item?.unit}</span>
                    </label>
                    <Button size="sm" variant="danger-ghost" icon="x" aria-label={`Remove ${item?.name}`} onClick={() => setLines(lines.filter((x) => x.sku !== l.sku))} />
                  </li>
                );
              })}
            </ul>
          )}
          <div className="recipe-add">
            <Select id="dlv-add" value={adding} options={[{ value: '', label: 'Add an item…' }, ...choices.map((i) => ({ value: i.sku, label: `${i.name} (${i.available} ${i.unit} available)` }))]} onChange={setAdding} />
            <Button size="sm" icon="plus" disabled={!adding} onClick={() => (setLines([...lines, { sku: adding, expected: String(Math.max(stock.find((s) => s.sku === adding)?.reorderLevel ?? 1, 1)) }]), setAdding(''))}>
              Add
            </Button>
          </div>
        </Field>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
};

import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field, Select } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { customersService } from '@/frontend/features/customers/services';
import { teamService } from '@/frontend/features/team/services';
import { FieldErrors, ToNumber } from '@/frontend/lib/form';
import { ordersService } from '../services';
import { NewOrderSchema, type OrderResponseType } from '../types';
import { OrderLinesEditor, type LineDraftType } from './OrderLinesEditor';

type Props = { onClose: () => void; onSaved: (number: string) => void; order?: OrderResponseType };

/** A new order / ticket / job — or, with `order`, change the lines of one that hasn't started. */
export function NewOrderModal({ onClose, onSaved, order }: Props) {
  const { template } = businessesService.useBusiness();
  const { labels } = template;
  const { data: customers = [] } = customersService.useCustomers();
  const { data: members = [] } = teamService.useMembers();
  const create = ordersService.useCreateOrderMutation();
  const setLines = ordersService.useSetLinesMutation();
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLinesDraft] = useState<LineDraftType[]>(order?.lines.map((l) => ({ sku: l.sku, qty: String(l.qty) })) ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const parsed = NewOrderSchema.safeParse({
      customerId: customerId || null,
      customerName: order ? order.customerName : customerName,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      assigneeId: assigneeId || null,
      notes,
      lines: lines.map((l) => ({ sku: l.sku, qty: ToNumber(l.qty) })),
    });
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    setErrors({});
    const onError = (err: { message: string }) => setErrors({ form: err.message });
    if (order) setLines.mutate({ number: order.number, lines: parsed.data.lines }, { onSuccess: () => onSaved(order.number), onError });
    else create.mutate(parsed.data, { onSuccess: (o) => onSaved(o.number), onError });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={order ? `Lines on ${order.number}` : `New ${labels.order.toLowerCase()}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={create.isPending || setLines.isPending} onClick={submit}>{order ? 'Save lines' : `Create ${labels.order.toLowerCase()}`}</Button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        {!order && (
          <div className="form-grid">
            <Field id="order-customer" label={labels.customer}>
              <Select id="order-customer" value={customerId} options={[{ value: '', label: 'Someone new / walk-in' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]} onChange={setCustomerId} />
            </Field>
            {!customerId && (
              <Field id="order-name" label="Name or label" error={errors.customerName} hint="e.g. Table 4, Walk-in, Smith kitchen">
                <input id="order-name" className="input" value={customerName} maxLength={80} onChange={(e) => setCustomerName(e.target.value)} aria-invalid={Boolean(errors.customerName)} />
              </Field>
            )}
            <Field id="order-due" label="Due (optional)">
              <input id="order-due" className="input" type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </Field>
            <Field id="order-assignee" label="Assigned to">
              <Select id="order-assignee" value={assigneeId} options={[{ value: '', label: 'Nobody yet' }, ...members.map((m) => ({ value: m.accountId, label: m.name }))]} onChange={setAssigneeId} />
            </Field>
          </div>
        )}
        <OrderLinesEditor lines={lines} onChange={setLinesDraft} error={errors.lines} />
        {!order && (
          <Field id="order-notes" label="Notes (optional)">
            <textarea id="order-notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

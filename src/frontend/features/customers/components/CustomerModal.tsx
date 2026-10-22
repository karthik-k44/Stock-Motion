import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { FieldErrors } from '@/frontend/lib/form';
import { customersService } from '../services';
import { CustomerSchema, type CustomerInput, type CustomerResponseType } from '../types';

type Props = { customer?: CustomerResponseType; onClose: () => void; onSaved?: (id: string) => void };

const FIELDS: { key: keyof CustomerInput; label: string; type?: string; area?: boolean }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email (optional)', type: 'email' },
  { key: 'phone', label: 'Phone (optional)', type: 'tel' },
  { key: 'address', label: 'Address (optional)' },
  { key: 'notes', label: 'Notes (optional)', area: true },
];

export const CustomerModal = ({ customer, onClose, onSaved }: Props) => {
  const { labels } = businessesService.useBusiness().template;
  const [values, setValues] = useState<CustomerInput>({
    name: customer?.name ?? '', email: customer?.email ?? '', phone: customer?.phone ?? '', address: customer?.address ?? '', notes: customer?.notes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = customersService.useCreateCustomerMutation();
  const update = customersService.useUpdateCustomerMutation();

  const submit = () => {
    const parsed = CustomerSchema.safeParse(values);
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    setErrors({});
    const onError = (err: { message: string; fieldErrors: () => Record<string, string> }) => setErrors({ form: err.message, ...err.fieldErrors() });
    if (customer) update.mutate({ id: customer.id, input: parsed.data }, { onSuccess: () => (onSaved?.(customer.id), onClose()), onError });
    else create.mutate(parsed.data, { onSuccess: (c) => (onSaved?.(c.id), onClose()), onError });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? `Edit ${customer.name}` : `Add a ${labels.customer.toLowerCase()}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={create.isPending || update.isPending} onClick={submit}>{customer ? 'Save' : 'Add'}</Button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        {FIELDS.map((f) => (
          <Field key={f.key} id={`cust-${f.key}`} label={f.label} error={errors[f.key]}>
            {f.area ? (
              <textarea id={`cust-${f.key}`} className="input" rows={2} maxLength={500} value={values[f.key]} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            ) : (
              <input id={`cust-${f.key}`} className="input" type={f.type ?? 'text'} value={values[f.key]} aria-invalid={Boolean(errors[f.key])} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            )}
          </Field>
        ))}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
};

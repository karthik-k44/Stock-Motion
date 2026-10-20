import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { FieldErrors, ToNumber } from '@/frontend/lib/form';
import { suppliersService } from '../services';
import { SupplierSchema, type SupplierResponseType } from '../types';

export const SupplierModal = ({ supplier, onClose }: { supplier?: SupplierResponseType; onClose: () => void }) => {
  const { labels } = businessesService.useBusiness().template;
  const [values, setValues] = useState({
    name: supplier?.name ?? '', contact: supplier?.contact ?? '', email: supplier?.email ?? '', phone: supplier?.phone ?? '', leadDays: String(supplier?.leadDays ?? 2),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = suppliersService.useCreateSupplierMutation();
  const update = suppliersService.useUpdateSupplierMutation();
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = () => {
    const parsed = SupplierSchema.safeParse({ ...values, leadDays: ToNumber(values.leadDays) });
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    setErrors({});
    const onError = (err: { message: string; fieldErrors: () => Record<string, string> }) => setErrors({ form: err.message, ...err.fieldErrors() });
    if (supplier) update.mutate({ id: supplier.id, input: parsed.data }, { onSuccess: onClose, onError });
    else create.mutate(parsed.data, { onSuccess: onClose, onError });
  };

  const input = (key: keyof typeof values, label: string, type = 'text', hint?: string) => (
    <Field id={`sup-${key}`} label={label} error={errors[key]} hint={hint}>
      <input id={`sup-${key}`} className="input" type={type} value={values[key]} aria-invalid={Boolean(errors[key])} onChange={set(key)} />
    </Field>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? `Edit ${supplier.name}` : `Add a ${labels.supplier.toLowerCase()}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={create.isPending || update.isPending} onClick={submit}>{supplier ? 'Save' : 'Add'}</Button>
        </>
      }
    >
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
        <div className="form-grid">
          {input('name', 'Name')}
          {input('contact', 'Contact person (optional)')}
          {input('email', 'Email (optional)', 'email')}
          {input('phone', 'Phone (optional)', 'tel')}
          {input('leadDays', 'Lead time (days)', 'number', 'Used when reordering low stock')}
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
};

import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { Field } from '@/frontend/components/form';
import { businessesService } from '@/frontend/features/businesses/services';

export const BusinessDetailsCard = () => {
  const business = businessesService.useBusiness();
  const save = businessesService.useUpdateBusiness();
  const [name, setName] = useState(business.name);
  const [currency, setCurrency] = useState(business.currency);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) return setError('Name your business');
    if (!/^[A-Z]{3}$/.test(currency)) return setError('Use a 3-letter currency code, e.g. USD');
    setError('');
    save.mutate({ name: name.trim(), currency });
  };

  return (
    <Card title="Business" subtitle={`${business.template.name} · the kind of business can't be changed; start another business for a different type.`}>
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-grid">
          <Field id="set-name" label="Name">
            <input id="set-name" className="input" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="set-currency" label="Currency">
            <input id="set-currency" className="input input-short" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </Field>
        </div>
        <div className="form-actions">
          <Button type="submit" variant="primary" loading={save.isPending} disabled={name === business.name && currency === business.currency}>Save</Button>
        </div>
      </form>
    </Card>
  );
};

import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { Field, Select } from '@/frontend/components/form';
import { businessesService } from '@/frontend/features/businesses/services';
import { locationsService } from '@/frontend/features/locations/services';

/** Add a shelf / bin beyond the ones the template created. */
export function LocationsCard() {
  const { template } = businessesService.useBusiness();
  const create = locationsService.useCreateLocationMutation();
  const [zone, setZone] = useState(template.zones[0]?.code ?? '');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!/^[A-Z0-9][A-Z0-9-]{0,23}$/.test(code)) return setError('Use letters, numbers and dashes for the code, e.g. FRIDGE-4');
    if (!name.trim()) return setError('Give it a name people recognise');
    setError('');
    create.mutate({ zone, code, name: name.trim() }, { onSuccess: () => (setCode(''), setName('')) });
  };

  return (
    <Card title={`Add to ${template.labels.locations.toLowerCase()}`} subtitle={`Your ${template.labels.locations.toLowerCase()} came from the template. Add more ${template.labels.location.toLowerCase()}s here.`}>
      <form className="form" onSubmit={(e) => (e.preventDefault(), submit())} noValidate>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-grid">
          <Field id="loc-zone" label="Zone">
            <Select id="loc-zone" value={zone} options={template.zones.map((z) => ({ value: z.code, label: z.name }))} onChange={setZone} />
          </Field>
          <Field id="loc-code" label="Code">
            <input id="loc-code" className="input mono" maxLength={24} value={code} placeholder={`${zone}-9`} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </Field>
          <Field id="loc-name" label="Name">
            <input id="loc-name" className="input" maxLength={80} value={name} placeholder="e.g. Top shelf by the door" onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>
        <div className="form-actions">
          <Button type="submit" icon="plus" loading={create.isPending}>Add {template.labels.location.toLowerCase()}</Button>
        </div>
      </form>
    </Card>
  );
}

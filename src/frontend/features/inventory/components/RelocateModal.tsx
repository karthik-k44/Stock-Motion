import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field, Select } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { locationsService } from '@/frontend/features/locations/services';
import { inventoryService } from '../services';
import type { ItemResponseType } from '../types';

const OFF_SHELF = '__none__';

type Props = { item: ItemResponseType; onClose: () => void };

export function RelocateModal({ item, onClose }: Props) {
  const { template } = businessesService.useBusiness();
  const { data: locations, isPending } = locationsService.useLocations();
  const relocate = inventoryService.useRelocateMutation();
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  // Warehouse bins hold one product; shelves in a café or van hold many.
  const options = (locations ?? []).filter((l) => l.code !== item.location && (!template.exclusiveLocations || !l.items.length));
  const current = locations?.find((l) => l.code === item.location);

  const submit = () => {
    if (!target) return setError(`Choose a ${template.labels.location.toLowerCase()}`);
    relocate.mutate({ sku: item.sku, input: { location: target === OFF_SHELF ? null : target } });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Move ${item.name}`}
      description={`Currently ${current ? `in ${current.name}` : 'not stored anywhere'}.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={isPending} onClick={submit}>Confirm move</Button>
        </>
      }
    >
      <Field id="relocate-to" label={`New ${template.labels.location.toLowerCase()}`} error={error} hint={!isPending && !options.length ? `Every ${template.labels.location.toLowerCase()} is taken` : undefined}>
        <Select
          id="relocate-to"
          data-autofocus
          value={target}
          disabled={isPending}
          options={[
            { value: '', label: isPending ? 'Loading…' : 'Choose…' },
            ...options.map((l) => ({ value: l.code, label: `${l.code} — ${l.name}${l.items.length ? ` (${l.items.length} items)` : ''}` })),
            ...(item.location ? [{ value: OFF_SHELF, label: 'Take it off the shelf' }] : []),
          ]}
          onChange={(v) => (setTarget(v), setError(''))}
        />
      </Field>
    </Modal>
  );
}

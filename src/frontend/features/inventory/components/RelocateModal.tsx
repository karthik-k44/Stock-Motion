import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field, Select } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { locationsService } from '@/frontend/features/locations/services';
import { describeLocation } from '@/frontend/features/warehouse/lib/layout';
import { inventoryService } from '../services';
import type { ItemResponseType } from '../types';

type Props = { item: ItemResponseType; open: boolean; onClose: () => void; onDone: () => void };

export function RelocateModal({ item, open, onClose, onDone }: Props) {
  const { data: locations, isPending } = locationsService.useLocations();
  const relocate = inventoryService.useRelocateMutation();
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const empty = (locations ?? []).filter((l) => !l.item);

  const submit = () => {
    if (!target) return setError('Choose an empty bin');
    relocate.mutate({ sku: item.sku, input: { location: target } }, { onSuccess: onDone, onError: (e) => setError(e.message) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Move ${item.name}`}
      description={`Currently in ${item.location ? describeLocation(item.location) : 'no bin'}. The forklift will move the stock and the warehouse map updates.`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={relocate.isPending} disabled={!empty.length} onClick={submit}>
            Confirm move
          </Button>
        </>
      }
    >
      <Field id="relocate-bin" label="Destination bin" error={error} hint={!isPending && !empty.length ? 'Every bin is occupied' : undefined}>
        <Select
          id="relocate-bin"
          data-autofocus
          value={target}
          disabled={isPending}
          options={[
            { value: '', label: isPending ? 'Loading bins…' : 'Choose an empty bin…' },
            ...empty.map((l) => ({ value: l.code, label: `${l.code} — ${describeLocation(l.code)}` })),
          ]}
          onChange={(v) => (setTarget(v), setError(''))}
        />
      </Field>
    </Modal>
  );
}

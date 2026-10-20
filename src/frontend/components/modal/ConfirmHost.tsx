import { useSyncExternalStore } from 'react';
import { Button } from '@/frontend/components/button';
import { ConfirmManager } from './confirm-manager';
import { Modal } from './Modal';

export const ConfirmHost = () => {
  const pending = useSyncExternalStore(ConfirmManager.Subscribe, ConfirmManager.Get);
  return (
    <Modal
      open={Boolean(pending)}
      size="sm"
      title={pending?.title ?? ''}
      description={pending?.message}
      onClose={() => ConfirmManager.Resolve(false)}
      footer={
        <>
          <Button onClick={() => ConfirmManager.Resolve(false)}>Cancel</Button>
          <Button
            data-autofocus
            variant={pending?.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => ConfirmManager.Resolve(true)}
          >
            {pending?.confirmLabel ?? 'Confirm'}
          </Button>
        </>
      }
    />
  );
};

import { Button } from '@/frontend/components/button';
import { ConfirmManager } from '@/frontend/components/modal';
import { systemService } from '../services';

export function ResetDemoButton() {
  const reset = systemService.useResetDemoMutation();
  return (
    <Button
      variant="ghost"
      size="sm"
      icon="refresh"
      loading={reset.isPending}
      title="Restore the demo data"
      aria-label="Reset demo data"
      onClick={async () => {
        const ok = await ConfirmManager.Ask({
          title: 'Reset demo data?',
          message: 'All stock levels, orders, deliveries and activity go back to the original sample data. This cannot be undone.',
          confirmLabel: 'Reset data',
          tone: 'danger',
        });
        if (ok) reset.mutate();
      }}
    >
      <span className="hide-sm">Reset</span>
    </Button>
  );
}

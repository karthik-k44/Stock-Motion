import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import type { ApiError } from '@/frontend/services/api-error';
import { Post } from '@/frontend/services/request';

const ResetDemo = (): Promise<{ ok: boolean }> => Post<{ ok: boolean }>('/system/reset');

const useResetDemoMutation = () => {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, ApiError, void>({
    mutationFn: ResetDemo,
    onSuccess: async () => {
      await qc.invalidateQueries();
      ToastManager.Success('Demo data restored', 'Inventory, orders and deliveries are back to the starting set');
    },
    onError: (err) => ToastManager.Error('Reset failed', err.message),
  });
};

export const systemService = { ResetDemo, useResetDemoMutation };

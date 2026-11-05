import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import type { ApiError } from '@/frontend/services/api-error';
import { Biz } from '@/frontend/services/request';
import type { ImportPreviewResponseType } from '../types';

const usePreviewImport = () =>
  useMutation<ImportPreviewResponseType, ApiError, string>({
    mutationFn: (csv) => Biz.Post('/imports/items/preview', { csv }),
  });

const useCommitImport = () => {
  const qc = useQueryClient();
  return useMutation<{ created: number; updated: number }, ApiError, string>({
    mutationFn: (csv) => Biz.Post('/imports/items', { csv }),
    onSuccess: async (result) => {
      await Promise.all(
        ['items', 'locations', 'dashboard', 'activity', 'categories', 'suppliers'].map((k) => qc.invalidateQueries({ queryKey: [k] })),
      );
      ToastManager.Success('Import finished', `${result.created} added · ${result.updated} updated`);
    },
  });
};

export const importsService = { usePreviewImport, useCommitImport };

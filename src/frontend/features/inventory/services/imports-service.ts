import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import type { ApiError } from '@/frontend/services/api-error';
import { Biz } from '@/frontend/services/request';
import type { ImportPreviewResponseType } from '../types';

const PreviewImport = (csv: string) => Biz.Post<ImportPreviewResponseType>('/imports/items/preview', { csv });
const CommitImport = (csv: string) => Biz.Post<{ created: number; updated: number }>('/imports/items', { csv });

const usePreviewImportMutation = () => useMutation<ImportPreviewResponseType, ApiError, string>({ mutationFn: PreviewImport });

const useCommitImportMutation = () => {
  const qc = useQueryClient();
  return useMutation<{ created: number; updated: number }, ApiError, string>({
    mutationFn: CommitImport,
    onSuccess: async (result) => {
      await Promise.all(
        ['items', 'locations', 'dashboard', 'activity', 'categories', 'suppliers'].map((k) => qc.invalidateQueries({ queryKey: [k] })),
      );
      ToastManager.Success('Import finished', `${result.created} added · ${result.updated} updated`);
    },
  });
};

export const importsService = { PreviewImport, CommitImport, usePreviewImportMutation, useCommitImportMutation };

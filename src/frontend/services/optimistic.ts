import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import type { ApiError } from './api-error';

/** A predicted change to every cached query under `queryKey` (lists and details alike). */
export type OptimisticPatchType = {
  queryKey: QueryKey;
  update: (old: unknown) => unknown;
};

type OptimisticOptionsType<TData, TVars> = {
  mutationFn: (vars: TVars) => Promise<TData>;
  /** Cache changes to show immediately, before the server answers */
  optimistic?: (vars: TVars) => OptimisticPatchType[];
  /** Query prefixes re-fetched once the server has answered, success or failure */
  invalidate: QueryKey[];
  errorTitle: string;
  /** Toast on success; omit for none */
  successToast?: (data: TData, vars: TVars) => { title: string; message?: string } | null;
  onSuccess?: (data: TData, vars: TVars) => void;
  onError?: (err: ApiError, vars: TVars) => void;
  /** Hide the error toast (the screen shows the error inline instead) */
  quietError?: boolean;
};

type SnapshotType = [QueryKey, unknown][];

/**
 * Optimistic mutation: apply the predicted result to the cache at once, roll back to the exact
 * previous cache entries if the server refuses, and always reconcile with the server afterwards.
 */
export function useOptimisticMutation<TData, TVars>(opts: OptimisticOptionsType<TData, TVars>) {
  const qc = useQueryClient();
  return useMutation<TData, ApiError, TVars, SnapshotType>({
    mutationFn: opts.mutationFn,
    onMutate: async (vars) => {
      const patches = opts.optimistic?.(vars) ?? [];
      const snapshot: SnapshotType = [];
      for (const p of patches) {
        await qc.cancelQueries({ queryKey: p.queryKey });
        snapshot.push(...qc.getQueriesData({ queryKey: p.queryKey }));
        qc.setQueriesData({ queryKey: p.queryKey }, (old: unknown) => (old === undefined ? old : p.update(old)));
      }
      return snapshot;
    },
    onError: (err, vars, snapshot) => {
      snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (!opts.quietError) ToastManager.Error(opts.errorTitle, err.message);
      opts.onError?.(err, vars);
    },
    onSuccess: (data, vars) => {
      const toast = opts.successToast?.(data, vars);
      if (toast) ToastManager.Success(toast.title, toast.message);
      opts.onSuccess?.(data, vars);
    },
    onSettled: () => Promise.all(opts.invalidate.map((queryKey) => qc.invalidateQueries({ queryKey }))),
  });
}

/** Apply `fn` to the matching entries of a cached list or single record; leaves anything else untouched. */
export function PatchWhere<T>(match: (x: T) => boolean, fn: (x: T) => T) {
  return (old: unknown): unknown => {
    if (Array.isArray(old)) return old.map((x: T) => (match(x) ? fn(x) : x));
    if (old && typeof old === 'object' && match(old as T)) return fn(old as T);
    return old;
  };
}

import { useQuery } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { SupplierInput, SupplierResponseType } from '../types';

const suppliersKeys = {
  all: ['suppliers'] as const,
  list: () => [...suppliersKeys.all, 'list'] as const,
};

const useGetSuppliers = () =>
  useQuery({
    queryKey: suppliersKeys.list(),
    queryFn: (): Promise<SupplierResponseType[]> => Biz.Get('/suppliers'),
  });

const useCreateSupplier = () =>
  useOptimisticMutation({
    mutationFn: (input: SupplierInput): Promise<SupplierResponseType> => Biz.Post('/suppliers', input),
    optimistic: (input) => [
      {
        queryKey: suppliersKeys.all,
        update: (old) =>
          Array.isArray(old)
            ? [...old, { ...input, id: `pending-${Date.now()}`, itemCount: 0, openDeliveries: 0, createdAt: new Date().toISOString() }]
            : old,
      },
    ],
    invalidate: [suppliersKeys.all, ['activity']],
    errorTitle: 'Not added',
    quietError: true,
    successToast: (s) => ({ title: `${s.name} added` }),
  });

const useUpdateSupplier = () =>
  useOptimisticMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierInput }): Promise<SupplierResponseType> =>
      Biz.Put(`/suppliers/${id}`, input),
    optimistic: ({ id, input }) => [
      { queryKey: suppliersKeys.all, update: PatchWhere<SupplierResponseType>((s) => s.id === id, (s) => ({ ...s, ...input })) },
    ],
    invalidate: [suppliersKeys.all, ['deliveries']],
    errorTitle: 'Not saved',
    quietError: true,
    successToast: (s) => ({ title: 'Saved', message: s.name }),
  });

const useDeleteSupplier = () =>
  useOptimisticMutation({
    mutationFn: (id: string): Promise<void> => Biz.Delete(`/suppliers/${id}`),
    optimistic: (id) => [
      { queryKey: suppliersKeys.all, update: (old) => (Array.isArray(old) ? old.filter((s: SupplierResponseType) => s.id !== id) : old) },
    ],
    invalidate: [suppliersKeys.all, ['items']],
    errorTitle: 'Not deleted',
  });

export const suppliersService = {
  suppliersKeys,
  useGetSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
};

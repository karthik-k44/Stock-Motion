import { useQuery } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { SupplierInput, SupplierResponseType } from '../types';

const ListSuppliers = () => Biz.Get<SupplierResponseType[]>('/suppliers');
const CreateSupplier = (input: SupplierInput) => Biz.Post<SupplierResponseType>('/suppliers', input);
const UpdateSupplier = (id: string, input: SupplierInput) => Biz.Put<SupplierResponseType>(`/suppliers/${id}`, input);
const DeleteSupplier = (id: string) => Biz.Delete<void>(`/suppliers/${id}`);

const suppliersKeys = {
  all: ['suppliers'] as const,
  list: () => ['suppliers', 'list'] as const,
};

const useSuppliers = () => useQuery({ queryKey: suppliersKeys.list(), queryFn: ListSuppliers });

const useCreateSupplierMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateSupplier,
    optimistic: (input: SupplierInput) => [
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

const useUpdateSupplierMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierInput }) => UpdateSupplier(id, input),
    optimistic: ({ id, input }) => [
      { queryKey: suppliersKeys.all, update: PatchWhere<SupplierResponseType>((s) => s.id === id, (s) => ({ ...s, ...input })) },
    ],
    invalidate: [suppliersKeys.all, ['deliveries']],
    errorTitle: 'Not saved',
    quietError: true,
    successToast: (s) => ({ title: 'Saved', message: s.name }),
  });

const useDeleteSupplierMutation = () =>
  useOptimisticMutation({
    mutationFn: DeleteSupplier,
    optimistic: (id: string) => [
      { queryKey: suppliersKeys.all, update: (old) => (Array.isArray(old) ? old.filter((s: SupplierResponseType) => s.id !== id) : old) },
    ],
    invalidate: [suppliersKeys.all, ['items']],
    errorTitle: 'Not deleted',
  });

export const suppliersService = {
  keys: suppliersKeys,
  ListSuppliers,
  CreateSupplier,
  UpdateSupplier,
  DeleteSupplier,
  useSuppliers,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
};

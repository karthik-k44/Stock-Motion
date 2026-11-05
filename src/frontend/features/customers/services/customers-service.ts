import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CustomerDetailResponseType, CustomerInput, CustomerResponseType } from '../types';

const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  list: (search?: string) => [...customersKeys.lists(), search ?? ''] as const,
  details: () => [...customersKeys.all, 'detail'] as const,
  detail: (id: string) => [...customersKeys.details(), id] as const,
};

const useGetCustomers = (search?: string) =>
  useQuery({
    queryKey: customersKeys.list(search),
    queryFn: (): Promise<CustomerResponseType[]> => Biz.Get('/customers', { params: { search } }),
    placeholderData: keepPreviousData,
  });

const useGetCustomer = (id: string | undefined) =>
  useQuery({
    queryKey: customersKeys.detail(id ?? ''),
    queryFn: (): Promise<CustomerDetailResponseType> => Biz.Get(`/customers/${id}`),
    enabled: Boolean(id),
  });

const blank = (input: CustomerInput): CustomerResponseType => ({
  ...input, id: `pending-${Date.now()}`, orderCount: 0, openOrders: 0, totalSpent: 0, lastOrderAt: null, createdAt: new Date().toISOString(),
});

const useCreateCustomer = () =>
  useOptimisticMutation({
    mutationFn: (input: CustomerInput): Promise<CustomerResponseType> => Biz.Post('/customers', input),
    optimistic: (input) => [
      { queryKey: customersKeys.lists(), update: (old) => (Array.isArray(old) ? [blank(input), ...old] : old) },
    ],
    invalidate: [customersKeys.all, ['dashboard'], ['activity']],
    errorTitle: 'Not added',
    quietError: true,
    successToast: (c) => ({ title: `${c.name} added` }),
  });

const useUpdateCustomer = () =>
  useOptimisticMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }): Promise<CustomerResponseType> =>
      Biz.Put(`/customers/${id}`, input),
    optimistic: ({ id, input }) => [
      { queryKey: customersKeys.all, update: PatchWhere<CustomerResponseType>((c) => c.id === id, (c) => ({ ...c, ...input })) },
    ],
    invalidate: [customersKeys.all],
    errorTitle: 'Not saved',
    quietError: true,
    successToast: (c) => ({ title: 'Saved', message: c.name }),
  });

const useDeleteCustomer = () =>
  useOptimisticMutation({
    mutationFn: (id: string): Promise<void> => Biz.Delete(`/customers/${id}`),
    optimistic: (id) => [
      { queryKey: customersKeys.lists(), update: (old) => (Array.isArray(old) ? old.filter((c: CustomerResponseType) => c.id !== id) : old) },
    ],
    invalidate: [customersKeys.all, ['dashboard']],
    errorTitle: 'Not deleted',
  });

export const customersService = {
  customersKeys,
  useGetCustomers,
  useGetCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
};

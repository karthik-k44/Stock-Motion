import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CustomerDetailResponseType, CustomerInput, CustomerResponseType } from '../types';

const ListCustomers = (search?: string) => Biz.Get<CustomerResponseType[]>('/customers', { params: { search } });
const GetCustomer = (id: string) => Biz.Get<CustomerDetailResponseType>(`/customers/${id}`);
const CreateCustomer = (input: CustomerInput) => Biz.Post<CustomerResponseType>('/customers', input);
const UpdateCustomer = (id: string, input: CustomerInput) => Biz.Put<CustomerResponseType>(`/customers/${id}`, input);
const DeleteCustomer = (id: string) => Biz.Delete<void>(`/customers/${id}`);

const customersKeys = {
  all: ['customers'] as const,
  listPrefix: ['customers', 'list'] as const,
  list: (search?: string) => ['customers', 'list', search ?? ''] as const,
  detail: (id: string) => ['customers', 'detail', id] as const,
};

const useCustomers = (search?: string) =>
  useQuery({ queryKey: customersKeys.list(search), queryFn: () => ListCustomers(search), placeholderData: keepPreviousData });

const useCustomer = (id: string | undefined) =>
  useQuery({ queryKey: customersKeys.detail(id ?? ''), queryFn: () => GetCustomer(id!), enabled: Boolean(id) });

const blank = (input: CustomerInput): CustomerResponseType => ({
  ...input, id: `pending-${Date.now()}`, orderCount: 0, openOrders: 0, totalSpent: 0, lastOrderAt: null, createdAt: new Date().toISOString(),
});

const useCreateCustomerMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateCustomer,
    optimistic: (input: CustomerInput) => [
      { queryKey: customersKeys.listPrefix, update: (old) => (Array.isArray(old) ? [blank(input), ...old] : old) },
    ],
    invalidate: [customersKeys.all, ['dashboard'], ['activity']],
    errorTitle: 'Not added',
    quietError: true,
    successToast: (c) => ({ title: `${c.name} added` }),
  });

const useUpdateCustomerMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ id, input }: { id: string; input: CustomerInput }) => UpdateCustomer(id, input),
    optimistic: ({ id, input }) => [
      { queryKey: customersKeys.all, update: PatchWhere<CustomerResponseType>((c) => c.id === id, (c) => ({ ...c, ...input })) },
    ],
    invalidate: [customersKeys.all],
    errorTitle: 'Not saved',
    quietError: true,
    successToast: (c) => ({ title: 'Saved', message: c.name }),
  });

const useDeleteCustomerMutation = () =>
  useOptimisticMutation({
    mutationFn: DeleteCustomer,
    optimistic: (id: string) => [
      { queryKey: customersKeys.listPrefix, update: (old) => (Array.isArray(old) ? old.filter((c: CustomerResponseType) => c.id !== id) : old) },
    ],
    invalidate: [customersKeys.all, ['dashboard']],
    errorTitle: 'Not deleted',
  });

export const customersService = {
  keys: customersKeys,
  ListCustomers,
  GetCustomer,
  CreateCustomer,
  UpdateCustomer,
  DeleteCustomer,
  useCustomers,
  useCustomer,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
};

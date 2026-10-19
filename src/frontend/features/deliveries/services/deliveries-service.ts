import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import { inventoryService } from '@/frontend/features/inventory/services';
import type { ApiError } from '@/frontend/services/api-error';
import { Get, Post } from '@/frontend/services/request';
import type { DeliveryResponseType, ListDeliveriesParams, ReceiveDeliveryInput } from '../types';

const ListDeliveries = (params: ListDeliveriesParams): Promise<DeliveryResponseType[]> =>
  Get<DeliveryResponseType[]>('/deliveries', { params });
const GetDelivery = (id: string): Promise<DeliveryResponseType> => Get<DeliveryResponseType>(`/deliveries/${id}`);
const BookDelivery = (): Promise<DeliveryResponseType> => Post<DeliveryResponseType>('/deliveries');
const StartUnloading = (id: string) => Post<DeliveryResponseType>(`/deliveries/${id}/start-unloading`);
const ReceiveDelivery = (id: string, input: ReceiveDeliveryInput) => Post<DeliveryResponseType>(`/deliveries/${id}/receive`, input);

const deliveriesKeys = {
  all: ['deliveries'] as const,
  listPrefix: ['deliveries', 'list'] as const,
  list: (params: ListDeliveriesParams) => ['deliveries', 'list', params] as const,
  detail: (id: string) => ['deliveries', 'detail', id] as const,
};

const useDeliveries = (params: ListDeliveriesParams = {}) =>
  useQuery({ queryKey: deliveriesKeys.list(params), queryFn: () => ListDeliveries(params), placeholderData: keepPreviousData });

const useDelivery = (id: string | undefined) =>
  useQuery({ queryKey: deliveriesKeys.detail(id ?? ''), queryFn: () => GetDelivery(id!), enabled: Boolean(id) });

const useBookDeliveryMutation = () => {
  const qc = useQueryClient();
  return useMutation<DeliveryResponseType, ApiError, void>({
    mutationFn: BookDelivery,
    onSuccess: async (d) => {
      await Promise.all([qc.invalidateQueries({ queryKey: deliveriesKeys.all }), inventoryService.InvalidateStock(qc)]);
      ToastManager.Info(`${d.id} booked`, `${d.truck} from ${d.supplier} is on its way`);
    },
    onError: (err) => ToastManager.Error('Could not book a delivery', err.message),
  });
};

const useStartUnloadingMutation = () => {
  const qc = useQueryClient();
  return useMutation<DeliveryResponseType, ApiError, string>({
    mutationFn: StartUnloading,
    onSuccess: () => qc.invalidateQueries({ queryKey: deliveriesKeys.all }),
    onError: (err) => ToastManager.Error('Could not start unloading', err.message),
  });
};

const useReceiveDeliveryMutation = () => {
  const qc = useQueryClient();
  return useMutation<DeliveryResponseType, ApiError, { id: string; input: ReceiveDeliveryInput }>({
    mutationFn: ({ id, input }) => ReceiveDelivery(id, input),
    onSuccess: async (d) => {
      await Promise.all([qc.invalidateQueries({ queryKey: deliveriesKeys.all }), inventoryService.InvalidateStock(qc)]);
      const units = d.lines.reduce((s, l) => s + (l.received ?? 0), 0);
      ToastManager.Success(`${d.id} received`, `${units} units from ${d.supplier} added to stock`);
    },
    onError: (err) => ToastManager.Error('Delivery not received', err.message),
  });
};

export const deliveriesService = {
  keys: deliveriesKeys,
  ListDeliveries,
  GetDelivery,
  BookDelivery,
  StartUnloading,
  ReceiveDelivery,
  useDeliveries,
  useDelivery,
  useBookDeliveryMutation,
  useStartUnloadingMutation,
  useReceiveDeliveryMutation,
};

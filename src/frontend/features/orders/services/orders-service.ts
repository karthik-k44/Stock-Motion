import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import { inventoryService } from '@/frontend/features/inventory/services';
import type { ApiError } from '@/frontend/services/api-error';
import { Get, Patch, Post } from '@/frontend/services/request';
import type { ListOrdersParams, OrderResponseType, UpdateOrderInput } from '../types';

const ListOrders = (params: ListOrdersParams): Promise<OrderResponseType[]> => Get<OrderResponseType[]>('/orders', { params });
const GetOrder = (id: string): Promise<OrderResponseType> => Get<OrderResponseType>(`/orders/${id}`);
const UpdateOrder = (id: string, input: UpdateOrderInput) => Patch<OrderResponseType>(`/orders/${id}`, input);
const StartPicking = (id: string) => Post<OrderResponseType>(`/orders/${id}/start-picking`);
const PickLine = (id: string, sku: string) => Post<OrderResponseType>(`/orders/${id}/lines/${sku}/pick`);
const PickAll = (id: string) => Post<OrderResponseType>(`/orders/${id}/pick-all`);
const PackOrder = (id: string) => Post<OrderResponseType>(`/orders/${id}/pack`);
const ShipOrder = (id: string) => Post<OrderResponseType>(`/orders/${id}/ship`);

const ordersKeys = {
  all: ['orders'] as const,
  listPrefix: ['orders', 'list'] as const,
  list: (params: ListOrdersParams) => ['orders', 'list', params] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

const useOrders = (params: ListOrdersParams = {}) =>
  useQuery({ queryKey: ordersKeys.list(params), queryFn: () => ListOrders(params), placeholderData: keepPreviousData });

const useOrder = (id: string | undefined) =>
  useQuery({ queryKey: ordersKeys.detail(id ?? ''), queryFn: () => GetOrder(id!), enabled: Boolean(id) });

/** Shared shape for every order state change: refresh orders + stock, toast the outcome. */
function useOrderMutation<V>(fn: (vars: V) => Promise<OrderResponseType>, success: (o: OrderResponseType, vars: V) => string) {
  const qc = useQueryClient();
  return useMutation<OrderResponseType, ApiError, V>({
    mutationFn: fn,
    onSuccess: async (order, vars) => {
      await Promise.all([qc.invalidateQueries({ queryKey: ordersKeys.all }), inventoryService.InvalidateStock(qc)]);
      ToastManager.Success(success(order, vars), order.customer);
    },
    onError: (err) => ToastManager.Error('Order not updated', err.message),
  });
}

const useStartPickingMutation = () => useOrderMutation((id: string) => StartPicking(id), (o) => `${o.id} released to picking`);
const usePickLineMutation = () =>
  useOrderMutation(
    ({ id, sku }: { id: string; sku: string }) => PickLine(id, sku),
    (o, v) => `Picked ${o.lines.find((l) => l.sku === v.sku)?.name ?? v.sku}`,
  );
const usePickAllMutation = () => useOrderMutation((id: string) => PickAll(id), (o) => `All lines picked for ${o.id}`);
const usePackMutation = () => useOrderMutation((id: string) => PackOrder(id), (o) => `${o.id} packed`);
const useShipMutation = () => useOrderMutation((id: string) => ShipOrder(id), (o) => `${o.id} shipped`);
const useUpdateOrderMutation = () =>
  useOrderMutation(({ id, input }: { id: string; input: UpdateOrderInput }) => UpdateOrder(id, input), (o) => `${o.id} reassigned`);

export const ordersService = {
  keys: ordersKeys,
  ListOrders,
  GetOrder,
  UpdateOrder,
  StartPicking,
  PickLine,
  PickAll,
  PackOrder,
  ShipOrder,
  useOrders,
  useOrder,
  useStartPickingMutation,
  usePickLineMutation,
  usePickAllMutation,
  usePackMutation,
  useShipMutation,
  useUpdateOrderMutation,
};

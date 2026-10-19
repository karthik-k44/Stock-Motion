import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import type { OrderStageType } from '@/frontend/features/businesses/types';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import { PredictAdvance, PredictConsume } from '../lib/order-flow';
import { CANCELLED_STATUS, type ListOrdersParams, type NewOrderInput, type OrderLineInput, type OrderResponseType, type UpdateOrderInput } from '../types';

const path = (number: string) => `/orders/${encodeURIComponent(number)}`;

const ListOrders = (params: ListOrdersParams) => Biz.Get<OrderResponseType[]>('/orders', { params });
const GetOrder = (number: string) => Biz.Get<OrderResponseType>(path(number));
const CreateOrder = (input: NewOrderInput) => Biz.Post<OrderResponseType>('/orders', input);
const UpdateOrder = (number: string, input: UpdateOrderInput) => Biz.Patch<OrderResponseType>(path(number), input);
const SetLines = (number: string, lines: OrderLineInput[]) => Biz.Put<OrderResponseType>(`${path(number)}/lines`, { lines });
const AdvanceOrder = (number: string, to: string) => Biz.Post<OrderResponseType>(`${path(number)}/advance`, { to });
const ConsumeOrder = (number: string, input: { sku?: string; qty?: number }) => Biz.Post<OrderResponseType>(`${path(number)}/consume`, input);
const CancelOrder = (number: string) => Biz.Post<OrderResponseType>(`${path(number)}/cancel`);

const ordersKeys = {
  all: ['orders'] as const,
  listPrefix: ['orders', 'list'] as const,
  list: (params: ListOrdersParams) => ['orders', 'list', params] as const,
  detail: (number: string) => ['orders', 'detail', number] as const,
};

/** An order change moves stock, money and the activity log. */
const ORDER_KEYS: QueryKey[] = [['orders'], ['items'], ['locations'], ['dashboard'], ['activity'], ['customers']];

const useOrders = (params: ListOrdersParams = {}) =>
  useQuery({ queryKey: ordersKeys.list(params), queryFn: () => ListOrders(params), placeholderData: keepPreviousData });

const useOrder = (number: string | undefined) =>
  useQuery({ queryKey: ordersKeys.detail(number ?? ''), queryFn: () => GetOrder(number!), enabled: Boolean(number) });

const patchOrder = (number: string, fn: (o: OrderResponseType) => OrderResponseType) => [
  { queryKey: ordersKeys.all, update: PatchWhere<OrderResponseType>((o) => o.number === number, fn) },
];

const useCreateOrderMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateOrder,
    invalidate: ORDER_KEYS,
    errorTitle: 'Not created',
    quietError: true,
    successToast: (o) => ({ title: `${o.number} created`, message: o.customerName }),
  });

const useUpdateOrderMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ number, input }: { number: string; input: UpdateOrderInput }) => UpdateOrder(number, input),
    optimistic: ({ number, input }) => patchOrder(number, (o) => ({ ...o, ...input, customerName: input.customerName ?? o.customerName })),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not updated',
  });

const useSetLinesMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ number, lines }: { number: string; lines: OrderLineInput[] }) => SetLines(number, lines),
    invalidate: ORDER_KEYS,
    errorTitle: 'Lines not saved',
    successToast: (o) => ({ title: `${o.number} updated`, message: `${o.lines.length} lines` }),
  });

/** Move to the next stage. The screen shows the new stage at once; a server refusal rolls it back. */
const useAdvanceMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ number, stage }: { number: string; stage: OrderStageType }) => AdvanceOrder(number, stage.status),
    optimistic: ({ number, stage }) => patchOrder(number, (o) => PredictAdvance(o, stage)),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not moved on',
    quietError: true,
    successToast: (o, { stage }) => ({ title: `${o.number} → ${stage.label}`, message: o.customerName }),
  });

const useConsumeMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ number, sku, qty }: { number: string; sku?: string; qty?: number }) => ConsumeOrder(number, { sku, qty }),
    optimistic: ({ number, sku, qty }) => patchOrder(number, (o) => PredictConsume(o, sku, qty)),
    invalidate: ORDER_KEYS,
    errorTitle: 'Stock not taken',
  });

const useCancelMutation = () =>
  useOptimisticMutation({
    mutationFn: CancelOrder,
    optimistic: (number: string) =>
      patchOrder(number, (o) => ({ ...o, status: CANCELLED_STATUS, cancelled: true, closed: true, reserves: false })),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not cancelled',
    successToast: (o) => ({ title: `${o.number} cancelled`, message: 'Reserved stock was released' }),
  });

export const ordersService = {
  keys: ordersKeys,
  ListOrders,
  GetOrder,
  CreateOrder,
  UpdateOrder,
  SetLines,
  AdvanceOrder,
  ConsumeOrder,
  CancelOrder,
  useOrders,
  useOrder,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useSetLinesMutation,
  useAdvanceMutation,
  useConsumeMutation,
  useCancelMutation,
};

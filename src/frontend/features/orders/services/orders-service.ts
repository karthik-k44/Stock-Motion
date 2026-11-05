import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import type { OrderStageType } from '@/frontend/features/businesses/types';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import { PredictAdvance, PredictConsume } from '../lib/order-flow';
import {
  CANCELLED_STATUS,
  type ListOrdersParams,
  type NewOrderInput,
  type OrderLineInput,
  type OrderResponseType,
  type UpdateOrderInput,
} from '../types';

const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (filter: ListOrdersParams) => [...ordersKeys.lists(), filter] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (number: string) => [...ordersKeys.details(), number] as const,
};

/** An order change moves stock, money and the activity log. */
const ORDER_KEYS: QueryKey[] = [ordersKeys.all, ['items'], ['locations'], ['dashboard'], ['activity'], ['customers']];

const path = (number: string) => `/orders/${encodeURIComponent(number)}`;

const useGetOrders = (filter: ListOrdersParams = {}) =>
  useQuery({
    queryKey: ordersKeys.list(filter),
    queryFn: (): Promise<OrderResponseType[]> => Biz.Get('/orders', { params: filter }),
    placeholderData: keepPreviousData,
  });

const useGetOrder = (number: string | undefined) =>
  useQuery({
    queryKey: ordersKeys.detail(number ?? ''),
    queryFn: (): Promise<OrderResponseType> => Biz.Get(path(number!)),
    enabled: Boolean(number),
  });

const patchOrder = (number: string, fn: (o: OrderResponseType) => OrderResponseType) => [
  { queryKey: ordersKeys.all, update: PatchWhere<OrderResponseType>((o) => o.number === number, fn) },
];

const useCreateOrder = () =>
  useOptimisticMutation({
    mutationFn: (input: NewOrderInput): Promise<OrderResponseType> => Biz.Post('/orders', input),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not created',
    quietError: true,
    successToast: (o) => ({ title: `${o.number} created`, message: o.customerName }),
  });

const useUpdateOrder = () =>
  useOptimisticMutation({
    mutationFn: ({ number, input }: { number: string; input: UpdateOrderInput }): Promise<OrderResponseType> =>
      Biz.Patch(path(number), input),
    optimistic: ({ number, input }) => patchOrder(number, (o) => ({ ...o, ...input, customerName: input.customerName ?? o.customerName })),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not updated',
  });

const useSetOrderLines = () =>
  useOptimisticMutation({
    mutationFn: ({ number, lines }: { number: string; lines: OrderLineInput[] }): Promise<OrderResponseType> =>
      Biz.Put(`${path(number)}/lines`, { lines }),
    invalidate: ORDER_KEYS,
    errorTitle: 'Lines not saved',
    successToast: (o) => ({ title: `${o.number} updated`, message: `${o.lines.length} lines` }),
  });

/** Move to the next stage. The screen shows the new stage at once; a server refusal rolls it back. */
const useAdvanceOrder = () =>
  useOptimisticMutation({
    mutationFn: ({ number, stage }: { number: string; stage: OrderStageType }): Promise<OrderResponseType> =>
      Biz.Post(`${path(number)}/advance`, { to: stage.status }),
    optimistic: ({ number, stage }) => patchOrder(number, (o) => PredictAdvance(o, stage)),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not moved on',
    quietError: true,
    successToast: (o, { stage }) => ({ title: `${o.number} → ${stage.label}`, message: o.customerName }),
  });

const useConsumeOrder = () =>
  useOptimisticMutation({
    mutationFn: ({ number, sku, qty }: { number: string; sku?: string; qty?: number }): Promise<OrderResponseType> =>
      Biz.Post(`${path(number)}/consume`, { sku, qty }),
    optimistic: ({ number, sku, qty }) => patchOrder(number, (o) => PredictConsume(o, sku, qty)),
    invalidate: ORDER_KEYS,
    errorTitle: 'Stock not taken',
  });

const useCancelOrder = () =>
  useOptimisticMutation({
    mutationFn: (number: string): Promise<OrderResponseType> => Biz.Post(`${path(number)}/cancel`),
    optimistic: (number) =>
      patchOrder(number, (o) => ({ ...o, status: CANCELLED_STATUS, cancelled: true, closed: true, reserves: false })),
    invalidate: ORDER_KEYS,
    errorTitle: 'Not cancelled',
    successToast: (o) => ({ title: `${o.number} cancelled`, message: 'Reserved stock was released' }),
  });

export const ordersService = {
  ordersKeys,
  useGetOrders,
  useGetOrder,
  useCreateOrder,
  useUpdateOrder,
  useSetOrderLines,
  useAdvanceOrder,
  useConsumeOrder,
  useCancelOrder,
};

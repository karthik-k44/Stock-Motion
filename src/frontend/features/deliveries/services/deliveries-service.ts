import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import {
  DeliveryStatusTypeEnum,
  type DeliveryResponseType,
  type ListDeliveriesParams,
  type NewDeliveryInput,
  type ReceiveDeliveryInput,
} from '../types';

const deliveriesKeys = {
  all: ['deliveries'] as const,
  lists: () => [...deliveriesKeys.all, 'list'] as const,
  list: (filter: ListDeliveriesParams) => [...deliveriesKeys.lists(), filter] as const,
  details: () => [...deliveriesKeys.all, 'detail'] as const,
  detail: (number: string) => [...deliveriesKeys.details(), number] as const,
};

const DELIVERY_KEYS: QueryKey[] = [deliveriesKeys.all, ['items'], ['locations'], ['dashboard'], ['activity'], ['suppliers']];

const path = (number: string) => `/deliveries/${encodeURIComponent(number)}`;

const useGetDeliveries = (filter: ListDeliveriesParams = {}) =>
  useQuery({
    queryKey: deliveriesKeys.list(filter),
    queryFn: (): Promise<DeliveryResponseType[]> => Biz.Get('/deliveries', { params: filter }),
    placeholderData: keepPreviousData,
  });

const useGetDelivery = (number: string | undefined) =>
  useQuery({
    queryKey: deliveriesKeys.detail(number ?? ''),
    queryFn: (): Promise<DeliveryResponseType> => Biz.Get(path(number!)),
    enabled: Boolean(number),
  });

const patchDelivery = (number: string, fn: (d: DeliveryResponseType) => DeliveryResponseType) => [
  { queryKey: deliveriesKeys.all, update: PatchWhere<DeliveryResponseType>((d) => d.number === number, fn) },
];

const useCreateDelivery = () =>
  useOptimisticMutation({
    mutationFn: (input: NewDeliveryInput): Promise<DeliveryResponseType> =>
      Biz.Post('/deliveries', { ...input, expectedAt: new Date(input.expectedAt).toISOString() }),
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Not booked',
    quietError: true,
    successToast: (d) => ({ title: `${d.number} booked`, message: `${d.supplierName} · ${d.totalExpected} units` }),
  });

const useReorder = () =>
  useOptimisticMutation({
    mutationFn: (supplierId: string | null): Promise<DeliveryResponseType[]> => Biz.Post('/deliveries/reorder', { supplierId }),
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Nothing reordered',
    successToast: (list) => ({
      title: `Booked ${list.length} reorder${list.length === 1 ? '' : 's'}`,
      message: list.map((d) => `${d.number} · ${d.supplierName}`).join(', '),
    }),
  });

const useUpdateDeliveryStatus = () =>
  useOptimisticMutation({
    mutationFn: ({ number, to }: { number: string; to: DeliveryStatusTypeEnum }): Promise<DeliveryResponseType> =>
      Biz.Post(`${path(number)}/status`, { to }),
    optimistic: ({ number, to }) => patchDelivery(number, (d) => ({ ...d, status: to })),
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Status not changed',
  });

const useReceiveDelivery = () =>
  useOptimisticMutation({
    mutationFn: ({ number, input }: { number: string; input: ReceiveDeliveryInput }): Promise<DeliveryResponseType> =>
      Biz.Post(`${path(number)}/receive`, input),
    optimistic: ({ number, input }) =>
      patchDelivery(number, (d) => ({
        ...d,
        status: DeliveryStatusTypeEnum.RECEIVED,
        receivedAt: new Date().toISOString(),
        lines: d.lines.map((l) => ({ ...l, received: input.lines.find((x) => x.sku === l.sku)?.received ?? l.expected })),
      })),
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Not received',
    successToast: (d) => ({
      title: `${d.number} received`,
      message: `${d.lines.reduce((s, l) => s + (l.received ?? 0), 0)} units from ${d.supplierName} added to stock`,
    }),
  });

export const deliveriesService = {
  deliveriesKeys,
  useGetDeliveries,
  useGetDelivery,
  useCreateDelivery,
  useReorder,
  useUpdateDeliveryStatus,
  useReceiveDelivery,
};

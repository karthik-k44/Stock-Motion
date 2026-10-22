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

const path = (number: string) => `/deliveries/${encodeURIComponent(number)}`;

const ListDeliveries = (params: ListDeliveriesParams) => Biz.Get<DeliveryResponseType[]>('/deliveries', { params });
const GetDelivery = (number: string) => Biz.Get<DeliveryResponseType>(path(number));
const CreateDelivery = (input: NewDeliveryInput) =>
  Biz.Post<DeliveryResponseType>('/deliveries', { ...input, expectedAt: new Date(input.expectedAt).toISOString() });
const Reorder = (supplierId: string | null) => Biz.Post<DeliveryResponseType[]>('/deliveries/reorder', { supplierId });
const UpdateStatus = (number: string, to: DeliveryStatusTypeEnum) => Biz.Post<DeliveryResponseType>(`${path(number)}/status`, { to });
const ReceiveDelivery = (number: string, input: ReceiveDeliveryInput) => Biz.Post<DeliveryResponseType>(`${path(number)}/receive`, input);

const deliveriesKeys = {
  all: ['deliveries'] as const,
  listPrefix: ['deliveries', 'list'] as const,
  list: (params: ListDeliveriesParams) => ['deliveries', 'list', params] as const,
  detail: (number: string) => ['deliveries', 'detail', number] as const,
};

const DELIVERY_KEYS: QueryKey[] = [['deliveries'], ['items'], ['locations'], ['dashboard'], ['activity'], ['suppliers']];

const useDeliveries = (params: ListDeliveriesParams = {}) =>
  useQuery({ queryKey: deliveriesKeys.list(params), queryFn: () => ListDeliveries(params), placeholderData: keepPreviousData });

const useDelivery = (number: string | undefined) =>
  useQuery({ queryKey: deliveriesKeys.detail(number ?? ''), queryFn: () => GetDelivery(number!), enabled: Boolean(number) });

const patchDelivery = (number: string, fn: (d: DeliveryResponseType) => DeliveryResponseType) => [
  { queryKey: deliveriesKeys.all, update: PatchWhere<DeliveryResponseType>((d) => d.number === number, fn) },
];

const useCreateDeliveryMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateDelivery,
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Not booked',
    quietError: true,
    successToast: (d) => ({ title: `${d.number} booked`, message: `${d.supplierName} · ${d.totalExpected} units` }),
  });

const useReorderMutation = () =>
  useOptimisticMutation({
    mutationFn: Reorder,
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Nothing reordered',
    successToast: (list) => ({
      title: `Booked ${list.length} reorder${list.length === 1 ? '' : 's'}`,
      message: list.map((d) => `${d.number} · ${d.supplierName}`).join(', '),
    }),
  });

const useUpdateStatusMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ number, to }: { number: string; to: DeliveryStatusTypeEnum }) => UpdateStatus(number, to),
    optimistic: ({ number, to }) => patchDelivery(number, (d) => ({ ...d, status: to })),
    invalidate: DELIVERY_KEYS,
    errorTitle: 'Status not changed',
  });

const useReceiveMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ number, input }: { number: string; input: ReceiveDeliveryInput }) => ReceiveDelivery(number, input),
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
  keys: deliveriesKeys,
  ListDeliveries,
  GetDelivery,
  CreateDelivery,
  Reorder,
  UpdateStatus,
  ReceiveDelivery,
  useDeliveries,
  useDelivery,
  useCreateDeliveryMutation,
  useReorderMutation,
  useUpdateStatusMutation,
  useReceiveMutation,
};

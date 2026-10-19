import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import { NextOnHand, WithOnHand } from '../lib/stock-math';
import type {
  AdjustStockInput,
  ComponentInput,
  ItemDetailResponseType,
  ItemFormInput,
  ItemResponseType,
  ListItemsParams,
  RelocateInput,
  UpdateItemInput,
} from '../types';

const ListItems = (params: ListItemsParams) => Biz.Get<ItemResponseType[]>('/items', { params });
const GetItem = (sku: string) => Biz.Get<ItemDetailResponseType>(`/items/${encodeURIComponent(sku)}`);
const CreateItem = (input: ItemFormInput & { components: ComponentInput[] }) => Biz.Post<ItemResponseType>('/items', input);
const UpdateItem = (sku: string, input: UpdateItemInput) => Biz.Put<ItemResponseType>(`/items/${encodeURIComponent(sku)}`, input);
const ArchiveItem = (sku: string) => Biz.Delete<void>(`/items/${encodeURIComponent(sku)}`);
const SetComponents = (sku: string, components: ComponentInput[]) =>
  Biz.Put<ItemResponseType>(`/items/${encodeURIComponent(sku)}/components`, { components });
const AdjustStock = (sku: string, input: AdjustStockInput) =>
  Biz.Post<ItemResponseType>(`/items/${encodeURIComponent(sku)}/adjustments`, input);
const RelocateItem = (sku: string, input: RelocateInput) =>
  Biz.Post<ItemResponseType>(`/items/${encodeURIComponent(sku)}/relocate`, input);

const itemsKeys = {
  all: ['items'] as const,
  listPrefix: ['items', 'list'] as const,
  list: (params: ListItemsParams) => ['items', 'list', params] as const,
  detail: (sku: string) => ['items', 'detail', sku] as const,
};

/** Everything that shows stock: items, storage, the dashboard and the activity log. */
const STOCK_KEYS: QueryKey[] = [['items'], ['locations'], ['dashboard'], ['activity']];

const useItems = (params: ListItemsParams = {}) =>
  useQuery({ queryKey: itemsKeys.list(params), queryFn: () => ListItems(params), placeholderData: keepPreviousData });

const useItem = (sku: string | null) =>
  useQuery({ queryKey: itemsKeys.detail(sku ?? ''), queryFn: () => GetItem(sku!), enabled: Boolean(sku) });

/** Patch one SKU wherever it is cached: every list variant and its detail. */
const patchSku = (sku: string, fn: (i: ItemResponseType) => ItemResponseType) => [
  { queryKey: itemsKeys.all, update: PatchWhere<ItemResponseType>((i) => i.sku === sku, fn) },
];

const useAdjustStockMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, input }: { sku: string; input: AdjustStockInput }) => AdjustStock(sku, input),
    optimistic: ({ sku, input }) => patchSku(sku, (i) => WithOnHand(i, NextOnHand(i.onHand, input.mode, input.qty))),
    invalidate: STOCK_KEYS,
    // The dialog closes as soon as the change shows; a refusal rolls back and toasts the reason.
    errorTitle: 'Stock not adjusted — change undone',
    successToast: (item) => ({ title: 'Stock adjusted', message: `${item.name} now has ${item.onHand} ${item.unit} on hand` }),
  });

const useRelocateMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, input }: { sku: string; input: RelocateInput }) => RelocateItem(sku, input),
    optimistic: ({ sku, input }) => patchSku(sku, (i) => ({ ...i, location: input.location })),
    invalidate: STOCK_KEYS,
    errorTitle: 'Could not move it',
    successToast: (item) => ({ title: 'Moved', message: `${item.name} is now in ${item.location ?? 'no location'}` }),
  });

const useCreateItemMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateItem,
    invalidate: [...STOCK_KEYS, ['categories'], ['suppliers']],
    errorTitle: 'Item not added',
    quietError: true,
    successToast: (item) => ({ title: `${item.name} added`, message: item.sku }),
  });

const useUpdateItemMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, input }: { sku: string; input: UpdateItemInput }) => UpdateItem(sku, input),
    optimistic: ({ sku, input }) => patchSku(sku, (i) => ({ ...i, ...input })),
    invalidate: [...STOCK_KEYS, ['categories']],
    errorTitle: 'Changes not saved',
    quietError: true,
    successToast: (item) => ({ title: 'Saved', message: item.name }),
  });

const useArchiveItemMutation = () =>
  useOptimisticMutation({
    mutationFn: ArchiveItem,
    optimistic: (sku: string) => [
      { queryKey: itemsKeys.listPrefix, update: (old) => (Array.isArray(old) ? old.filter((i: ItemResponseType) => i.sku !== sku) : old) },
    ],
    invalidate: [...STOCK_KEYS, ['categories']],
    errorTitle: 'Could not archive',
    successToast: (_, sku) => ({ title: `${sku} archived`, message: 'Its history is kept' }),
  });

const useSetComponentsMutation = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, components }: { sku: string; components: ComponentInput[] }) => SetComponents(sku, components),
    invalidate: STOCK_KEYS,
    errorTitle: 'Recipe not saved',
    successToast: (item) => ({ title: 'Recipe saved', message: `${item.name} · ${item.available} can be made now` }),
  });

export const inventoryService = {
  keys: itemsKeys,
  STOCK_KEYS,
  ListItems,
  GetItem,
  CreateItem,
  UpdateItem,
  ArchiveItem,
  SetComponents,
  AdjustStock,
  RelocateItem,
  useItems,
  useItem,
  useAdjustStockMutation,
  useRelocateMutation,
  useCreateItemMutation,
  useUpdateItemMutation,
  useArchiveItemMutation,
  useSetComponentsMutation,
};

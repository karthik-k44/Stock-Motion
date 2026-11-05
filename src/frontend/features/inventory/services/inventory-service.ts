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

const itemsKeys = {
  all: ['items'] as const,
  lists: () => [...itemsKeys.all, 'list'] as const,
  list: (filter: ListItemsParams) => [...itemsKeys.lists(), filter] as const,
  details: () => [...itemsKeys.all, 'detail'] as const,
  detail: (sku: string) => [...itemsKeys.details(), sku] as const,
};

/** Everything that shows stock: items, storage, the dashboard and the activity log. */
const STOCK_KEYS: QueryKey[] = [itemsKeys.all, ['locations'], ['dashboard'], ['activity']];

const path = (sku: string) => `/items/${encodeURIComponent(sku)}`;

const useGetItems = (filter: ListItemsParams = {}) =>
  useQuery({
    queryKey: itemsKeys.list(filter),
    queryFn: (): Promise<ItemResponseType[]> => Biz.Get('/items', { params: filter }),
    placeholderData: keepPreviousData,
  });

const useGetItem = (sku: string | null) =>
  useQuery({
    queryKey: itemsKeys.detail(sku ?? ''),
    queryFn: (): Promise<ItemDetailResponseType> => Biz.Get(path(sku!)),
    enabled: Boolean(sku),
  });

/** Patch one SKU wherever it is cached: every list variant and its detail. */
const patchSku = (sku: string, fn: (i: ItemResponseType) => ItemResponseType) => [
  { queryKey: itemsKeys.all, update: PatchWhere<ItemResponseType>((i) => i.sku === sku, fn) },
];

const useAdjustStock = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, input }: { sku: string; input: AdjustStockInput }): Promise<ItemResponseType> =>
      Biz.Post(`${path(sku)}/adjustments`, input),
    optimistic: ({ sku, input }) => patchSku(sku, (i) => WithOnHand(i, NextOnHand(i.onHand, input.mode, input.qty))),
    invalidate: STOCK_KEYS,
    // The dialog closes as soon as the change shows; a refusal rolls back and toasts the reason.
    errorTitle: 'Stock not adjusted — change undone',
    successToast: (item) => ({ title: 'Stock adjusted', message: `${item.name} now has ${item.onHand} ${item.unit} on hand` }),
  });

const useRelocateItem = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, input }: { sku: string; input: RelocateInput }): Promise<ItemResponseType> =>
      Biz.Post(`${path(sku)}/relocate`, input),
    optimistic: ({ sku, input }) => patchSku(sku, (i) => ({ ...i, location: input.location })),
    invalidate: STOCK_KEYS,
    errorTitle: 'Could not move it',
    successToast: (item) => ({ title: 'Moved', message: `${item.name} is now in ${item.location ?? 'no location'}` }),
  });

const useCreateItem = () =>
  useOptimisticMutation({
    mutationFn: (input: ItemFormInput & { components: ComponentInput[] }): Promise<ItemResponseType> => Biz.Post('/items', input),
    invalidate: [...STOCK_KEYS, ['categories'], ['suppliers']],
    errorTitle: 'Item not added',
    quietError: true,
    successToast: (item) => ({ title: `${item.name} added`, message: item.sku }),
  });

const useUpdateItem = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, input }: { sku: string; input: UpdateItemInput }): Promise<ItemResponseType> =>
      Biz.Put(path(sku), input),
    optimistic: ({ sku, input }) => patchSku(sku, (i) => ({ ...i, ...input })),
    invalidate: [...STOCK_KEYS, ['categories']],
    errorTitle: 'Changes not saved',
    quietError: true,
    successToast: (item) => ({ title: 'Saved', message: item.name }),
  });

const useArchiveItem = () =>
  useOptimisticMutation({
    mutationFn: (sku: string): Promise<void> => Biz.Delete(path(sku)),
    optimistic: (sku) => [
      { queryKey: itemsKeys.lists(), update: (old) => (Array.isArray(old) ? old.filter((i: ItemResponseType) => i.sku !== sku) : old) },
    ],
    invalidate: [...STOCK_KEYS, ['categories']],
    errorTitle: 'Could not archive',
    successToast: (_, sku) => ({ title: `${sku} archived`, message: 'Its history is kept' }),
  });

const useSetItemComponents = () =>
  useOptimisticMutation({
    mutationFn: ({ sku, components }: { sku: string; components: ComponentInput[] }): Promise<ItemResponseType> =>
      Biz.Put(`${path(sku)}/components`, { components }),
    invalidate: STOCK_KEYS,
    errorTitle: 'Recipe not saved',
    successToast: (item) => ({ title: 'Recipe saved', message: `${item.name} · ${item.available} can be made now` }),
  });

export const inventoryService = {
  itemsKeys,
  useGetItems,
  useGetItem,
  useAdjustStock,
  useRelocateItem,
  useCreateItem,
  useUpdateItem,
  useArchiveItem,
  useSetItemComponents,
};

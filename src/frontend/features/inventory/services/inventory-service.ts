import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import { activityService } from '@/frontend/features/activity/services';
import { dashboardService } from '@/frontend/features/dashboard/services';
import { locationsService } from '@/frontend/features/locations/services';
import type { ApiError } from '@/frontend/services/api-error';
import { Get, Post } from '@/frontend/services/request';
import type { AdjustStockInput, ItemDetailResponseType, ItemResponseType, ListItemsParams, RelocateInput } from '../types';

const ListItems = (params: ListItemsParams): Promise<ItemResponseType[]> => Get<ItemResponseType[]>('/items', { params });
const GetItem = (sku: string): Promise<ItemDetailResponseType> => Get<ItemDetailResponseType>(`/items/${sku}`);
const AdjustStock = (sku: string, input: AdjustStockInput): Promise<ItemResponseType> =>
  Post<ItemResponseType>(`/items/${sku}/adjustments`, input);
const RelocateItem = (sku: string, input: RelocateInput): Promise<ItemResponseType> =>
  Post<ItemResponseType>(`/items/${sku}/relocate`, input);

const itemsKeys = {
  all: ['items'] as const,
  listPrefix: ['items', 'list'] as const,
  list: (params: ListItemsParams) => ['items', 'list', params] as const,
  detail: (sku: string) => ['items', 'detail', sku] as const,
};

/** Everything that shows stock: items, bins, dashboard numbers and the activity log. */
const InvalidateStock = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: itemsKeys.all }),
    qc.invalidateQueries({ queryKey: locationsService.keys.all }),
    qc.invalidateQueries({ queryKey: dashboardService.keys.all }),
    qc.invalidateQueries({ queryKey: activityService.keys.all }),
  ]);

const useItems = (params: ListItemsParams = {}) =>
  useQuery({ queryKey: itemsKeys.list(params), queryFn: () => ListItems(params), placeholderData: keepPreviousData });

const useItem = (sku: string | null) =>
  useQuery({ queryKey: itemsKeys.detail(sku ?? ''), queryFn: () => GetItem(sku!), enabled: Boolean(sku) });

const useAdjustStockMutation = () => {
  const qc = useQueryClient();
  return useMutation<ItemResponseType, ApiError, { sku: string; input: AdjustStockInput }>({
    mutationFn: ({ sku, input }) => AdjustStock(sku, input),
    onSuccess: async (item) => {
      await InvalidateStock(qc);
      ToastManager.Success('Stock adjusted', `${item.name} now has ${item.onHand} on hand`);
    },
  });
};

const useRelocateMutation = () => {
  const qc = useQueryClient();
  return useMutation<ItemResponseType, ApiError, { sku: string; input: RelocateInput }>({
    mutationFn: ({ sku, input }) => RelocateItem(sku, input),
    onSuccess: async (item) => {
      await InvalidateStock(qc);
      ToastManager.Success('Item relocated', `${item.name} is now in ${item.location}`);
    },
    onError: (err) => ToastManager.Error('Could not relocate', err.message),
  });
};

export const inventoryService = {
  keys: itemsKeys,
  ListItems,
  GetItem,
  AdjustStock,
  RelocateItem,
  InvalidateStock,
  useItems,
  useItem,
  useAdjustStockMutation,
  useRelocateMutation,
};

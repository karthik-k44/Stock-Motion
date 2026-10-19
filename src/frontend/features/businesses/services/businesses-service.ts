import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useContext, useSyncExternalStore } from 'react';
import { ToastManager } from '@/frontend/components/toast/toast-manager';
import type { ApiError } from '@/frontend/services/api-error';
import { PatchWhere, useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz, Get, Post } from '@/frontend/services/request';
import { sessionState } from '@/frontend/services/session-state';
import { tokenStore } from '@/frontend/services/token-store';
import { BusinessContext } from '../lib/business-context';
import type {
  BusinessDetailResponseType,
  BusinessResponseType,
  CreateBusinessInput,
  TemplateResponseType,
  UpdateBusinessInput,
} from '../types';

const ListMine = () => Get<BusinessResponseType[]>('/businesses');
const ListTemplates = () => Get<TemplateResponseType[]>('/templates');
const CreateBusiness = (input: CreateBusinessInput) => Post<BusinessDetailResponseType>('/businesses', input);
const GetBusiness = () => Biz.Get<BusinessDetailResponseType>('');
const UpdateBusiness = (input: UpdateBusinessInput) => Biz.Patch<BusinessDetailResponseType>('', input);
const ResetData = (sampleData: boolean) => Biz.Post<{ ok: true }>('/reset', { sampleData });

const businessesKeys = {
  mine: ['businesses', 'mine'] as const,
  templates: ['templates'] as const,
  /** Starts with the realtime resource name `business`. */
  detail: (id: string | null) => ['business', id] as const,
};

/** Queries that don't belong to one business and survive a switch. */
const GLOBAL_KEYS = new Set(['session', 'businesses', 'templates', 'invite']);

/** Work in another business: forget everything cached for the previous one. */
function SelectBusiness(qc: QueryClient, id: string | null) {
  tokenStore.Advance();
  sessionState.SetBusinessId(id);
  qc.removeQueries({ predicate: (q) => !GLOBAL_KEYS.has(String(q.queryKey[0])) });
}

const useBusinessId = () => useSyncExternalStore(sessionState.Subscribe, sessionState.GetBusinessId);

const useMyBusinesses = (enabled = true) => useQuery({ queryKey: businessesKeys.mine, queryFn: ListMine, enabled });

const useTemplates = () => useQuery({ queryKey: businessesKeys.templates, queryFn: ListTemplates, staleTime: Infinity });

const useCurrentBusiness = () => {
  const id = useBusinessId();
  return useQuery({ queryKey: businessesKeys.detail(id), queryFn: GetBusiness, enabled: Boolean(id), retry: false });
};

/** The current business. Only call under the app shell (BusinessGate provides it once loaded). */
const useBusiness = (): BusinessDetailResponseType => {
  const business = useContext(BusinessContext);
  if (!business) throw new Error('useBusiness() used outside BusinessGate');
  return business;
};

const useCreateBusinessMutation = () => {
  const qc = useQueryClient();
  return useMutation<BusinessDetailResponseType, ApiError, CreateBusinessInput>({
    mutationFn: CreateBusiness,
    onSuccess: async (business) => {
      SelectBusiness(qc, business.id);
      qc.setQueryData(businessesKeys.detail(business.id), business);
      await qc.invalidateQueries({ queryKey: businessesKeys.mine });
      ToastManager.Success(`${business.name} is ready`, business.template.tagline);
    },
  });
};

const useUpdateBusinessMutation = () => {
  const id = useBusinessId();
  return useOptimisticMutation({
    mutationFn: UpdateBusiness,
    optimistic: (input: UpdateBusinessInput) => [
      { queryKey: businessesKeys.detail(id), update: PatchWhere<BusinessDetailResponseType>(() => true, (b) => ({ ...b, ...input })) },
      { queryKey: businessesKeys.mine, update: PatchWhere<BusinessResponseType>((b) => b.id === id, (b) => ({ ...b, ...input })) },
    ],
    invalidate: [businessesKeys.detail(id), businessesKeys.mine],
    errorTitle: 'Settings not saved',
    successToast: () => ({ title: 'Settings saved' }),
  });
};

const useResetDataMutation = () => {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiError, boolean>({
    mutationFn: ResetData,
    onSuccess: async (_, sampleData) => {
      await qc.invalidateQueries({ predicate: (q) => !GLOBAL_KEYS.has(String(q.queryKey[0])) });
      ToastManager.Success(sampleData ? 'Sample data reloaded' : 'All data cleared', 'Your team and settings were kept');
    },
    onError: (err) => ToastManager.Error('Could not reset', err.message),
  });
};

export const businessesService = {
  keys: businessesKeys,
  ListMine,
  ListTemplates,
  CreateBusiness,
  GetBusiness,
  UpdateBusiness,
  ResetData,
  SelectBusiness,
  useBusinessId,
  useMyBusinesses,
  useTemplates,
  useCurrentBusiness,
  useBusiness,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useResetDataMutation,
};

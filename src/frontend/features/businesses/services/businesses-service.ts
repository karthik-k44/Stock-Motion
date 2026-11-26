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

const businessesKeys = {
  all: ['businesses'] as const,
  mine: () => [...businessesKeys.all, 'mine'] as const,
  templates: () => ['templates'] as const,
  /** Starts with the realtime resource name `business`. */
  detail: (id: string | null) => ['business', id] as const,
};

/** Queries that don't belong to one business and survive a switch. */
const GLOBAL_KEYS = new Set(['session', 'businesses', 'templates', 'invite']);

/** Every business this account belongs to. Kept as a function because AcceptInvite fetches it outside a hook too. */
const ListMine = (): Promise<BusinessResponseType[]> => Get('/businesses');

/** Work in another business: forget everything cached for the previous one. */
const SelectBusiness = (qc: QueryClient, id: string | null) => {
  tokenStore.Advance();
  sessionState.SetBusinessId(id);
  qc.removeQueries({ predicate: (q) => !GLOBAL_KEYS.has(String(q.queryKey[0])) });
};

const useBusinessId = () => useSyncExternalStore(sessionState.Subscribe, sessionState.GetBusinessId);

const useGetMyBusinesses = (enabled = true) => useQuery({ queryKey: businessesKeys.mine(), queryFn: ListMine, enabled });

const useGetTemplates = () =>
  useQuery({
    queryKey: businessesKeys.templates(),
    queryFn: (): Promise<TemplateResponseType[]> => Get('/templates'),
    staleTime: Infinity,
  });

const useGetCurrentBusiness = () => {
  const id = useBusinessId();
  return useQuery({
    queryKey: businessesKeys.detail(id),
    queryFn: (): Promise<BusinessDetailResponseType> => Biz.Get(''),
    enabled: Boolean(id),
    retry: false,
  });
};

/** The current business. Only call under the app shell (BusinessGate provides it once loaded). */
const useBusiness = (): BusinessDetailResponseType => {
  const business = useContext(BusinessContext);
  if (!business) throw new Error('useBusiness() used outside BusinessGate');
  return business;
};

const useCreateBusiness = () => {
  const qc = useQueryClient();
  return useMutation<BusinessDetailResponseType, ApiError, CreateBusinessInput>({
    mutationFn: (input) => Post('/businesses', input),
    onSuccess: async (business) => {
      SelectBusiness(qc, business.id);
      qc.setQueryData(businessesKeys.detail(business.id), business);
      await qc.invalidateQueries({ queryKey: businessesKeys.mine() });
      ToastManager.Success(`${business.name} is ready`, business.template.tagline);
    },
  });
};

const useUpdateBusiness = () => {
  const id = useBusinessId();
  return useOptimisticMutation({
    mutationFn: (input: UpdateBusinessInput): Promise<BusinessDetailResponseType> => Biz.Patch('', input),
    optimistic: (input) => [
      { queryKey: businessesKeys.detail(id), update: PatchWhere<BusinessDetailResponseType>(() => true, (b) => ({ ...b, ...input })) },
      { queryKey: businessesKeys.mine(), update: PatchWhere<BusinessResponseType>((b) => b.id === id, (b) => ({ ...b, ...input })) },
    ],
    invalidate: [businessesKeys.detail(id), businessesKeys.mine()],
    errorTitle: 'Settings not saved',
    successToast: () => ({ title: 'Settings saved' }),
  });
};

const useResetData = () => {
  const qc = useQueryClient();
  return useMutation<{ ok: true }, ApiError, void>({
    mutationFn: () => Biz.Post('/reset'),
    onSuccess: async () => {
      await qc.invalidateQueries({ predicate: (q) => !GLOBAL_KEYS.has(String(q.queryKey[0])) });
      ToastManager.Success('All data cleared', 'Your team and settings were kept');
    },
    onError: (err) => ToastManager.Error('Could not reset', err.message),
  });
};

export const businessesService = {
  businessesKeys,
  ListMine,
  SelectBusiness,
  useBusinessId,
  useGetMyBusinesses,
  useGetTemplates,
  useGetCurrentBusiness,
  useBusiness,
  useCreateBusiness,
  useUpdateBusiness,
  useResetData,
};

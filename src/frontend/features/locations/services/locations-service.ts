import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CreateLocationInput, LocationResponseType } from '../types';

const locationsKeys = {
  all: ['locations'] as const,
  list: () => [...locationsKeys.all, 'list'] as const,
};

const useGetLocations = () =>
  useQuery({
    queryKey: locationsKeys.list(),
    queryFn: (): Promise<LocationResponseType[]> => Biz.Get('/locations'),
  });

const useCreateLocation = () =>
  useOptimisticMutation({
    mutationFn: (input: CreateLocationInput): Promise<LocationResponseType[]> => Biz.Post('/locations', input),
    optimistic: (input) => [
      { queryKey: locationsKeys.all, update: (old) => (Array.isArray(old) ? [...old, { ...input, items: [] }] : old) },
    ],
    invalidate: [locationsKeys.all, ['dashboard']],
    errorTitle: 'Location not added',
    successToast: (_, input) => ({ title: `${input.code} added`, message: input.name }),
  });

export const locationsService = { locationsKeys, useGetLocations, useCreateLocation };

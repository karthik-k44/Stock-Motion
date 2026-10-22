import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CreateLocationInput, LocationResponseType } from '../types';

const ListLocations = () => Biz.Get<LocationResponseType[]>('/locations');
const CreateLocation = (input: CreateLocationInput) => Biz.Post<LocationResponseType[]>('/locations', input);

const locationsKeys = {
  all: ['locations'] as const,
  list: () => ['locations', 'list'] as const,
};

const useLocations = () => useQuery({ queryKey: locationsKeys.list(), queryFn: ListLocations });

const useCreateLocationMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateLocation,
    optimistic: (input: CreateLocationInput) => [
      { queryKey: locationsKeys.all, update: (old) => (Array.isArray(old) ? [...old, { ...input, items: [] }] : old) },
    ],
    invalidate: [locationsKeys.all, ['dashboard']],
    errorTitle: 'Location not added',
    successToast: (_, input) => ({ title: `${input.code} added`, message: input.name }),
  });

export const locationsService = { keys: locationsKeys, ListLocations, CreateLocation, useLocations, useCreateLocationMutation };

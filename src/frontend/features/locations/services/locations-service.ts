import { useQuery } from '@tanstack/react-query';
import { Get } from '@/frontend/services/request';
import type { LocationResponseType } from '../types';

const ListLocations = (): Promise<LocationResponseType[]> => Get<LocationResponseType[]>('/locations');

const locationsKeys = {
  all: ['locations'] as const,
  list: () => ['locations', 'list'] as const,
};

const useLocations = () => useQuery({ queryKey: locationsKeys.list(), queryFn: ListLocations });

export const locationsService = { keys: locationsKeys, ListLocations, useLocations };

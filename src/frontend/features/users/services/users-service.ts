import { useQuery } from '@tanstack/react-query';
import { Get } from '@/frontend/services/request';
import type { UserResponseType } from '../types';

const ListUsers = (): Promise<UserResponseType[]> => Get<UserResponseType[]>('/users');

const usersKeys = {
  all: ['users'] as const,
  list: () => ['users', 'list'] as const,
};

const useUsers = () =>
  useQuery({ queryKey: usersKeys.list(), queryFn: ListUsers, staleTime: Infinity });

export const usersService = { keys: usersKeys, ListUsers, useUsers };

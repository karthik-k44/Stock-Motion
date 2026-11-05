import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CategoryResponseType } from '../types';

const categoriesKeys = {
  all: ['categories'] as const,
  list: () => [...categoriesKeys.all, 'list'] as const,
};

const useGetCategories = () =>
  useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: (): Promise<CategoryResponseType[]> => Biz.Get('/categories'),
    staleTime: 60_000,
  });

const useCreateCategory = () =>
  useOptimisticMutation({
    mutationFn: (name: string): Promise<CategoryResponseType[]> => Biz.Post('/categories', { name }),
    optimistic: (name) => [
      {
        queryKey: categoriesKeys.all,
        update: (old) => (Array.isArray(old) ? [...old, { code: `pending-${name}`, name, itemCount: 0 }] : old),
      },
    ],
    invalidate: [categoriesKeys.all],
    errorTitle: 'Category not added',
    successToast: (_, name) => ({ title: `${name} added` }),
  });

const useDeleteCategory = () =>
  useOptimisticMutation({
    mutationFn: (code: string): Promise<CategoryResponseType[]> => Biz.Delete(`/categories/${encodeURIComponent(code)}`),
    optimistic: (code) => [
      { queryKey: categoriesKeys.all, update: (old) => (Array.isArray(old) ? old.filter((c: CategoryResponseType) => c.code !== code) : old) },
    ],
    invalidate: [categoriesKeys.all],
    errorTitle: 'Category not removed',
  });

/** Display name for a category code; falls back to the code. */
const CategoryName = (categories: CategoryResponseType[] | undefined, code: string) =>
  categories?.find((c) => c.code === code)?.name ?? code;

export const categoriesService = {
  categoriesKeys,
  CategoryName,
  useGetCategories,
  useCreateCategory,
  useDeleteCategory,
};

import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/frontend/services/optimistic';
import { Biz } from '@/frontend/services/request';
import type { CategoryResponseType } from '../types';

const ListCategories = () => Biz.Get<CategoryResponseType[]>('/categories');
const CreateCategory = (name: string) => Biz.Post<CategoryResponseType[]>('/categories', { name });
const DeleteCategory = (code: string) => Biz.Delete<CategoryResponseType[]>(`/categories/${encodeURIComponent(code)}`);

const categoriesKeys = {
  all: ['categories'] as const,
  list: () => ['categories', 'list'] as const,
};

const useCategories = () => useQuery({ queryKey: categoriesKeys.list(), queryFn: ListCategories, staleTime: 60_000 });

const useCreateCategoryMutation = () =>
  useOptimisticMutation({
    mutationFn: CreateCategory,
    optimistic: (name: string) => [
      {
        queryKey: categoriesKeys.all,
        update: (old) => (Array.isArray(old) ? [...old, { code: `pending-${name}`, name, itemCount: 0 }] : old),
      },
    ],
    invalidate: [categoriesKeys.all],
    errorTitle: 'Category not added',
    successToast: (_, name) => ({ title: `${name} added` }),
  });

const useDeleteCategoryMutation = () =>
  useOptimisticMutation({
    mutationFn: DeleteCategory,
    optimistic: (code: string) => [
      { queryKey: categoriesKeys.all, update: (old) => (Array.isArray(old) ? old.filter((c: CategoryResponseType) => c.code !== code) : old) },
    ],
    invalidate: [categoriesKeys.all],
    errorTitle: 'Category not removed',
  });

/** Display name for a category code; falls back to the code. */
const CategoryName = (categories: CategoryResponseType[] | undefined, code: string) =>
  categories?.find((c) => c.code === code)?.name ?? code;

export const categoriesService = {
  keys: categoriesKeys,
  ListCategories,
  CreateCategory,
  DeleteCategory,
  CategoryName,
  useCategories,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
};

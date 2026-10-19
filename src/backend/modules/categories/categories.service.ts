import { BadRequest, Conflict, NotFound } from '@/backend/common/errors';
import { db } from '@/backend/db/client';
import { BroadcastChange } from '@/backend/realtime/socket';
import type { ScopeType } from '@/backend/types/business';
import type { CategoryResponseType } from '@/backend/types/category';
import { ResourceTypeEnum } from '@/backend/types/dashboard';
import { categoriesRepository } from './categories.repository';
import type { CreateCategoryInput } from './categories.validators';

async function List(scope: ScopeType): Promise<CategoryResponseType[]> {
  const rows = await categoriesRepository.List(db, scope.businessId);
  return rows.map((r) => ({ code: r.code, name: r.name, itemCount: r.item_count }));
}

/** Throws unless the category exists in this business. */
async function AssertExists(scope: ScopeType, code: string): Promise<void> {
  if (!(await categoriesRepository.Find(db, scope.businessId, code))) throw BadRequest(`Unknown category ${code}`);
}

async function Create(scope: ScopeType, input: CreateCategoryInput): Promise<CategoryResponseType[]> {
  const code = input.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  if (!code) throw BadRequest('Use letters or numbers in the category name');
  if (await categoriesRepository.Find(db, scope.businessId, code)) throw Conflict(`${input.name} already exists`);
  await categoriesRepository.Insert(db, scope.businessId, { code, name: input.name });
  BroadcastChange(scope.businessId, [ResourceTypeEnum.CATEGORIES]);
  return List(scope);
}

async function Delete(scope: ScopeType, code: string): Promise<CategoryResponseType[]> {
  const current = (await List(scope)).find((c) => c.code === code);
  if (!current) throw NotFound('Category', code);
  if (current.itemCount) throw Conflict(`${current.name} still has ${current.itemCount} item${current.itemCount === 1 ? '' : 's'}`);
  await categoriesRepository.Delete(db, scope.businessId, code);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.CATEGORIES]);
  return List(scope);
}

export const categoriesService = { List, AssertExists, Create, Delete };

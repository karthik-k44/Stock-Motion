import { Conflict } from '@/backend/common/errors';
import { db } from '@/backend/db/client';
import { ToItemResponse } from '@/backend/modules/items/items.mapper';
import { itemsRepository } from '@/backend/modules/items/items.repository';
import { BroadcastChange } from '@/backend/realtime/socket';
import type { ScopeType } from '@/backend/types/business';
import { ResourceTypeEnum, type LocationResponseType } from '@/backend/types/dashboard';
import { locationsRepository } from './locations.repository';
import type { CreateLocationInput } from './locations.validators';

/** Every location of the business with the items stored there (shared shelves can hold several). */
const List = async (scope: ScopeType): Promise<LocationResponseType[]> => {
  const [locations, items] = await Promise.all([
    locationsRepository.List(db, scope.businessId),
    itemsRepository.ListViews(db, scope.businessId),
  ]);
  return locations.map((l) => ({
    code: l.code,
    zone: l.zone,
    name: l.name,
    items: items.filter((i) => i.location === l.code).map(ToItemResponse),
  }));
};

const Create = async (scope: ScopeType, input: CreateLocationInput): Promise<LocationResponseType[]> => {
  if (await locationsRepository.Find(db, scope.businessId, input.code)) throw Conflict(`${input.code} already exists`);
  await locationsRepository.Insert(db, scope.businessId, input);
  BroadcastChange(scope.businessId, [ResourceTypeEnum.LOCATIONS, ResourceTypeEnum.DASHBOARD]);
  return List(scope);
};

export const locationsService = { List, Create };

import { db } from '@/backend/db/client';
import type { ActivityResponseType } from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import { ToActivityResponse } from './activity.mapper';
import { activityRepository } from './activity.repository';
import type { ListActivityQuery } from './activity.validators';

async function List(scope: ScopeType, filters: ListActivityQuery): Promise<ActivityResponseType[]> {
  return (await activityRepository.List(db, scope.businessId, filters)).map(ToActivityResponse);
}

export const activityService = { List };

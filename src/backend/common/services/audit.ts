import type { Queryable } from '@/backend/db/client';
import { ToActivityResponse } from '@/backend/modules/activity/activity.mapper';
import { activityRepository } from '@/backend/modules/activity/activity.repository';
import { itemsRepository } from '@/backend/modules/items/items.repository';
import type {
  ActivityKindTypeEnum,
  ActivityMetaType,
  ActivityRefTypeEnum,
  ActivityResponseType,
} from '@/backend/types/activity';
import type { ScopeType } from '@/backend/types/business';
import type { MovementTypeEnum } from '@/backend/types/item';

/**
 * The activity log and stock ledger are written by several modules (items,
 * orders, deliveries), always inside the caller's transaction.
 */
export async function RecordActivity(
  tx: Queryable,
  scope: ScopeType,
  input: {
    kind: ActivityKindTypeEnum;
    message: string;
    ref?: { type: ActivityRefTypeEnum; id: string };
    meta?: ActivityMetaType;
  },
): Promise<ActivityResponseType> {
  const row = await activityRepository.Insert(tx, {
    businessId: scope.businessId,
    kind: input.kind,
    accountId: scope.actor.id,
    message: input.message,
    refType: input.ref?.type,
    refId: input.ref?.id,
    meta: input.meta,
  });
  return ToActivityResponse({ ...row, actor_name: scope.actor.name });
}

export async function RecordMovement(
  tx: Queryable,
  scope: ScopeType,
  input: { itemId: string; type: MovementTypeEnum; delta: number; balance: number; ref?: string | null; note: string },
): Promise<void> {
  await itemsRepository.InsertMovement(tx, { businessId: scope.businessId, accountId: scope.actor.id, ...input });
}

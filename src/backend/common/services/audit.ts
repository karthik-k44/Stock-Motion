import type { Queryable } from '@/backend/db/client';
import type { ActivityRow } from '@/backend/db/schema';
import { ACTIVITY_COLUMNS, ToActivityResponse } from '@/backend/modules/activity/activity.mapper';
import type {
  ActivityKindTypeEnum,
  ActivityMetaType,
  ActivityRefTypeEnum,
  ActivityResponseType,
} from '@/backend/types/activity';
import type { MovementTypeEnum } from '@/backend/types/item';

/**
 * The activity log and stock ledger are written by several modules (items,
 * orders, deliveries), always inside the caller's transaction.
 */
export async function RecordActivity(
  tx: Queryable,
  input: {
    kind: ActivityKindTypeEnum;
    userId: string;
    message: string;
    ref?: { type: ActivityRefTypeEnum; id: string };
    meta?: ActivityMetaType;
  },
): Promise<ActivityResponseType> {
  const { rows } = await tx.query<ActivityRow>(
    `INSERT INTO activity (kind, user_id, message, ref_type, ref_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${ACTIVITY_COLUMNS}`,
    [input.kind, input.userId, input.message, input.ref?.type ?? null, input.ref?.id ?? null, JSON.stringify(input.meta ?? {})],
  );
  return ToActivityResponse(rows[0]);
}

export async function RecordMovement(
  tx: Queryable,
  input: { sku: string; type: MovementTypeEnum; delta: number; balance: number; ref?: string | null; userId: string; note: string },
): Promise<void> {
  await tx.query(
    'INSERT INTO movements (sku, type, delta, balance, ref, user_id, note) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [input.sku, input.type, input.delta, input.balance, input.ref ?? null, input.userId, input.note],
  );
}

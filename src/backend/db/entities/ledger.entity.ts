import { EntitySchema } from 'typeorm';
import type { ActivityRecord, MovementRecord } from '../schema';
import { CreatedAt, Int, SerialId, Text, TextOrNull } from './columns';

/** The stock ledger: one row per change to an item's on-hand count. Append-only (a trigger refuses updates). */
export const MovementEntity = new EntitySchema<MovementRecord>({
  name: 'Movement',
  tableName: 'movements',
  columns: {
    id: SerialId,
    business_id: Text,
    at: CreatedAt,
    item_id: Text,
    type: Text,
    delta: Int,
    balance: Int,
    ref: TextOrNull,
    account_id: TextOrNull,
    note: { ...Text, default: '' },
  },
});

/** Who did what, and when. Append-only (a trigger refuses updates). */
export const ActivityEntity = new EntitySchema<ActivityRecord>({
  name: 'Activity',
  tableName: 'activity',
  columns: {
    id: SerialId,
    business_id: Text,
    at: CreatedAt,
    kind: Text,
    account_id: TextOrNull,
    message: Text,
    ref_type: TextOrNull,
    ref_id: TextOrNull,
    meta: { type: 'jsonb', default: () => `'{}'::jsonb` },
  },
});

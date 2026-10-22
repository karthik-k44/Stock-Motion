import { ToIso } from '@/backend/common/utils/dates';
import type { ActivityRow } from '@/backend/db/schema';
import type {
  ActivityKindTypeEnum,
  ActivityMetaType,
  ActivityRefTypeEnum,
  ActivityResponseType,
} from '@/backend/types/activity';

export const ToActivityResponse = (row: ActivityRow): ActivityResponseType => {
  const meta = typeof row.meta === 'string' ? (JSON.parse(row.meta) as ActivityMetaType) : ((row.meta ?? {}) as ActivityMetaType);
  return {
    id: row.id,
    at: ToIso(row.at),
    kind: row.kind as ActivityKindTypeEnum,
    accountId: row.account_id,
    actorName: row.actor_name,
    message: row.message,
    refType: row.ref_type as ActivityRefTypeEnum | null,
    refId: row.ref_id,
    meta,
  };
};

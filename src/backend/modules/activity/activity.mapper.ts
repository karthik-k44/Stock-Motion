import { ToIso } from '@/backend/common/utils/dates';
import type { ActivityRow } from '@/backend/db/schema';
import type {
  ActivityKindTypeEnum,
  ActivityMetaType,
  ActivityRefTypeEnum,
  ActivityResponseType,
} from '@/backend/types/activity';

export const ACTIVITY_COLUMNS = 'id, at, kind, user_id, message, ref_type, ref_id, meta';

export function ToActivityResponse(row: ActivityRow): ActivityResponseType {
  const meta = typeof row.meta === 'string' ? (JSON.parse(row.meta) as ActivityMetaType) : ((row.meta ?? {}) as ActivityMetaType);
  return {
    id: row.id,
    at: ToIso(row.at),
    kind: row.kind as ActivityKindTypeEnum,
    userId: row.user_id,
    message: row.message,
    refType: row.ref_type as ActivityRefTypeEnum | null,
    refId: row.ref_id,
    meta,
  };
}

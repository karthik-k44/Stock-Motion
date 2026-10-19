import { z } from 'zod';
import { ActivityKindTypeEnum, ActivityRefTypeEnum } from '@/backend/types/activity';

export const ListActivityQuerySchema = z.object({
  kind: z.nativeEnum(ActivityKindTypeEnum).optional(),
  accountId: z.string().max(64).optional(),
  refType: z.nativeEnum(ActivityRefTypeEnum).optional(),
  refId: z.string().max(64).optional(),
  search: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
export type ListActivityQuery = z.infer<typeof ListActivityQuerySchema>;

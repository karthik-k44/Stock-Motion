import { z } from 'zod';
import { ActivityKindTypeEnum } from '@/backend/types/activity';

export const ListActivityQuerySchema = z.object({
  kind: z.nativeEnum(ActivityKindTypeEnum).optional(),
  userId: z.string().optional(),
  search: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});
export type ListActivityQuery = z.infer<typeof ListActivityQuerySchema>;

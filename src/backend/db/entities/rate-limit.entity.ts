import { EntitySchema } from 'typeorm';
import type { RateLimitRecord } from '../schema';
import { Int, Key, Time } from './columns';

/** Shared rate-limit counters, so every server instance counts the same requests (middleware/rate-limit). */
export const RateLimitEntity = new EntitySchema<RateLimitRecord>({
  name: 'RateLimit',
  tableName: 'rate_limits',
  columns: { key: Key, count: Int, reset_at: Time },
});

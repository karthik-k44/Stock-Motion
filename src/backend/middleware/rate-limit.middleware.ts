import type { NextFunction, Request, Response } from 'express';
import { TooManyRequests } from '@/backend/common/errors';
import { logger } from '@/backend/config/logger';
import { db } from '@/backend/db/client';
import { rateLimitsRepository } from '@/backend/modules/rate-limits/rate-limits.repository';

/** Counts hits per key in fixed windows. Returns the count in the current window, this hit included. */
type RateLimitStoreType = { Hit: (key: string, windowMs: number) => Promise<number> };

/** Counts in this process's memory: no round trip, but each server instance counts on its own. */
const memoryStore = (windowMs: number): RateLimitStoreType => {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs);
  sweep.unref();
  return {
    Hit: async (key) => {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return 1;
      }
      return ++entry.count;
    },
  };
};

/** Counts in PostgreSQL, shared by every server instance. */
const databaseStore = (windowMs: number): RateLimitStoreType => {
  const sweep = setInterval(() => {
    rateLimitsRepository.DeleteExpired(db).catch((err: unknown) => logger.warn('Could not sweep rate limits', err));
  }, Math.max(windowMs, 60_000));
  sweep.unref();
  return { Hit: (key) => rateLimitsRepository.Hit(db, key, windowMs) };
};

/**
 * Fixed-window limiter for write requests (GET, HEAD and OPTIONS pass), keyed by client IP. `name` keeps limiters'
 * counters apart; `shared` counts in the database so the limit holds across server instances.
 */
export const RateLimitWrites = (opts: { name: string; windowMs: number; max: number; shared?: boolean }) => {
  const store = opts.shared ? databaseStore(opts.windowMs) : memoryStore(opts.windowMs);
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    const count = await store.Hit(`${opts.name}:${req.ip ?? 'unknown'}`, opts.windowMs);
    next(count > opts.max ? TooManyRequests() : undefined);
  };
};

import type { NextFunction, Request, Response } from 'express';
import { TooManyRequests } from '@/backend/common/errors';

/** Small fixed-window limiter for write requests, keyed by client IP. */
export function RateLimitWrites(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > opts.max) return next(TooManyRequests());
    next();
  };
}

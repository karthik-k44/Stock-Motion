import type { NextFunction, Request, Response } from 'express';
import { db } from '@/backend/db/client';
import { ScopeOf } from '@/backend/modules/businesses/rest-api/businesses.middleware';
import { billingService } from '../billing.service';

const READS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** A business whose owner's plan has ended is read-only: everything can be seen, nothing changed. Run after RequireBusinessRole. */
export const RequireWritableBusiness = async (req: Request, _res: Response, next: NextFunction) => {
  if (READS.has(req.method)) return next();
  await billingService.AssertWritable(db, ScopeOf(req).businessId);
  next();
};

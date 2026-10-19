import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/backend/common/errors';
import { logger } from '@/backend/config/logger';

export function ErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const flat = err.flatten();
    const first = Object.values(flat.fieldErrors).flat()[0] ?? flat.formErrors[0] ?? 'Invalid request';
    res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: String(first), details: flat.fieldErrors } });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  logger.error('Unhandled error', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on the server' } });
}

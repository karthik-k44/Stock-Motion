import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/backend/common/errors';
import { PgErrorCode } from '@/backend/common/utils/pg-error';
import { logger } from '@/backend/config/logger';

/** Postgres errors that mean "your request clashes with existing data", never SQL details. */
const PG_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  '23505': { status: 409, code: 'CONFLICT', message: 'Something with these details already exists' },
  '23503': { status: 409, code: 'CONFLICT', message: 'A related record is missing or still in use' },
  '23514': { status: 409, code: 'CONFLICT', message: 'That change would break a stock rule' },
  '22P02': { status: 400, code: 'BAD_REQUEST', message: 'Invalid identifier or value' },
};

export const ErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON request body' } });
    return;
  }
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' } });
    return;
  }
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
  const pgCode = PgErrorCode(err);
  const pg = pgCode ? PG_ERRORS[pgCode] : undefined;
  if (pg) {
    res.status(pg.status).json({ error: { code: pg.code, message: pg.message } });
    return;
  }
  logger.error('Unhandled error', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong on the server' } });
};

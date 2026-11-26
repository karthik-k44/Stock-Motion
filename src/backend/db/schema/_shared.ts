import { timestamp } from 'drizzle-orm/pg-core';

/**
 * Tables keep snake_case property names, exactly as the columns are named, so table rows and joined query rows
 * share one shape. Timestamps come back as Date; NUMERIC columns as strings, to keep every decimal.
 * Constraint names are the ones PostgreSQL gave them, so `drizzle-kit generate` diffs against the real databases.
 */
export type DbDate = Date | string;
export type DbNumeric = number | string;

export const timestampTz = () => timestamp({ withTimezone: true, mode: 'date' });
export const createdAt = () => timestampTz().notNull().defaultNow();

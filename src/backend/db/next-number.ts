import type { Queryable } from '@/backend/db/client';

/**
 * Next human-facing number for a business, e.g. SO-10239 or TKT-1045. Takes a transaction-scoped
 * advisory lock first so two concurrent creates can't pick the same number.
 */
export const NextNumber = async (
  tx: Queryable,
  table: 'orders' | 'deliveries',
  businessId: string,
  prefix: string,
  start: number,): Promise<string> => {
  await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${table}:${businessId}`]);
  const { rows } = await tx.query<{ n: number | null }>(
    `SELECT MAX(NULLIF(regexp_replace(number, '\\D', '', 'g'), '')::int) AS n
     FROM ${table} WHERE business_id = $1 AND number LIKE $2`,
    [businessId, `${prefix}-%`],
  );
  return `${prefix}-${(rows[0]?.n ?? start - 1) + 1}`;
};

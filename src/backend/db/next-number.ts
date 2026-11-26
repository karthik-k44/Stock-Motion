import { and, desc, eq, like, sql } from 'drizzle-orm';
import type { Queryable } from '@/backend/db/client';
import { businesses, type deliveries, type orders } from '@/backend/db/schema';

/**
 * Next human-facing number for a business, e.g. SO-10239 or TKT-1045. Locks the business row first (in the caller's
 * transaction), so two concurrent creates can't pick the same number.
 */
export const NextNumber = async (
  tx: Queryable,
  table: typeof orders | typeof deliveries,
  businessId: string,
  prefix: string,
  start: number,): Promise<string> => {
  await tx.select({ id: businesses.id }).from(businesses).where(eq(businesses.id, businessId)).for('update');
  // Longest first, then highest: SO-10000 sorts after SO-9999.
  const [last] = await tx
    .select({ number: table.number })
    .from(table)
    .where(and(eq(table.business_id, businessId), like(table.number, `${prefix}-%`)))
    .orderBy(desc(sql`length(${table.number})`), desc(table.number))
    .limit(1);
  const current = last ? Number(last.number.slice(prefix.length + 1)) : NaN;
  return `${prefix}-${(Number.isInteger(current) ? current : start - 1) + 1}`;
};

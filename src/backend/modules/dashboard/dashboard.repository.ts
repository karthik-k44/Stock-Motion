import { and, count, desc, eq, gte, isNull, not, or, sql, type SQL } from 'drizzle-orm';
import { StartOfUtcDay, StartOfUtcMonth, UtcDayKey } from '@/backend/common/utils/dates';
import type { Queryable } from '@/backend/db/client';
import { customers, items, memberships, movements, orderLines, orders } from '@/backend/db/schema';
import { ItemKindTypeEnum } from '@/backend/types/item';

export type SalesSummaryRow = {
  orders_today: number;
  closed_today: number;
  revenue_today: number;
  revenue_month: number;
  closed_month: number;
};

export type DailyValueRow = { day: string; value: number };

const lineTotal = sql`${orderLines.qty} * ${orderLines.unit_price}`;
/** count(*) / sum(…) of the rows matching `where`, as a number (FILTER keeps it to one pass over the rows). */
const countWhere = (where: SQL) => sql<number>`count(*) filter (where ${where})`.mapWith(Number);
const sumWhere = (value: SQL | unknown, where: SQL) => sql<number>`coalesce(sum(${value}) filter (where ${where}), 0)`.mapWith(Number);

/** Order counts and revenue. Revenue counts closed, non-cancelled orders by the day they closed. */
const SalesSummary = async (q: Queryable, businessId: string): Promise<SalesSummaryRow> => {
  const today = StartOfUtcDay();
  const month = StartOfUtcMonth();
  const totals = q
    .select({
      created_at: orders.created_at,
      closed_at: orders.closed_at,
      closed: orders.closed,
      cancelled: orders.cancelled,
      total: sql<string>`coalesce(sum(${lineTotal}), 0)`.as('total'),
    })
    .from(orders)
    .leftJoin(orderLines, eq(orderLines.order_id, orders.id))
    .where(and(eq(orders.business_id, businessId), or(gte(orders.created_at, month), gte(orders.closed_at, month))))
    .groupBy(orders.id)
    .as('totals');
  const sold = sql`${totals.closed} and not ${totals.cancelled}`;
  const [row] = await q
    .select({
      orders_today: countWhere(sql`${totals.created_at} >= ${today} and not ${totals.cancelled}`),
      closed_today: countWhere(sql`${sold} and ${totals.closed_at} >= ${today}`),
      revenue_today: sumWhere(totals.total, sql`${sold} and ${totals.closed_at} >= ${today}`),
      revenue_month: sumWhere(totals.total, sql`${sold} and ${totals.closed_at} >= ${month}`),
      closed_month: countWhere(sql`${sold} and ${totals.closed_at} >= ${month}`),
    })
    .from(totals);
  return row;
};

/** Open orders per status. */
const OpenByStatus = (q: Queryable, businessId: string): Promise<{ status: string; n: number }[]> => {
  return q
    .select({ status: orders.status, n: count() })
    .from(orders)
    .where(and(eq(orders.business_id, businessId), not(orders.closed)))
    .groupBy(orders.status);
};

/** Best sellers this month by quantity, from closed orders. */
const TopSellers = (q: Queryable, businessId: string, limit: number): Promise<{ sku: string; name: string; qty: number; revenue: number }[]> => {
  const qty = sql<number>`sum(${orderLines.qty})`.mapWith(Number);
  const revenue = sql<number>`sum(${lineTotal})`.mapWith(Number);
  return q
    .select({ sku: items.sku, name: items.name, qty, revenue })
    .from(orderLines)
    .innerJoin(orders, eq(orders.id, orderLines.order_id))
    .innerJoin(items, eq(items.id, orderLines.item_id))
    .where(and(eq(orders.business_id, businessId), eq(orders.closed, true), not(orders.cancelled), gte(orders.closed_at, StartOfUtcMonth())))
    .groupBy(items.sku, items.name)
    .orderBy(desc(qty), desc(revenue))
    .limit(limit);
};

/** The UTC day of a timestamp, as YYYY-MM-DD. */
const dayOf = (column: unknown) => sql<string>`to_char(${column} at time zone 'UTC', 'YYYY-MM-DD')`;

/** One row per day for the last `days` days, oldest first; days with no rows are 0. */
const fillDays = (totals: { day: string; total: number }[], days: number): DailyValueRow[] => {
  const byDay = new Map(totals.map((t) => [t.day, t.total]));
  return Array.from({ length: days }, (_, i) => {
    const day = UtcDayKey(StartOfUtcDay(i - days + 1));
    return { day, value: byDay.get(day) ?? 0 };
  });
};

/** How much stock value each day added or removed, for the items stocked today at today's cost. */
const DailyStockChange = async (q: Queryable, businessId: string, days: number): Promise<DailyValueRow[]> => {
  const day = dayOf(movements.at);
  const totals = await q
    .select({ day, total: sql<number>`sum(${movements.delta} * ${items.cost})`.mapWith(Number) })
    .from(items)
    .innerJoin(movements, eq(movements.item_id, items.id))
    .where(
      and(eq(items.business_id, businessId), eq(items.kind, ItemKindTypeEnum.STOCK), isNull(items.archived_at), gte(movements.at, StartOfUtcDay(1 - days))),
    )
    .groupBy(day);
  return fillDays(totals, days);
};

/** Revenue per day, counted the same way as SalesSummary: closed, non-cancelled orders by the day they closed. */
const DailyRevenue = async (q: Queryable, businessId: string, days: number): Promise<DailyValueRow[]> => {
  const day = dayOf(orders.closed_at);
  const totals = await q
    .select({ day, total: sql<number>`sum(${lineTotal})`.mapWith(Number) })
    .from(orders)
    .innerJoin(orderLines, eq(orderLines.order_id, orders.id))
    .where(
      and(eq(orders.business_id, businessId), eq(orders.closed, true), not(orders.cancelled), gte(orders.closed_at, StartOfUtcDay(1 - days))),
    )
    .groupBy(day);
  return fillDays(totals, days);
};

const Counts = async (q: Queryable, businessId: string): Promise<{ customers: number; new_customers_month: number; team: number }> => {
  const [all, newThisMonth, team] = await Promise.all([
    q.$count(customers, eq(customers.business_id, businessId)),
    q.$count(customers, and(eq(customers.business_id, businessId), gte(customers.created_at, StartOfUtcMonth()))),
    q.$count(memberships, eq(memberships.business_id, businessId)),
  ]);
  return { customers: all, new_customers_month: newThisMonth, team };
};

export const dashboardRepository = { SalesSummary, OpenByStatus, TopSellers, DailyStockChange, DailyRevenue, Counts };

import type { Queryable } from '@/backend/db/client';

// Reporting aggregates (FILTER, date_trunc) read clearest as SQL, so these stay parameterised raw queries.

export type SalesSummaryRow = {
  orders_today: number;
  closed_today: number;
  revenue_today: number;
  revenue_month: number;
  closed_month: number;
};

/** Order counts and revenue. Revenue counts closed, non-cancelled orders by the day they closed. */
const SalesSummary = async (q: Queryable, businessId: string): Promise<SalesSummaryRow> => {
  const rows: SalesSummaryRow[] = await q.query(
    `WITH totals AS (
       SELECT o.id, o.created_at, o.closed_at, o.closed, o.cancelled, COALESCE(SUM(ol.qty * ol.unit_price), 0) AS total
       FROM orders o LEFT JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.business_id = $1 AND (o.created_at >= date_trunc('month', now()) OR o.closed_at >= date_trunc('month', now()))
       GROUP BY o.id
     )
     SELECT
       COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()) AND NOT cancelled)::int AS orders_today,
       COUNT(*) FILTER (WHERE closed AND NOT cancelled AND closed_at >= date_trunc('day', now()))::int AS closed_today,
       COALESCE(SUM(total) FILTER (WHERE closed AND NOT cancelled AND closed_at >= date_trunc('day', now())), 0)::float8 AS revenue_today,
       COALESCE(SUM(total) FILTER (WHERE closed AND NOT cancelled AND closed_at >= date_trunc('month', now())), 0)::float8 AS revenue_month,
       COUNT(*) FILTER (WHERE closed AND NOT cancelled AND closed_at >= date_trunc('month', now()))::int AS closed_month
     FROM totals`,
    [businessId],
  );
  return rows[0];
};

/** Open orders per status. */
const OpenByStatus = async (q: Queryable, businessId: string): Promise<{ status: string; n: number }[]> => {
  const rows: { status: string; n: number }[] = await q.query(
    'SELECT status, COUNT(*)::int AS n FROM orders WHERE business_id = $1 AND NOT closed GROUP BY status',
    [businessId],
  );
  return rows;
};

/** Best sellers this month by quantity, from closed orders. */
const TopSellers = async (q: Queryable, businessId: string, limit: number): Promise<{ sku: string; name: string; qty: number; revenue: number }[]> => {
  const rows: { sku: string; name: string; qty: number; revenue: number }[] = await q.query(
    `SELECT i.sku, i.name, SUM(ol.qty)::int AS qty, SUM(ol.qty * ol.unit_price)::float8 AS revenue
     FROM order_lines ol JOIN orders o ON o.id = ol.order_id JOIN items i ON i.id = ol.item_id
     WHERE o.business_id = $1 AND o.closed AND NOT o.cancelled AND o.closed_at >= date_trunc('month', now())
     GROUP BY i.sku, i.name ORDER BY qty DESC, revenue DESC LIMIT $2`,
    [businessId, limit],
  );
  return rows;
};

export type DailyValueRow = { day: string; value: number };

/** One row per day, oldest first. `daily` selects (day, total); days it has nothing for come back as 0. */
const dailySeries = async (q: Queryable, daily: string, businessId: string, days: number): Promise<DailyValueRow[]> => {
  const rows: DailyValueRow[] = await q.query(
    `WITH daily AS (${daily})
     SELECT to_char(d.day, 'YYYY-MM-DD') AS day, COALESCE(daily.total, 0)::float8 AS value
     FROM generate_series(date_trunc('day', now()) - ($2::int - 1) * interval '1 day', date_trunc('day', now()), interval '1 day') AS d(day)
     LEFT JOIN daily ON daily.day = d.day
     ORDER BY d.day`,
    [businessId, days],
  );
  return rows;
};

/** How much stock value each day added or removed, for the items stocked today at today's cost. */
const DailyStockChange = (q: Queryable, businessId: string, days: number): Promise<DailyValueRow[]> =>
  dailySeries(
    q,
    `SELECT date_trunc('day', m.at) AS day, SUM(m.delta * i.cost) AS total
     FROM items i JOIN movements m ON m.item_id = i.id
     WHERE i.business_id = $1 AND i.kind = 'STOCK' AND i.archived_at IS NULL
       AND m.at >= date_trunc('day', now()) - ($2::int - 1) * interval '1 day'
     GROUP BY 1`,
    businessId,
    days,
  );

/** Revenue per day, counted the same way as SalesSummary: closed, non-cancelled orders by the day they closed. */
const DailyRevenue = (q: Queryable, businessId: string, days: number): Promise<DailyValueRow[]> =>
  dailySeries(
    q,
    `SELECT date_trunc('day', o.closed_at) AS day, SUM(ol.qty * ol.unit_price) AS total
     FROM orders o JOIN order_lines ol ON ol.order_id = o.id
     WHERE o.business_id = $1 AND o.closed AND NOT o.cancelled
       AND o.closed_at >= date_trunc('day', now()) - ($2::int - 1) * interval '1 day'
     GROUP BY 1`,
    businessId,
    days,
  );

const Counts = async (q: Queryable, businessId: string): Promise<{ customers: number; new_customers_month: number; team: number }> => {
  const rows: { customers: number; new_customers_month: number; team: number }[] = await q.query(
    `SELECT
       (SELECT COUNT(*)::int FROM customers WHERE business_id = $1) AS customers,
       (SELECT COUNT(*)::int FROM customers WHERE business_id = $1 AND created_at >= date_trunc('month', now())) AS new_customers_month,
       (SELECT COUNT(*)::int FROM memberships WHERE business_id = $1) AS team`,
    [businessId],
  );
  return rows[0];
};

export const dashboardRepository = { SalesSummary, OpenByStatus, TopSellers, DailyStockChange, DailyRevenue, Counts };

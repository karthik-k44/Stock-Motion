import type { Queryable } from '@/backend/db/client';
import { BUSINESS_TABLES, type BusinessRow, type MembershipRow } from '@/backend/db/schema';

export type BusinessWithRoleRow = BusinessRow & { role: string };
export type MemberRow = MembershipRow & { name: string; email: string };

const ListForAccount = async (q: Queryable, accountId: string): Promise<BusinessWithRoleRow[]> => {
  const { rows } = await q.query<BusinessWithRoleRow>(
    `SELECT b.*, m.role FROM businesses b JOIN memberships m ON m.business_id = b.id
     WHERE m.account_id = $1 ORDER BY m.created_at`,
    [accountId],
  );
  return rows;
};

const FindForAccount = async (q: Queryable, businessId: string, accountId: string): Promise<BusinessWithRoleRow | undefined> => {
  const { rows } = await q.query<BusinessWithRoleRow>(
    `SELECT b.*, m.role FROM businesses b JOIN memberships m ON m.business_id = b.id
     WHERE b.id = $1 AND m.account_id = $2`,
    [businessId, accountId],
  );
  return rows[0];
};

const Find = async (q: Queryable, businessId: string): Promise<BusinessRow | undefined> => {
  const { rows } = await q.query<BusinessRow>('SELECT * FROM businesses WHERE id = $1', [businessId]);
  return rows[0];
};

const Lock = async (q: Queryable, businessId: string): Promise<BusinessRow | undefined> => {
  const { rows } = await q.query<BusinessRow>('SELECT * FROM businesses WHERE id = $1 FOR UPDATE', [businessId]);
  return rows[0];
};

const Insert = async (q: Queryable, input: { name: string; type: string; currency: string; createdBy: string }): Promise<BusinessRow> => {
  const { rows } = await q.query<BusinessRow>(
    'INSERT INTO businesses (name, type, currency, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [input.name, input.type, input.currency, input.createdBy],
  );
  return rows[0];
};

const Update = async (q: Queryable, businessId: string, input: { name?: string; currency?: string }): Promise<void> => {
  await q.query('UPDATE businesses SET name = COALESCE($2, name), currency = COALESCE($3, currency) WHERE id = $1', [
    businessId, input.name ?? null, input.currency ?? null,
  ]);
};

/** The member's role plus the business type, or undefined when not a member. */
const FindMembership = async (q: Queryable, businessId: string, accountId: string): Promise<{ type: string; role: string } | undefined> => {
  const { rows } = await q.query<{ type: string; role: string }>(
    `SELECT b.type, m.role FROM memberships m JOIN businesses b ON b.id = m.business_id
     WHERE m.business_id = $1 AND m.account_id = $2`,
    [businessId, accountId],
  );
  return rows[0];
};

const CountMembers = async (q: Queryable, businessId: string, role?: string): Promise<number> => {
  const { rows } = await q.query<{ n: number }>(
    'SELECT COUNT(*)::int AS n FROM memberships WHERE business_id = $1 AND ($2::text IS NULL OR role = $2)',
    [businessId, role ?? null],
  );
  return rows[0].n;
};

const InsertMembership = async (q: Queryable, input: { businessId: string; accountId: string; role: string; color: string }): Promise<void> => {
  await q.query('INSERT INTO memberships (business_id, account_id, role, color) VALUES ($1, $2, $3, $4)', [
    input.businessId, input.accountId, input.role, input.color,
  ]);
};

const ListMembers = async (q: Queryable, businessId: string): Promise<MemberRow[]> => {
  const { rows } = await q.query<MemberRow>(
    `SELECT m.*, a.name, a.email FROM memberships m JOIN accounts a ON a.id = m.account_id
     WHERE m.business_id = $1 ORDER BY m.created_at`,
    [businessId],
  );
  return rows;
};

const LockMember = async (q: Queryable, businessId: string, accountId: string): Promise<MemberRow | undefined> => {
  const { rows } = await q.query<MemberRow>(
    `SELECT m.*, a.name, a.email FROM memberships m JOIN accounts a ON a.id = m.account_id
     WHERE m.business_id = $1 AND m.account_id = $2 FOR UPDATE OF m`,
    [businessId, accountId],
  );
  return rows[0];
};

const UpdateMemberRole = async (q: Queryable, businessId: string, accountId: string, role: string): Promise<void> => {
  await q.query('UPDATE memberships SET role = $3 WHERE business_id = $1 AND account_id = $2', [businessId, accountId, role]);
};

const DeleteMember = async (q: Queryable, businessId: string, accountId: string): Promise<void> => {
  await q.query('DELETE FROM memberships WHERE business_id = $1 AND account_id = $2', [businessId, accountId]);
};

/** Remove every operational row of a business (keeps the business, its team and invites). */
const DeleteOperationalData = async (q: Queryable, businessId: string): Promise<void> => {
  await q.query('DELETE FROM item_components WHERE parent_id IN (SELECT id FROM items WHERE business_id = $1)', [businessId]);
  await q.query('DELETE FROM order_lines WHERE order_id IN (SELECT id FROM orders WHERE business_id = $1)', [businessId]);
  await q.query('DELETE FROM delivery_lines WHERE delivery_id IN (SELECT id FROM deliveries WHERE business_id = $1)', [businessId]);
  const scoped = BUSINESS_TABLES.filter((t) => t !== 'item_components' && t !== 'order_lines' && t !== 'delivery_lines');
  for (const table of scoped) await q.query(`DELETE FROM ${table} WHERE business_id = $1`, [businessId]);
};

export const businessesRepository = {
  ListForAccount,
  FindForAccount,
  Find,
  Lock,
  Insert,
  Update,
  FindMembership,
  CountMembers,
  InsertMembership,
  ListMembers,
  LockMember,
  UpdateMemberRole,
  DeleteMember,
  DeleteOperationalData,
};

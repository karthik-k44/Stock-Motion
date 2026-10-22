import type { DbDate } from './_shared';

/** Row shape as returned by the database (snake_case, before mapping), joined with the item sku and actor name. */
export type MovementRow = {
  id: number;
  at: DbDate;
  sku: string;
  type: string;
  delta: number;
  balance: number;
  ref: string | null;
  account_id: string | null;
  actor_name: string | null;
  note: string;
};

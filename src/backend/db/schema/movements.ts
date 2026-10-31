import type { DbDate } from './_shared';

/** The `movements` table: the stock ledger. */
export type MovementRecord = {
  id: number;
  business_id: string;
  at: DbDate;
  item_id: string;
  type: string;
  delta: number;
  balance: number;
  ref: string | null;
  account_id: string | null;
  note: string;
};

/** A ledger row joined with the item sku and actor name. */
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

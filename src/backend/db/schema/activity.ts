import type { DbDate } from './_shared';

/** The `activity` table. */
export type ActivityRecord = {
  id: number;
  business_id: string;
  at: DbDate;
  kind: string;
  account_id: string | null;
  message: string;
  ref_type: string | null;
  ref_id: string | null;
  meta: unknown;
};

/** An activity row joined with the actor name. */
export type ActivityRow = {
  id: number;
  at: DbDate;
  kind: string;
  account_id: string | null;
  actor_name: string | null;
  message: string;
  ref_type: string | null;
  ref_id: string | null;
  meta: unknown;
};

import type { DbDate } from './_shared';

/** Row shape as returned by the database (snake_case, before mapping), joined with the actor name. */
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

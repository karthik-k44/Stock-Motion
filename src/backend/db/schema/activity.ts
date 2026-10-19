/** Row shape as returned by the database (snake_case, before mapping). */
export type ActivityRow = {
  id: number;
  at: Date | string;
  kind: string;
  user_id: string;
  message: string;
  ref_type: string | null;
  ref_id: string | null;
  meta: unknown;
};

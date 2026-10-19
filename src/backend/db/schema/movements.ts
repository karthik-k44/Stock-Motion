/** Row shape as returned by the database (snake_case, before mapping). */
export type MovementRow = {
  id: number;
  at: Date | string;
  sku: string;
  type: string;
  delta: number;
  balance: number;
  ref: string | null;
  user_id: string;
  note: string;
};

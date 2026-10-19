/** Row shape as returned by the database (snake_case, before mapping). */
export type UserRow = {
  id: string;
  name: string;
  role: string;
  initials: string;
  vest: string;
  skin: string;
  hat: string;
};

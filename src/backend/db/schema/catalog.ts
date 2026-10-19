import type { DbDate } from './_shared';

/** Row shapes as returned by the database (snake_case, before mapping). */
export type LocationRow = {
  business_id: string;
  code: string;
  zone: string;
  name: string;
  position: number;
};

export type CategoryRow = {
  business_id: string;
  code: string;
  name: string;
  position: number;
};

export type SupplierRow = {
  id: string;
  business_id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  lead_days: number;
  created_at: DbDate;
};

export type CustomerRow = {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  created_at: DbDate;
};

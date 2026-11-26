/** Postgres drivers return Date objects for timestamptz; the API always speaks ISO strings. */
export const ToIso = (value: Date | string): string => {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

export const ToIsoOrNull = (value: Date | string | null): string | null => {
  return value === null ? null : ToIso(value);
};

/** `days` from now (expiry dates for tokens and invites). */
export const DaysFromNow = (days: number): Date => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

/** Midnight UTC, `offsetDays` from today (negative for the past). The database runs in UTC, so its days match. */
export const StartOfUtcDay = (offsetDays = 0): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays));
};

/** Midnight UTC on the first of this month. */
export const StartOfUtcMonth = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

/** YYYY-MM-DD of a UTC day. */
export const UtcDayKey = (date: Date): string => date.toISOString().slice(0, 10);

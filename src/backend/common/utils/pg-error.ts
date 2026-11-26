/** PostgreSQL's SQLSTATE code for a failed query (Drizzle wraps the driver's error and keeps it as `cause`). */
export const PgErrorCode = (err: unknown): string | undefined => {
  for (let e: unknown = err; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code;
  }
  return undefined;
};

export const UNIQUE_VIOLATION = '23505';

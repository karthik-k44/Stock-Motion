/** Postgres drivers return Date objects for timestamptz; the API always speaks ISO strings. */
export function ToIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function ToIsoOrNull(value: Date | string | null): string | null {
  return value === null ? null : ToIso(value);
}

const numberFormat = new Intl.NumberFormat('en-US');

export const FormatNumber = (n: number) => numberFormat.format(n);

export const FormatSigned = (n: number) => (n > 0 ? `+${FormatNumber(n)}` : n < 0 ? `−${FormatNumber(Math.abs(n))}` : '0');

export const FormatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const FormatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const FormatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function RelativeTime(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const future = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60_000);
  if (mins < 1) return future ? 'in a moment' : 'just now';
  const text = mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`;
  return future ? `in ${text}` : `${text} ago`;
}

export function DayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const offset = (days: number) => {
    const x = new Date();
    x.setDate(today.getDate() + days);
    return x.toDateString();
  };
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === offset(-1)) return 'Yesterday';
  if (d.toDateString() === offset(1)) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export const IsPast = (iso: string) => new Date(iso).getTime() < Date.now();

const moneyFormats = new Map<string, Intl.NumberFormat>();

/** Money in the business's currency, e.g. $1,240.50. Falls back to a plain number for unknown codes. */
export function FormatMoney(n: number, currency: string): string {
  let format = moneyFormats.get(currency);
  if (!format) {
    try {
      format = new Intl.NumberFormat('en-US', { style: 'currency', currency });
    } catch {
      format = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    moneyFormats.set(currency, format);
  }
  return format.format(n);
}

/** Quantity with its unit; large gram / millilitre amounts read as kg / L. */
export function FormatQty(n: number, unit: string): string {
  if ((unit === 'g' || unit === 'ml') && Math.abs(n) >= 1000) {
    return `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit === 'g' ? 'kg' : 'L'}`;
  }
  return `${FormatNumber(n)} ${unit}`;
}

/** Value for an <input type="datetime-local"> from an ISO string. */
export function ToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

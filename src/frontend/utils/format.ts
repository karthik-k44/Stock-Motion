const numberFormat = new Intl.NumberFormat('en-US');

export const FormatNumber = (n: number) => numberFormat.format(n);

export const FormatSigned = (n: number) => (n > 0 ? `+${FormatNumber(n)}` : n < 0 ? `−${FormatNumber(Math.abs(n))}` : '0');

export const FormatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const FormatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const FormatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const RelativeTime = (iso: string, now = Date.now()): string => {
  const diff = now - new Date(iso).getTime();
  const future = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60_000);
  if (mins < 1) return future ? 'in a moment' : 'just now';
  const text = mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`;
  return future ? `in ${text}` : `${text} ago`;
};

export const DayLabel = (iso: string): string => {
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
};

export const IsPast = (iso: string) => new Date(iso).getTime() < Date.now();

const moneyFormats = new Map<string, Intl.NumberFormat>();

const moneyFormat = (currency: string, compact: boolean): Intl.NumberFormat => {
  const key = `${currency}:${compact}`;
  let format = moneyFormats.get(key);
  if (!format) {
    const notation = compact ? ({ notation: 'compact', maximumFractionDigits: 1 } as const) : undefined;
    try {
      format = new Intl.NumberFormat('en-US', { style: 'currency', currency, ...notation });
    } catch {
      format = new Intl.NumberFormat('en-US', notation ?? { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    moneyFormats.set(key, format);
  }
  return format;
};

/** Money in the business's currency, e.g. $1,240.50. Falls back to a plain number for unknown codes. */
export const FormatMoney = (n: number, currency: string): string => moneyFormat(currency, false).format(n);

/** Money for chart axes, e.g. $12.5K. */
export const FormatMoneyCompact = (n: number, currency: string): string => moneyFormat(currency, true).format(n);

/** A signed percentage for trend pills, e.g. +12% or −3.4%. */
export const FormatPercentChange = (pct: number): string => {
  const size = Math.abs(pct);
  const text = size >= 10 ? Math.round(size) : Number(size.toFixed(1));
  return pct > 0 ? `+${text}%` : pct < 0 ? `−${text}%` : '0%';
};

/** Quantity with its unit; large gram / millilitre amounts read as kg / L. */
export const FormatQty = (n: number, unit: string): string => {
  if ((unit === 'g' || unit === 'ml') && Math.abs(n) >= 1000) {
    return `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit === 'g' ? 'kg' : 'L'}`;
  }
  return `${FormatNumber(n)} ${unit}`;
};

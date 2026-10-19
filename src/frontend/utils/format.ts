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

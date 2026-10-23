const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400], ['month', 30 * 86_400], ['week', 7 * 86_400], ['day', 86_400], ['hour', 3600], ['minute', 60],
];
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' });

/** "5 min. ago", "yesterday", "3 wk. ago". */
export function timeAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

/** 1234 -> "1.2k" like Reddit's score display. */
export function compact(n: number): string {
  return Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(Math.abs(n) >= 10_000 ? 0 : 1)}k` : String(n);
}

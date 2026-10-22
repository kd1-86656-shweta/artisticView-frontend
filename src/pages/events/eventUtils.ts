import { APP_NAME } from '@/config/app';
import type { EventItem } from '@/types/api';

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const longFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatDay = (iso: string) => dayFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));
export const formatLong = (iso: string) => longFmt.format(new Date(iso));

export function formatWhen(e: Pick<EventItem, 'startsAt' | 'endsAt'>): string {
  const start = `${formatDay(e.startsAt)} · ${formatTime(e.startsAt)}`;
  return e.endsAt ? `${start} – ${formatTime(e.endsAt)}` : start;
}

/** "In 3 days", "Tomorrow", "Live now"... for the small badge on cards. */
export function relativeStart(e: Pick<EventItem, 'startsAt' | 'endsAt'>): string {
  const now = Date.now();
  const start = new Date(e.startsAt).getTime();
  const end = e.endsAt ? new Date(e.endsAt).getTime() : start + 3 * 3600_000;
  if (now >= start && now <= end) return 'Happening now';
  if (now > end) return 'Ended';
  const days = Math.round((new Date(e.startsAt).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return days < 7 ? `In ${days} days` : formatDay(e.startsAt);
}

export const eventUrl = (id: number) => `${window.location.origin}/events/${id}`;

export const mapsUrl = (place: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;

function shareText(e: EventItem): string {
  const where = e.locationType === 'ONLINE' ? 'Online' : e.location ?? '';
  return `${e.title}\n${formatLong(e.startsAt)}${where ? `\n${where}` : ''}\nHosted by ${e.host.displayName} on ${APP_NAME}\n${eventUrl(e.id)}`;
}

/** WhatsApp share (picks the contact in WhatsApp) and email share, both prefilled. */
export const whatsappShareUrl = (e: EventItem) => `https://wa.me/?text=${encodeURIComponent(shareText(e))}`;

export const emailShareUrl = (e: EventItem) =>
  `mailto:?subject=${encodeURIComponent(`Join me at ${e.title}`)}&body=${encodeURIComponent(`Hi!\n\nI thought you'd like this:\n\n${shareText(e)}`)}`;

/** <input type="datetime-local"> works in local time without a zone; convert both ways. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : undefined);

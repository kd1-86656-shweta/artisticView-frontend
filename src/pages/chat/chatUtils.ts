import type { Chat, ChatMessage } from '@/types/api';

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const date = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const longDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Chat list time: "4:12 PM" today, "Mon" this week, "12 Oct" otherwise. */
export function listTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return time.format(d);
  if (now.getTime() - d.getTime() < 6 * 86_400_000) return weekday.format(d);
  return date.format(d);
}

export const messageTime = (iso: string) => time.format(new Date(iso));

/** Separator label between days in a conversation. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return longDate.format(d);
}

export function preview(m: ChatMessage | null, myId: number): string {
  if (!m) return 'No messages yet';
  if (m.deleted) return 'Message deleted';
  if (m.system) return m.body ?? '';
  const who = m.sender?.id === myId ? 'You: ' : '';
  return who + (m.body ?? (m.imageUrl ? '📷 Photo' : ''));
}

/** Read by everyone else in the chat, for the blue ticks. */
export function readByAll(chat: Chat, m: ChatMessage, myId: number): boolean {
  const others = chat.members.filter((x) => x.user.id !== myId);
  return others.length > 0 && others.every((x) => (x.lastReadMessageId ?? 0) >= m.id);
}

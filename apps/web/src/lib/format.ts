const TZ = 'Africa/Nairobi';

const kes = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 });

export function formatKES(amount: string | number | null | undefined) {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  return kes.format(Number.isFinite(n) ? n : 0).replace(/ /g, ' ');
}

/** Shortens large amounts for stat tiles: "Ksh 9.8M", "Ksh 245K". */
export function formatKESCompact(amount: string | number | null | undefined) {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0);
  if (!Number.isFinite(n) || Math.abs(n) < 100_000) return formatKES(n);
  const short = new Intl.NumberFormat('en-KE', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  return `Ksh ${short}`;
}

export function priceLabel(minPrice: string | null | undefined) {
  if (minPrice === null || minPrice === undefined) return 'Tickets soon';
  return Number(minPrice) === 0 ? 'Free' : `From ${formatKES(minPrice)}`;
}

const dateFmt = new Intl.DateTimeFormat('en-KE', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
const dateLongFmt = new Intl.DateTimeFormat('en-KE', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const timeFmt = new Intl.DateTimeFormat('en-KE', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateLong = (iso: string) => dateLongFmt.format(new Date(iso));
export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

/** "Sat, 12 Oct · 5:00 pm – 11:00 pm", spanning days when needed. Times are Nairobi time. */
export function formatEventRange(startIso: string, endIso: string) {
  const sameDay = dayKeyFmt.format(new Date(startIso)) === dayKeyFmt.format(new Date(endIso));
  return sameDay
    ? `${formatDate(startIso)} · ${formatTime(startIso)} – ${formatTime(endIso)}`
    : `${formatDate(startIso)}, ${formatTime(startIso)} – ${formatDate(endIso)}, ${formatTime(endIso)}`;
}

/** Converts an ISO timestamp to the value a datetime-local input expects, in Nairobi time. */
export function toNairobiInput(iso: string | null | undefined) {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** Reads a datetime-local value as Nairobi time (UTC+3, no DST) and returns ISO UTC. */
export function fromNairobiInput(value: string) {
  if (!value) return '';
  return new Date(`${value}:00+03:00`).toISOString();
}

export const CATEGORY_LABELS: Record<string, string> = {
  music: 'Music',
  sports: 'Sports',
  conference: 'Conference',
  workshop: 'Workshop',
  networking: 'Networking',
  party: 'Party',
  festival: 'Festival',
  exhibition: 'Exhibition',
  comedy: 'Comedy',
  theater: 'Theatre',
  food_drink: 'Food & Drink',
  charity: 'Charity',
  other: 'Other',
};

/** Normalizes Kenyan numbers to 2547XXXXXXXX, matching the API. */
export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

export const isKenyanPhone = (input: string) => /^254\d{9}$/.test(normalizePhone(input));

/** Strips tags from organizer-supplied HTML for plain-text previews. */
export const stripHtml = (html: string | null | undefined) =>
  (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

import 'server-only';
import { ApiError, serverApi } from './client';
import type { EventFilters, KlixEvent, Paginated, TicketType } from './types';

/** Public event listing for server components; never throws. */
export async function fetchEvents(filters: EventFilters = {}, revalidate = 30) {
  try {
    return await serverApi<Paginated<KlixEvent>>('/api/v1/events', { query: { ...filters }, revalidate });
  } catch {
    return null;
  }
}

/** A published event plus its ticket types, or null if it doesn't exist. */
export async function fetchEventPage(slug: string) {
  try {
    const event = await serverApi<KlixEvent>(`/api/v1/events/slug/${encodeURIComponent(slug)}`, { revalidate: 10 });
    const ticketTypes = await serverApi<TicketType[]>(`/api/v1/tickets/events/${event.id}/ticket-types`, {
      revalidate: 10,
    });
    return { event, ticketTypes };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

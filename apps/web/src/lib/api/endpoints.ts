import { api } from './client';
import type {
  DoorResult,
  Envelope,
  EventFilters,
  KlixEvent,
  Order,
  Organizer,
  Paginated,
  Session,
  StaffAssignment,
  Ticket,
  TicketType,
  User,
} from './types';

export interface CartItem {
  ticket_type_id: string;
  quantity: number;
}

export interface PurchaseRequest {
  items: CartItem[];
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  promoter_code?: string;
}

export type EventInput = Pick<
  KlixEvent,
  'title' | 'category' | 'location' | 'start_datetime' | 'end_datetime'
> &
  Partial<Pick<KlixEvent, 'description' | 'banner_image_url' | 'portrait_image_url'>>;

export interface TicketTypeInput {
  name: string;
  description?: string;
  price: string;
  quantity_total: number;
  max_per_order?: number;
  sale_start?: string | null;
  sale_end?: string | null;
  is_active?: boolean;
}

export const authApi = {
  login: (email: string, password: string) =>
    api<Session>('/api/v1/auth/login', { method: 'POST', body: { email, password }, anonymous: true }),
  register: (body: { email: string; password: string; first_name?: string; last_name?: string; phone_number?: string }) =>
    api<Session>('/api/v1/auth/register', { method: 'POST', body, anonymous: true }),
  logout: (refresh_token: string | null) =>
    api('/api/v1/auth/logout', { method: 'POST', body: { refresh_token }, anonymous: true }),
  me: () => api<User>('/api/v1/auth/me'),
  updateProfile: (body: Partial<Pick<User, 'first_name' | 'last_name' | 'phone_number'>>) =>
    api<User>('/api/v1/users/me', { method: 'PATCH', body }),
};

export const eventsApi = {
  list: (filters: EventFilters = {}) =>
    api<Paginated<KlixEvent>>('/api/v1/events', { query: { ...filters }, anonymous: true }),
  bySlug: (slug: string) => api<KlixEvent>(`/api/v1/events/slug/${encodeURIComponent(slug)}`),
  get: (id: string) => api<KlixEvent>(`/api/v1/events/${id}`),
  ticketTypes: (eventId: string, includeInactive = false) =>
    api<TicketType[]>(`/api/v1/tickets/events/${eventId}/ticket-types`, {
      query: { include_inactive: includeInactive || undefined },
    }),
};

export const checkoutApi = {
  purchase: (body: PurchaseRequest) =>
    api<Envelope<Order>>('/api/v1/tickets/purchase-cart', { method: 'POST', body }),
  initiateMpesa: (transactionId: string, phoneNumber?: string) =>
    api<Envelope<Order>>('/api/v1/payments/initiate-mpesa', {
      method: 'POST',
      body: { transaction_id: transactionId, phone_number: phoneNumber },
    }),
  order: (transactionId: string, forceCheck = false) =>
    api<Envelope<Order>>(`/api/v1/payments/transaction/${transactionId}`, {
      query: { force_check: forceCheck || undefined },
    }),
  cancel: (transactionId: string) =>
    api<Envelope<Order>>(`/api/v1/tickets/cancel/${transactionId}`, { method: 'POST' }),
  validatePromo: (code: string, eventId: string) =>
    api<{ valid: boolean; data: { discount_percentage?: string; message?: string } }>(
      '/api/v1/promoters/codes/validate',
      { query: { code, event_id: eventId }, anonymous: true },
    ),
};

export const ticketsApi = {
  mine: () => api<Ticket[]>('/api/v1/tickets/my-tickets'),
  get: (id: string) => api<Ticket>(`/api/v1/tickets/${id}`),
  validate: (qr_data: string, event_id: string) =>
    api<DoorResult>('/api/v1/tickets/validate-qr', { method: 'POST', body: { qr_data, event_id } }),
  checkIn: async (qr_data: string, event_id: string, location?: string) => {
    try {
      return await api<DoorResult>('/api/v1/tickets/checkin', {
        method: 'POST',
        body: { qr_data, event_id, location },
      });
    } catch (error) {
      // A 409 still carries a full door result (e.g. "already checked in").
      const body = (error as { body?: DoorResult }).body;
      if (body && typeof body === 'object' && 'valid' in body) return body;
      throw error;
    }
  },
  checkinStats: (eventId: string) =>
    api<Envelope<{ total: number; checked_in: number }>>(`/api/v1/tickets/events/${eventId}/checkin-stats`),
};

export const organizerApi = {
  apply: (body: { business_name: string; description?: string; website?: string; business_registration?: string }) =>
    api<Organizer>('/api/v1/organizers/apply', { method: 'POST', body }),
  me: () => api<Organizer>('/api/v1/organizers/me'),
  events: (page = 1) => api<Paginated<KlixEvent>>('/api/v1/events/my-events', { query: { page, page_size: 50 } }),
  createEvent: (body: EventInput) => api<KlixEvent>('/api/v1/events', { method: 'POST', body }),
  updateEvent: (id: string, body: Partial<EventInput>) =>
    api<KlixEvent>(`/api/v1/events/${id}`, { method: 'PATCH', body }),
  publish: (id: string) => api<KlixEvent>(`/api/v1/events/${id}/publish`, { method: 'POST' }),
  unpublish: (id: string) => api<KlixEvent>(`/api/v1/events/${id}/unpublish`, { method: 'POST' }),
  deleteEvent: (id: string) => api(`/api/v1/events/${id}`, { method: 'DELETE' }),
  createTicketType: (eventId: string, body: TicketTypeInput) =>
    api<TicketType>(`/api/v1/tickets/events/${eventId}/ticket-types`, { method: 'POST', body }),
  updateTicketType: (id: string, body: Partial<TicketTypeInput>) =>
    api<TicketType>(`/api/v1/tickets/ticket-types/${id}`, { method: 'PATCH', body }),
  deleteTicketType: (id: string) => api(`/api/v1/tickets/ticket-types/${id}`, { method: 'DELETE' }),
  staff: (eventId: string) =>
    api<{ staff: StaffAssignment[] }>(`/api/v1/staff/events/${eventId}/staff`),
  addStaff: (eventId: string, email: string) =>
    api<StaffAssignment>(`/api/v1/staff/events/${eventId}/staff`, { method: 'POST', body: { email } }),
  removeStaff: (eventId: string, id: string) =>
    api(`/api/v1/staff/events/${eventId}/staff/${id}`, { method: 'DELETE' }),
};

export const staffApi = {
  myAssignments: () => api<{ assignments: StaffAssignment[] }>('/api/v1/staff/my-staff-assignments'),
};

export const adminApi = {
  organizers: (status?: string) =>
    api<Paginated<Organizer>>('/api/v1/admin/organizers', { query: { status, page_size: 100 } }),
  approve: (id: string) => api<Envelope<Organizer>>(`/api/v1/admin/organizers/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    api<Envelope<Organizer>>(`/api/v1/admin/organizers/${id}/reject`, { method: 'POST', body: { reason } }),
};

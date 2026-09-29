import { api } from './client';
import type {
  AdminOverview,
  AuditLog,
  DoorResult,
  EventAnalytics,
  EventApproval,
  FileUpload,
  LeaderboardEntry,
  LoyaltyBalance,
  LoyaltyTransaction,
  MpesaCredential,
  OrganizerDashboard,
  PromoterCode,
  PromoterDashboard,
  PromoterEarnings,
  PromoterProfile,
  SearchSuggestion,
  SettlementStatement,
  Withdrawal,
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
  use_loyalty_credits?: boolean;
  loyalty_credits_amount?: number;
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
  updateProfile: (body: Partial<Pick<User, 'first_name' | 'last_name' | 'phone_number' | 'profile_image_url'>>) =>
    api<User>('/api/v1/users/me', { method: 'PATCH', body }),
  requestPasswordReset: (email: string) =>
    api<{ message: string }>('/api/v1/auth/password-reset', { method: 'POST', body: { email }, anonymous: true }),
  resetPassword: (token: string, password: string) =>
    api<Session>('/api/v1/auth/password-reset/confirm', { method: 'POST', body: { token, password }, anonymous: true }),
  verifyEmail: (token: string) =>
    api<{ message: string; user: User }>('/api/v1/auth/verify-email', { method: 'POST', body: { token }, anonymous: true }),
  requestVerification: () => api<{ message: string }>('/api/v1/auth/verify-email/request', { method: 'POST' }),
  changePassword: (current_password: string, new_password: string) =>
    api<{ message: string }>('/api/v1/auth/change-password', { method: 'POST', body: { current_password, new_password } }),
  preferences: () => api<Envelope<Record<string, unknown>>>('/api/v1/recommendations/preferences'),
  updatePreferences: (body: { preferred_categories?: string[]; preferred_location?: string }) =>
    api<Envelope<Record<string, unknown>>>('/api/v1/recommendations/preferences', { method: 'PUT', body }),
};

export const discoveryApi = {
  trending: (limit = 8) => api<Envelope<KlixEvent[]>>('/api/v1/recommendations/trending', { query: { limit }, anonymous: true }),
  similar: (eventId: string, limit = 4) =>
    api<Envelope<KlixEvent[]>>(`/api/v1/recommendations/similar/${eventId}`, { query: { limit }, anonymous: true }),
  forYou: (limit = 8) => api<Envelope<KlixEvent[]>>('/api/v1/recommendations/for-you', { query: { limit } }),
  suggestions: (q: string) =>
    api<Envelope<SearchSuggestion[]>>('/api/v1/search/suggestions', { query: { q }, anonymous: true }),
  nearby: (latitude: number, longitude: number, radius_km = 25) =>
    api<Envelope<KlixEvent[]>>('/api/v1/search/nearby', { query: { latitude, longitude, radius_km }, anonymous: true }),
};

export const loyaltyApi = {
  balance: () => api<LoyaltyBalance>('/api/v1/loyalty/balance'),
  transactions: () => api<LoyaltyTransaction[]>('/api/v1/loyalty/transactions'),
};

export const uploadsApi = {
  upload: (file: File, uploadType: string, entityId?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('upload_type', uploadType);
    if (entityId) form.append('entity_id', entityId);
    return api<FileUpload>('/api/v1/uploads/upload', { method: 'POST', body: form });
  },
};

export const promoterApi = {
  apply: (body: { display_name: string; bio?: string; social_links?: string; experience?: string; payout_phone?: string }) =>
    api<PromoterProfile>('/api/v1/promoters/apply', { method: 'POST', body }),
  me: () => api<PromoterProfile>('/api/v1/promoters/me'),
  updateMe: (body: Partial<Pick<PromoterProfile, 'display_name' | 'bio' | 'social_links' | 'payout_phone'>>) =>
    api<PromoterProfile>('/api/v1/promoters/me', { method: 'PATCH', body }),
  dashboard: () => api<Envelope<PromoterDashboard>>('/api/v1/analytics/promoter/dashboard'),
  requestEvent: (event_id: string, message?: string) =>
    api<EventApproval>('/api/v1/promoter-requests/events/request', { method: 'POST', body: { event_id, message } }),
  myRequests: () => api<EventApproval[]>('/api/v1/promoter-requests/my-requests'),
  codes: () => api<PromoterCode[]>('/api/v1/promoters/my-codes'),
  createCode: (body: { event_id: string; code?: string; usage_limit?: number }) =>
    api<PromoterCode>('/api/v1/promoters/codes', { method: 'POST', body }),
  deactivateCode: (id: string) => api(`/api/v1/promoters/code/${id}/deactivate`, { method: 'POST' }),
  earnings: () => api<Envelope<PromoterEarnings>>('/api/v1/promoters/earnings'),
  withdraw: (amount: string, phone?: string) =>
    api<Envelope<Withdrawal>>('/api/v1/promoters/withdraw', { method: 'POST', body: { amount, phone } }),
  withdrawals: () => api<Envelope<Withdrawal[]>>('/api/v1/promoters/withdrawals'),
  leaderboard: (period?: 'week' | 'month') =>
    api<Envelope<LeaderboardEntry[]>>('/api/v1/promoters/leaderboard', { query: { period }, anonymous: true }),
  trackClick: (code: string) =>
    api('/api/v1/promoters/track-click', { method: 'POST', body: { code }, anonymous: true }),
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
  updateProfile: (body: { business_name?: string; description?: string; website?: string; logo_url?: string | null }) =>
    api<Organizer>('/api/v1/organizers/me', { method: 'PATCH', body }),
  dashboard: () => api<OrganizerDashboard>('/api/v1/analytics/organizer/dashboard'),
  eventAnalytics: (eventId: string) => api<EventAnalytics>(`/api/v1/analytics/organizer/events/${eventId}/stats`),
  promoterRequests: (status?: string) =>
    api<{ requests: EventApproval[] }>('/api/v1/promoter-requests/organizers/promoter-requests', { query: { status } }),
  approvePromoter: (id: string, body: { commission_percentage: string; discount_percentage?: string; response_message?: string }) =>
    api<Envelope<EventApproval>>(`/api/v1/promoter-requests/organizers/promoter-requests/${id}/approve`, { method: 'POST', body }),
  rejectPromoter: (id: string, response_message?: string) =>
    api<Envelope<EventApproval>>(`/api/v1/promoter-requests/organizers/promoter-requests/${id}/reject`, {
      method: 'POST',
      body: { response_message },
    }),
  revokePromoter: (id: string, response_message?: string) =>
    api<Envelope<EventApproval>>(`/api/v1/promoter-requests/organizers/promoter-requests/${id}/revoke`, {
      method: 'POST',
      body: { response_message },
    }),
  mpesa: () => api<Envelope<MpesaCredential | null>>('/api/v1/organizers/me/mpesa'),
  saveMpesa: (body: {
    credential_type: 'paybill' | 'till_number';
    environment: 'sandbox' | 'production';
    shortcode: string;
    store_number?: string;
    consumer_key: string;
    consumer_secret: string;
    passkey: string;
  }) => api<Envelope<MpesaCredential>>('/api/v1/organizers/me/mpesa', { method: 'PUT', body }),
  verifyMpesa: () => api<Envelope<MpesaCredential>>('/api/v1/organizers/me/mpesa/verify', { method: 'POST' }),
  deleteMpesa: () => api('/api/v1/organizers/me/mpesa', { method: 'DELETE' }),
  settlements: () => api<Envelope<SettlementStatement[]>>('/api/v1/organizers/me/settlements'),
};

export const staffApi = {
  myAssignments: () => api<{ assignments: StaffAssignment[] }>('/api/v1/staff/my-staff-assignments'),
};

export const adminApi = {
  overview: () => api<AdminOverview>('/api/v1/admin/statistics'),
  organizers: (status?: string) =>
    api<Paginated<Organizer>>('/api/v1/admin/organizers', { query: { status, page_size: 100 } }),
  approve: (id: string) => api<Envelope<Organizer>>(`/api/v1/admin/organizers/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    api<Envelope<Organizer>>(`/api/v1/admin/organizers/${id}/reject`, { method: 'POST', body: { reason } }),
  promoters: (status?: string) =>
    api<Paginated<PromoterProfile>>('/api/v1/admin/promoters', { query: { status, page_size: 100 } }),
  approvePromoter: (id: string) => api(`/api/v1/admin/promoters/${id}/approve`, { method: 'POST' }),
  rejectPromoter: (id: string, reason: string) =>
    api(`/api/v1/admin/promoters/${id}/reject`, { method: 'POST', body: { reason } }),
  users: (params: { q?: string; role?: string; page?: number }) =>
    api<Paginated<User>>('/api/v1/admin/users', { query: { ...params, page_size: 25 } }),
  setRole: (id: string, role: string) => api<Envelope<User>>(`/api/v1/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  suspendUser: (id: string, reason?: string) =>
    api<Envelope<User>>(`/api/v1/admin/users/${id}/suspend`, { method: 'POST', body: { reason } }),
  unsuspendUser: (id: string) => api<Envelope<User>>(`/api/v1/admin/users/${id}/unsuspend`, { method: 'POST' }),
  events: (params: { q?: string; flagged?: boolean; page?: number }) =>
    api<Paginated<KlixEvent>>('/api/v1/admin/events', {
      query: { q: params.q, flagged: params.flagged || undefined, page: params.page, page_size: 25 },
    }),
  flagEvent: (id: string, reason: string) => api(`/api/v1/admin/events/${id}/flag`, { method: 'POST', body: { reason } }),
  unflagEvent: (id: string) => api(`/api/v1/admin/events/${id}/unflag`, { method: 'POST' }),
  withdrawals: (status?: string) =>
    api<Paginated<Withdrawal>>('/api/v1/admin/withdrawals', { query: { status, page_size: 100 } }),
  payWithdrawal: (id: string, reference: string) =>
    api(`/api/v1/admin/withdrawals/${id}/pay`, { method: 'POST', body: { reference } }),
  rejectWithdrawal: (id: string, note: string) =>
    api(`/api/v1/admin/withdrawals/${id}/reject`, { method: 'POST', body: { note } }),
  pendingSettlements: () => api<Envelope<SettlementStatement[]>>('/api/v1/admin/settlements/pending'),
  settle: (eventId: string, reference: string) =>
    api(`/api/v1/admin/settlements/${eventId}`, { method: 'POST', body: { reference } }),
  auditLogs: (params: { action?: string; page?: number }) =>
    api<Paginated<AuditLog>>('/api/v1/admin/audit-logs', { query: { ...params, page_size: 50 } }),
};

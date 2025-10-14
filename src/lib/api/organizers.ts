// src/lib/api/organizers.ts

import apiClient from '@/lib/api-client';

export interface OrganizerProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_registration?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string; // Added this line
  rejected_at?: string; // Added this line
  created_at: string;
  updated_at: string;
}

export interface EventCreateData {
  title: string;
  description?: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  start_datetime: string;
  end_datetime: string;
  banner_image_url?: string;
  additional_images?: string[];
  settings?: any;
}

export interface TicketTypeCreateData {
  name: string;
  description?: string;
  price: number;
  quantity_total: number;
  sale_start?: string;
  sale_end?: string;
  settings?: any;
}

export interface MpesaCredentials {
  consumer_key: string;
  consumer_secret: string;
  shortcode: string;
  passkey: string;
  credential_type: 'paybill' | 'till_number';
}

// Use apiClient directly for organizer-specific endpoints
export const organizersApi = {
  // Profile
  apply: (data: Partial<OrganizerProfile>) => 
    apiClient.post('/api/v1/organizers/apply', data),
  
  getMyProfile: () => 
    apiClient.get('/api/v1/organizers/me'),
  
  updateProfile: (data: Partial<OrganizerProfile>) => 
    apiClient.patch('/api/v1/organizers/me', data),
  
  getById: (organizerId: string) => 
    apiClient.get(`/api/v1/organizers/${organizerId}`),

  // M-Pesa Credentials
  addMpesaCredentials: (data: MpesaCredentials) =>
    apiClient.post('/api/v1/organizers/mpesa-credentials', data),
  
  getMyMpesaCredentials: () =>
    apiClient.get('/api/v1/organizers/mpesa-credentials/me'),

  // Events (using existing event methods from api-client)
  createEvent: (data: EventCreateData) =>
    apiClient.post('/api/v1/events', data),
  
  getMyEvents: (params?: any) =>
    apiClient.get('/api/v1/events/my-events', { params }),
  
  updateEvent: (eventId: string, data: Partial<EventCreateData>) =>
    apiClient.patch(`/api/v1/events/${eventId}`, data),
  
  deleteEvent: (eventId: string) =>
    apiClient.delete(`/api/v1/events/${eventId}`),
  
  publishEvent: (eventId: string) =>
    apiClient.post(`/api/v1/events/${eventId}/publish`),
  
  unpublishEvent: (eventId: string) =>
    apiClient.post(`/api/v1/events/${eventId}/unpublish`),

  // Ticket Types
  createTicketType: (eventId: string, data: TicketTypeCreateData) =>
    apiClient.post(`/api/v1/tickets/events/${eventId}/ticket-types`, data),
  
  updateTicketType: (ticketTypeId: string, data: Partial<TicketTypeCreateData>) =>
    apiClient.patch(`/api/v1/tickets/ticket-types/${ticketTypeId}`, data),
  
  deleteTicketType: (ticketTypeId: string) =>
    apiClient.delete(`/api/v1/tickets/ticket-types/${ticketTypeId}`),

  // Analytics
  getDashboard: () =>
    apiClient.get('/api/v1/analytics/organizer/dashboard'),
  
  getEventStats: (eventId: string) =>
    apiClient.get(`/api/v1/analytics/organizer/events/${eventId}/stats`),
  
  getRevenue: (params?: any) =>
    apiClient.get('/api/v1/analytics/organizer/revenue', { params }),
  
  getSalesVelocity: (eventId: string) =>
    apiClient.get(`/api/v1/analytics/organizer/events/${eventId}/velocity`),
  
  getTopPromoters: (limit?: number) =>
    apiClient.get('/api/v1/analytics/organizer/promoters', { params: { limit } }),
};
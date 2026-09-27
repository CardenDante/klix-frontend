// Types for the Klix /api/v1 contract. Money arrives as decimal strings
// ("1500.00") and timestamps as ISO 8601 UTC strings.

export const EVENT_CATEGORIES = [
  'music',
  'sports',
  'conference',
  'workshop',
  'networking',
  'party',
  'festival',
  'exhibition',
  'comedy',
  'theater',
  'food_drink',
  'charity',
  'other',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type UserRole = 'attendee' | 'promoter' | 'organizer' | 'event_staff' | 'admin';
export type OrderStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_required';
export type TicketStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'used';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  profile_image_url: string | null;
  is_organizer: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
}

export interface OrganizerPublic {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
}

export interface Organizer extends OrganizerPublic {
  user_id: string;
  business_registration: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  user?: User;
}

export interface KlixEvent {
  id: string;
  organizer_id: string;
  title: string;
  slug: string;
  description: string | null;
  category: EventCategory;
  location: string;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string | null;
  portrait_image_url: string | null;
  additional_images: string[];
  status: EventStatus;
  is_published: boolean;
  total_capacity: number;
  tickets_sold: number;
  tickets_available: number;
  is_sold_out: boolean;
  min_price: string | null;
  organizer?: OrganizerPublic;
  created_at: string;
  updated_at: string;
}

export interface EventBrief {
  id: string;
  title: string;
  slug: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string | null;
  portrait_image_url: string | null;
  status: EventStatus;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  quantity_available: number;
  max_per_order: number;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
  is_on_sale: boolean;
  is_sold_out: boolean;
  sold_percentage: number;
  sort_order: number;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  ticket_type_id: string;
  event_id: string;
  order_id: string;
  attendee_name: string;
  attendee_email: string;
  status: TicketStatus;
  original_price: string;
  discount_amount: string;
  final_price: string;
  is_guest_purchase: boolean;
  purchased_at: string | null;
  checked_in_at: string | null;
  is_valid: boolean;
  is_checked_in: boolean;
  qr_code: string | null;
  event?: EventBrief;
  ticket_type?: { id: string; name: string; price: string };
}

export interface Order {
  transaction_id: string;
  id: string;
  event_id: string;
  status: OrderStatus;
  currency: string;
  subtotal: string;
  discount_amount: string;
  amount: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  mpesa_receipt: string | null;
  checkout_request_id: string | null;
  expires_at: string;
  paid_at: string | null;
  failure_reason: string | null;
  event?: EventBrief;
  tickets?: Ticket[];
}

export interface StaffAssignment {
  id: string;
  event_id: string;
  user_id: string;
  role: 'scanner' | 'supervisor';
  is_active: boolean;
  assigned_at: string;
  user?: { id: string; email: string; full_name: string };
  event?: EventBrief;
}

export interface DoorResult {
  valid: boolean;
  message: string;
  reason?: 'invalid_qr' | 'not_found' | 'wrong_event' | 'already_used' | 'not_valid';
  ticket: Ticket | null;
}

export interface Paginated<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Envelope<T> {
  success: true;
  message?: string;
  data: T;
}

export interface EventFilters {
  q?: string;
  category?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'relevance' | 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'popularity' | 'newest';
  page?: number;
  page_size?: number;
}

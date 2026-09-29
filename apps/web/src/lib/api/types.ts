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
  is_flagged?: boolean;
  flag_reason?: string | null;
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
  credits_applied: number;
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

// ==================== PROMOTERS ====================

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface PromoterProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  social_links: string | null;
  experience: string | null;
  payout_phone: string | null;
  status: ReviewStatus;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  user?: User;
}

export interface EventApproval {
  id: string;
  promoter_id: string;
  event_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  message: string | null;
  response_message: string | null;
  commission_percentage: string | null;
  discount_percentage: string | null;
  promoter_name: string | null;
  created_at: string;
  event?: EventBrief;
  promoter?: { id: string; email: string; full_name: string };
}

export interface PromoterCode {
  id: string;
  code: string;
  event_id: string;
  code_type: 'discount' | 'commission';
  discount_percentage: string | null;
  commission_percentage: string | null;
  usage_limit: number | null;
  times_used: number;
  clicks: number;
  is_active: boolean;
  tickets_sold: number;
  revenue_generated: string;
  total_commission_earned: string;
  conversion_rate: number | null;
  created_at: string;
  event?: EventBrief;
}

export interface PromoterEarnings {
  total_earned: string;
  pending: string;
  available: string;
  in_withdrawal: string;
  withdrawn: string;
  this_month: string;
  minimum_withdrawal: string;
}

export interface Withdrawal {
  id: string;
  amount: string;
  phone: string;
  status: 'requested' | 'paid' | 'rejected';
  reference: string | null;
  note: string | null;
  processed_at: string | null;
  created_at: string;
  promoter?: { id: string; email: string; full_name: string };
}

export interface LeaderboardEntry {
  rank: number;
  promoter_id: string;
  display_name: string;
  tickets_sold: number;
  revenue_generated: string;
  total_commission: string;
}

export interface PromoterDashboard {
  total_codes: number;
  active_codes: number;
  total_clicks: number;
  total_uses: number;
  total_tickets_sold: number;
  total_revenue_generated: string;
  commission_this_month: string;
  commission_last_month: string;
  tickets_this_month: number;
  tickets_last_month: number;
  earnings: PromoterEarnings;
  top_events: {
    event_id: string;
    event_name: string;
    event_slug: string;
    event_date: string;
    tickets_sold: number;
    revenue_generated: string;
    commission_earned: string;
  }[];
}

// ==================== LOYALTY ====================

export interface LoyaltyBalance {
  available_credits: number;
  expiring_soon: number;
  total_credits: number;
  redeemed_credits: number;
  expired_credits: number;
  max_redeem_percentage: number;
}

export interface LoyaltyTransaction {
  id: string;
  transaction_type: 'earned' | 'redeemed' | 'refunded' | 'expired' | 'adjusted';
  credits: number;
  remaining: number;
  description: string;
  expires_at: string | null;
  created_at: string;
}

// ==================== ANALYTICS ====================

export interface EventSummary {
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  status: string;
  tickets_sold: number;
  total_capacity: number;
  revenue: string;
  check_in_rate: number;
}

export interface OrganizerDashboard {
  total_events: number;
  active_events: number;
  completed_events: number;
  draft_events: number;
  total_revenue: string;
  total_platform_fees: string;
  total_promoter_commissions: string;
  total_net_revenue: string;
  revenue_this_month: string;
  revenue_last_month: string;
  revenue_growth_percentage: number | null;
  total_tickets_sold: number;
  tickets_sold_this_month: number;
  ticket_sales_growth_percentage: number | null;
  average_event_capacity_utilization: number;
  average_check_in_rate: number;
  top_events: EventSummary[];
  upcoming_events: EventSummary[];
}

export interface EventAnalytics {
  total_revenue: string;
  platform_fees: string;
  total_promoter_commissions: string;
  net_revenue: string;
  tickets_sold: number;
  total_capacity: number;
  capacity_utilization: number;
  average_ticket_price: string;
  sales_by_type: {
    ticket_type_id: string;
    ticket_type_name: string;
    price: string;
    quantity_total: number;
    tickets_sold: number;
    tickets_checked_in: number;
    revenue: string;
    percentage_of_total: number;
  }[];
  daily_sales: { date: string; tickets_sold: number; revenue: string; cumulative_tickets: number }[];
  top_promoters: {
    promoter_code: string;
    promoter_name: string | null;
    times_used: number;
    clicks: number;
    tickets_sold: number;
    total_commission_earned: string;
  }[];
  checkin_stats: { total_tickets: number; checked_in: number; check_in_rate: number; cancelled_tickets: number };
  customer_demographics: {
    total_customers: number;
    registered_customers: number;
    guest_customers: number;
    returning_customers: number;
    average_tickets_per_customer: number;
  };
  days_until_event: number;
  average_sales_per_day: number;
  projected_tickets: number;
  projected_revenue: string;
}

export interface AdminOverview {
  users: { total: number; active: number; new_this_month: number; organizers: number; promoters: number };
  events: { total: number; published: number; upcoming: number; flagged: number };
  orders: {
    completed: number;
    gross_merchandise_value: string;
    cash_collected: string;
    platform_fees: string;
    gmv_this_month: string;
    platform_fees_this_month: string;
  };
  tickets_sold: number;
  pending: {
    organizers: number;
    promoters: number;
    withdrawals: number;
    withdrawal_amount: string;
    refunds_required: number;
  };
  monthly: { month: string; gmv: string; platform_fees: string; orders: number; new_users: number }[];
  top_organizers: { organizer_id: string; business_name: string; revenue: string; orders: number }[];
  top_events: { event_id: string; title: string; slug: string; revenue: string; orders: number }[];
  categories: { category: string; events: number; tickets_sold: number }[];
}

export interface SettlementStatement {
  event_id: string;
  event_title: string;
  event_slug: string;
  end_datetime: string;
  organizer_id: string;
  organizer_name: string;
  orders: number;
  gross: string;
  platform_fees: string;
  promoter_commissions: string;
  collected_by_organizer: string;
  net_payable: string;
  status: 'accruing' | 'due' | 'paid';
  paid_at: string | null;
  reference: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  created_at: string;
  actor?: { id: string; email: string; full_name: string };
}

export interface MpesaCredential {
  id: string;
  credential_type: 'paybill' | 'till_number';
  environment: 'sandbox' | 'production';
  shortcode_masked: string;
  store_number: string | null;
  is_active: boolean;
  verified_at: string | null;
}

export interface FileUpload {
  id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

export interface SearchSuggestion {
  type: 'event' | 'location' | 'category';
  value: string;
  label: string;
}

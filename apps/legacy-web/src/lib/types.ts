// ==================== ENUMS ====================

export enum EventCategory {
  MUSIC = 'music',
  SPORTS = 'sports',
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  NETWORKING = 'networking',
  PARTY = 'party',
  FESTIVAL = 'festival',
  EXHIBITION = 'exhibition',
  COMEDY = 'comedy',
  THEATER = 'theater',
  FOOD_DRINK = 'food_drink',
  CHARITY = 'charity',
  OTHER = 'other',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum UserRole {
  GUEST = 'guest',
  ATTENDEE = 'attendee',
  PROMOTER = 'promoter',
  ORGANIZER = 'organizer',
  EVENT_STAFF = 'event_staff',
  ADMIN = 'admin',
}

export enum OrganizerStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum TicketStatus {
  RESERVED = 'reserved',
  PENDING_PAYMENT = 'pending_payment',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  USED = 'used',
}

export enum PromoterCodeType {
  DISCOUNT = 'discount',
  COMMISSION = 'commission',
}

export enum PromoterStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum PromoterEventApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVOKED = 'revoked',
}

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  DATE_ASC = 'date_asc',
  DATE_DESC = 'date_desc',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULARITY = 'popularity',
  NEWEST = 'newest',
}

// ==================== USER TYPES ====================

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  profile_image_url?: string;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  full_name: string;
  is_organizer: boolean;
  is_promoter: boolean;
  is_admin: boolean;
}

export interface UserUpdate {
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  preferences?: Record<string, any>;
}

export interface PreferencesUpdate {
  preferred_categories?: string[];
  preferred_location?: string;
  notification_email?: boolean;
  notification_sms?: boolean;
  marketing_emails?: boolean;
}

// ==================== EVENT TYPES ====================

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  category: EventCategory;
  location: string;
  latitude?: number;
  longitude?: number;
  start_datetime: string;
  end_datetime: string;
  banner_image_url?: string;
  additional_images?: string[];
  status: EventStatus;
  is_published: boolean;
  slug: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface EventDetail extends Event {
  organizer: OrganizerPublic;
  total_capacity: number;
  tickets_sold: number;
  is_sold_out: boolean;
}

export interface EventCreate {
  title: string;
  description?: string;
  category: EventCategory;
  location: string;
  latitude?: number;
  longitude?: number;
  start_datetime: string;
  end_datetime: string;
  banner_image_url?: string;
  additional_images?: string[];
  settings?: Record<string, any>;
}

export interface EventUpdate {
  title?: string;
  description?: string;
  category?: EventCategory;
  location?: string;
  latitude?: number;
  longitude?: number;
  start_datetime?: string;
  end_datetime?: string;
  banner_image_url?: string;
  additional_images?: string[];
  settings?: Record<string, any>;
}

// ==================== ORGANIZER TYPES ====================

export interface Organizer {
  id: string;
  user_id: string;
  business_name: string;
  business_registration?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  status: OrganizerStatus;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizerPublic {
  id: string;
  business_name: string;
  description?: string;
  logo_url?: string;
  website?: string;
}

export interface OrganizerCreate {
  business_name: string;
  business_registration?: string;
  description?: string;
  website?: string;
  logo_url?: string;
}

export interface OrganizerUpdate {
  business_name?: string;
  business_registration?: string;
  description?: string;
  website?: string;
  logo_url?: string;
}

// ==================== TICKET TYPES ====================

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: number;
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  quantity_available: number;
  sale_start?: string;
  sale_end?: string;
  is_active: boolean;
  is_sold_out: boolean;
  sold_percentage: number;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TicketTypeCreate {
  name: string;
  description?: string;
  price: number;
  quantity_total: number;
  sale_start?: string;
  sale_end?: string;
  settings?: Record<string, any>;
}

export interface Ticket {
  id: string;
  ticket_type_id: string;
  event_id: string;
  user_id?: string;
  ticket_number: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  status: TicketStatus;
  original_price: number;
  discount_amount: number;
  final_price: number;
  is_guest_purchase: boolean;
  purchased_at?: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends Ticket {
  event: Event;
  ticket_type: TicketType;
  is_valid: boolean;
  is_checked_in: boolean;
}

export interface TicketPurchaseRequest {
  ticket_type_id: string;
  quantity: number;
  promoter_code?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  use_loyalty_credits?: boolean;
  loyalty_credits_amount?: number;
}

// ==================== PROMOTER TYPES ====================

// Promoter Profile
export interface PromoterProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  social_links?: string;
  experience?: string;
  status: PromoterStatus;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoterApplicationCreate {
  display_name: string;
  bio?: string;
  social_links?: string;
  experience?: string;
}

export interface PromoterProfileUpdate {
  display_name?: string;
  bio?: string;
  social_links?: string;
  experience?: string;
}

// Promoter Event Approval
export interface PromoterEventApproval {
  id: string;
  promoter_id: string;
  event_id: string;
  organizer_id: string;
  message?: string;
  status: PromoterEventApprovalStatus;
  commission_percentage?: number;
  discount_percentage?: number;
  response_message?: string;
  approved_at?: string;
  rejected_at?: string;
  revoked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoterEventRequest {
  event_id: string;
  message?: string;
}

export interface OrganizerPromoterApproval {
  commission_percentage?: number;
  discount_percentage?: number;
  response_message?: string;
}

export interface OrganizerPromoterRejection {
  response_message?: string;
}

// Promoter Codes
export interface PromoterCode {
  id: string;
  code: string;
  user_id: string;
  event_id: string;
  code_type: PromoterCodeType;
  discount_percentage?: number;
  commission_percentage?: number;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoterCodeCreate {
  event_id: string;
  code_type: PromoterCodeType;
  discount_percentage?: number;
  commission_percentage?: number;
  usage_limit?: number;
  valid_from?: string;
  valid_until?: string;
}

// ==================== ANALYTICS TYPES ====================

export interface OrganizerDashboard {
  organizer_id: string;
  organizer_name: string;
  total_events: number;
  active_events: number;
  completed_events: number;
  draft_events: number;
  total_revenue: number;
  total_platform_fees: number;
  total_net_revenue: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_growth_percentage?: number;
  total_tickets_sold: number;
  tickets_sold_this_month: number;
  tickets_sold_last_month: number;
  ticket_sales_growth_percentage?: number;
  average_event_capacity_utilization: number;
  average_check_in_rate: number;
  total_promoter_commissions_owed: number;
  top_events: EventSummary[];
  upcoming_events: EventSummary[];
  recent_completed_events: EventSummary[];
}

export interface EventSummary {
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  status: string;
  is_published: boolean;
  tickets_sold: number;
  total_capacity: number;
  revenue: number;
  check_in_rate?: number;
}

export interface EventAnalytics {
  event_id: string;
  event_name: string;
  event_date: string;
  total_revenue: number;
  platform_fees: number;
  net_revenue: number;
  tickets_sold: number;
  total_capacity: number;
  capacity_utilization: number;
  average_ticket_price: number;
  sales_by_type: TicketTypeSales[];
  daily_sales: DailySales[];
  top_promoters: PromoterPerformance[];
  total_promoter_discounts: number;
  total_promoter_commissions: number;
  checkin_stats: CheckinStatistics;
  customer_demographics: CustomerDemographics;
  projected_revenue?: number;
  days_until_event?: number;
  average_sales_per_day?: number;
}

export interface TicketTypeSales {
  ticket_type_id: string;
  ticket_type_name: string;
  price: number;
  tickets_sold: number;
  tickets_checked_in: number;
  revenue: number;
  percentage_of_total: number;
}

export interface DailySales {
  date: string;
  tickets_sold: number;
  revenue: number;
  cumulative_tickets: number;
  cumulative_revenue: number;
}

export interface PromoterPerformance {
  promoter_code: string;
  promoter_name?: string;
  code_type: string;
  discount_percentage?: number;
  commission_percentage?: number;
  times_used: number;
  tickets_sold: number;
  revenue_generated: number;
  total_discount_given: number;
  total_commission_earned: number;
  conversion_rate?: number;
}

export interface CheckinStatistics {
  total_tickets: number;
  checked_in: number;
  not_checked_in: number;
  check_in_rate: number;
  cancelled_tickets: number;
}

export interface CustomerDemographics {
  total_customers: number;
  registered_customers: number;
  guest_customers: number;
  returning_customers: number;
  average_tickets_per_customer: number;
}

export interface PromoterDashboard {
  promoter_id: string;
  promoter_name: string;
  total_codes: number;
  active_codes: number;
  total_uses: number;
  total_tickets_sold: number;
  total_revenue_generated: number;
  total_commission_earned: number;
  total_commission_pending: number;
  total_commission_paid: number;
  total_discounts_given: number;
  average_conversion_rate?: number;
  average_order_value: number;
  best_performing_code?: string;
  best_performing_event?: string;
  commission_this_month: number;
  commission_last_month: number;
  tickets_this_month: number;
  tickets_last_month: number;
  commission_growth_percentage?: number;
  ticket_growth_percentage?: number;
  top_events: PromoterEventPerformance[];
  active_codes_list: PromoterCodeDetails[];
}

export interface PromoterEventPerformance {
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  event_status: string;
  code: string;
  code_type: string;
  times_used: number;
  tickets_sold: number;
  revenue_generated: number;
  commission_earned: number;
  discount_given: number;
  conversion_rate?: number;
  average_order_value: number;
}

export interface PromoterCodeDetails {
  code_id: string;
  code: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  code_type: string;
  discount_percentage?: number;
  commission_percentage?: number;
  is_active: boolean;
  times_used: number;
  tickets_sold: number;
  revenue_generated: number;
  total_discount_given: number;
  total_commission_earned: number;
  created_at: string;
}

// ==================== LOYALTY TYPES ====================

export interface LoyaltyBalance {
  user_id: string;
  total_credits: number;
  available_credits: number;
  expired_credits: number;
  pending_credits: number;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  credits: number;
  description: string;
  reference_id?: string;
  expires_at?: string;
  created_at: string;
}

// ==================== SEARCH TYPES ====================

export interface SearchParams {
  q: string;
  category?: EventCategory;
  location?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  end_date?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  sort_by?: SearchSortBy;
  page?: number;
  page_size?: number;
}

export interface SearchSuggestion {
  type: 'event' | 'category' | 'location' | 'organizer';
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

export interface SearchFacet {
  field: string;
  value: string;
  count: number;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// ==================== AUTH TYPES ====================

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface FirebaseTokenRequest {
  id_token: string;
}

export interface PasswordResetRequest {
  email: string;
}

// ==================== UPLOAD TYPES ====================

export interface FileUpload {
  id: string;
  uploader_id: string;
  entity_id: string;
  upload_type: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

// ==================== STAFF TYPES ====================

export interface StaffAssignment {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  permissions?: Record<string, any>;
  is_active: boolean;
  assigned_at: string;
}

export interface StaffAssignRequest {
  user_id?: string;
  email?: string;
  role?: string;
  permissions?: Record<string, any>;
}

// ==================== MPESA TYPES ====================

export interface MpesaCredential {
  id: string;
  organizer_id: string;
  credential_type: 'paybill' | 'till_number';
  shortcode_masked: string;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  mpesa_receipt?: string;
  created_at: string;
  updated_at: string;
}
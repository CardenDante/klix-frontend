// lib/api/tickets.ts
import apiClient from '../api-client';

export interface PurchaseTicketRequest {
  ticket_type_id: string;
  quantity: number;
  promoter_code?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  use_loyalty_credits?: boolean;
  loyalty_credits_amount?: number;
}

export interface CartItem {
  ticket_type_id: string;
  quantity: number;
}

export interface PurchaseCartRequest {
  items: CartItem[];
  promoter_code?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  use_loyalty_credits?: boolean;
  loyalty_credits_amount?: number;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  ticket_type_id: string;
  event_id: string;
  user_id?: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  status: 'reserved' | 'pending_payment' | 'confirmed' | 'cancelled' | 'used';
  original_price: string;
  discount_amount: string;
  final_price: string;
  is_guest_purchase: boolean;
  purchased_at?: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
  // Event details (populated when fetching tickets)
  event?: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
    end_datetime: string;
    location: string;
    banner_image_url?: string;
  };
  // Ticket type details (populated when fetching tickets)
  ticket_type?: {
    id: string;
    name: string;
    price: string;
  };
}

export const ticketsApi = {
  // Purchase tickets (single ticket type - LEGACY)
  purchaseTickets: async (data: PurchaseTicketRequest) => {
    const response = await apiClient.post('/api/v1/tickets/purchase', data);
    return response.data;
  },

  // Purchase cart (multiple ticket types in one transaction)
  purchaseCart: async (data: PurchaseCartRequest) => {
    const response = await apiClient.post('/api/v1/tickets/purchase-cart', data);
    return response.data.data; // Extract the nested data
  },

  // Get my tickets
  getMyTickets: async (eventId?: string) => {
    const url = eventId 
      ? `/api/v1/tickets/my-tickets?event_id=${eventId}` 
      : '/api/v1/tickets/my-tickets';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get ticket by ID
  getTicket: async (ticketId: string) => {
    const response = await apiClient.get(`/api/v1/tickets/${ticketId}`);
    return response.data;
  },

  // Confirm purchase (after payment)
  confirmPurchase: async (transactionId: string, mpesaReceipt?: string) => {
    const params = mpesaReceipt ? `?mpesa_receipt=${mpesaReceipt}` : '';
    const response = await apiClient.post(`/api/v1/tickets/confirm/${transactionId}${params}`);
    return response.data;
  },

  // Cancel purchase
  cancelPurchase: async (transactionId: string) => {
    const response = await apiClient.post(`/api/v1/tickets/cancel/${transactionId}`);
    return response.data;
  },

  // Validate QR code
  validateQR: async (qrData: string, eventId: string) => {
    const response = await apiClient.post(`/api/v1/tickets/validate-qr?qr_data=${qrData}&event_id=${eventId}`);
    return response.data;
  },
};

export const paymentsApi = {
  // Initiate M-Pesa payment
  initiateMpesa: async (transactionId: string) => {
    const response = await apiClient.post(`/api/v1/payments/initiate-mpesa?transaction_id=${transactionId}`);
    return response.data;
  },

  // Query payment status
  queryPaymentStatus: async (transactionId: string) => {
    const response = await apiClient.get(`/api/v1/payments/query-status/${transactionId}`);
    return response.data;
  },

  // Get transaction status
  getTransactionStatus: async (transactionId: string) => {
    const response = await apiClient.get(`/api/v1/payments/transaction/${transactionId}`);
    return response.data;
  },
};
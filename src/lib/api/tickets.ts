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
  // Purchase tickets
  purchaseTickets: async (data: PurchaseTicketRequest) => {
    const response = await apiClient.post('/tickets/purchase', data);
    return response.data;
  },

  // Get my tickets
  getMyTickets: async (eventId?: string) => {
    const url = eventId ? `/tickets/my-tickets?event_id=${eventId}` : '/tickets/my-tickets';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Get ticket by ID
  getTicket: async (ticketId: string) => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  },

  // Confirm purchase (after payment)
  confirmPurchase: async (transactionId: string, mpesaReceipt?: string) => {
    const params = mpesaReceipt ? `?mpesa_receipt=${mpesaReceipt}` : '';
    const response = await apiClient.post(`/tickets/confirm/${transactionId}${params}`);
    return response.data;
  },

  // Cancel purchase
  cancelPurchase: async (transactionId: string) => {
    const response = await apiClient.post(`/tickets/cancel/${transactionId}`);
    return response.data;
  },

  // Validate QR code
  validateQR: async (qrData: string, eventId: string) => {
    const response = await apiClient.post(`/tickets/validate-qr?qr_data=${qrData}&event_id=${eventId}`);
    return response.data;
  },
};

export const paymentsApi = {
  // Initiate M-Pesa payment
  initiateMpesa: async (transactionId: string) => {
    const response = await apiClient.post(`/payments/initiate-mpesa?transaction_id=${transactionId}`);
    return response.data;
  },

  // Query payment status
  queryPaymentStatus: async (transactionId: string) => {
    const response = await apiClient.get(`/payments/query-status/${transactionId}`);
    return response.data;
  },

  // Get transaction status
  getTransactionStatus: async (transactionId: string) => {
    const response = await apiClient.get(`/payments/transaction/${transactionId}`);
    return response.data;
  },
};
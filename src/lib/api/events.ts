// lib/api/events.ts
import apiClient from '../api-client';

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  start_datetime: string;
  end_datetime: string;
  banner_image_url?: string;
  additional_images?: string[];
  status: string;
  is_published: boolean;
  tickets_sold: number;
  is_sold_out: boolean;
  total_capacity: number;
  organizer: {
    id: string;
    business_name: string;
    description?: string;
    logo_url?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  price: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  quantity_available: number;
  is_active: boolean;
  is_sold_out: boolean;
  sold_percentage: number;
  sale_start?: string;
  sale_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
  start_date?: string;
  end_date?: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  sort_by?: 'relevance' | 'date_asc' | 'date_desc' | 'price_asc' | 'price_desc' | 'popularity' | 'newest';
  page?: number;
  page_size?: number;
}

export const eventsApi = {
  // List all events with filters
  listEvents: async (filters: SearchFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const response = await apiClient.get(`/events?${params.toString()}`);
    return response.data;
  },

  // Search events (advanced)
  searchEvents: async (filters: SearchFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const response = await apiClient.get(`/search/?${params.toString()}`);
    return response.data;
  },

  // Get event by ID
  getEvent: async (eventId: string) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  // Get event by slug
  getEventBySlug: async (slug: string) => {
    const response = await apiClient.get(`/events/slug/${slug}`);
    return response.data;
  },

  // Get ticket types for event
  getTicketTypes: async (eventId: string) => {
    const response = await apiClient.get(`/tickets/events/${eventId}/ticket-types`);
    return response.data;
  },

  // Get trending events
  getTrending: async (filters: { category?: string; location?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await apiClient.get(`/recommendations/trending?${params.toString()}`);
    return response.data;
  },

  // Get popular events
  getPopular: async (filters: { category?: string; location?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await apiClient.get(`/recommendations/popular?${params.toString()}`);
    return response.data;
  },

  // Get similar events
  getSimilarEvents: async (eventId: string, limit: number = 6) => {
    const response = await apiClient.get(`/recommendations/similar/${eventId}?limit=${limit}`);
    return response.data;
  },

  // Get search suggestions (autocomplete)
  getSearchSuggestions: async (query: string, limit: number = 10) => {
    const response = await apiClient.get(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get search facets (for filter UI)
  getSearchFacets: async (query?: string) => {
    const url = query ? `/search/facets?q=${encodeURIComponent(query)}` : '/search/facets';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Search nearby events
  searchNearby: async (params: {
    latitude: number;
    longitude: number;
    radius_km?: number;
    category?: string;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const response = await apiClient.get(`/search/nearby?${queryParams.toString()}`);
    return response.data;
  },

  // Get personalized recommendations (requires auth)
  getRecommendations: async (filters: { category?: string; location?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    const response = await apiClient.get(`/recommendations/for-you?${params.toString()}`);
    return response.data;
  },

  // Categories
  CATEGORIES: [
    { value: 'music', label: 'Music', icon: '🎵' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'conference', label: 'Conference', icon: '🎤' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️' },
    { value: 'networking', label: 'Networking', icon: '🤝' },
    { value: 'party', label: 'Party', icon: '🎉' },
    { value: 'festival', label: 'Festival', icon: '🎪' },
    { value: 'exhibition', label: 'Exhibition', icon: '🖼️' },
    { value: 'comedy', label: 'Comedy', icon: '😂' },
    { value: 'theater', label: 'Theater', icon: '🎭' },
    { value: 'food_drink', label: 'Food & Drink', icon: '🍽️' },
    { value: 'charity', label: 'Charity', icon: '❤️' },
    { value: 'other', label: 'Other', icon: '📌' },
  ],
};
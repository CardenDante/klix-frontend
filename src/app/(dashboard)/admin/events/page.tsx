'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { EventStatus } from '@/lib/types';

// ==================== TYPES ====================

interface EventOrganizer {
  id: string;
  business_name: string;
  email?: string;
}

interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: string;
  venue_name?: string;
  start_datetime: string;
  end_datetime?: string;
  is_published: boolean;
  is_featured: boolean;
  status: EventStatus;
  banner_image_url?: string;
  total_tickets_sold?: number;
  total_revenue?: number;
  organizer: EventOrganizer;
  organizer_id: string;
  created_at: string;
  updated_at: string;
  flagged?: boolean;
  flag_reason?: string;
  flag_severity?: string;
}

interface EventStats {
  total_events: number;
  published_events: number;
  draft_events: number;
  upcoming_events: number;
  ongoing_events: number;
  completed_events: number;
  cancelled_events: number;
  flagged_events: number;
}

type ActionType = 'flag' | 'unflag' | 'delete' | 'feature' | 'unfeature';
type FlagSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ==================== COMPONENT ====================

export default function AdminEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and modal states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all' | 'flagged'>('all');
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  
  // Action data
  const [flagReason, setFlagReason] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<FlagSeverity>('MEDIUM');
  const [unflagResolution, setUnflagResolution] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [refundTickets, setRefundTickets] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  // ==================== DATA FETCHING ====================

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        page_size: pageSize,
      };

      if (statusFilter !== 'all' && statusFilter !== 'flagged') {
        params.status = statusFilter;
      }

      console.log('Fetching events with params:', params);
      
      // Try admin endpoint first, fall back to public endpoint
      let response;
      try {
        response = await api.admin.events.list(params);
      } catch (adminErr) {
        console.log('Admin endpoint failed, trying public endpoint');
        response = await api.events.list(params);
      }

      console.log('Events response:', response);

      const responseData = response.data;
      
      let eventsList: AdminEvent[] = [];
      if (Array.isArray(responseData)) {
        eventsList = responseData;
      } else if (responseData.events && Array.isArray(responseData.events)) {
        eventsList = responseData.events;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        eventsList = responseData.data;
      }

      setEvents(eventsList);

      // Calculate stats from events
      const calculatedStats: EventStats = {
        total_events: eventsList.length,
        published_events: eventsList.filter(e => e.is_published).length,
        draft_events: eventsList.filter(e => !e.is_published).length,
        upcoming_events: eventsList.filter(e => e.status === EventStatus.UPCOMING).length,
        ongoing_events: eventsList.filter(e => e.status === EventStatus.ONGOING).length,
        completed_events: eventsList.filter(e => e.status === EventStatus.COMPLETED).length,
        cancelled_events: eventsList.filter(e => e.status === EventStatus.CANCELLED).length,
        flagged_events: eventsList.filter(e => e.flagged).length,
      };
      setStats(calculatedStats);

    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      console.error('Events fetch error:', err);
      
      let errorMessage = 'Failed to load events';
      
      if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to the server.';
      } else if (axiosError.response) {
        errorMessage = 
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          `Server error: ${axiosError.response.status}`;
      }
      
      setError(errorMessage);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ==================== ACTION HANDLERS ====================

  const handleFlag = async () => {
    if (!selectedEvent || !flagReason.trim()) {
      setError('Please provide a flag reason (minimum 10 characters)');
      return;
    }

    if (flagReason.length < 10) {
      setError('Flag reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedEvent.id);
      await api.admin.events.flag(selectedEvent.id, {
        reason: flagReason,
        severity: flagSeverity,
      });
      setSuccess(`Event "${selectedEvent.title}" has been flagged`);
      closeModal();
      await fetchEvents();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to flag event'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnflag = async () => {
    if (!selectedEvent || !unflagResolution.trim()) {
      setError('Please provide a resolution note (minimum 10 characters)');
      return;
    }

    if (unflagResolution.length < 10) {
      setError('Resolution note must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedEvent.id);
      await api.admin.events.unflag(selectedEvent.id, {
        resolution: unflagResolution,
      });
      setSuccess(`Event "${selectedEvent.title}" has been unflagged`);
      closeModal();
      await fetchEvents();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to unflag event'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent || !deleteReason.trim()) {
      setError('Please provide a deletion reason (minimum 10 characters)');
      return;
    }

    if (deleteReason.length < 10) {
      setError('Deletion reason must be at least 10 characters');
      return;
    }

    if (!confirm(`Are you sure you want to force delete "${selectedEvent.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(selectedEvent.id);
      await api.admin.events.forceDelete(selectedEvent.id, {
        reason: deleteReason,
        refund_tickets: refundTickets,
      });
      setSuccess(`Event "${selectedEvent.title}" has been deleted`);
      closeModal();
      await fetchEvents();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to delete event'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleFeature = async (eventId: string, eventTitle: string, shouldFeature: boolean) => {
    try {
      setActionLoading(eventId);
      
      if (shouldFeature) {
        await api.admin.events.feature(eventId);
        setSuccess(`Event "${eventTitle}" is now featured`);
      } else {
        await api.admin.events.unfeature(eventId);
        setSuccess(`Event "${eventTitle}" is no longer featured`);
      }
      
      await fetchEvents();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to update featured status'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (event: AdminEvent, action: ActionType) => {
    setSelectedEvent(event);
    setActionType(action);
    setFlagReason('');
    setFlagSeverity('MEDIUM');
    setUnflagResolution('');
    setDeleteReason('');
    setRefundTickets(false);
    setError(null);
  };

  const closeModal = () => {
    setSelectedEvent(null);
    setActionType(null);
    setFlagReason('');
    setFlagSeverity('MEDIUM');
    setUnflagResolution('');
    setDeleteReason('');
    setRefundTickets(false);
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: EventStatus): string => {
    switch (status) {
      case EventStatus.UPCOMING: return 'bg-blue-100 text-blue-800';
      case EventStatus.ONGOING: return 'bg-green-100 text-green-800';
      case EventStatus.COMPLETED: return 'bg-gray-100 text-gray-800';
      case EventStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // ==================== COMPUTED VALUES ====================

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      statusFilter === 'all' || 
      (statusFilter === 'flagged' && event.flagged) ||
      event.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  // ==================== RENDER ====================

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
            <p className="text-gray-600 mt-1">Review and moderate platform events</p>
          </div>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800">{success}</p>
              <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_events}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Published</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.published_events}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Upcoming</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.upcoming_events}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{stats.completed_events}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Flagged</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.flagged_events}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, organizer, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="flagged">Flagged</option>
              <option value={EventStatus.UPCOMING}>Upcoming</option>
              <option value={EventStatus.ONGOING}>Ongoing</option>
              <option value={EventStatus.COMPLETED}>Completed</option>
              <option value={EventStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Events ({filteredEvents.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">No events found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {/* Event Image */}
                    {event.banner_image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={event.banner_image_url}
                          alt={event.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-lg text-gray-900">{event.title || 'Untitled Event'}</h4>
                        {event.is_published ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Draft
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        {event.is_featured && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            ⭐ Featured
                          </span>
                        )}
                        {event.flagged && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            🚩 Flagged
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                          {event.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDateTime(event.start_datetime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location}
                        </span>
                        {event.total_tickets_sold !== undefined && (
                          <span>🎟️ {event.total_tickets_sold} tickets sold</span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500">
                        Organized by: <strong>{event.organizer?.business_name || 'Unknown'}</strong>
                      </p>

                      {event.flagged && event.flag_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">Flag Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{event.flag_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </button>
                      
                      <button
                        onClick={() => handleFeature(event.id, event.title, !event.is_featured)}
                        disabled={actionLoading === event.id}
                        className="px-3 py-1.5 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition disabled:opacity-50"
                      >
                        {event.is_featured ? 'Unfeature' : 'Feature'}
                      </button>

                      {event.flagged ? (
                        <button
                          onClick={() => openModal(event, 'unflag')}
                          disabled={actionLoading === event.id}
                          className="px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition disabled:opacity-50"
                        >
                          Unflag
                        </button>
                      ) : (
                        <button
                          onClick={() => openModal(event, 'flag')}
                          disabled={actionLoading === event.id}
                          className="px-3 py-1.5 text-sm border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition disabled:opacity-50"
                        >
                          Flag
                        </button>
                      )}

                      <button
                        onClick={() => openModal(event, 'delete')}
                        disabled={actionLoading === event.id}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {selectedEvent && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {actionType === 'flag' && 'Flag Event'}
                  {actionType === 'unflag' && 'Unflag Event'}
                  {actionType === 'delete' && 'Force Delete Event'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Event:</p>
                  <p className="font-semibold">{selectedEvent.title}</p>
                  <p className="text-sm text-gray-600 mt-2">Organizer:</p>
                  <p className="font-semibold">{selectedEvent.organizer?.business_name}</p>
                </div>

                {actionType === 'flag' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={flagSeverity}
                        onChange={(e) => setFlagSeverity(e.target.value as FlagSeverity)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="LOW">Low - Minor Issue</option>
                        <option value="MEDIUM">Medium - Moderate Concern</option>
                        <option value="HIGH">High - Serious Issue (Unpublish)</option>
                        <option value="CRITICAL">Critical - Severe Violation (Unpublish)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        placeholder="Why is this event being flagged? (min 10 characters)"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {flagReason.length}/10 characters minimum
                      </p>
                    </div>
                  </>
                )}

                {actionType === 'unflag' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={unflagResolution}
                      onChange={(e) => setUnflagResolution(e.target.value)}
                      placeholder="How was the issue resolved? (min 10 characters)"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {unflagResolution.length}/10 characters minimum
                    </p>
                  </div>
                )}

                {actionType === 'delete' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deletion Reason <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Why is this event being deleted? (min 10 characters)"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {deleteReason.length}/10 characters minimum
                      </p>
                    </div>
                    <label className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refundTickets}
                        onChange={(e) => setRefundTickets(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-yellow-900">Refund all tickets</p>
                        <p className="text-sm text-yellow-700">Required if tickets have been sold</p>
                      </div>
                    </label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="font-medium text-red-900">Warning</p>
                          <p className="text-sm text-red-700 mt-1">
                            This will permanently delete the event and all related data. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (actionType === 'flag') handleFlag();
                      if (actionType === 'unflag') handleUnflag();
                      if (actionType === 'delete') handleDelete();
                    }}
                    disabled={actionLoading === selectedEvent.id}
                    className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 ${
                      actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {actionLoading === selectedEvent.id ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                  </button>
                  <button
                    onClick={closeModal}
                    disabled={actionLoading === selectedEvent.id}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
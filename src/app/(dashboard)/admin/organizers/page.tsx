'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { OrganizerStatus } from '@/lib/types';

// ==================== TYPES ====================

interface AdminOrganizer {
  id: string;
  user_id: string;
  business_name: string;
  business_registration?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  status: OrganizerStatus;
  user_email?: string;
  user_phone?: string;
  total_events?: number;
  active_events?: number;
  total_revenue?: number;
  total_tickets_sold?: number;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  suspended_at?: string;
  suspension_reason?: string;
  created_at: string;
  updated_at: string;
}

interface OrganizerStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

// ==================== COMPONENT ====================

export default function AdminOrganizersPage() {
  // State management
  const [organizers, setOrganizers] = useState<AdminOrganizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrganizerStatus | ''>('');

  // Modal state
  const [selectedOrganizer, setSelectedOrganizer] = useState<AdminOrganizer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  // ==================== DATA FETCHING ====================

  const fetchOrganizers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        page_size: pageSize,
      };

      if (statusFilter) params.status = statusFilter;

      console.log('Fetching organizers with params:', params);
      const response = await api.admin.organizers.list(params);
      console.log('Organizers response:', response);

      // Handle response
      const responseData = response.data;
      
      if (Array.isArray(responseData)) {
        setOrganizers(responseData);
        setTotal(responseData.length);
      } else if (responseData.organizers && Array.isArray(responseData.organizers)) {
        setOrganizers(responseData.organizers);
        setTotal(responseData.total || responseData.organizers.length);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setOrganizers(responseData.data);
        setTotal(responseData.total || responseData.data.length);
      } else {
        setOrganizers([]);
        setTotal(0);
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      console.error('Organizers fetch error:', err);
      
      let errorMessage = 'Failed to load organizers';
      
      if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to the server.';
      } else if (axiosError.response) {
        errorMessage = 
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          `Server error: ${axiosError.response.status}`;
      } else if (axiosError.request) {
        errorMessage = 'No response from server.';
      } else {
        errorMessage = axiosError.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      setOrganizers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  const fetchPendingOrganizers = async () => {
    try {
      const response = await api.admin.organizers.pending({ page: 1, page_size: 100 });
      const responseData = response.data;
      
      if (Array.isArray(responseData)) {
        return responseData;
      } else if (responseData.organizers && Array.isArray(responseData.organizers)) {
        return responseData.organizers;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch pending organizers:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  // ==================== ACTION HANDLERS ====================

  const handleApprove = async () => {
    if (!selectedOrganizer) return;

    try {
      setActionLoading(selectedOrganizer.id);
      await api.admin.organizers.approve(selectedOrganizer.id, {
        notes: actionNotes || undefined
      });
      setSuccess(`${selectedOrganizer.business_name} has been approved successfully!`);
      closeModal();
      await fetchOrganizers();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to approve organizer'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedOrganizer) return;

    if (!actionReason || actionReason.length < 10) {
      setError('Please provide a rejection reason (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(selectedOrganizer.id);
      await api.admin.organizers.reject(selectedOrganizer.id, {
        reason: actionReason
      });
      setSuccess(`${selectedOrganizer.business_name} has been rejected`);
      closeModal();
      await fetchOrganizers();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to reject organizer'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedOrganizer) return;

    if (!actionReason || actionReason.length < 10) {
      setError('Please provide a suspension reason (minimum 10 characters)');
      return;
    }

    try {
      setActionLoading(selectedOrganizer.id);
      await api.admin.organizers.suspend(selectedOrganizer.id, {
        reason: actionReason,
        duration_days: undefined // Indefinite suspension
      });
      setSuccess(`${selectedOrganizer.business_name} has been suspended`);
      closeModal();
      await fetchOrganizers();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to suspend organizer'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openModal = (organizer: AdminOrganizer, action: 'approve' | 'reject' | 'suspend') => {
    setSelectedOrganizer(organizer);
    setActionType(action);
    setActionReason('');
    setActionNotes('');
    setError(null);
  };

  const closeModal = () => {
    setSelectedOrganizer(null);
    setActionType(null);
    setActionReason('');
    setActionNotes('');
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: OrganizerStatus): string => {
    switch (status) {
      case OrganizerStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-200';
      case OrganizerStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrganizerStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200';
      case OrganizerStatus.SUSPENDED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // ==================== COMPUTED VALUES ====================

  const filteredOrganizers = organizers.filter(org => {
    if (!org || !searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      org.business_name?.toLowerCase().includes(search) ||
      org.user_email?.toLowerCase().includes(search) ||
      org.business_registration?.toLowerCase().includes(search)
    );
  });

  const stats: OrganizerStats = {
    total: organizers.length,
    pending: organizers.filter(o => o?.status === OrganizerStatus.PENDING).length,
    approved: organizers.filter(o => o?.status === OrganizerStatus.APPROVED).length,
    rejected: organizers.filter(o => o?.status === OrganizerStatus.REJECTED).length,
    suspended: organizers.filter(o => o?.status === OrganizerStatus.SUSPENDED).length,
  };

  // ==================== RENDER ====================

  if (loading && organizers.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Organizer Management</h1>
            <p className="text-gray-600 mt-1">Review and manage event organizer applications</p>
          </div>
          <button
            onClick={fetchOrganizers}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <button
            onClick={() => setStatusFilter('')}
            className={`bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition ${
              statusFilter === '' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <p className="text-gray-600 text-sm">Total Organizers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </button>

          <button
            onClick={() => setStatusFilter(OrganizerStatus.PENDING)}
            className={`bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition ${
              statusFilter === OrganizerStatus.PENDING ? 'ring-2 ring-yellow-500' : ''
            }`}
          >
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
          </button>

          <button
            onClick={() => setStatusFilter(OrganizerStatus.APPROVED)}
            className={`bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition ${
              statusFilter === OrganizerStatus.APPROVED ? 'ring-2 ring-green-500' : ''
            }`}
          >
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
          </button>

          <button
            onClick={() => setStatusFilter(OrganizerStatus.REJECTED)}
            className={`bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition ${
              statusFilter === OrganizerStatus.REJECTED ? 'ring-2 ring-red-500' : ''
            }`}
          >
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
          </button>

          <button
            onClick={() => setStatusFilter(OrganizerStatus.SUSPENDED)}
            className={`bg-white rounded-lg shadow p-6 text-left hover:shadow-md transition ${
              statusFilter === OrganizerStatus.SUSPENDED ? 'ring-2 ring-gray-500' : ''
            }`}
          >
            <p className="text-gray-600 text-sm">Suspended</p>
            <p className="text-3xl font-bold text-gray-600 mt-2">{stats.suspended}</p>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by business name, email, or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Organizers List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Organizers ({filteredOrganizers.length})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading organizers...</p>
            </div>
          ) : filteredOrganizers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-gray-600">No organizers found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrganizers.filter(org => org && org.id).map((organizer, index) => (
                <div key={organizer.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {organizer.logo_url ? (
                        <img
                          src={organizer.logo_url}
                          alt={organizer.business_name || 'Organizer'}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                          {organizer.business_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg text-gray-900 truncate">
                          {organizer.business_name || 'Unknown Business'}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(organizer.status)}`}>
                          {organizer.status}
                        </span>
                      </div>

                      {/* Contact */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        {organizer.user_email && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {organizer.user_email}
                          </span>
                        )}
                        {organizer.user_phone && (
                          <span>📱 {organizer.user_phone}</span>
                        )}
                        {organizer.business_registration && (
                          <span>📋 Reg: {organizer.business_registration}</span>
                        )}
                        {organizer.website && (
                          <a 
                            href={organizer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Website
                          </a>
                        )}
                      </div>

                      {/* Description */}
                      {organizer.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {organizer.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600">Total Events</p>
                          <p className="text-lg font-bold">{organizer.total_events || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Active Events</p>
                          <p className="text-lg font-bold text-green-600">{organizer.active_events || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Tickets Sold</p>
                          <p className="text-lg font-bold">{organizer.total_tickets_sold || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Total Revenue</p>
                          <p className="text-lg font-bold">{formatCurrency(organizer.total_revenue || 0)}</p>
                        </div>
                      </div>

                      {/* Rejection/Suspension Reason */}
                      {organizer.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{organizer.rejection_reason}</p>
                        </div>
                      )}

                      {organizer.suspension_reason && (
                        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">Suspension Reason:</p>
                          <p className="text-sm text-gray-700 mt-1">{organizer.suspension_reason}</p>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Applied: {formatDate(organizer.created_at)}</span>
                        {organizer.approved_at && (
                          <span>✓ Approved: {formatDate(organizer.approved_at)}</span>
                        )}
                        {organizer.rejected_at && (
                          <span>✗ Rejected: {formatDate(organizer.rejected_at)}</span>
                        )}
                        {organizer.suspended_at && (
                          <span>⊗ Suspended: {formatDate(organizer.suspended_at)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      {organizer.status === OrganizerStatus.PENDING && (
                        <>
                          <button
                            onClick={() => openModal(organizer, 'approve')}
                            disabled={actionLoading === organizer.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(organizer, 'reject')}
                            disabled={actionLoading === organizer.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </>
                      )}

                      {organizer.status === OrganizerStatus.APPROVED && (
                        <button
                          onClick={() => openModal(organizer, 'suspend')}
                          disabled={actionLoading === organizer.id}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {selectedOrganizer && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {actionType === 'approve' && 'Approve Organizer'}
                  {actionType === 'reject' && 'Reject Organizer'}
                  {actionType === 'suspend' && 'Suspend Organizer'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Business Name:</p>
                  <p className="font-semibold">{selectedOrganizer.business_name || 'Unknown Business'}</p>
                  {selectedOrganizer.user_email && (
                    <>
                      <p className="text-sm text-gray-600 mt-2">Email:</p>
                      <p className="font-semibold">{selectedOrganizer.user_email}</p>
                    </>
                  )}
                </div>

                {actionType === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Internal notes about this approval..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {(actionType === 'reject' || actionType === 'suspend') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder={`Enter ${actionType} reason (minimum 10 characters)...`}
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {actionReason.length}/10 characters minimum
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (actionType === 'approve') handleApprove();
                      if (actionType === 'reject') handleReject();
                      if (actionType === 'suspend') handleSuspend();
                    }}
                    disabled={actionLoading === selectedOrganizer.id}
                    className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 ${
                      actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionLoading === selectedOrganizer.id ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                  </button>
                  <button
                    onClick={closeModal}
                    disabled={actionLoading === selectedOrganizer.id}
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
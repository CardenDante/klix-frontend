'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { OrganizerStatus } from '@/lib/types';
import { Loader2, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface AdminOrganizer {
  id: string;
  user_id: string;
  business_name?: string; // Made optional
  business_registration?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  status?: OrganizerStatus | string; // Made optional and allow string
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
  created_at?: string; // Made optional
  updated_at?: string; // Made optional
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

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Extracts organizers array from various response formats
   */
  const extractOrganizers = (responseData: any): AdminOrganizer[] => {
    console.log('🔍 Raw API response:', responseData);
    console.log('🔍 Response type:', typeof responseData);
    console.log('🔍 Response keys:', responseData ? Object.keys(responseData) : 'null');
    
    // Check if it's a direct array
    if (Array.isArray(responseData)) {
      console.log('✅ Response is direct array, length:', responseData.length);
      console.log('✅ First item:', responseData[0]);
      return responseData;
    }
    
    // Check for items array (paginated response)
    if (responseData?.items && Array.isArray(responseData.items)) {
      console.log('✅ Found items array, length:', responseData.items.length);
      console.log('✅ First item:', responseData.items[0]);
      return responseData.items;
    }
    
    // Check for organizers array
    if (responseData?.organizers && Array.isArray(responseData.organizers)) {
      console.log('✅ Found organizers array, length:', responseData.organizers.length);
      console.log('✅ First item:', responseData.organizers[0]);
      return responseData.organizers;
    }
    
    // Check for data array
    if (responseData?.data && Array.isArray(responseData.data)) {
      console.log('✅ Found data array, length:', responseData.data.length);
      console.log('✅ First item:', responseData.data[0]);
      return responseData.data;
    }
    
    // Check for nested data.items
    if (responseData?.data?.items && Array.isArray(responseData.data.items)) {
      console.log('✅ Found data.items array, length:', responseData.data.items.length);
      console.log('✅ First item:', responseData.data.items[0]);
      return responseData.data.items;
    }
    
    console.error('❌ Could not extract organizers array from response:', responseData);
    console.error('❌ Available keys:', responseData ? Object.keys(responseData) : 'none');
    return [];
  };

  /**
   * Extracts total count from various response formats
   */
  const extractTotal = (responseData: any, organizersLength: number): number => {
    return responseData.total || responseData.count || organizersLength;
  };

  // ==================== DATA FETCHING ====================

  const fetchOrganizers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build params object - only include non-empty values
      const params: any = {};

      // Try different parameter name variations based on common API patterns
      // Some APIs use 'page' and 'page_size', others use 'skip' and 'limit'
      if (page > 1) {
        params.page = page;
      }
      if (pageSize !== 50) {
        params.page_size = pageSize;
      }

      // Only add status filter if it's set
      if (statusFilter && statusFilter !== '') {
        params.status = statusFilter;
      }

      // Only add search if it has a value
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }

      console.log('🔍 Fetching organizers with params:', params);
      console.log('📋 Params stringified:', JSON.stringify(params));

      // Try the request - if it fails with 422, we'll try without params
      let response;
      try {
        response = await api.admin.organizers.list(params);
      } catch (firstError: any) {
        if (firstError.response?.status === 422) {
          console.warn('⚠️ 422 error with params, retrying without pagination params...');
          console.error('422 Error details:', firstError.response?.data);
          
          // Try with just status filter if it exists
          const simplifiedParams: any = {};
          if (statusFilter && statusFilter !== '') {
            simplifiedParams.status = statusFilter;
          }
          
          console.log('🔄 Retrying with simplified params:', simplifiedParams);
          response = await api.admin.organizers.list(simplifiedParams);
        } else {
          throw firstError;
        }
      }

      console.log('📦 Full response object:', response);
      console.log('📊 Response data:', response.data);
      console.log('📈 Response status:', response.status);

      const extractedOrganizers = extractOrganizers(response.data);
      const extractedTotal = extractTotal(response.data, extractedOrganizers.length);

      console.log('✅ Extracted organizers:', extractedOrganizers.length);
      console.log('📊 Total count:', extractedTotal);

      setOrganizers(extractedOrganizers);
      setTotal(extractedTotal);

      if (extractedOrganizers.length === 0) {
        console.warn('⚠️ No organizers found in response');
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      console.error('❌ Organizers fetch error:', err);
      console.error('❌ Error response:', axiosError.response);
      console.error('❌ Error status:', axiosError.response?.status);
      console.error('❌ Error data:', axiosError.response?.data);
      
      let errorMessage = 'Failed to load organizers';
      
      if (axiosError.response?.status === 422) {
        // Provide more detailed error message for validation errors
        const validationDetails = axiosError.response?.data?.detail;
        if (Array.isArray(validationDetails)) {
          const fieldErrors = validationDetails.map((err: any) => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
          errorMessage = `Validation Error: ${fieldErrors}`;
        } else if (typeof validationDetails === 'string') {
          errorMessage = `Validation Error: ${validationDetails}`;
        } else {
          errorMessage = 'Invalid request parameters. The API may not support pagination or the current filters.';
        }
        console.error('Full validation error details:', axiosError.response?.data);
      } else if (axiosError.response?.status === 404) {
        errorMessage = 'Organizers endpoint not found (404). Check your backend is running.';
      } else if (axiosError.response?.status === 403) {
        errorMessage = 'Access denied. You may not have admin permissions.';
      } else if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to the server. Check if backend is running.';
      } else if (axiosError.response) {
        errorMessage = 
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          `Server error: ${axiosError.response.status}`;
      } else if (axiosError.request) {
        errorMessage = 'No response from server. Check your network connection.';
      } else {
        errorMessage = axiosError.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setOrganizers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchTerm]);

  const fetchPendingOrganizers = async () => {
    try {
      console.log('🔍 Fetching pending organizers...');
      
      // Try with minimal params first
      let response;
      try {
        response = await api.admin.organizers.pending({ page: 1, page_size: 100 });
      } catch (firstError: any) {
        if (firstError.response?.status === 422) {
          console.warn('⚠️ 422 error with params, trying without params...');
          response = await api.admin.organizers.pending({});
        } else {
          throw firstError;
        }
      }
      
      console.log('📦 Pending organizers response:', response.data);
      
      const extracted = extractOrganizers(response.data);
      console.log('✅ Extracted pending organizers:', extracted.length);
      
      return extracted;
    } catch (err) {
      console.error('❌ Error fetching pending organizers:', err);
      return [];
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchOrganizers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchOrganizers]);

  // ==================== ACTION HANDLERS ====================

  const openModal = (organizer: AdminOrganizer, type: 'approve' | 'reject' | 'suspend') => {
    setSelectedOrganizer(organizer);
    setActionType(type);
    setActionReason('');
    setActionNotes('');
  };

  const closeModal = () => {
    setSelectedOrganizer(null);
    setActionType(null);
    setActionReason('');
    setActionNotes('');
  };

  const handleApprove = async () => {
    if (!selectedOrganizer) return;

    try {
      setActionLoading(selectedOrganizer.id);
      await api.admin.organizers.approve(selectedOrganizer.id, {
        notes: actionNotes || undefined
      });
      
      setSuccess(`${selectedOrganizer.business_name} approved successfully`);
      toast.success(`${selectedOrganizer.business_name} approved`);
      
      await fetchOrganizers();
      closeModal();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to approve organizer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedOrganizer) return;

    if (!actionReason || actionReason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedOrganizer.id);
      await api.admin.organizers.reject(selectedOrganizer.id, {
        reason: actionReason
      });
      
      setSuccess(`${selectedOrganizer.business_name} rejected`);
      toast.success(`${selectedOrganizer.business_name} rejected`);
      
      await fetchOrganizers();
      closeModal();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to reject organizer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedOrganizer) return;

    if (!actionReason || actionReason.length < 10) {
      toast.error('Suspension reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedOrganizer.id);
      await api.admin.organizers.suspend(selectedOrganizer.id, {
        reason: actionReason
      });
      
      setSuccess(`${selectedOrganizer.business_name} suspended`);
      toast.success(`${selectedOrganizer.business_name} suspended`);
      
      await fetchOrganizers();
      closeModal();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to suspend organizer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const getStatusBadge = (status: OrganizerStatus | string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-300';
    
    // Normalize status to uppercase for comparison
    const normalizedStatus = String(status).toUpperCase();
    
    const badges: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'APPROVED': 'bg-green-100 text-green-800 border-green-300',
      'REJECTED': 'bg-red-100 text-red-800 border-red-300',
      'SUSPENDED': 'bg-gray-100 text-gray-800 border-gray-300',
    };
    
    return badges[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount) return 'KSh 0';
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Stats
  const stats = {
    total: organizers.length,
    pending: organizers.filter(o => o.status === OrganizerStatus.PENDING).length,
    approved: organizers.filter(o => o.status === OrganizerStatus.APPROVED).length,
    rejected: organizers.filter(o => o.status === OrganizerStatus.REJECTED).length,
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizer Management</h1>
          <p className="text-gray-600 mt-1">Review and manage event organizer applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Organizers</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-700">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-700">Approved</p>
            <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-700">Rejected</p>
            <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by business name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrganizerStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {Object.values(OrganizerStatus).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-green-800">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        )}

        {/* Organizers List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading organizers...</p>
            </div>
          ) : organizers.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No organizers found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {organizers.map((organizer) => (
                <div key={organizer.id} className="p-6 hover:bg-gray-50 transition">
                  {/* Debug Info - Remove after fixing */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="font-semibold mb-1">Debug - Organizer Data:</p>
                      <pre className="overflow-auto max-h-40">{JSON.stringify(organizer, null, 2)}</pre>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {organizer.logo_url ? (
                        <img
                          src={organizer.logo_url}
                          alt={organizer.business_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          {organizer.business_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {organizer.business_name || 'Unknown Business'}
                        </h4>
                        
                        {/* Status Badge */}
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(organizer.status)}`}>
                          {organizer.status}
                        </span>
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        {organizer.user_email && (
                          <span>✉️ {organizer.user_email}</span>
                        )}
                        {organizer.user_phone && (
                          <span>📞 {organizer.user_phone}</span>
                        )}
                        {organizer.website && (
                          <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            🌐 Website
                          </a>
                        )}
                      </div>

                      {/* Description */}
                      {organizer.description && (
                        <p className="text-sm text-gray-600 mb-3">{organizer.description}</p>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
                      {/* Debug status */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded">
                          Status: "{organizer.status}" 
                          <br/>
                          Type: {typeof organizer.status}
                          <br/>
                          Normalized: "{String(organizer.status).toUpperCase()}"
                          <br/>
                          Expected: "PENDING"
                        </div>
                      )}

                      {/* Normalize status for comparison */}
                      {String(organizer.status).toUpperCase() === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openModal(organizer, 'approve')}
                            disabled={actionLoading === organizer.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => openModal(organizer, 'reject')}
                            disabled={actionLoading === organizer.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {String(organizer.status).toUpperCase() === 'APPROVED' && (
                        <button
                          onClick={() => openModal(organizer, 'suspend')}
                          disabled={actionLoading === organizer.id}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Suspend
                        </button>
                      )}

                      {/* Fallback for unexpected status */}
                      {!['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(String(organizer.status).toUpperCase()) && (
                        <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
                          Unexpected status: {organizer.status || 'null/undefined'}
                        </div>
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
                    {actionLoading === selectedOrganizer.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`
                    )}
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
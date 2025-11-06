'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { PromoterStatus, PromoterProfile } from '@/lib/types';
import { Loader2, Search, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react';
import { toast } from 'sonner';

// ==================== COMPONENT ====================

export default function AdminPromotersPage() {
  // State management
  const [promoters, setPromoters] = useState<PromoterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromoterStatus | ''>('');

  // Modal state
  const [selectedPromoter, setSelectedPromoter] = useState<PromoterProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'view' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // ==================== DATA FETCHING ====================

  const fetchPromoters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching promoters...');
      const response = await api.admin.promoters.pending({});

      console.log('📦 Full response:', response);
      console.log('📊 Response data:', response.data);

      // Extract promoters array
      let promotersList: PromoterProfile[] = [];
      if (Array.isArray(response.data)) {
        promotersList = response.data;
      } else if (response.data?.promoters && Array.isArray(response.data.promoters)) {
        promotersList = response.data.promoters;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        promotersList = response.data.items;
      }

      console.log('✅ Extracted promoters:', promotersList.length);
      setPromoters(promotersList);

      if (promotersList.length === 0) {
        console.warn('⚠️ No promoters found in response');
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;

      console.error('❌ Promoters fetch error:', err);
      console.error('❌ Error response:', axiosError.response);

      let errorMessage = 'Failed to load promoters';

      if (axiosError.response?.status === 404) {
        errorMessage = 'Promoters endpoint not found (404). Check your backend is running.';
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
      setPromoters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromoters();
  }, [fetchPromoters]);

  // ==================== ACTION HANDLERS ====================

  const openModal = (
    promoter: PromoterProfile,
    type: 'approve' | 'reject' | 'suspend' | 'view'
  ) => {
    setSelectedPromoter(promoter);
    setActionType(type);
    setActionReason('');
    setActionNotes('');
  };

  const closeModal = () => {
    setSelectedPromoter(null);
    setActionType(null);
    setActionReason('');
    setActionNotes('');
  };

  const handleApprove = async () => {
    if (!selectedPromoter) return;

    try {
      setActionLoading(selectedPromoter.id);
      await api.admin.promoters.approve(selectedPromoter.id, {
        notes: actionNotes || undefined
      });

      setSuccess(`${selectedPromoter.display_name} approved successfully`);
      toast.success(`${selectedPromoter.display_name} approved as promoter`);

      await fetchPromoters();
      closeModal();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        'Failed to approve promoter';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPromoter) return;

    if (!actionReason || actionReason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedPromoter.id);
      await api.admin.promoters.reject(selectedPromoter.id, {
        reason: actionReason
      });

      setSuccess(`${selectedPromoter.display_name} rejected`);
      toast.success(`${selectedPromoter.display_name} rejected`);

      await fetchPromoters();
      closeModal();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        'Failed to reject promoter';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async () => {
    if (!selectedPromoter) return;

    if (!actionReason || actionReason.length < 10) {
      toast.error('Suspension reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedPromoter.id);
      await api.admin.promoters.suspend(selectedPromoter.id, {
        reason: actionReason
      });

      setSuccess(`${selectedPromoter.display_name} suspended`);
      toast.success(`${selectedPromoter.display_name} suspended`);

      await fetchPromoters();
      closeModal();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage =
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        'Failed to suspend promoter';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const getStatusBadge = (status: PromoterStatus) => {
    const badges: Record<PromoterStatus, string> = {
      [PromoterStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [PromoterStatus.APPROVED]: 'bg-green-100 text-green-800 border-green-300',
      [PromoterStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-300',
      [PromoterStatus.SUSPENDED]: 'bg-gray-100 text-gray-800 border-gray-300',
    };

    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
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

  const parseSocialLinks = (socialLinksJson: string | undefined): Record<string, string> => {
    if (!socialLinksJson) return {};
    try {
      return JSON.parse(socialLinksJson);
    } catch {
      return {};
    }
  };

  // ==================== FILTERING ====================

  const filteredPromoters = promoters.filter(promoter => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      promoter.display_name?.toLowerCase().includes(searchLower) ||
      promoter.bio?.toLowerCase().includes(searchLower) ||
      promoter.experience?.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus = !statusFilter || promoter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: promoters.length,
    pending: promoters.filter(p => p.status === PromoterStatus.PENDING).length,
    approved: promoters.filter(p => p.status === PromoterStatus.APPROVED).length,
    rejected: promoters.filter(p => p.status === PromoterStatus.REJECTED).length,
    suspended: promoters.filter(p => p.status === PromoterStatus.SUSPENDED).length,
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promoter Management</h1>
          <p className="text-gray-600 mt-1">Review and manage promoter applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Promoters</p>
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
                placeholder="Search by name, bio, or experience..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PromoterStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {Object.values(PromoterStatus).map(status => (
                <option key={status} value={status}>{status.toUpperCase()}</option>
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

        {/* Promoters List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading promoters...</p>
            </div>
          ) : filteredPromoters.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {promoters.length === 0 ? 'No promoters found' : 'No promoters match your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPromoters.map((promoter) => {
                const socialLinks = parseSocialLinks(promoter.social_links);

                return (
                  <div key={promoter.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
                          {promoter.display_name.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {promoter.display_name}
                          </h4>

                          {/* Status Badge */}
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadge(promoter.status)}`}>
                            {promoter.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Bio */}
                        {promoter.bio && (
                          <p className="text-sm text-gray-600 mb-3">{promoter.bio}</p>
                        )}

                        {/* Experience */}
                        {promoter.experience && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-1">Experience:</p>
                            <p className="text-sm text-gray-600">{promoter.experience}</p>
                          </div>
                        )}

                        {/* Social Links */}
                        {Object.keys(socialLinks).length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {Object.entries(socialLinks).map(([platform, url]) => (
                              <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition"
                              >
                                {platform}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {promoter.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">{promoter.rejection_reason}</p>
                          </div>
                        )}

                        {/* Dates */}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>Applied: {formatDate(promoter.created_at)}</span>
                          {promoter.approved_at && (
                            <span>✓ Approved: {formatDate(promoter.approved_at)}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex flex-col gap-2">
                        <button
                          onClick={() => openModal(promoter, 'view')}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 whitespace-nowrap"
                        >
                          <User className="w-4 h-4" />
                          View Details
                        </button>

                        {promoter.status === PromoterStatus.PENDING && (
                          <>
                            <button
                              onClick={() => openModal(promoter, 'approve')}
                              disabled={actionLoading === promoter.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => openModal(promoter, 'reject')}
                              disabled={actionLoading === promoter.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </>
                        )}

                        {promoter.status === PromoterStatus.APPROVED && (
                          <button
                            onClick={() => openModal(promoter, 'suspend')}
                            disabled={actionLoading === promoter.id}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Suspend
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {selectedPromoter && actionType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {actionType === 'approve' && 'Approve Promoter'}
                  {actionType === 'reject' && 'Reject Promoter'}
                  {actionType === 'suspend' && 'Suspend Promoter'}
                  {actionType === 'view' && 'Promoter Details'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Display Name:</p>
                  <p className="font-semibold">{selectedPromoter.display_name}</p>

                  {selectedPromoter.bio && (
                    <>
                      <p className="text-sm text-gray-600 mt-3">Bio:</p>
                      <p className="text-sm">{selectedPromoter.bio}</p>
                    </>
                  )}

                  {selectedPromoter.experience && (
                    <>
                      <p className="text-sm text-gray-600 mt-3">Experience:</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedPromoter.experience}</p>
                    </>
                  )}

                  {selectedPromoter.social_links && (
                    <>
                      <p className="text-sm text-gray-600 mt-3">Social Links:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(parseSocialLinks(selectedPromoter.social_links)).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          >
                            {platform}: {url}
                          </a>
                        ))}
                      </div>
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
                  {actionType !== 'view' && (
                    <button
                      onClick={() => {
                        if (actionType === 'approve') handleApprove();
                        if (actionType === 'reject') handleReject();
                        if (actionType === 'suspend') handleSuspend();
                      }}
                      disabled={actionLoading === selectedPromoter.id}
                      className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 ${
                        actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {actionLoading === selectedPromoter.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`
                      )}
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    disabled={actionLoading === selectedPromoter.id}
                    className={`${actionType === 'view' ? 'flex-1' : ''} px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50`}
                  >
                    {actionType === 'view' ? 'Close' : 'Cancel'}
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

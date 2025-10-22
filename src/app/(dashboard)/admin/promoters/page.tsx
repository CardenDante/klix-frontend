'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';

// ==================== TYPES ====================

interface SocialMediaLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
}

interface PromoterApplication {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  business_name: string;
  phone_number?: string;
  social_media_links?: SocialMediaLinks;
  audience_size?: string;
  experience_description?: string;
  why_join?: string;
  sample_content?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  updated_at: string;
}

interface ActivePromoter {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  business_name: string;
  phone_number?: string;
  total_tickets_sold: number;
  total_codes: number;
  active_codes: number;
  total_commission_earned: number;
  total_commission_paid: number;
  total_commission_pending: number;
  total_revenue_generated: number;
  created_at: string;
  last_sale_at?: string;
}

interface PromoterStats {
  total_promoters: number;
  pending_applications: number;
  active_promoters: number;
  total_commission_paid: number;
  total_commission_pending: number;
  total_tickets_sold: number;
  total_revenue_generated: number;
  average_commission_per_promoter: number;
}

// ==================== COMPONENT ====================

export default function AdminPromotersPage() {
  // State management
  const [stats, setStats] = useState<PromoterStats | null>(null);
  const [applications, setApplications] = useState<PromoterApplication[]>([]);
  const [activePromoters, setActivePromoters] = useState<ActivePromoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter and modal states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'active'>('pending');
  const [selectedApplication, setSelectedApplication] = useState<PromoterApplication | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // ==================== DATA FETCHING ====================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching promoter data...');

      const [statsRes, applicationsRes, promotersRes] = await Promise.allSettled([
        api.admin.promoters.stats(),
        api.admin.promoters.applications(),
        api.admin.promoters.active(),
      ]);

      // Handle stats
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      // Handle applications
      if (applicationsRes.status === 'fulfilled') {
        const responseData = applicationsRes.value.data;
        if (Array.isArray(responseData)) {
          setApplications(responseData);
        } else if (responseData.applications && Array.isArray(responseData.applications)) {
          setApplications(responseData.applications);
        } else {
          setApplications([]);
        }
      }

      // Handle active promoters
      if (promotersRes.status === 'fulfilled') {
        const responseData = promotersRes.value.data;
        if (Array.isArray(responseData)) {
          setActivePromoters(responseData);
        } else if (responseData.promoters && Array.isArray(responseData.promoters)) {
          setActivePromoters(responseData.promoters);
        } else {
          setActivePromoters([]);
        }
      }

    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      console.error('Promoters fetch error:', err);
      
      let errorMessage = 'Failed to load promoter data';
      
      if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to the server.';
      } else if (axiosError.response) {
        errorMessage = 
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          `Server error: ${axiosError.response.status}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== ACTION HANDLERS ====================

  const handleApprove = async (applicationId: string, businessName: string) => {
    if (!confirm(`Approve promoter application for ${businessName}?`)) return;

    try {
      setActionLoading(applicationId);
      await api.admin.promoters.approve(applicationId);
      setSuccess(`${businessName} has been approved as a promoter!`);
      setSelectedApplication(null);
      await fetchData();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to approve application'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    if (rejectionReason.length < 10) {
      setError('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(selectedApplication.id);
      await api.admin.promoters.reject(selectedApplication.id, {
        reason: rejectionReason
      });
      setSuccess(`Application for ${selectedApplication.business_name} has been rejected`);
      setShowRejectModal(false);
      setSelectedApplication(null);
      setRejectionReason('');
      await fetchData();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to reject application'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (promoterId: string, businessName: string) => {
    if (!confirm(`Deactivate promoter ${businessName}? They will lose access to create new codes.`)) return;

    try {
      setActionLoading(promoterId);
      await api.admin.promoters.deactivate(promoterId);
      setSuccess(`${businessName} has been deactivated`);
      await fetchData();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to deactivate promoter'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (application: PromoterApplication) => {
    setSelectedApplication(application);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
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

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ==================== COMPUTED VALUES ====================

  const filteredApplications = applications.filter(app =>
    (app.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     app.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     app.user_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');
  const approvedApplications = filteredApplications.filter(app => app.status === 'approved');
  const rejectedApplications = filteredApplications.filter(app => app.status === 'rejected');

  const filteredActivePromoters = activePromoters.filter(promoter =>
    (promoter.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     promoter.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     promoter.user_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ==================== RENDER ====================

  if (loading && !stats) {
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
            <h1 className="text-3xl font-bold text-gray-900">Promoter Management</h1>
            <p className="text-gray-600 mt-1">Manage promoter applications and active promoters</p>
          </div>
          <button
            onClick={fetchData}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending Applications</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending_applications}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Promoters</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.active_promoters}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Tickets Sold</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{formatNumber(stats.total_tickets_sold)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Commission</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(stats.total_commission_paid)}</p>
                  {stats.total_commission_pending > 0 && (
                    <p className="text-xs text-gray-500 mt-1">+{formatCurrency(stats.total_commission_pending)} pending</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by business name, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex gap-6 px-6">
              {[
                { id: 'pending', label: 'Pending', count: pendingApplications.length },
                { id: 'approved', label: 'Approved', count: approvedApplications.length },
                { id: 'rejected', label: 'Rejected', count: rejectedApplications.length },
                { id: 'active', label: 'Active Promoters', count: activePromoters.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Pending Applications Tab */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-600">No pending applications</p>
                  </div>
                ) : (
                  pendingApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{app.business_name || 'Unknown Business'}</h3>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Pending Review
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            {app.user_email && (
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {app.user_email}
                              </span>
                            )}
                            {app.phone_number && (
                              <span>📱 {app.phone_number}</span>
                            )}
                            {app.audience_size && (
                              <span>👥 {app.audience_size} audience</span>
                            )}
                            <span>📅 Applied {formatDate(app.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleApprove(app.id, app.business_name)}
                            disabled={actionLoading === app.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => openRejectModal(app)}
                            disabled={actionLoading === app.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </div>
                      </div>

                      {app.experience_description && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 line-clamp-3">{app.experience_description}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Approved Applications Tab */}
            {activeTab === 'approved' && (
              <div className="space-y-4">
                {approvedApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No approved applications</p>
                  </div>
                ) : (
                  approvedApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{app.business_name}</h3>
                          <p className="text-sm text-gray-600">{app.user_email}</p>
                          {app.approved_at && (
                            <p className="text-xs text-gray-500 mt-1">Approved on {formatDate(app.approved_at)}</p>
                          )}
                        </div>
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Rejected Applications Tab */}
            {activeTab === 'rejected' && (
              <div className="space-y-4">
                {rejectedApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No rejected applications</p>
                  </div>
                ) : (
                  rejectedApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{app.business_name}</h3>
                          <p className="text-sm text-gray-600">{app.user_email}</p>
                          {app.rejected_at && (
                            <p className="text-xs text-gray-500 mt-1">Rejected on {formatDate(app.rejected_at)}</p>
                          )}
                        </div>
                        <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                          Rejected
                        </span>
                      </div>
                      {app.rejection_reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{app.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Active Promoters Tab */}
            {activeTab === 'active' && (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredActivePromoters.length === 0 ? (
                  <div className="col-span-2 text-center py-12">
                    <p className="text-gray-600">No active promoters</p>
                  </div>
                ) : (
                  filteredActivePromoters.map((promoter) => (
                    <div key={promoter.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">{promoter.business_name || 'Unknown Business'}</h3>
                          <p className="text-sm text-gray-600">{promoter.user_email}</p>
                          {promoter.last_sale_at && (
                            <p className="text-xs text-gray-500 mt-1">Last sale: {formatDate(promoter.last_sale_at)}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeactivate(promoter.id, promoter.business_name)}
                          disabled={actionLoading === promoter.id}
                          className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{promoter.total_tickets_sold || 0}</p>
                          <p className="text-xs text-gray-600">Tickets Sold</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{promoter.active_codes || 0}</p>
                          <p className="text-xs text-gray-600">Active Codes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">{formatCurrency(promoter.total_commission_earned || 0)}</p>
                          <p className="text-xs text-gray-600">Commission</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Application Modal */}
        {selectedApplication && !showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Business Name</label>
                    <p className="mt-1">{selectedApplication.business_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <p className="mt-1">{selectedApplication.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Phone</label>
                    <p className="mt-1">{selectedApplication.phone_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Audience Size</label>
                    <p className="mt-1">{selectedApplication.audience_size || 'N/A'}</p>
                  </div>
                </div>

                {selectedApplication.social_media_links && Object.keys(selectedApplication.social_media_links).length > 0 && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Social Media</label>
                    <div className="space-y-2">
                      {Object.entries(selectedApplication.social_media_links).map(([platform, url]) => 
                        url && (
                          <div key={platform} className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 capitalize">{platform}</span>
                            <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                              {url as string}
                            </a>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedApplication.experience_description && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Experience</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.experience_description}</p>
                  </div>
                )}

                {selectedApplication.why_join && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Why Join</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.why_join}</p>
                  </div>
                )}

                {selectedApplication.sample_content && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Sample Content</label>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.sample_content}</p>
                  </div>
                )}

                {selectedApplication.status === 'pending' && (
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => handleApprove(selectedApplication.id, selectedApplication.business_name)}
                      disabled={actionLoading === selectedApplication.id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Application
                    </button>
                    <button
                      onClick={() => openRejectModal(selectedApplication)}
                      disabled={actionLoading === selectedApplication.id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Application
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Reject Application</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Provide a reason for rejecting {selectedApplication.business_name}'s application
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Insufficient social media presence, audience size too small, etc."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectionReason.length}/10 characters minimum
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeRejectModal}
                    disabled={actionLoading === selectedApplication.id}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading === selectedApplication.id || rejectionReason.length < 10}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {actionLoading === selectedApplication.id ? 'Rejecting...' : 'Confirm Rejection'}
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

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
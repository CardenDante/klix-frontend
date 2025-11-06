'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Shield, TrendingUp, Users, AlertCircle, CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface PendingStats {
  pending_organizers: number;
  pending_promoters: number;
  total_organizers: number;
  total_promoters: number;
  loading: boolean;
  error: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PendingStats>({
    pending_organizers: 0,
    pending_promoters: 0,
    total_organizers: 0,
    total_promoters: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchPendingStats();
  }, []);

  const fetchPendingStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch promoter stats
      const promoterStatsPromise = api.admin.promoters.stats().catch(() => ({ data: null }));

      // Fetch organizers list
      const organizersPromise = api.admin.organizers.list({}).catch(() => ({ data: [] }));

      const [promoterStatsRes, organizersRes] = await Promise.all([
        promoterStatsPromise,
        organizersPromise
      ]);

      // Extract promoter stats
      const promoterStats = promoterStatsRes.data;
      const pending_promoters = promoterStats?.pending_applications || 0;
      const total_promoters = promoterStats?.total_promoters || 0;

      // Extract organizer stats
      const organizersData = Array.isArray(organizersRes.data)
        ? organizersRes.data
        : organizersRes.data?.items || organizersRes.data?.organizers || [];

      const pending_organizers = organizersData.filter((org: any) =>
        String(org.status).toUpperCase() === 'PENDING'
      ).length;

      setStats({
        pending_organizers,
        pending_promoters,
        total_organizers: organizersData.length,
        total_promoters,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error fetching pending stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.detail || error.message || 'Failed to load pending approvals'
      }));
    }
  };

  const totalPending = stats.pending_organizers + stats.pending_promoters;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage pending approvals and platform administration</p>
        </div>

        {/* Error Alert */}
        {stats.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error loading pending approvals</p>
              <p className="text-red-700 text-sm mt-1">{stats.error}</p>
            </div>
            <button
              onClick={fetchPendingStats}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {stats.loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending approvals...</p>
          </div>
        )}

        {/* Pending Approvals Alert */}
        {!stats.loading && totalPending > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <p className="text-yellow-900 font-bold text-lg">
                  {totalPending} Pending Approval{totalPending !== 1 ? 's' : ''}
                </p>
                <p className="text-yellow-800 text-sm">
                  {stats.pending_organizers} organizer{stats.pending_organizers !== 1 ? 's' : ''} and {stats.pending_promoters} promoter{stats.pending_promoters !== 1 ? 's' : ''} awaiting review
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Pending Approvals */}
        {!stats.loading && totalPending === 0 && !stats.error && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-green-900 font-bold">All Clear!</p>
                <p className="text-green-800 text-sm">No pending approvals at this time</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Cards */}
        {!stats.loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pending Organizers Card */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Organizer Approvals</h3>
                      <p className="text-sm text-gray-600">Review organizer applications</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_organizers}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.total_organizers}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/admin/organizers')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <span>Manage Organizers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pending Promoters Card */}
            <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Promoter Approvals</h3>
                      <p className="text-sm text-gray-600">Review promoter applications</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.pending_promoters}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{stats.total_promoters}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/admin/promoters')}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <span>Manage Promoters</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other Admin Actions */}
        {!stats.loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Other Admin Actions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <Users className="w-6 h-6 text-gray-600 mb-2" />
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">View and manage all users</p>
              </button>

              <button
                onClick={() => router.push('/admin/analytics')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <TrendingUp className="w-6 h-6 text-gray-600 mb-2" />
                <p className="font-medium text-gray-900">Analytics</p>
                <p className="text-sm text-gray-600">Platform analytics and insights</p>
              </button>

              <button
                onClick={() => router.push('/admin/settings')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
              >
                <Shield className="w-6 h-6 text-gray-600 mb-2" />
                <p className="font-medium text-gray-900">Settings</p>
                <p className="text-sm text-gray-600">Platform configuration</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
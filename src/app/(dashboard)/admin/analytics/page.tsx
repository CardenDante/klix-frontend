'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';

// ==================== TYPES ====================

interface AdminOverview {
  total_users: number;
  total_events: number;
  total_revenue: number;
  total_tickets_sold: number;
  active_organizers: number;
  pending_organizers: number;
  active_promoters: number;
}

interface AdminSummary {
  users: {
    total: number;
    active: number;
    verified: number;
    growth_rate: number;
  };
  events: {
    total: number;
    published: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
    growth_rate: number;
  };
  tickets: {
    total_sold: number;
    this_month: number;
    last_month: number;
    growth_rate: number;
  };
}

interface UserGrowthData {
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  platform_fees: number;
  net_revenue: number;
  transactions: number;
}

interface TopOrganizer {
  organizer_id: string;
  business_name: string;
  total_events: number;
  total_revenue: number;
  tickets_sold: number;
  average_rating?: number;
}

interface TopEvent {
  event_id: string;
  event_name: string;
  event_slug: string;
  organizer_name: string;
  tickets_sold: number;
  revenue: number;
  start_datetime: string;
  category: string;
}

interface CategoryStats {
  category: string;
  event_count: number;
  tickets_sold: number;
  revenue: number;
  percentage_of_total: number;
}

interface SystemHealth {
  database_status: 'healthy' | 'degraded' | 'down';
  cache_status: 'healthy' | 'degraded' | 'down';
  api_response_time_ms: number;
  error_rate_percentage: number;
  uptime_percentage: number;
  last_checked: string;
}

// ==================== COMPONENT ====================

export default function AdminAnalytics() {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [topOrganizers, setTopOrganizers] = useState<TopOrganizer[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'events'>('overview');

  // ==================== DATA FETCHING ====================

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [
        overviewRes,
        summaryRes,
        userGrowthRes,
        revenueRes,
        topOrganizersRes,
        topEventsRes,
        categoriesRes,
        systemHealthRes,
      ] = await Promise.allSettled([
        api.admin.analytics.overview(),
        api.admin.analytics.summary(),
        api.admin.analytics.userGrowth(),
        api.admin.analytics.revenue(),
        api.admin.analytics.topOrganizers({ limit: 10 }),
        api.admin.analytics.topEvents({ limit: 10 }),
        api.admin.analytics.categories(),
        api.admin.analytics.systemHealth(),
      ]);

      // Handle overview
      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value.data);
      }

      // Handle summary
      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data);
      }

      // Handle user growth
      if (userGrowthRes.status === 'fulfilled') {
        setUserGrowth(userGrowthRes.value.data);
      }

      // Handle revenue
      if (revenueRes.status === 'fulfilled') {
        setRevenue(revenueRes.value.data);
      }

      // Handle top organizers
      if (topOrganizersRes.status === 'fulfilled') {
        setTopOrganizers(topOrganizersRes.value.data);
      }

      // Handle top events
      if (topEventsRes.status === 'fulfilled') {
        setTopEvents(topEventsRes.value.data);
      }

      // Handle categories
      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.data);
      }

      // Handle system health
      if (systemHealthRes.status === 'fulfilled') {
        setSystemHealth(systemHealthRes.value.data);
      }

    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError.message || 'Failed to load analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const clearCache = async () => {
    try {
      await api.admin.analytics.clearCache();
      alert('Cache cleared successfully!');
      await fetchAllData();
    } catch (err) {
      console.error('Error clearing cache:', err);
      alert('Failed to clear cache');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ==================== UTILITY FUNCTIONS ====================

  const formatNumber = (num: number | undefined | null): string => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === null || amount === undefined) return 'KSh 0';
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number | undefined | null): string => {
    if (value === null || value === undefined) return '0%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getHealthColor = (status: string | undefined): string => {
    if (!status) return 'text-gray-500';
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getHealthBg = (status: string | undefined): string => {
    if (!status) return 'bg-gray-50';
    switch (status) {
      case 'healthy': return 'bg-green-50';
      case 'degraded': return 'bg-yellow-50';
      case 'down': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  // ==================== RENDER ====================

  if (loading && !overview && !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !overview && !summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-center mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={fetchAllData}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
            <p className="text-gray-600 mt-1">Platform performance and insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearCache}
              disabled={refreshing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Clear Cache
            </button>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* System Health Banner */}
        {systemHealth && (
          <div className={`rounded-lg p-4 ${getHealthBg(systemHealth.database_status)}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${systemHealth.database_status === 'healthy' ? 'bg-green-500' : systemHealth.database_status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className={`font-semibold ${getHealthColor(systemHealth.database_status)}`}>
                  System Status: {systemHealth.database_status === 'healthy' ? 'Healthy' : systemHealth.database_status === 'degraded' ? 'Degraded Performance' : 'Down'}
                </span>
              </div>
              <div className="flex gap-6 text-sm">
                <span>Response: {systemHealth.api_response_time_ms}ms</span>
                <span>Error Rate: {systemHealth.error_rate_percentage?.toFixed(2) ?? 0}%</span>
                <span>Uptime: {systemHealth.uptime_percentage?.toFixed(2) ?? 0}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {['overview', 'users', 'revenue', 'events'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Quick Stats Cards */}
              {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{formatNumber(overview.total_users ?? 0)}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Events</p>
                        <p className="text-3xl font-bold text-gray-900">{formatNumber(overview.total_events ?? 0)}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(overview.total_revenue ?? 0)}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                        <p className="text-3xl font-bold text-gray-900">{formatNumber(overview.total_tickets_sold ?? 0)}</p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Organizers & Promoters */}
              {overview && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizers</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold text-lg">{formatNumber(overview.active_organizers ?? 0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Pending Approval</span>
                        <span className="font-semibold text-lg text-orange-600">{formatNumber(overview.pending_organizers ?? 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Promoters</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold text-lg">{formatNumber(overview.active_promoters ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Total Users</h3>
                  <p className="text-4xl font-bold text-blue-600 mb-2">{formatNumber(summary.users?.total ?? 0)}</p>
                  <p className="text-sm text-gray-600">
                    Growth: <span className={(summary.users?.growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(summary.users?.growth_rate ?? 0)}
                    </span>
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Active Users</h3>
                  <p className="text-4xl font-bold text-green-600 mb-2">{formatNumber(summary.users?.active ?? 0)}</p>
                  <p className="text-sm text-gray-600">Currently active</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Verified Users</h3>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{formatNumber(summary.users?.verified ?? 0)}</p>
                  <p className="text-sm text-gray-600">Email verified</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Verification Rate</h3>
                  <p className="text-4xl font-bold text-indigo-600 mb-2">
                    {summary.users?.total ? ((summary.users.verified / summary.users.total) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Of all users</p>
                </div>
              </div>

              {/* User Growth Chart Data Table */}
              {userGrowth.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">User Growth Over Time</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Users</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">New Users</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Active Users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userGrowth.map((data, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{formatDate(data.date)}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold">{formatNumber(data.total_users)}</td>
                            <td className="py-3 px-4 text-sm text-right text-green-600">{formatNumber(data.new_users)}</td>
                            <td className="py-3 px-4 text-sm text-right text-blue-600">{formatNumber(data.active_users)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Total Revenue</h3>
                  <p className="text-4xl font-bold text-green-600 mb-2">{formatCurrency(summary.revenue?.total ?? 0)}</p>
                  <p className="text-sm text-gray-600">
                    Growth: <span className={(summary.revenue?.growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(summary.revenue?.growth_rate ?? 0)}
                    </span>
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">This Month</h3>
                  <p className="text-4xl font-bold text-blue-600 mb-2">{formatCurrency(summary.revenue?.this_month ?? 0)}</p>
                  <p className="text-sm text-gray-600">Current month revenue</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Last Month</h3>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{formatCurrency(summary.revenue?.last_month ?? 0)}</p>
                  <p className="text-sm text-gray-600">Previous month</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Tickets Sold</h3>
                  <p className="text-4xl font-bold text-yellow-600 mb-2">{formatNumber(summary.tickets?.total_sold ?? 0)}</p>
                  <p className="text-sm text-gray-600">
                    Growth: <span className={(summary.tickets?.growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercentage(summary.tickets?.growth_rate ?? 0)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Revenue Table */}
              {revenue.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Revenue Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Platform Fees</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenue.map((data, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm">{formatDate(data.date)}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold">{formatCurrency(data.revenue)}</td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600">{formatCurrency(data.platform_fees)}</td>
                            <td className="py-3 px-4 text-sm text-right text-green-600">{formatCurrency(data.net_revenue)}</td>
                            <td className="py-3 px-4 text-sm text-right">{formatNumber(data.transactions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Organizers */}
              {topOrganizers.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Top Organizers by Revenue</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organizer</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Events</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tickets Sold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topOrganizers.map((organizer, index) => (
                          <tr key={organizer.organizer_id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium">{organizer.business_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-right">{formatNumber(organizer.total_events)}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(organizer.total_revenue)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">{formatNumber(organizer.tickets_sold)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Total Events</h3>
                  <p className="text-4xl font-bold text-purple-600 mb-2">{formatNumber(summary.events?.total ?? 0)}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Published</h3>
                  <p className="text-4xl font-bold text-green-600 mb-2">{formatNumber(summary.events?.published ?? 0)}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Completed</h3>
                  <p className="text-4xl font-bold text-blue-600 mb-2">{formatNumber(summary.events?.completed ?? 0)}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Cancelled</h3>
                  <p className="text-4xl font-bold text-red-600 mb-2">{formatNumber(summary.events?.cancelled ?? 0)}</p>
                </div>
              </div>

              {/* Top Events */}
              {topEvents.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Top Events by Revenue</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organizer</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tickets Sold</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topEvents.map((event, index) => (
                          <tr key={event.event_id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium">{event.event_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">{event.organizer_name}</td>
                            <td className="py-3 px-4 text-sm">{formatDate(event.start_datetime)}</td>
                            <td className="py-3 px-4 text-sm text-right">
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.category}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right">{formatNumber(event.tickets_sold)}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                              {formatCurrency(event.revenue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Category Statistics */}
              {categories.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-gray-900 font-semibold mb-4">Performance by Category</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Events</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tickets Sold</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category) => (
                          <tr key={category.category} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="text-sm font-medium capitalize">{category.category.replace('_', ' ')}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-right">{formatNumber(category.event_count)}</td>
                            <td className="py-3 px-4 text-sm text-right">{formatNumber(category.tickets_sold)}</td>
                            <td className="py-3 px-4 text-sm text-right font-semibold">
                              {formatCurrency(category.revenue)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${category.percentage_of_total}%` }}
                                  ></div>
                                </div>
                                <span>{category.percentage_of_total.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
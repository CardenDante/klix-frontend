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
      setError(
        axiosError.response?.data?.message || 
        axiosError.message || 
        'Failed to load analytics data'
      );
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleClearCache = async () => {
    try {
      await api.admin.analytics.clearCache();
      alert('Cache cleared successfully');
      await handleRefresh();
    } catch (err) {
      const axiosError = err as AxiosError;
      alert(axiosError.response?.data?.message || 'Failed to clear cache');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ==================== HELPER FUNCTIONS ====================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-900 font-semibold">Error Loading Analytics</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
            <p className="text-gray-600 mt-1">Platform performance and insights</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClearCache}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear Cache
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* System Health Banner */}
        {systemHealth && (
          <div className={`rounded-lg p-4 ${
            systemHealth.database_status === 'healthy' && systemHealth.cache_status === 'healthy'
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  systemHealth.database_status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
                } animate-pulse`}></div>
                <span className="font-medium">
                  System Status: {systemHealth.database_status === 'healthy' ? 'All Systems Operational' : 'Degraded Performance'}
                </span>
              </div>
              <div className="flex gap-6 text-sm">
                <span>Response: {systemHealth.api_response_time_ms ?? 0}ms</span>
                <span>Error Rate: {(systemHealth.error_rate_percentage ?? 0).toFixed(2)}%</span>
                <span>Uptime: {(systemHealth.uptime_percentage ?? 0).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'users', label: 'Users' },
              { id: 'revenue', label: 'Revenue' },
              { id: 'events', label: 'Events' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(overview.total_users)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Events</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(overview.total_events)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(overview.total_revenue)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Tickets Sold</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(overview.total_tickets_sold)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Organizers</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold">{formatNumber(overview.active_organizers)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Approval</span>
                    <span className="font-semibold text-yellow-600">{formatNumber(overview.pending_organizers)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Promoters</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold">{formatNumber(overview.active_promoters)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Total Users</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">{formatNumber(summary.users.total)}</p>
                <p className="text-sm text-gray-600">
                  Growth: <span className={(summary.users.growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(summary.users.growth_rate ?? 0)}
                  </span>
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Active Users</h3>
                <p className="text-4xl font-bold text-green-600 mb-2">{formatNumber(summary.users.active)}</p>
                <p className="text-sm text-gray-600">
                  {((summary.users.active / summary.users.total) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Verified Users</h3>
                <p className="text-4xl font-bold text-purple-600 mb-2">{formatNumber(summary.users.verified)}</p>
                <p className="text-sm text-gray-600">
                  {((summary.users.verified / summary.users.total) * 100).toFixed(1)}% verified
                </p>
              </div>
            </div>

            {/* User Growth Chart */}
            {userGrowth.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">User Growth Trend</h3>
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
                          <td className="py-3 px-4 text-sm text-right">{formatNumber(data.total_users)}</td>
                          <td className="py-3 px-4 text-sm text-right text-green-600">+{formatNumber(data.new_users)}</td>
                          <td className="py-3 px-4 text-sm text-right">{formatNumber(data.active_users)}</td>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Total Revenue</h3>
                <p className="text-4xl font-bold text-green-600 mb-2">{formatCurrency(summary.revenue.total)}</p>
                <p className="text-sm text-gray-600">
                  Growth: <span className={(summary.revenue.growth_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatPercentage(summary.revenue.growth_rate ?? 0)}
                  </span>
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">This Month</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">{formatCurrency(summary.revenue.this_month)}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Last Month</h3>
                <p className="text-4xl font-bold text-gray-600 mb-2">{formatCurrency(summary.revenue.last_month)}</p>
              </div>
            </div>

            {/* Revenue Chart */}
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
                <p className="text-4xl font-bold text-purple-600 mb-2">{formatNumber(summary.events.total)}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Published</h3>
                <p className="text-4xl font-bold text-green-600 mb-2">{formatNumber(summary.events.published)}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Completed</h3>
                <p className="text-4xl font-bold text-blue-600 mb-2">{formatNumber(summary.events.completed)}</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-900 font-semibold mb-4">Cancelled</h3>
                <p className="text-4xl font-bold text-red-600 mb-2">{formatNumber(summary.events.cancelled)}</p>
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
  );
}
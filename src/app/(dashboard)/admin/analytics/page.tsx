'use client';

import { useState, useEffect } from 'react';
import  apiClient  from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, Users, DollarSign, Calendar, Activity,
  Server, Database, Zap, Award, BarChart
} from 'lucide-react';

interface PlatformSummary {
  overview: {
    total_users: number;
    total_events: number;
    total_platform_revenue: number;
    total_platform_fees_collected: number;
  };
  user_growth: {
    new_users_today: number;
    new_users_this_week: number;
    new_users_this_month: number;
    active_users_30d: number;
  };
  revenue_metrics: {
    revenue_today: number;
    revenue_this_week: number;
    revenue_this_month: number;
    revenue_this_year: number;
    average_daily_revenue: number;
  };
  top_organizers: Array<{
    business_name: string;
    total_revenue: number;
    total_events: number;
  }>;
  top_events: Array<{
    title: string;
    tickets_sold: number;
    revenue: number;
  }>;
  category_performance: Array<{
    category: string;
    total_events: number;
    total_tickets_sold: number;
    total_revenue: number;
  }>;
  system_health: {
    total_database_records: number;
    redis_connected: boolean;
    tickets_sold_24h: number;
    transaction_success_rate: number;
  };
}

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'revenue' | 'health'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get('/analytics/admin/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return <div className="text-center py-12 text-gray-600">Failed to load analytics</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Platform Analytics
        </h1>
        <p className="text-gray-600 mt-1">Comprehensive platform insights and metrics</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'health', label: 'System Health', icon: Activity }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold">{summary.overview.total_users.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold">{summary.overview.total_events.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Platform Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(summary.overview.total_platform_revenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Platform Fees</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(summary.overview.total_platform_fees_collected)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Organizers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.top_organizers.slice(0, 5).map((org, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#EB7D30] text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{org.business_name}</p>
                          <p className="text-sm text-gray-600">{org.total_events} events</p>
                        </div>
                      </div>
                      <p className="font-bold text-[#EB7D30]">{formatCurrency(org.total_revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Top Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.top_events.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.tickets_sold} tickets sold</p>
                      </div>
                      <p className="font-bold">{formatCurrency(event.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.category_performance.slice(0, 6).map((cat, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-semibold capitalize mb-2">{cat.category}</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{cat.total_events} events</p>
                      <p className="text-gray-600">{cat.total_tickets_sold} tickets</p>
                      <p className="font-bold text-[#EB7D30]">{formatCurrency(cat.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">New Today</p>
                  <p className="text-2xl font-bold">{summary.user_growth.new_users_today}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">New This Week</p>
                  <p className="text-2xl font-bold">{summary.user_growth.new_users_this_week}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold">{summary.user_growth.new_users_this_month}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Active (30d)</p>
                  <p className="text-2xl font-bold">{summary.user_growth.active_users_30d}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.revenue_metrics.revenue_today)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.revenue_metrics.revenue_this_week)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.revenue_metrics.revenue_this_month)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">This Year</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.revenue_metrics.revenue_this_year)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-200 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Daily Revenue</p>
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(summary.revenue_metrics.average_daily_revenue)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* System Health Tab */}
      {activeTab === 'health' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Database Records</p>
                    <p className="text-2xl font-bold">{summary.system_health.total_database_records.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Server className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Redis Status</p>
                    <Badge className={summary.system_health.redis_connected ? 'bg-green-600' : 'bg-red-600'}>
                      {summary.system_health.redis_connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tickets (24h)</p>
                    <p className="text-2xl font-bold">{summary.system_health.tickets_sold_24h}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{(summary.system_health.transaction_success_rate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-200 rounded-full">
                    <Activity className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">System Status: Operational</h4>
                    <p className="text-sm text-gray-600">All services running normally</p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-lg px-4 py-2">Healthy</Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
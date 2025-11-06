'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Activity,
  AlertCircle,
  Building,
  Tag,
  Award,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsOverview {
  total_users: number;
  total_organizers: number;
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  platform_earnings: number;
  user_growth_rate?: number;
  revenue_growth_rate?: number;
}

interface UserGrowth {
  date: string;
  new_users: number;
  total_users: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  platform_earnings: number;
  organizer_earnings: number;
}

interface TopOrganizer {
  organizer_id: string;
  business_name: string;
  total_revenue: number;
  total_events: number;
  total_tickets_sold: number;
  platform_earnings: number;
}

interface TopEvent {
  event_id: string;
  title: string;
  category: string;
  tickets_sold: number;
  revenue: number;
  organizer_name: string;
}

interface CategoryStats {
  category: string;
  event_count: number;
  tickets_sold: number;
  revenue: number;
}

interface SystemHealth {
  status: string;
  api_response_time: number;
  database_status: string;
  cache_hit_rate: number;
  active_users_24h: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [topOrganizers, setTopOrganizers] = useState<TopOrganizer[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchUserGrowth(),
        fetchRevenue(),
        fetchTopOrganizers(),
        fetchTopEvents(),
        fetchCategories(),
        fetchSystemHealth(),
      ]);
    } catch (err: any) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await api.admin.analytics.overview();
      setOverview(response.data);
    } catch (err: any) {
      console.error('Failed to fetch overview:', err);
    }
  };

  const fetchUserGrowth = async () => {
    try {
      const response = await api.admin.analytics.userGrowth();
      const data = Array.isArray(response.data) ? response.data : [];
      setUserGrowth(data);
    } catch (err: any) {
      console.error('Failed to fetch user growth:', err);
      setUserGrowth([]);
    }
  };

  const fetchRevenue = async () => {
    try {
      const response = await api.admin.analytics.revenue();
      const data = Array.isArray(response.data) ? response.data : [];
      setRevenue(data);
    } catch (err: any) {
      console.error('Failed to fetch revenue:', err);
      setRevenue([]);
    }
  };

  const fetchTopOrganizers = async () => {
    try {
      const response = await api.admin.analytics.topOrganizers({ limit: 10 });
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('📊 [TOP ORGANIZERS]', data);
      setTopOrganizers(data);
    } catch (err: any) {
      console.error('Failed to fetch top organizers:', err);
      setTopOrganizers([]);
    }
  };

  const fetchTopEvents = async () => {
    try {
      const response = await api.admin.analytics.topEvents({ limit: 10 });
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('📊 [TOP EVENTS]', data);
      setTopEvents(data);
    } catch (err: any) {
      console.error('Failed to fetch top events:', err);
      setTopEvents([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.admin.analytics.categories();
      const data = Array.isArray(response.data) ? response.data : [];
      console.log('📊 [CATEGORIES]', data);
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await api.admin.analytics.systemHealth();
      setSystemHealth(response.data);
    } catch (err: any) {
      console.error('Failed to fetch system health:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">
            Platform performance metrics and insights
          </p>
        </div>
        <Button onClick={fetchAllAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overview?.total_users || 0)}
            </div>
            {overview?.user_growth_rate !== undefined && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${
                overview.user_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {overview.user_growth_rate >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercentage(overview.user_growth_rate)} from last period
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.total_revenue || 0)}
            </div>
            {overview?.revenue_growth_rate !== undefined && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${
                overview.revenue_growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {overview.revenue_growth_rate >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercentage(overview.revenue_growth_rate)} from last period
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(overview?.platform_earnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {formatNumber(overview?.total_tickets_sold || 0)} tickets sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(overview?.total_events || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              By {formatNumber(overview?.total_organizers || 0)} organizers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="organizers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizers">Top Organizers</TabsTrigger>
          <TabsTrigger value="events">Top Events</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        {/* Top Organizers */}
        <TabsContent value="organizers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Organizers</CardTitle>
              <CardDescription>Organizers with highest revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topOrganizers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topOrganizers.map((org, index) => (
                    <div key={org.organizer_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            {org.business_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(org.total_events)} events • {formatNumber(org.total_tickets_sold)} tickets sold
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(org.total_revenue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Platform: {formatCurrency(org.platform_earnings)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Events */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Events</CardTitle>
              <CardDescription>Events with highest ticket sales</CardDescription>
            </CardHeader>
            <CardContent>
              {topEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topEvents.map((event, index) => (
                    <div key={event.event_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{event.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="secondary">{event.category}</Badge>
                            <span>by {event.organizer_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatNumber(event.tickets_sold)} tickets
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(event.revenue)} revenue
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Event categories by popularity and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((cat, index) => (
                    <div key={cat.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Tag className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{cat.category}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(cat.event_count)} events
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(cat.revenue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(cat.tickets_sold)} tickets
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance and status</CardDescription>
            </CardHeader>
            <CardContent>
              {!systemHealth ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">System Status</span>
                        <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'}>
                          {systemHealth.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          systemHealth.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <span className="text-sm text-muted-foreground">
                          {systemHealth.status === 'healthy' ? 'All systems operational' : 'Issues detected'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium mb-2">API Response Time</div>
                      <div className="text-2xl font-bold">
                        {systemHealth.api_response_time}ms
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Average response time
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Database Status</div>
                      <Badge variant={systemHealth.database_status === 'connected' ? 'default' : 'destructive'}>
                        {systemHealth.database_status}
                      </Badge>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Cache Hit Rate</div>
                      <div className="text-2xl font-bold">
                        {(systemHealth.cache_hit_rate * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Performance optimization
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg md:col-span-2">
                      <div className="text-sm font-medium mb-2">Active Users (24h)</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(systemHealth.active_users_24h)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Users active in the last 24 hours
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, DollarSign, Ticket, Calendar, Users, 
  Award, BarChart3, Activity, Download, RefreshCw, ArrowUpRight,
  ArrowDownRight, Target, Clock, MapPin, Star
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  overview: {
    total_revenue: number;
    total_tickets_sold: number;
    total_events: number;
    active_events: number;
    average_ticket_price: number;
    revenue_growth: number;
    ticket_growth: number;
  };
  revenue_trend: Array<{
    date: string;
    revenue: number;
    tickets: number;
  }>;
  event_performance: Array<{
    event_id: string;
    event_name: string;
    tickets_sold: number;
    revenue: number;
    capacity: number;
    capacity_used: number;
    status: string;
  }>;
  category_breakdown: Array<{
    category: string;
    events: number;
    tickets: number;
    revenue: number;
  }>;
  top_promoters: Array<{
    promoter_name: string;
    tickets_sold: number;
    revenue_generated: number;
    commission_owed: number;
  }>;
  ticket_types_performance: Array<{
    ticket_type: string;
    sold: number;
    revenue: number;
  }>;
}

export default function OrganizerAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/analytics/organizer/dashboard', {
        params: { time_range: timeRange }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await apiClient.post('/api/v1/analytics/organizer/cache/clear');
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const exportData = () => {
    // Convert analytics to CSV
    const csv = generateCSV(analytics);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const generateCSV = (data: any) => {
    // Simple CSV generation
    return 'Event,Tickets,Revenue\n' + 
      (data?.event_performance || []).map((e: any) => 
        `"${e.event_name}",${e.tickets_sold},${e.revenue}`
      ).join('\n');
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const GrowthIndicator = ({ value }: { value: number }) => {
    if (!value) return null;
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span className="font-semibold">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-body">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#EB7D30', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1 font-body">Comprehensive insights into your event performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {[
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
          { value: '90d', label: 'Last 90 Days' },
          { value: 'all', label: 'All Time' }
        ].map((range) => (
          <Button
            key={range.value}
            variant={timeRange === range.value ? 'default' : 'outline'}
            onClick={() => setTimeRange(range.value as any)}
            size="sm"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-body">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-comfortaa">
                  {formatCurrency(analytics.overview.total_revenue)}
                </p>
                <GrowthIndicator value={analytics.overview.revenue_growth} />
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-body">Tickets Sold</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-comfortaa">
                  {analytics.overview.total_tickets_sold.toLocaleString()}
                </p>
                <GrowthIndicator value={analytics.overview.ticket_growth} />
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-body">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-comfortaa">
                  {analytics.overview.total_events}
                </p>
                <p className="text-sm text-gray-500 mt-1 font-body">
                  {analytics.overview.active_events} active
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-body">Avg Ticket Price</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 font-comfortaa">
                  {formatCurrency(analytics.overview.average_ticket_price)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="promoters">Promoters</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-comfortaa">Revenue & Ticket Sales Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenue_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Revenue (KSh)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Tickets Sold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-comfortaa">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.category_breakdown}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analytics.category_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-comfortaa">Ticket Types Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.ticket_types_performance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ticket_type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sold" fill="#EB7D30" name="Sold" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-comfortaa">Event Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.event_performance.map((event, index) => (
                  <div 
                    key={event.event_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition cursor-pointer"
                    onClick={() => router.push(`/organizer/events/${event.event_id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg font-comfortaa">{event.event_name}</h4>
                        <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-4 h-4" />
                          {event.tickets_sold} / {event.capacity} tickets
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          {event.capacity_used.toFixed(1)}% capacity
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary font-comfortaa">
                        {formatCurrency(event.revenue)}
                      </p>
                      <p className="text-sm text-gray-500 font-body">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promoters Tab */}
        <TabsContent value="promoters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-comfortaa">Top Promoters</CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push('/organizer/promoters')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.top_promoters.map((promoter, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold font-comfortaa">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold font-comfortaa">{promoter.promoter_name}</h4>
                      <p className="text-sm text-gray-600 font-body">
                        {promoter.tickets_sold} tickets • {formatCurrency(promoter.revenue_generated)} revenue
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600 font-comfortaa">
                        {formatCurrency(promoter.commission_owed)}
                      </p>
                      <p className="text-xs text-gray-500 font-body">Commission owed</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-200 rounded-full">
                    <TrendingUp className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 font-comfortaa">Peak Performance</h4>
                    <p className="text-sm text-gray-700 font-body">
                      Your best-selling event generated {formatCurrency(Math.max(...analytics.event_performance.map(e => e.revenue)))} in revenue.
                      Keep creating similar events!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-200 rounded-full">
                    <Users className="w-6 h-6 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 font-comfortaa">Audience Growth</h4>
                    <p className="text-sm text-gray-700 font-body">
                      You've sold {analytics.overview.total_tickets_sold} tickets total. 
                      {analytics.overview.ticket_growth > 0 ? ` Up ${analytics.overview.ticket_growth.toFixed(1)}% from last period!` : ' Keep promoting to increase sales!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-200 rounded-full">
                    <Star className="w-6 h-6 text-orange-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 font-comfortaa">Top Category</h4>
                    <p className="text-sm text-gray-700 font-body">
                      {analytics.category_breakdown[0]?.category} events are performing best with {formatCurrency(analytics.category_breakdown[0]?.revenue)} in revenue.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-200 rounded-full">
                    <Award className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2 font-comfortaa">Promoter Network</h4>
                    <p className="text-sm text-gray-700 font-body">
                      {analytics.top_promoters.length} promoters are helping sell your tickets. 
                      Engage with them for better results!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
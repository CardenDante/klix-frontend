'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, TrendingUp, Users, DollarSign, Ticket, 
  CheckCircle, Target, Calendar, Award 
} from 'lucide-react';

interface EventAnalytics {
  event_name: string;
  event_date: string;
  total_revenue: number;
  platform_fees: number;
  net_revenue: number;
  tickets_sold: number;
  total_capacity: number;
  capacity_utilization: number;
  average_ticket_price: number;
  sales_by_type: {
    ticket_type_name: string;
    tickets_sold: number;
    revenue: number;
    percentage_of_total: number;
  }[];
  daily_sales: {
    date: string;
    tickets_sold: number;
    revenue: number;
    cumulative_tickets: number;
    cumulative_revenue: number;
  }[];
  top_promoters: {
    promoter_code: string;
    promoter_name: string | null;
    tickets_sold: number;
    revenue_generated: number;
    total_commission_earned: number;
  }[];
  checkin_stats: {
    total_tickets: number;
    checked_in: number;
    check_in_rate: number;
  };
  projected_revenue: number | null;
  days_until_event: number | null;
}

interface SalesVelocity {
  average_daily_sales: number;
  sales_last_7_days: number;
  sales_last_24_hours: number;
  projected_final_sales: number | null;
  is_trending_to_sellout: boolean;
  projected_sellout_date: string | null;
}

export default function EventAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [velocity, setVelocity] = useState<SalesVelocity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    fetchVelocity();
  }, [eventId]);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get(`/analytics/organizer/events/${eventId}/stats`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVelocity = async () => {
    try {
      const response = await apiClient.get(`/analytics/organizer/events/${eventId}/velocity`);
      setVelocity(response.data);
    } catch (err) {
      console.error('Failed to load velocity:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

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

  if (!analytics) {
    return <div className="text-center py-12 text-gray-600">No analytics available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
              {analytics.event_name}
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date(analytics.event_date).toLocaleDateString()} • Analytics Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.total_revenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Net: {formatCurrency(analytics.net_revenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.tickets_sold}</p>
                <p className="text-xs text-gray-500 mt-1">of {analytics.total_capacity} capacity</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Capacity Filled</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.capacity_utilization.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-[#EB7D30] h-2 rounded-full"
                    style={{ width: `${analytics.capacity_utilization}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Check-in Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.checkin_stats.check_in_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.checkin_stats.checked_in} / {analytics.checkin_stats.total_tickets}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Velocity */}
      {velocity && analytics.days_until_event !== null && analytics.days_until_event > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Sales Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Avg Daily Sales</p>
                <p className="text-xl font-bold">{velocity.average_daily_sales.toFixed(1)} tickets</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last 7 Days</p>
                <p className="text-xl font-bold">{velocity.sales_last_7_days} tickets</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last 24 Hours</p>
                <p className="text-xl font-bold">{velocity.sales_last_24_hours} tickets</p>
              </div>
              {velocity.projected_final_sales && (
                <div>
                  <p className="text-sm text-gray-600">Projected Final</p>
                  <p className="text-xl font-bold">{velocity.projected_final_sales} tickets</p>
                  {velocity.is_trending_to_sellout && (
                    <Badge className="mt-1 bg-green-500">Trending to sellout!</Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ticket Sales by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Ticket Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.sales_by_type.map((type, index) => (
              <div key={index} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div className="flex-1">
                  <h4 className="font-semibold">{type.ticket_type_name}</h4>
                  <p className="text-sm text-gray-600">{type.tickets_sold} tickets sold</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(type.revenue)}</p>
                  <p className="text-sm text-gray-600">{type.percentage_of_total.toFixed(1)}% of total</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Promoters */}
      {analytics.top_promoters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Promoters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.top_promoters.map((promoter, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#EB7D30] text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{promoter.promoter_name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">Code: {promoter.promoter_code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{promoter.tickets_sold} tickets</p>
                    <p className="text-sm text-gray-600">{formatCurrency(promoter.revenue_generated)}</p>
                    <p className="text-xs text-[#EB7D30]">
                      Commission: {formatCurrency(promoter.total_commission_earned)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.daily_sales.slice(-10).map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-[#EB7D30] h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ 
                          width: `${(day.tickets_sold / Math.max(...analytics.daily_sales.map(d => d.tickets_sold))) * 100}%` 
                        }}
                      >
                        <span className="text-xs text-white font-semibold">{day.tickets_sold}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold w-24 text-right">{formatCurrency(day.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
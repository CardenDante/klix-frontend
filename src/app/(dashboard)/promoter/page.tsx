'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, TrendingUp, Ticket, Code, Award, 
  ArrowUpRight, ArrowDownRight, Users, Target 
} from 'lucide-react';

interface PromoterDashboard {
  promoter_name: string;
  total_codes: number;
  active_codes: number;
  total_uses: number;
  total_tickets_sold: number;
  total_revenue_generated: number;
  total_commission_earned: number;
  total_commission_pending: number;
  total_discounts_given: number;
  average_order_value: number;
  commission_this_month: number;
  commission_last_month: number;
  tickets_this_month: number;
  tickets_last_month: number;
  commission_growth_percentage: number | null;
  ticket_growth_percentage: number | null;
  top_events: Array<{
    event_name: string;
    event_slug: string;
    tickets_sold: number;
    revenue_generated: number;
    commission_earned: number;
  }>;
  active_codes_list: Array<{
    code: string;
    event_name: string;
    times_used: number;
    tickets_sold: number;
  }>;
}

export default function PromoterDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<PromoterDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.analytics.promoter.dashboard();
      setDashboard(response.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const GrowthIndicator = ({ value }: { value: number | null }) => {
    if (value === null || value === 0) return null;
    
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span className="font-medium">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return <div className="text-center py-12 text-gray-600">Failed to load dashboard</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
            Welcome back, {dashboard.promoter_name}! 👋
          </h1>
          <p className="text-gray-600 mt-1">Here's how your promotions are performing</p>
        </div>
        <Button onClick={() => router.push('/promoter/codes')}>
          <Code className="w-4 h-4 mr-2" />
          Create New Code
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard.total_commission_earned)}
                </p>
                <GrowthIndicator value={dashboard.commission_growth_percentage} />
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
              <div className="flex-1">
                <p className="text-sm text-gray-600">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboard.total_tickets_sold.toLocaleString()}
                </p>
                <GrowthIndicator value={dashboard.ticket_growth_percentage} />
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
              <div className="flex-1">
                <p className="text-sm text-gray-600">Active Codes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {dashboard.active_codes}
                </p>
                <p className="text-xs text-gray-500 mt-1">of {dashboard.total_codes} total</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Code className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(dashboard.average_order_value)}
                </p>
                <p className="text-xs text-gray-500 mt-1">per transaction</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Commission Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Available for Withdrawal</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(dashboard.total_commission_earned - dashboard.total_commission_pending)}
                </p>
              </div>
              <Button onClick={() => router.push('/promoter/earnings')}>
                Withdraw
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending (Upcoming Events)</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(dashboard.total_commission_pending)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-lg font-bold">{formatCurrency(dashboard.commission_this_month)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Month</p>
                <p className="text-lg font-bold">{formatCurrency(dashboard.commission_last_month)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold">{dashboard.total_uses.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Revenue Generated</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.total_revenue_generated)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Tickets This Month</p>
                <p className="text-2xl font-bold">{dashboard.tickets_this_month}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Discounts Given</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.total_discounts_given)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performing Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.top_events.length > 0 ? (
            <div className="space-y-3">
              {dashboard.top_events.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#EB7D30] text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{event.event_name}</h4>
                      <p className="text-sm text-gray-600">{event.tickets_sold} tickets sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#EB7D30]">{formatCurrency(event.commission_earned)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(event.revenue_generated)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No events yet. Start promoting to see your top performers!</p>
          )}
        </CardContent>
      </Card>

      {/* Active Codes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Your Active Codes
          </CardTitle>
          <Button variant="outline" onClick={() => router.push('/promoter/codes')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {dashboard.active_codes_list.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboard.active_codes_list.slice(0, 6).map((code, index) => (
                <div key={index} className="p-4 border rounded-lg hover:border-[#EB7D30] transition">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-[#EB7D30]">{code.code}</Badge>
                    <Badge variant="outline">{code.times_used} uses</Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{code.event_name}</p>
                  <p className="text-sm text-gray-600">{code.tickets_sold} tickets sold</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No active codes yet</p>
              <Button onClick={() => router.push('/promoter/codes')}>
                Create Your First Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-[#EB7D30] transition" onClick={() => router.push('/promoter/leaderboard')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold">View Leaderboard</h4>
                <p className="text-sm text-gray-600">See how you rank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-[#EB7D30] transition" onClick={() => router.push('/promoter/earnings')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold">Manage Earnings</h4>
                <p className="text-sm text-gray-600">Withdraw commission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-[#EB7D30] transition" onClick={() => router.push('/promoter/codes')}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold">My Codes</h4>
                <p className="text-sm text-gray-600">Manage promo codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
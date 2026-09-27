'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, TrendingUp, Ticket, Code, Award,
  ArrowUpRight, ArrowDownRight, Users, Target,
  Plus, Share2, Copy, CheckCircle, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    code_id: string;
    code: string;
    event_id: string;
    event_name: string;
    event_slug: string;
    times_used: number;
    tickets_sold: number;
  }>;
}

interface ApprovedEvent {
  id: string;
  event_id: string;
  commission_percentage: number | null;
  discount_percentage: number | null;
  status: string;
  approved_at: string;
  event?: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
  };
}

interface PromoterInsights {
  conversion_rate: number;
  average_order_value: number;
  best_performing_code: string | null;
  total_revenue_generated: number;
  commission_rate_avg: number;
  total_clicks: number;
  total_conversions: number;
}

export default function PromoterDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<PromoterDashboard | null>(null);
  const [insights, setInsights] = useState<PromoterInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [approvedEvents, setApprovedEvents] = useState<ApprovedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ApprovedEvent | null>(null);
  const [shareCode, setShareCode] = useState<{ code: string; event_slug: string } | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
    fetchInsights();
    fetchApprovedEvents();
  }, []);

  const fetchDashboard = async () => {
    try {
      console.log('📊 [PROMOTER DASHBOARD] Fetching dashboard data...');
      const response = await api.analytics.promoter.dashboard();
      console.log('📊 [PROMOTER DASHBOARD] Dashboard response:', response.data);
      setDashboard(response.data);
    } catch (err: any) {
      console.error('❌ [PROMOTER DASHBOARD] Failed to load dashboard:', err);
      console.error('❌ [PROMOTER DASHBOARD] Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      console.log('💡 [PROMOTER INSIGHTS] Fetching insights data...');
      const response = await api.promoter.insights();
      console.log('💡 [PROMOTER INSIGHTS] Insights response:', response.data);
      setInsights(response.data.data);
    } catch (err: any) {
      console.error('❌ [PROMOTER INSIGHTS] Failed to load insights:', err);
      console.error('❌ [PROMOTER INSIGHTS] Error details:', err.response?.data);
    }
  };

  const fetchApprovedEvents = async () => {
    try {
      const response = await api.promoter.approvedEvents();
      setApprovedEvents(response.data || []);
    } catch (err) {
      console.error('Failed to load approved events:', err);
    }
  };

  const handleCreateCode = async () => {
    if (!selectedEvent) {
      setError('Please select an event');
      return;
    }

    setError('');
    setSuccess('');

    const payload = {
      event_id: selectedEvent.event_id,
      // Use DISCOUNT type if organizer set a discount (customers get discount + promoter gets commission)
      // Use COMMISSION type if no discount (only promoter gets commission, no customer discount)
      code_type: selectedEvent.discount_percentage ? 'DISCOUNT' : 'COMMISSION'
    };

    try {
      await api.promoter.createCode(payload);
      setSuccess('Promo code created successfully!');
      setShowCreateModal(false);
      setSelectedEvent(null);
      fetchDashboard(); // Refresh dashboard to show new code
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Create code error:', err);
      setError(err.response?.data?.detail || 'Failed to create code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const generateShareLink = (code: string, eventSlug: string) => {
    const params = new URLSearchParams({
      promo: code,
      utm_source: 'promoter',
      utm_medium: 'share',
      utm_campaign: eventSlug
    });
    return `${window.location.origin}/events/${eventSlug}?${params.toString()}`;
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const value = amount ? parseFloat(amount.toString()) : 0;
    return `KSh ${value.toLocaleString()}`;
  };

  const formatNumber = (num: number | string | undefined | null) => {
    const value = num ? parseFloat(num.toString()) : 0;
    return value.toLocaleString();
  };

  const GrowthIndicator = ({ value }: { value: number | null | undefined }) => {
    if (value === null || value === undefined || value === 0) return null;

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
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Comfortaa' }}>
            Welcome back, {dashboard.promoter_name}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Here's how your promotions are performing</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={approvedEvents.length === 0}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Code
        </Button>
      </div>

      {/* Alerts */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

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
                  {formatNumber(dashboard.total_tickets_sold)}
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

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performing Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboard.top_events || []).length > 0 ? (
            <div className="space-y-3">
              {(dashboard.top_events || []).slice(0, 5).map((event, index) => (
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
                    <p className="font-bold text-[#EB7D30]">{formatCurrency(event?.commission_earned)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(event?.revenue_generated)} revenue</p>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Your Active Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(dashboard.active_codes_list || []).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(dashboard.active_codes_list || []).map((code, index) => (
                <div key={index} className="p-4 border rounded-lg hover:border-[#EB7D30] transition">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-[#EB7D30] text-base px-3 py-1">{code.code}</Badge>
                    <Badge variant="outline">{code.times_used} uses</Badge>
                  </div>
                  <p className="text-sm font-medium truncate mb-1">{code.event_name}</p>
                  <p className="text-sm text-gray-600 mb-3">{code.tickets_sold} tickets sold</p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(code.code)}
                      className="flex-1"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShareCode({ code: code.code, event_slug: code.event_slug })}
                      className="flex-1"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No active codes yet</p>
              <Button onClick={() => setShowCreateModal(true)} disabled={approvedEvents.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Create Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="bg-white">
              <CardTitle className="font-comfortaa text-gray-900 flex items-center justify-between">
                Create New Promo Code
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Event (You're Approved For)
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={selectedEvent?.event_id || ''}
                  onChange={(e) => {
                    const event = approvedEvents.find(ev => ev.event_id === e.target.value);
                    setSelectedEvent(event || null);
                  }}
                >
                  <option value="">Choose an event...</option>
                  {approvedEvents.map((approval) => (
                    <option key={approval.event_id} value={approval.event_id}>
                      {approval.event?.title || 'Unknown Event'}
                      {approval.commission_percentage && ` (${approval.commission_percentage}% commission)`}
                      {approval.discount_percentage && ` (${approval.discount_percentage}% discount)`}
                    </option>
                  ))}
                </select>
                {approvedEvents.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    You need organizer approval before creating codes. Request to promote an event first.
                  </p>
                )}
              </div>

              {selectedEvent && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Organizer-Set Rates (Read-Only)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.commission_percentage && (
                      <div>
                        <p className="text-sm text-gray-600">Commission Rate</p>
                        <p className="text-2xl font-bold text-green-700">
                          {selectedEvent.commission_percentage}%
                        </p>
                      </div>
                    )}
                    {selectedEvent.discount_percentage && (
                      <div>
                        <p className="text-sm text-gray-600">Discount Rate</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {selectedEvent.discount_percentage}%
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    These rates were set by the organizer and cannot be changed.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateCode} disabled={!selectedEvent} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Code
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Modal */}
      {shareCode && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <CardHeader className="bg-white">
              <CardTitle className="font-comfortaa text-gray-900 flex items-center justify-between">
                Share Code: {shareCode.code}
                <button onClick={() => setShareCode(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium mb-2">Shareable Link</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generateShareLink(shareCode.code, shareCode.event_slug)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(generateShareLink(shareCode.code, shareCode.event_slug))}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this link on social media, WhatsApp, or email to track your conversions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
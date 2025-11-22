'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, 
  XCircle, Send, Wallet, Calendar, ArrowDownToLine
} from 'lucide-react';

interface CommissionBreakdown {
  total_commission: number;
  commission_by_status: Record<string, number>;
  commission_by_event: Array<{
    event_name: string;
    event_date: string;
    event_status: string;
    commission: number;
  }>;
  commission_by_month: Array<{
    month: string;
    commission: number;
  }>;
  available_for_payout: number;
  pending_payout: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  mpesa_phone: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
  mpesa_receipt: string | null;
}

export default function PromoterEarningsPage() {
  const [breakdown, setBreakdown] = useState<CommissionBreakdown | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [withdrawData, setWithdrawData] = useState({
    amount: '',
    mpesa_phone: ''
  });

  useEffect(() => {
    fetchEarnings();
    fetchWithdrawals();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await api.promoter.earnings();
      setBreakdown(response.data);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await api.promoter.withdrawals(50);
      setWithdrawals(response.data.withdrawals || []);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.promoter.withdraw({
        amount: parseFloat(withdrawData.amount),
        mpesa_phone: withdrawData.mpesa_phone
      });
      setSuccess('Withdrawal request submitted! Funds will be sent to your M-Pesa shortly.');
      setShowWithdrawForm(false);
      setWithdrawData({ amount: '', mpesa_phone: '' });
      fetchEarnings();
      fetchWithdrawals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process withdrawal');
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return <div className="text-center py-12 text-gray-600">Failed to load earnings data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Earnings & Withdrawals
        </h1>
        <p className="text-gray-600 mt-1">Manage your commission and request payouts</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">Available to Withdraw</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {formatCurrency(breakdown.available_for_payout)}
                </p>
                <Button 
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => setShowWithdrawForm(true)}
                  disabled={breakdown.available_for_payout <= 0}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Withdraw Now
                </Button>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <Wallet className="w-8 h-8 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-yellow-700 font-medium">Pending (Future Events)</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">
                  {formatCurrency(breakdown.pending_payout)}
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Available after events complete
                </p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-full">
                <Clock className="w-8 h-8 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium">Total Earned</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {formatCurrency(breakdown.total_commission)}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  All-time commission
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <TrendingUp className="w-8 h-8 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <Card className="border-[#EB7D30]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Request Withdrawal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (KSh) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max={breakdown.available_for_payout}
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                  placeholder="Enter amount to withdraw"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(breakdown.available_for_payout)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  M-Pesa Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={withdrawData.mpesa_phone}
                  onChange={(e) => setWithdrawData({ ...withdrawData, mpesa_phone: e.target.value })}
                  placeholder="+254712345678"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Funds will be sent to this number via M-Pesa
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Processing Information:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Withdrawals are processed within 24 hours</li>
                  <li>• Minimum withdrawal: KSh 100</li>
                  <li>• M-Pesa charges may apply</li>
                  <li>• You'll receive an SMS confirmation</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowWithdrawForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Commission by Event */}
      <Card>
        <CardHeader>
          <CardTitle>Commission by Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {breakdown.commission_by_event.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">{event.event_name}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(event.event_date).toLocaleDateString()} • {event.event_status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#EB7D30]">{formatCurrency(event.commission)}</p>
                  {event.event_status === 'completed' ? (
                    <Badge className="bg-green-500 mt-1">Available</Badge>
                  ) : (
                    <Badge className="bg-yellow-500 mt-1">Pending</Badge>
                  )}
                </div>
              </div>
            ))}
            {breakdown.commission_by_event.length === 0 && (
              <p className="text-center text-gray-500 py-8">No commission earned yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Commission Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {breakdown.commission_by_month.slice(-6).map((month, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">{month.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-[#EB7D30] h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ 
                          width: `${(month.commission / Math.max(...breakdown.commission_by_month.map(m => m.commission))) * 100}%` 
                        }}
                      >
                        <span className="text-xs text-white font-semibold">{formatCurrency(month.commission)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length > 0 ? (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-lg">{formatCurrency(withdrawal.amount)}</p>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      To: {withdrawal.mpesa_phone} • Requested: {new Date(withdrawal.requested_at).toLocaleString()}
                    </p>
                    {withdrawal.mpesa_receipt && (
                      <p className="text-sm text-green-600 mt-1">
                        Receipt: {withdrawal.mpesa_receipt}
                      </p>
                    )}
                  </div>
                  {withdrawal.status === 'completed' ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  ) : withdrawal.status === 'pending' ? (
                    <Clock className="w-8 h-8 text-yellow-500" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No withdrawal history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
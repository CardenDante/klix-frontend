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
  XCircle, Send, Wallet, Calendar, ArrowDownToLine, AlertCircle
} from 'lucide-react';

interface CommissionByEvent {
  event_id: string;
  event_name: string;
  event_date: string;
  total_commission: number;
  withdrawn: number;
  available: number;
  transaction_count: number;
}

interface CommissionBreakdown {
  total_earned: number;
  available_balance: number;
  pending_commission: number;
  withdrawn_total: number;
  current_month_earnings: number;
  last_month_earnings: number;
  commission_by_event: CommissionByEvent[];
}

interface Withdrawal {
  id: string;
  event_id: string;
  amount: number;
  payment_details: string;
  status: string;
  payment_reference: string | null;
  payment_notes: string | null;
  requested_at: string;
  confirmed_at: string | null;
}

export default function PromoterEarningsPage() {
  const [breakdown, setBreakdown] = useState<CommissionBreakdown | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [withdrawData, setWithdrawData] = useState({
    event_id: '',
    amount: '',
    payment_details: ''
  });

  const [selectedEvent, setSelectedEvent] = useState<CommissionByEvent | null>(null);

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

  const handleEventSelect = (eventId: string) => {
    const event = breakdown?.commission_by_event.find(e => e.event_id === eventId);
    setSelectedEvent(event || null);
    setWithdrawData({
      ...withdrawData,
      event_id: eventId,
      amount: event?.available.toString() || ''
    });
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEvent) {
      setError('Please select an event');
      return;
    }

    if (parseFloat(withdrawData.amount) > selectedEvent.available) {
      setError(`Maximum available: KSh ${selectedEvent.available.toLocaleString()}`);
      return;
    }

    try {
      await api.promoter.withdraw({
        event_id: withdrawData.event_id,
        amount: parseFloat(withdrawData.amount),
        payment_details: withdrawData.payment_details
      });
      setSuccess('Withdrawal request sent to organizer! They will pay you directly and confirm payment.');
      setShowWithdrawForm(false);
      setWithdrawData({ event_id: '', amount: '', payment_details: '' });
      setSelectedEvent(null);
      fetchEarnings();
      fetchWithdrawals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process withdrawal');
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
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
        <p className="text-gray-600 mt-1">Request payments from organizers</p>
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

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>How it works:</strong> Request payment for a specific event. The organizer will pay you manually
          (M-Pesa, bank transfer, etc.) and then confirm the payment in the system.
        </AlertDescription>
      </Alert>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">Available to Withdraw</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {formatCurrency(breakdown.available_balance)}
                </p>
                <Button
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  onClick={() => setShowWithdrawForm(true)}
                  disabled={breakdown.available_balance <= 0}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Request Payment
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
                <p className="text-sm text-yellow-700 font-medium">Pending Organizer Confirmation</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">
                  {formatCurrency(breakdown.pending_commission)}
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Waiting for organizer to confirm payment
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
                  {formatCurrency(breakdown.total_earned)}
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
              Request Payment from Organizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Event <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={withdrawData.event_id}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  required
                >
                  <option value="">Choose an event...</option>
                  {breakdown.commission_by_event
                    .filter(event => event.available > 0)
                    .map((event) => (
                      <option key={event.event_id} value={event.event_id}>
                        {event.event_name} - {formatCurrency(event.available)} available
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only shows events with available commission
                </p>
              </div>

              {selectedEvent && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedEvent.event_name}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Earned</p>
                      <p className="font-bold">{formatCurrency(selectedEvent.total_commission)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Already Withdrawn</p>
                      <p className="font-bold">{formatCurrency(selectedEvent.withdrawn)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Available</p>
                      <p className="font-bold text-green-700">{formatCurrency(selectedEvent.available)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount (KSh) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="100"
                  max={selectedEvent?.available || 0}
                  value={withdrawData.amount}
                  onChange={(e) => setWithdrawData({ ...withdrawData, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {selectedEvent ? formatCurrency(selectedEvent.available) : 'Select event first'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Payment Details <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={withdrawData.payment_details}
                  onChange={(e) => setWithdrawData({ ...withdrawData, payment_details: e.target.value })}
                  placeholder="M-Pesa: +254712345678 or Bank: KCB 1234567890"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  How should the organizer pay you? (M-Pesa number, bank account, etc.)
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900 font-medium mb-2">Important:</p>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• The organizer will pay you OUTSIDE the system</li>
                  <li>• They will then confirm the payment here</li>
                  <li>• Commission will be deducted after confirmation</li>
                  <li>• Minimum withdrawal: KSh 100</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={!selectedEvent}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowWithdrawForm(false);
                  setSelectedEvent(null);
                }}>
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
                    {new Date(event.event_date).toLocaleDateString()} • {event.transaction_count} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#EB7D30]">{formatCurrency(event.total_commission)}</p>
                  <div className="flex gap-2 mt-1">
                    {event.withdrawn > 0 && (
                      <Badge className="bg-gray-500">
                        Withdrawn: {formatCurrency(event.withdrawn)}
                      </Badge>
                    )}
                    {event.available > 0 ? (
                      <Badge className="bg-green-500">
                        Available: {formatCurrency(event.available)}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Fully Withdrawn</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {breakdown.commission_by_event.length === 0 && (
              <p className="text-center text-gray-500 py-8">No commission earned yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests History</CardTitle>
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
                      Payment Details: {withdrawal.payment_details}
                    </p>
                    <p className="text-sm text-gray-600">
                      Requested: {new Date(withdrawal.requested_at).toLocaleString()}
                    </p>
                    {withdrawal.payment_reference && (
                      <p className="text-sm text-green-600 mt-1">
                        <strong>Payment Reference:</strong> {withdrawal.payment_reference}
                      </p>
                    )}
                    {withdrawal.payment_notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Notes:</strong> {withdrawal.payment_notes}
                      </p>
                    )}
                    {withdrawal.confirmed_at && (
                      <p className="text-sm text-green-600 mt-1">
                        Confirmed: {new Date(withdrawal.confirmed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {withdrawal.status === 'confirmed' ? (
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
            <p className="text-center text-gray-500 py-8">No withdrawal requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

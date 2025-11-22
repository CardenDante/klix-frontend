'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DollarSign, CheckCircle, XCircle, Clock, Send,
  User, Calendar, Wallet, AlertCircle, FileText
} from 'lucide-react';

interface PromoterPayment {
  id: string;
  amount: number;
  payment_details: string;
  status: string;
  payment_reference: string | null;
  payment_notes: string | null;
  requested_at: string;
  confirmed_at: string | null;
  promoter: {
    id: string;
    name: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    date: string;
  };
}

interface PaymentsSummary {
  pending: {
    count: number;
    total_amount: number;
  };
  confirmed: {
    count: number;
    total_amount: number;
  };
  by_event: Array<{
    event_id: string;
    event_title: string;
    payment_count: number;
    pending_amount: number;
    paid_amount: number;
    total_amount: number;
  }>;
}

export default function OrganizerPromoterPaymentsPage() {
  const [pendingPayments, setPendingPayments] = useState<PromoterPayment[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PromoterPayment[]>([]);
  const [summary, setSummary] = useState<PaymentsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PromoterPayment | null>(null);

  const [confirmData, setConfirmData] = useState({
    payment_reference: '',
    payment_notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingResp, historyResp, summaryResp] = await Promise.all([
        api.get('/api/v1/organizer/promoter-payments/pending'),
        api.get('/api/v1/organizer/promoter-payments/history?limit=50'),
        api.get('/api/v1/organizer/promoter-payments/summary')
      ]);

      setPendingPayments(pendingResp.data.pending_payments || []);
      setPaymentHistory(historyResp.data.payments || []);
      setSummary(summaryResp.data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setError('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setError('');
    setSuccess('');

    try {
      await api.post(`/api/v1/organizer/promoter-payments/${selectedPayment.id}/confirm`, confirmData);
      setSuccess(`Payment of KSh ${selectedPayment.amount.toLocaleString()} confirmed successfully!`);
      setShowConfirmModal(false);
      setSelectedPayment(null);
      setConfirmData({ payment_reference: '', payment_notes: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to confirm payment');
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
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Promoter Payments
        </h1>
        <p className="text-gray-600 mt-1">Manage promoter commission payments</p>
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
          <strong>How it works:</strong> Promoters request payment for commissions earned.
          Pay them manually (M-Pesa, bank transfer, etc.), then confirm the payment here to update their balance.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-yellow-700 font-medium">Pending Payments</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">
                    {formatCurrency(summary.pending.total_amount)}
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    {summary.pending.count} requests
                  </p>
                </div>
                <div className="p-3 bg-yellow-200 rounded-full">
                  <Clock className="w-8 h-8 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-green-700 font-medium">Total Paid</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {formatCurrency(summary.confirmed.total_amount)}
                  </p>
                  <p className="text-xs text-green-700 mt-2">
                    {summary.confirmed.count} payments
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-700 font-medium">Total Commission</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {formatCurrency(summary.pending.total_amount + summary.confirmed.total_amount)}
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    All promoter commissions
                  </p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <DollarSign className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Payment Requests
            </div>
            <Badge className="bg-yellow-500">{pendingPayments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingPayments.length > 0 ? (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4 hover:border-[#EB7D30] transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-[#EB7D30]">
                          {formatCurrency(payment.amount)}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Promoter
                          </p>
                          <p className="font-semibold">{payment.promoter.name}</p>
                          <p className="text-gray-600">{payment.promoter.email}</p>
                        </div>

                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Event
                          </p>
                          <p className="font-semibold">{payment.event.title}</p>
                          <p className="text-gray-600">
                            {new Date(payment.event.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          <Wallet className="w-4 h-4 inline mr-1" />
                          Payment Details:
                        </p>
                        <p className="text-sm text-blue-800 font-mono">
                          {payment.payment_details}
                        </p>
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Requested: {new Date(payment.requested_at).toLocaleString()}
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowConfirmModal(true);
                      }}
                      className="ml-4"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No pending payments</p>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-lg">{formatCurrency(payment.amount)}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      To: {payment.promoter.name} • Event: {payment.event.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(payment.requested_at).toLocaleDateString()}
                    </p>
                    {payment.confirmed_at && (
                      <p className="text-xs text-green-600">
                        Confirmed: {new Date(payment.confirmed_at).toLocaleDateString()}
                      </p>
                    )}
                    {payment.payment_reference && (
                      <p className="text-xs text-gray-600 mt-1">
                        Ref: {payment.payment_reference}
                      </p>
                    )}
                  </div>
                  {payment.status === 'confirmed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Clock className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No payment history yet</p>
          )}
        </CardContent>
      </Card>

      {/* Summary by Event */}
      {summary && summary.by_event.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission by Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.by_event.map((event) => (
                <div key={event.event_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{event.event_title}</h4>
                    <p className="text-sm text-gray-600">{event.payment_count} payments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(event.total_amount)}</p>
                    <div className="flex gap-2 mt-1 justify-end">
                      {event.pending_amount > 0 && (
                        <Badge className="bg-yellow-500 text-xs">
                          Pending: {formatCurrency(event.pending_amount)}
                        </Badge>
                      )}
                      {event.paid_amount > 0 && (
                        <Badge className="bg-green-500 text-xs">
                          Paid: {formatCurrency(event.paid_amount)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Payment Modal */}
      {showConfirmModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Confirm Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Promoter</p>
                  <p className="font-semibold">{selectedPayment.promoter.name}</p>
                  <p className="text-sm text-gray-600 mt-2">Amount</p>
                  <p className="text-2xl font-bold text-[#EB7D30]">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">Payment Details</p>
                  <p className="font-mono text-sm">{selectedPayment.payment_details}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Payment Reference (Optional)
                  </label>
                  <Input
                    type="text"
                    value={confirmData.payment_reference}
                    onChange={(e) => setConfirmData({ ...confirmData, payment_reference: e.target.value })}
                    placeholder="M-Pesa code, transaction ID, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    value={confirmData.payment_notes}
                    onChange={(e) => setConfirmData({ ...confirmData, payment_notes: e.target.value })}
                    placeholder="Any additional notes about the payment..."
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-900">
                    ✓ By confirming, you declare that you have paid the promoter
                    {formatCurrency(selectedPayment.amount)} and the commission will be deducted from their available balance.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setSelectedPayment(null);
                      setConfirmData({ payment_reference: '', payment_notes: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

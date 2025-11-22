'use client';

import { useState, useEffect } from 'react';
import { organizersApi } from '@/lib/api/organizers';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Ticket,
  DollarSign,
  Loader2,
  Megaphone,
  Check,
  X,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// --- INTERFACES ---
interface PromoterStat {
  promoter_id: string;
  promoter_name: string;
  tickets_sold: number;
  total_revenue: number;
  promo_codes_count: number;
}

interface PromoterRequest {
  id: string;
  promoter_id: string;
  event_id: string;
  event: {
    id: string;
    title: string;
  };
  promoter: {
    id: string;
    business_name: string;
    user: {
      email: string;
      first_name: string;
      last_name: string;
    };
  };
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  commission_percentage: number | null;
  discount_percentage: number | null;
  created_at: string;
}

// --- MAIN COMPONENT ---
export default function OrganizerPromotersPage() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'requests'>('leaderboard');
  const [promoters, setPromoters] = useState<PromoterStat[]>([]);
  const [requests, setRequests] = useState<PromoterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalModal, setApprovalModal] = useState<{
    show: boolean;
    request: PromoterRequest | null;
    commissionPercentage: string;
    discountPercentage: string;
    responseMessage: string;
    processing: boolean;
  }>({
    show: false,
    request: null,
    commissionPercentage: '10',
    discountPercentage: '5',
    responseMessage: '',
    processing: false
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'leaderboard') {
        const response = await organizersApi.getTopPromoters(50);
        setPromoters(response.data.promoters || []);
      } else {
        const response = await api.organizer.promoterRequests.list();
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Could not load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approvalModal.request) return;

    const commission = parseFloat(approvalModal.commissionPercentage);
    const discount = parseFloat(approvalModal.discountPercentage);

    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast.error('Commission must be between 0 and 100');
      return;
    }
    if (isNaN(discount) || discount < 0 || discount > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }

    try {
      setApprovalModal(prev => ({ ...prev, processing: true }));

      await api.organizer.promoterRequests.approve(approvalModal.request.id, {
        commission_percentage: commission,
        discount_percentage: discount,
        response_message: approvalModal.responseMessage || undefined
      });

      toast.success('Promoter request approved!');
      setApprovalModal({
        show: false,
        request: null,
        commissionPercentage: '10',
        discountPercentage: '5',
        responseMessage: '',
        processing: false
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to approve:', error);
      toast.error(error.response?.data?.detail || 'Failed to approve request');
      setApprovalModal(prev => ({ ...prev, processing: false }));
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Are you sure you want to reject this promoter request?')) return;

    try {
      await api.organizer.promoterRequests.reject(requestId, {
        response_message: 'Request declined'
      });
      toast.success('Promoter request rejected');
      fetchData();
    } catch (error: any) {
      console.error('Failed to reject:', error);
      toast.error(error.response?.data?.detail || 'Failed to reject request');
    }
  };

  const totalPromoTickets = promoters.reduce((sum, p) => sum + p.tickets_sold, 0);
  const totalPromoRevenue = promoters.reduce((sum, p) => sum + p.total_revenue, 0);
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Promoters</h1>
          <p className="text-gray-600 mt-1 font-body">Manage promoter requests and track performance.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'leaderboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Requests
            {pendingRequests > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests}
              </Badge>
            )}
          </button>
        </nav>
      </div>

      {/* Stat Cards */}
      {activeTab === 'leaderboard' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Active Promoters"
              value={promoters.length.toString()}
              icon={Users}
              iconColor="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard
              title="Promo Tickets Sold"
              value={totalPromoTickets.toLocaleString()}
              icon={Ticket}
              iconColor="text-orange-600"
              bgColor="bg-orange-100"
            />
            <StatCard
              title="Promo Revenue"
              value={`KSh ${totalPromoRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-green-600"
              bgColor="bg-green-100"
            />
          </div>

          {/* Promoters Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-comfortaa">Promoter Leaderboard</CardTitle>
              <CardDescription className="font-body">Ranking of your promoters by tickets sold.</CardDescription>
            </CardHeader>
            <CardContent>
              {promoters.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Promoter</TableHead>
                        <TableHead className="text-right">Tickets Sold</TableHead>
                        <TableHead className="text-right">Revenue Generated</TableHead>
                        <TableHead className="text-center">Active Codes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoters.sort((a, b) => b.tickets_sold - a.tickets_sold).map((promoter, index) => (
                        <TableRow key={promoter.promoter_id}>
                          <TableCell className="font-bold text-gray-500">#{index + 1}</TableCell>
                          <TableCell className="font-semibold">{promoter.promoter_name}</TableCell>
                          <TableCell className="text-right font-mono">{promoter.tickets_sold.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-green-700">KSh {promoter.total_revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{promoter.promo_codes_count || 0}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Promoter Requests Tab */}
      {activeTab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle className="font-comfortaa">Promoter Requests</CardTitle>
            <CardDescription className="font-body">
              Review and approve promoters who want to promote your events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-body">No promoter requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold font-comfortaa">
                            {request.promoter.business_name}
                          </h4>
                          <Badge
                            variant={
                              request.status === 'APPROVED'
                                ? 'default'
                                : request.status === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-body">
                          {request.promoter.user.first_name} {request.promoter.user.last_name} ({request.promoter.user.email})
                        </p>
                        <p className="text-sm text-gray-900 font-body mt-1">
                          Event: <span className="font-semibold">{request.event.title}</span>
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 font-body mt-2 italic">
                            "{request.message}"
                          </p>
                        )}
                        {request.status === 'APPROVED' && (
                          <div className="mt-2 text-sm text-gray-600 font-body">
                            Commission: {request.commission_percentage}% | Discount: {request.discount_percentage}%
                          </div>
                        )}
                        <p className="text-xs text-gray-500 font-body mt-2">
                          Requested {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => setApprovalModal({
                              show: true,
                              request,
                              commissionPercentage: '10',
                              discountPercentage: '5',
                              responseMessage: '',
                              processing: false
                            })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Modal */}
      {approvalModal.show && approvalModal.request && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="font-comfortaa">Approve Promoter Request</CardTitle>
              <CardDescription className="font-body">
                Set commission and discount rates for {approvalModal.request.promoter.business_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Commission Percentage (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={approvalModal.commissionPercentage}
                  onChange={(e) => setApprovalModal(prev => ({
                    ...prev,
                    commissionPercentage: e.target.value
                  }))}
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-gray-500 mt-1 font-body">
                  The promoter will earn this percentage on each sale
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Discount Percentage (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={approvalModal.discountPercentage}
                  onChange={(e) => setApprovalModal(prev => ({
                    ...prev,
                    discountPercentage: e.target.value
                  }))}
                  placeholder="e.g. 5"
                />
                <p className="text-xs text-gray-500 mt-1 font-body">
                  Buyers using promo codes will get this discount
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Message (Optional)
                </label>
                <Textarea
                  value={approvalModal.responseMessage}
                  onChange={(e) => setApprovalModal(prev => ({
                    ...prev,
                    responseMessage: e.target.value
                  }))}
                  placeholder="Welcome message or additional instructions..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={approvalModal.processing}
                  className="flex-1"
                >
                  {approvalModal.processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setApprovalModal({
                    show: false,
                    request: null,
                    commissionPercentage: '10',
                    discountPercentage: '5',
                    responseMessage: '',
                    processing: false
                  })}
                  disabled={approvalModal.processing}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, iconColor, bgColor }: { title: string, value: string, icon: React.ElementType, iconColor: string, bgColor: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <p className="text-gray-600 text-sm mb-1 font-body">{title}</p>
      <p className="text-3xl font-bold text-gray-900 font-comfortaa">{value}</p>
    </CardContent>
  </Card>
);

const EmptyState = () => (
  <div className="text-center py-16">
    <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h3 className="text-2xl font-bold text-gray-900 mb-2 font-comfortaa">No Active Promoters Yet</h3>
    <p className="text-gray-600 mb-6 font-body">
      Promoters will appear here once they start selling tickets for your events.
    </p>
    <p className="text-sm text-gray-500 font-body">
      Check the "Requests" tab to approve promoters who want to promote your events.
    </p>
  </div>
);

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, CheckCircle, XCircle, Ban, Search,
  Calendar, DollarSign, ExternalLink, Mail
} from 'lucide-react';

interface Organizer {
  id: string;
  user_id: string;
  business_name: string;
  email: string;
  phone_number: string;
  status: string;
  total_events: number;
  total_revenue: number;
  approval_date: string | null;
  rejection_reason: string | null;
}

export default function AdminOrganizersPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | null>(null);
  const [actionData, setActionData] = useState({ notes: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOrganizers();
  }, [statusFilter]);

  const fetchOrganizers = async () => {
    try {
      const params: any = { limit: 100 };
      if (statusFilter) params.status = statusFilter.toUpperCase();

      const response = await apiClient.get('/admin/organizers', { params });
      setOrganizers(response.data.organizers || response.data);
    } catch (err) {
      console.error('Failed to load organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedOrganizer) return;

    try {
      await apiClient.post(`/admin/organizers/${selectedOrganizer.id}/approve`, {
        notes: actionData.notes
      });
      setSuccess(`${selectedOrganizer.business_name} approved successfully!`);
      setSelectedOrganizer(null);
      setActionType(null);
      setActionData({ notes: '', reason: '' });
      fetchOrganizers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve organizer');
    }
  };

  const handleReject = async () => {
    if (!selectedOrganizer || actionData.reason.length < 10) {
      setError('Please provide a rejection reason (minimum 10 characters)');
      return;
    }

    try {
      await apiClient.post(`/admin/organizers/${selectedOrganizer.id}/reject`, {
        reason: actionData.reason
      });
      setSuccess(`${selectedOrganizer.business_name} rejected`);
      setSelectedOrganizer(null);
      setActionType(null);
      setActionData({ notes: '', reason: '' });
      fetchOrganizers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject organizer');
    }
  };

  const handleSuspend = async () => {
    if (!selectedOrganizer || actionData.reason.length < 10) {
      setError('Please provide a suspension reason (minimum 10 characters)');
      return;
    }

    try {
      await apiClient.post(`/admin/organizers/${selectedOrganizer.id}/suspend`, {
        reason: actionData.reason,
        duration_days: null
      });
      setSuccess(`${selectedOrganizer.business_name} suspended`);
      setSelectedOrganizer(null);
      setActionType(null);
      setActionData({ notes: '', reason: '' });
      fetchOrganizers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to suspend organizer');
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-gray-500">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrganizers = organizers.filter(org =>
    org.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organizers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Organizers Management
        </h1>
        <p className="text-gray-600 mt-1">Review and manage event organizer applications</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map(status => (
          <Card key={status} className="cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter(status)}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 capitalize">{status.toLowerCase()}</p>
              <p className="text-2xl font-bold">
                {organizers.filter(o => o.status.toUpperCase() === status).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by business name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              className="px-4 py-2 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Organizers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organizers ({filteredOrganizers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredOrganizers.map((organizer) => (
              <div key={organizer.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{organizer.business_name}</h4>
                      {getStatusBadge(organizer.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {organizer.email}
                      </span>
                      <span>📱 {organizer.phone_number}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {organizer.status.toUpperCase() === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrganizer(organizer);
                            setActionType('approve');
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedOrganizer(organizer);
                            setActionType('reject');
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {organizer.status.toUpperCase() === 'APPROVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrganizer(organizer);
                          setActionType('suspend');
                        }}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600">Total Events</p>
                    <p className="text-lg font-bold">{organizer.total_events}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Revenue</p>
                    <p className="text-lg font-bold">{formatCurrency(organizer.total_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Status Date</p>
                    <p className="text-sm">
                      {organizer.approval_date 
                        ? new Date(organizer.approval_date).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {organizer.rejection_reason && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Rejection Reason:</strong> {organizer.rejection_reason}
                  </div>
                )}
              </div>
            ))}

            {filteredOrganizers.length === 0 && (
              <p className="text-center text-gray-500 py-12">No organizers found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      {selectedOrganizer && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>
                {actionType === 'approve' && 'Approve Organizer'}
                {actionType === 'reject' && 'Reject Organizer'}
                {actionType === 'suspend' && 'Suspend Organizer'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Business: <strong>{selectedOrganizer.business_name}</strong></p>
                <p className="text-sm text-gray-600">Email: <strong>{selectedOrganizer.email}</strong></p>
              </div>

              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Notes (Optional)</label>
                  <Textarea
                    value={actionData.notes}
                    onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                    placeholder="Internal notes about this approval..."
                    rows={3}
                  />
                </div>
              )}

              {(actionType === 'reject' || actionType === 'suspend') && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={actionData.reason}
                    onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                    placeholder={`Enter ${actionType} reason (minimum 10 characters)...`}
                    rows={3}
                    required
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (actionType === 'approve') handleApprove();
                    if (actionType === 'reject') handleReject();
                    if (actionType === 'suspend') handleSuspend();
                  }}
                  className={actionType === 'approve' ? 'bg-green-600' : 'bg-red-600'}
                >
                  Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrganizer(null);
                    setActionType(null);
                    setActionData({ notes: '', reason: '' });
                  }}
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
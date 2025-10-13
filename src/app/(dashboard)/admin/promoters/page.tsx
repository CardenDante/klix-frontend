'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, Search, CheckCircle, XCircle, Clock, Award,
  TrendingUp, DollarSign, Eye, Ban, Calendar, Phone,
  Globe, Target, Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PromoterApplication {
  id: string;
  user_id: string;
  user_email: string;
  business_name: string;
  phone_number: string;
  social_media_links: any;
  audience_size: string;
  experience_description: string;
  why_join: string;
  sample_content?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
}

interface PromoterStats {
  total_promoters: number;
  pending_applications: number;
  active_promoters: number;
  total_commission_paid: number;
  total_tickets_sold: number;
  total_revenue_generated: number;
}

export default function AdminPromotersPage() {
  const [stats, setStats] = useState<PromoterStats | null>(null);
  const [applications, setApplications] = useState<PromoterApplication[]>([]);
  const [activePromoters, setActivePromoters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<PromoterApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, appsRes, promotersRes] = await Promise.all([
        apiClient.get('/api/v1/admin/promoters/stats'),
        apiClient.get('/api/v1/admin/promoters/applications'),
        apiClient.get('/api/v1/admin/promoters/active')
      ]);

      setStats(statsRes.data);
      setApplications(appsRes.data);
      setActivePromoters(promotersRes.data);
    } catch (error) {
      console.error('Failed to load promoter data:', error);
      toast.error('Failed to load promoter data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    if (!confirm('Are you sure you want to approve this application?')) return;

    setProcessing(true);
    try {
      await apiClient.post(`/api/v1/admin/promoters/applications/${applicationId}/approve`);
      toast.success('Application approved successfully');
      loadData();
      setSelectedApplication(null);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.post(`/api/v1/admin/promoters/applications/${selectedApplication.id}/reject`, {
        reason: rejectionReason
      });
      toast.success('Application rejected');
      loadData();
      setShowRejectDialog(false);
      setSelectedApplication(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async (promoterId: string) => {
    if (!confirm('Are you sure you want to deactivate this promoter?')) return;

    try {
      await apiClient.post(`/api/v1/admin/promoters/${promoterId}/deactivate`);
      toast.success('Promoter deactivated');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to deactivate promoter');
    }
  };

  const filteredApplications = applications.filter(app =>
    app.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingApplications = filteredApplications.filter(app => app.status === 'pending');
  const approvedApplications = filteredApplications.filter(app => app.status === 'approved');
  const rejectedApplications = filteredApplications.filter(app => app.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Promoter Management</h1>
        <p className="text-gray-600 mt-1 font-body">Manage promoter applications and active promoters</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-body">Pending Applications</p>
                <p className="text-3xl font-bold text-yellow-600 font-comfortaa">
                  {stats?.pending_applications || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-body">Active Promoters</p>
                <p className="text-3xl font-bold text-green-600 font-comfortaa">
                  {stats?.active_promoters || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-body">Total Tickets Sold</p>
                <p className="text-3xl font-bold text-blue-600 font-comfortaa">
                  {stats?.total_tickets_sold.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-body">Commission Paid</p>
                <p className="text-3xl font-bold text-purple-600 font-comfortaa">
                  KSh {stats?.total_commission_paid.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-11"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Promoters ({activePromoters.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Applications */}
        <TabsContent value="pending">
          {pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-body">No pending applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((app) => (
                <Card key={app.id} className="hover:shadow-lg transition">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-bold font-comfortaa">{app.business_name}</h3>
                          <Badge variant="secondary">{app.status}</Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                          <div className="space-y-2">
                            <p className="text-gray-600 font-body">
                              <strong>Email:</strong> {app.user_email}
                            </p>
                            <p className="text-gray-600 font-body">
                              <strong>Phone:</strong> {app.phone_number}
                            </p>
                            <p className="text-gray-600 font-body">
                              <strong>Audience:</strong> {app.audience_size}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-gray-600 font-body">
                              <strong>Applied:</strong> {new Date(app.created_at).toLocaleDateString()}
                            </p>
                            <div>
                              <strong className="text-gray-600 font-body">Social Media:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(app.social_media_links || {}).map(([platform, url]) => (
                                  url && (
                                    <Badge key={platform} variant="outline" className="text-xs">
                                      {platform}
                                    </Badge>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="text-gray-700 font-body">
                            <strong>Experience:</strong> {app.experience_description.substring(0, 150)}...
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(app.id)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowRejectDialog(true);
                          }}
                          disabled={processing}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Approved Applications */}
        <TabsContent value="approved">
          {approvedApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-body">No approved applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {approvedApplications.map((app) => (
                <Card key={app.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold font-comfortaa">{app.business_name}</h3>
                        <p className="text-sm text-gray-600 font-body">{app.user_email}</p>
                        <p className="text-xs text-gray-500 font-body">
                          Approved on {new Date(app.approved_at || '').toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-green-600">Approved</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected Applications */}
        <TabsContent value="rejected">
          {rejectedApplications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-body">No rejected applications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedApplications.map((app) => (
                <Card key={app.id} className="border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold font-comfortaa">{app.business_name}</h3>
                        <p className="text-sm text-gray-600 mb-2 font-body">{app.user_email}</p>
                        {app.rejection_reason && (
                          <div className="mt-2 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-800 font-body">
                              <strong>Reason:</strong> {app.rejection_reason}
                            </p>
                          </div>
                        )}
                      </div>
                      <Badge variant="destructive">Rejected</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Promoters */}
        <TabsContent value="active">
          {activePromoters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-body">No active promoters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activePromoters.map((promoter) => (
                <Card key={promoter.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold font-comfortaa">{promoter.business_name}</h3>
                        <p className="text-sm text-gray-600 font-body">{promoter.user_email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeactivate(promoter.id)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary font-comfortaa">
                          {promoter.total_tickets_sold || 0}
                        </p>
                        <p className="text-xs text-gray-600 font-body">Tickets Sold</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600 font-comfortaa">
                          {promoter.total_codes || 0}
                        </p>
                        <p className="text-xs text-gray-600 font-body">Active Codes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600 font-comfortaa">
                          KSh {promoter.total_commission?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-gray-600 font-body">Commission</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Application Dialog */}
      <Dialog open={!!selectedApplication && !showRejectDialog} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-comfortaa">Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 font-body">Business Name</label>
                  <p className="font-comfortaa">{selectedApplication.business_name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 font-body">Email</label>
                  <p className="font-body">{selectedApplication.user_email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 font-body">Phone</label>
                  <p className="font-body">{selectedApplication.phone_number}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 font-body">Audience Size</label>
                  <p className="font-body">{selectedApplication.audience_size}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block font-body">Social Media Links</label>
                <div className="space-y-2">
                  {Object.entries(selectedApplication.social_media_links || {}).map(([platform, url]) => (
                    url && (
                      <div key={platform} className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{platform}</Badge>
                        <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-body">
                          {url as string}
                        </a>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block font-body">Experience</label>
                <p className="text-gray-700 whitespace-pre-wrap font-body">{selectedApplication.experience_description}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block font-body">Why Join</label>
                <p className="text-gray-700 whitespace-pre-wrap font-body">{selectedApplication.why_join}</p>
              </div>

              {selectedApplication.sample_content && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block font-body">Sample Content</label>
                  <p className="text-gray-700 whitespace-pre-wrap font-body">{selectedApplication.sample_content}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleApprove(selectedApplication.id)}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Application
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Application
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-comfortaa">Reject Application</DialogTitle>
            <DialogDescription className="font-body">
              Provide a reason for rejection. The applicant will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Insufficient social media presence, audience size too small, etc."
              rows={4}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
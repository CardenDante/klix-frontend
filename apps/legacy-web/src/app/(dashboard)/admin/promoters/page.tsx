'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  UserCheck,
  UserX,
  Ban,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Activity,
  TrendingUp,
  Users as UsersIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface Promoter {
  id: string;
  user_id: string;
  display_name: string;  // Backend field
  bio?: string;  // Backend field
  social_links?: string;  // Backend field (JSON string)
  experience?: string;  // Backend field
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  updated_at?: string;
  approved_at?: string;
  rejection_reason?: string;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  };
}

type ActionType = 'approve' | 'reject' | 'suspend' | null;

export default function PromotersPage() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPromoters();
  }, [activeTab]);

  const fetchPromoters = async () => {
    try {
      setLoading(true);

      // Only fetch pending promoters for now (backend may only have pending endpoint)
      if (activeTab === 'pending') {
        const response = await api.admin.promoters.pending();
        console.log('🎯 [PROMOTERS] Response:', response.data);

        const promotersData = Array.isArray(response.data)
          ? response.data
          : (response.data?.promoters || response.data?.data || []);

        console.log('🎯 [PROMOTERS] Processed:', promotersData.length, 'promoters');
        setPromoters(promotersData);
      } else {
        // For other tabs, show empty for now
        // TODO: Backend may need to add list endpoint with status filter
        setPromoters([]);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch promoters';
      toast.error(errorMessage);
      console.error('🎯 [PROMOTERS] Error:', err);
      setPromoters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPromoter || !actionType) return;

    if ((actionType === 'reject' || actionType === 'suspend') && !actionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      setProcessing(true);

      switch (actionType) {
        case 'approve':
          await api.admin.promoters.approve(selectedPromoter.id, {
            notes: actionNotes || undefined,
          });
          toast.success(`Promoter has been approved`);
          break;

        case 'reject':
          await api.admin.promoters.reject(selectedPromoter.id, {
            reason: actionReason,
          });
          toast.success(`Promoter has been rejected`);
          break;

        case 'suspend':
          await api.admin.promoters.suspend(selectedPromoter.id, {
            reason: actionReason,
          });
          toast.success(`Promoter has been suspended`);
          break;
      }

      setSelectedPromoter(null);
      setActionType(null);
      setActionReason('');
      setActionNotes('');
      fetchPromoters();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || `Failed to ${actionType} promoter`;
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (promoter: Promoter, action: ActionType) => {
    setSelectedPromoter(promoter);
    setActionType(action);
    setActionReason('');
    setActionNotes('');
  };

  const closeDialog = () => {
    setSelectedPromoter(null);
    setActionType(null);
    setActionReason('');
    setActionNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'default', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      suspended: { variant: 'destructive', icon: Ban },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const filteredPromoters = promoters.filter((promoter) =>
    promoter.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promoter.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (promoter.user?.first_name && promoter.user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (promoter.user?.last_name && promoter.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPromoterName = (promoter: Promoter) => {
    if (promoter.display_name) return promoter.display_name;
    if (promoter.user?.first_name || promoter.user?.last_name) {
      return `${promoter.user.first_name || ''} ${promoter.user.last_name || ''}`.trim();
    }
    return promoter.user?.email?.split('@')[0] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promoter Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage promoter applications
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchPromoters} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Activity className="w-6 h-6 animate-spin mr-2" />
                <span>Loading promoters...</span>
              </CardContent>
            </Card>
          ) : filteredPromoters.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No promoters found matching your search' : 'No promoters found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromoters.map((promoter) => (
                    <TableRow key={promoter.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            {getPromoterName(promoter)}
                          </div>
                          {promoter.bio && (
                            <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {promoter.bio}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {promoter.user?.email}
                          </div>
                          {promoter.user?.phone_number && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {promoter.user.phone_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {promoter.experience ? (
                            <span className="line-clamp-2">{promoter.experience}</span>
                          ) : (
                            <span className="text-muted-foreground">Not specified</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(promoter.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(promoter.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openDialog(promoter, 'approve')}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDialog(promoter, 'reject')}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {activeTab === 'approved' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDialog(promoter, 'suspend')}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {(activeTab === 'rejected' || activeTab === 'suspended') && (
                            <div className="text-sm text-muted-foreground">
                              {promoter.rejection_reason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Promoter'}
              {actionType === 'reject' && 'Reject Promoter'}
              {actionType === 'suspend' && 'Suspend Promoter'}
            </DialogTitle>
            <DialogDescription>
              {selectedPromoter && getPromoterName(selectedPromoter)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'approve' && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this approval..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {(actionType === 'reject' || actionType === 'suspend') && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder={`Explain why you are ${actionType}ing this promoter...`}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            )}

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {actionType === 'approve' && (
                  <>
                    <li>Change promoter status to APPROVED</li>
                    <li>Upgrade user role to PROMOTER</li>
                    <li>Send approval confirmation email</li>
                    <li>Allow them to create promo codes</li>
                  </>
                )}
                {actionType === 'reject' && (
                  <>
                    <li>Change promoter status to REJECTED</li>
                    <li>Send rejection notification email</li>
                    <li>User will remain as ATTENDEE</li>
                    <li>Record rejection reason in audit log</li>
                  </>
                )}
                {actionType === 'suspend' && (
                  <>
                    <li>Change promoter status to SUSPENDED</li>
                    <li>Deactivate all their promo codes</li>
                    <li>Send suspension notification email</li>
                    <li>Record suspension reason in audit log</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || ((actionType === 'reject' || actionType === 'suspend') && !actionReason.trim())}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'approve' && <UserCheck className="w-4 h-4 mr-2" />}
                  {actionType === 'reject' && <UserX className="w-4 h-4 mr-2" />}
                  {actionType === 'suspend' && <Ban className="w-4 h-4 mr-2" />}
                  Confirm {actionType}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

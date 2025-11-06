'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Building,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface Organizer {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string;
  business_registration_number?: string;
  phone_number?: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  suspended_at?: string;
  rejection_reason?: string;
  suspension_reason?: string;
  approved_by?: string;
  total_events?: number;
  total_revenue?: number;
  platform_earnings?: number;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
  };
}

type ActionType = 'approve' | 'reject' | 'suspend' | null;

export default function OrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrganizers();
  }, [activeTab]);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      let response;

      if (activeTab === 'pending') {
        response = await api.admin.organizers.pending();
      } else {
        // Backend expects UPPERCASE status values
        response = await api.admin.organizers.list({ status: activeTab.toUpperCase() });
      }

      console.log('📊 [ORGANIZERS] Raw response:', response);
      console.log('📊 [ORGANIZERS] Response.data:', response.data);
      console.log('📊 [ORGANIZERS] Type:', typeof response.data, 'IsArray:', Array.isArray(response.data));

      // Handle different response structures
      const organizersData = Array.isArray(response.data)
        ? response.data
        : (response.data?.organizers || response.data?.data || []);

      console.log('📊 [ORGANIZERS] Processed:', organizersData.length, 'organizers for tab:', activeTab);
      if (organizersData.length > 0) {
        console.log('📊 [ORGANIZERS] First organizer:', organizersData[0]);
      }
      setOrganizers(organizersData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch organizers';
      toast.error(errorMessage);
      console.error('📊 [ORGANIZERS] Error:', err);
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedOrganizer || !actionType) return;

    if ((actionType === 'reject' || actionType === 'suspend') && !actionReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      setProcessing(true);

      switch (actionType) {
        case 'approve':
          await api.admin.organizers.approve(selectedOrganizer.id, {
            notes: actionNotes || undefined,
          });
          toast.success(`${selectedOrganizer.business_name} has been approved`);
          break;

        case 'reject':
          await api.admin.organizers.reject(selectedOrganizer.id, {
            reason: actionReason,
          });
          toast.success(`${selectedOrganizer.business_name} has been rejected`);
          break;

        case 'suspend':
          await api.admin.organizers.suspend(selectedOrganizer.id, {
            reason: actionReason,
          });
          toast.success(`${selectedOrganizer.business_name} has been suspended`);
          break;
      }

      setSelectedOrganizer(null);
      setActionType(null);
      setActionReason('');
      setActionNotes('');
      fetchOrganizers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || `Failed to ${actionType} organizer`;
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (organizer: Organizer, action: ActionType) => {
    setSelectedOrganizer(organizer);
    setActionType(action);
    setActionReason('');
    setActionNotes('');
  };

  const closeDialog = () => {
    setSelectedOrganizer(null);
    setActionType(null);
    setActionReason('');
    setActionNotes('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const filteredOrganizers = organizers.filter((org) =>
    org.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizer Management</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage organizer applications
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by business name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchOrganizers} variant="outline">
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
                <span>Loading organizers...</span>
              </CardContent>
            </Card>
          ) : filteredOrganizers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No organizers found matching your search' : 'No organizers found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    {activeTab === 'approved' && (
                      <>
                        <TableHead>Events</TableHead>
                        <TableHead>Revenue</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizers.map((organizer) => (
                    <TableRow key={organizer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{organizer.business_name}</div>
                          {organizer.business_type && (
                            <div className="text-sm text-muted-foreground">
                              {organizer.business_type}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {organizer.user?.email || organizer.email}
                          </div>
                          {(organizer.user?.phone_number || organizer.phone_number) && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {organizer.user?.phone_number || organizer.phone_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(organizer.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(organizer.created_at)}
                        </div>
                      </TableCell>
                      {activeTab === 'approved' && (
                        <>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {organizer.total_events || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {formatCurrency(organizer.total_revenue || 0)}
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeTab === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openDialog(organizer, 'approve')}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDialog(organizer, 'reject')}
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
                              onClick={() => openDialog(organizer, 'suspend')}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {(activeTab === 'rejected' || activeTab === 'suspended') && (
                            <div className="text-sm text-muted-foreground">
                              {organizer.rejection_reason || organizer.suspension_reason}
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
              {actionType === 'approve' && 'Approve Organizer'}
              {actionType === 'reject' && 'Reject Organizer'}
              {actionType === 'suspend' && 'Suspend Organizer'}
            </DialogTitle>
            <DialogDescription>
              {selectedOrganizer?.business_name}
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
                  placeholder={`Explain why you are ${actionType}ing this organizer...`}
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
                    <li>Change organizer status to APPROVED</li>
                    <li>Upgrade user role to ORGANIZER</li>
                    <li>Send approval confirmation email</li>
                    <li>Allow them to create events</li>
                  </>
                )}
                {actionType === 'reject' && (
                  <>
                    <li>Change organizer status to REJECTED</li>
                    <li>Send rejection notification email</li>
                    <li>User will remain as ATTENDEE</li>
                    <li>Record rejection reason in audit log</li>
                  </>
                )}
                {actionType === 'suspend' && (
                  <>
                    <li>Change organizer status to SUSPENDED</li>
                    <li>Unpublish all their events</li>
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

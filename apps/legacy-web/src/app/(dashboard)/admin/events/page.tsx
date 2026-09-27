'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  AlertCircle,
  Activity,
  Flag,
  FlagOff,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Eye,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  slug: string;
  category: string;
  location: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  status: string;
  price_min?: number;
  price_max?: number;
  organizer?: {
    business_name: string;
  };
  total_tickets_sold?: number;
  is_flagged?: boolean;
  flag_severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flag_reason?: string;
}

type ActionType = 'flag' | 'unflag' | 'delete' | null;

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagSeverity, setFlagSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [unflagReason, setUnflagReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [shouldRefund, setShouldRefund] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit: 100,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter.toUpperCase();
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.events.list(params);
      console.log('📅 [EVENTS] Response:', response.data);

      // Handle different response formats
      const eventsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.events || response.data?.data || []);

      console.log('📅 [EVENTS] Processed:', eventsData.length, 'events');
      setEvents(eventsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch events';
      toast.error(errorMessage);
      setEvents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchEvents();
  };

  const handleAction = async () => {
    if (!selectedEvent || !actionType) return;

    try {
      setProcessing(true);

      switch (actionType) {
        case 'flag':
          if (!flagReason.trim()) {
            toast.error('Please provide a reason for flagging');
            return;
          }
          await api.admin.events.flag(selectedEvent.id, {
            reason: flagReason,
            severity: flagSeverity,
          });
          toast.success(`Event "${selectedEvent.title}" has been flagged`);
          break;

        case 'unflag':
          await api.admin.events.unflag(selectedEvent.id, {
            reason: unflagReason || 'Flag removed by admin',
          });
          toast.success(`Event "${selectedEvent.title}" has been unflagged`);
          break;

        case 'delete':
          if (!deleteReason.trim()) {
            toast.error('Please provide a reason for deletion');
            return;
          }
          await api.admin.events.forceDelete(selectedEvent.id, {
            reason: deleteReason,
            refund_tickets: shouldRefund,
          });
          toast.success(`Event "${selectedEvent.title}" has been deleted`);
          break;
      }

      closeDialog();
      fetchEvents();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || `Failed to ${actionType} event`;
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (event: Event, action: ActionType) => {
    setSelectedEvent(event);
    setActionType(action);
    setFlagReason('');
    setFlagSeverity('MEDIUM');
    setUnflagReason('');
    setDeleteReason('');
    setShouldRefund(false);
  };

  const closeDialog = () => {
    setSelectedEvent(null);
    setActionType(null);
    setFlagReason('');
    setFlagSeverity('MEDIUM');
    setUnflagReason('');
    setDeleteReason('');
    setShouldRefund(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityBadge = (severity?: string) => {
    const severityConfig: Record<string, { variant: any; class: string }> = {
      LOW: { variant: 'default', class: 'bg-yellow-100 text-yellow-800' },
      MEDIUM: { variant: 'default', class: 'bg-orange-100 text-orange-800' },
      HIGH: { variant: 'destructive', class: 'bg-red-100 text-red-800' },
      CRITICAL: { variant: 'destructive', class: 'bg-red-200 text-red-900' },
    };

    if (!severity) return null;

    const config = severityConfig[severity] || severityConfig.MEDIUM;

    return (
      <Badge className={config.class}>
        {severity}
      </Badge>
    );
  };

  const filteredEvents = events.filter((event) =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Moderation</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and moderate events on the platform
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search by event name, organizer, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Activity className="w-6 h-6 animate-spin mr-2" />
            <span>Loading events...</span>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No events found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Date & Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {event.title}
                        {event.is_flagged && (
                          <div className="flex items-center gap-1">
                            <Flag className="h-4 w-4 text-destructive" />
                            {getSeverityBadge(event.flag_severity)}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.category}
                      </div>
                      {event.is_flagged && event.flag_reason && (
                        <div className="text-sm text-destructive mt-1">
                          Flagged: {event.flag_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {event.organizer?.business_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(event.start_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {event.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={event.is_published ? 'default' : 'secondary'}>
                        {event.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {event.total_tickets_sold !== undefined && (
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {event.total_tickets_sold} sold
                        </div>
                      )}
                      {event.price_min !== undefined && event.price_max !== undefined && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(event.price_min)} - {formatCurrency(event.price_max)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/events/${event.slug}`} target="_blank">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      {event.is_flagged ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(event, 'unflag')}
                        >
                          <FlagOff className="h-4 w-4 mr-1" />
                          Unflag
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(event, 'flag')}
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          Flag
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDialog(event, 'delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'flag' && 'Flag Event'}
              {actionType === 'unflag' && 'Unflag Event'}
              {actionType === 'delete' && 'Delete Event'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'flag' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="severity">
                    Severity <span className="text-destructive">*</span>
                  </Label>
                  <Select value={flagSeverity} onValueChange={(v: any) => setFlagSeverity(v)}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low - Minor issue, stays published</SelectItem>
                      <SelectItem value="MEDIUM">Medium - Moderate concern, stays published</SelectItem>
                      <SelectItem value="HIGH">High - Serious issue, auto-unpublished</SelectItem>
                      <SelectItem value="CRITICAL">Critical - Severe violation, auto-unpublished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flag-reason">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="flag-reason"
                    placeholder="Explain why you are flagging this event..."
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
              </>
            )}

            {actionType === 'unflag' && (
              <div className="space-y-2">
                <Label htmlFor="unflag-reason">Reason (Optional)</Label>
                <Textarea
                  id="unflag-reason"
                  placeholder="Explain why you are removing the flag..."
                  value={unflagReason}
                  onChange={(e) => setUnflagReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {actionType === 'delete' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="delete-reason">
                    Reason <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="delete-reason"
                    placeholder="Explain why you are deleting this event..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="refund"
                    checked={shouldRefund}
                    onChange={(e) => setShouldRefund(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="refund" className="font-normal cursor-pointer">
                    Refund all tickets (if applicable)
                  </Label>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-sm">
                  <p className="font-medium text-destructive mb-1">Warning: This action is irreversible!</p>
                  <ul className="list-disc list-inside space-y-1 text-destructive/80">
                    <li>Event will be permanently deleted</li>
                    <li>All event data will be removed</li>
                    <li>Action will be logged in audit trail</li>
                  </ul>
                </div>
              </>
            )}

            {actionType !== 'delete' && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {actionType === 'flag' && (
                    <>
                      <li>Mark event as flagged with {flagSeverity} severity</li>
                      {(flagSeverity === 'HIGH' || flagSeverity === 'CRITICAL') && (
                        <li className="text-destructive">Automatically unpublish the event</li>
                      )}
                      <li>Notify the organizer</li>
                      <li>Record action in audit log</li>
                    </>
                  )}
                  {actionType === 'unflag' && (
                    <>
                      <li>Remove flag from event</li>
                      <li>Event can be republished by organizer</li>
                      <li>Record action in audit log</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || ((actionType === 'flag' || actionType === 'delete') && (!flagReason.trim() && !deleteReason.trim()))}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              {processing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'flag' && <Flag className="w-4 h-4 mr-2" />}
                  {actionType === 'unflag' && <FlagOff className="w-4 h-4 mr-2" />}
                  {actionType === 'delete' && <Trash2 className="w-4 h-4 mr-2" />}
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

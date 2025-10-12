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
  Calendar, Flag, Trash2, Search, ExternalLink,
  AlertTriangle, CheckCircle, MapPin
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  category: string;
  location: string;
  start_datetime: string;
  is_published: boolean;
  status: string;
  organizer: {
    business_name: string;
  };
}

export default function AdminEventsPage() {
  const searchParams = useSearchParams();
  const flaggedOnly = searchParams.get('flagged') === 'true';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [actionType, setActionType] = useState<'flag' | 'unflag' | 'delete' | null>(null);
  const [actionData, setActionData] = useState({
    reason: '',
    severity: 'MEDIUM',
    resolution: '',
    refund_tickets: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/events', {
        params: { page_size: 100 }
      });
      setEvents(response.data.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!selectedEvent || actionData.reason.length < 10) {
      setError('Please provide a flag reason (minimum 10 characters)');
      return;
    }

    try {
      await apiClient.post(`/admin/events/${selectedEvent.id}/flag`, {
        reason: actionData.reason,
        severity: actionData.severity
      });
      setSuccess(`Event "${selectedEvent.title}" flagged successfully`);
      setSelectedEvent(null);
      setActionType(null);
      setActionData({ reason: '', severity: 'MEDIUM', resolution: '', refund_tickets: false });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to flag event');
    }
  };

  const handleUnflag = async () => {
    if (!selectedEvent || actionData.resolution.length < 10) {
      setError('Please provide a resolution note (minimum 10 characters)');
      return;
    }

    try {
      await apiClient.post(`/admin/events/${selectedEvent.id}/unflag`, {
        resolution: actionData.resolution
      });
      setSuccess(`Event "${selectedEvent.title}" unflagged successfully`);
      setSelectedEvent(null);
      setActionType(null);
      setActionData({ reason: '', severity: 'MEDIUM', resolution: '', refund_tickets: false });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to unflag event');
    }
  };

  const handleForceDelete = async () => {
    if (!selectedEvent || actionData.reason.length < 10) {
      setError('Please provide a deletion reason (minimum 10 characters)');
      return;
    }

    if (!confirm(`Are you sure you want to force delete "${selectedEvent.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/events/${selectedEvent.id}/force-delete`, {
        data: {
          reason: actionData.reason,
          refund_tickets: actionData.refund_tickets
        }
      });
      setSuccess(`Event "${selectedEvent.title}" deleted successfully`);
      setSelectedEvent(null);
      setActionType(null);
      setActionData({ reason: '', severity: 'MEDIUM', resolution: '', refund_tickets: false });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete event');
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.organizer.business_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Events Management
        </h1>
        <p className="text-gray-600 mt-1">Review and moderate platform events</p>
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
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Events</p>
            <p className="text-2xl font-bold">{events.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-bold text-green-600">
              {events.filter(e => e.is_published).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Draft</p>
            <p className="text-2xl font-bold text-yellow-600">
              {events.filter(e => !e.is_published).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search events or organizers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-lg">{event.title}</h4>
                      <Badge variant={event.is_published ? 'default' : 'secondary'}>
                        {event.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {event.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {event.category}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.start_datetime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      Organized by: <strong>{event.organizer.business_name}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/events/${event.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setActionType('flag');
                      }}
                    >
                      <Flag className="w-4 h-4 mr-1" />
                      Flag
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedEvent(event);
                        setActionType('delete');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <p className="text-center text-gray-500 py-12">No events found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      {selectedEvent && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>
                {actionType === 'flag' && 'Flag Event'}
                {actionType === 'unflag' && 'Unflag Event'}
                {actionType === 'delete' && 'Force Delete Event'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Event: <strong>{selectedEvent.title}</strong></p>
                <p className="text-sm text-gray-600">Organizer: <strong>{selectedEvent.organizer.business_name}</strong></p>
              </div>

              {actionType === 'flag' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Severity <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={actionData.severity}
                      onChange={(e) => setActionData({ ...actionData, severity: e.target.value })}
                    >
                      <option value="LOW">Low - Minor Issue</option>
                      <option value="MEDIUM">Medium - Moderate Concern</option>
                      <option value="HIGH">High - Serious Issue (Unpublish)</option>
                      <option value="CRITICAL">Critical - Severe Violation (Unpublish)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={actionData.reason}
                      onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                      placeholder="Why is this event being flagged? (min 10 characters)"
                      rows={3}
                      required
                    />
                  </div>
                </>
              )}

              {actionType === 'unflag' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Resolution <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={actionData.resolution}
                    onChange={(e) => setActionData({ ...actionData, resolution: e.target.value })}
                    placeholder="How was the issue resolved? (min 10 characters)"
                    rows={3}
                    required
                  />
                </div>
              )}

              {actionType === 'delete' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Deletion Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={actionData.reason}
                      onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                      placeholder="Why is this event being deleted? (min 10 characters)"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <input
                      type="checkbox"
                      id="refund"
                      checked={actionData.refund_tickets}
                      onChange={(e) => setActionData({ ...actionData, refund_tickets: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="refund" className="text-sm text-yellow-800">
                      Refund all tickets (required if tickets sold)
                    </label>
                  </div>
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      This will permanently delete the event and all related data. This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (actionType === 'flag') handleFlag();
                    if (actionType === 'unflag') handleUnflag();
                    if (actionType === 'delete') handleForceDelete();
                  }}
                  variant={actionType === 'delete' ? 'destructive' : 'default'}
                >
                  Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEvent(null);
                    setActionType(null);
                    setActionData({ reason: '', severity: 'MEDIUM', resolution: '', refund_tickets: false });
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, MapPin, Search, Send, CheckCircle,
  Clock, XCircle, Loader2, ExternalLink, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string;
  portrait_image_url?: string;
  organizer: {
    business_name: string;
  };
}

interface PromoterRequest {
  id: string;
  event_id: string;
  event: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
    location: string;
  };
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  commission_percentage: number | null;
  discount_percentage: number | null;
  response_message: string | null;
  created_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

export default function PromoterEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [requests, setRequests] = useState<PromoterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'requests'>('available');

  const [requestModal, setRequestModal] = useState<{
    show: boolean;
    event: Event | null;
    message: string;
    submitting: boolean;
  }>({
    show: false,
    event: null,
    message: '',
    submitting: false
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'available') {
        // Fetch all available events AND requests to check status
        const [eventsResponse, requestsResponse] = await Promise.all([
          api.events.list({ page: 1, page_size: 100 }),
          api.promoter.myRequests()
        ]);
        setEvents(eventsResponse.data.data || []);
        setRequests(requestsResponse.data || []);
      } else {
        // Fetch my requests
        const response = await api.promoter.myRequests();
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToPromote = (event: Event) => {
    setRequestModal({
      show: true,
      event,
      message: '',
      submitting: false
    });
  };

  const submitRequest = async () => {
    if (!requestModal.event) return;

    try {
      setRequestModal(prev => ({ ...prev, submitting: true }));

      await api.promoter.requestToPromoteEvent({
        event_id: requestModal.event.id,
        message: requestModal.message || undefined
      });

      toast.success('Request Submitted!', {
        description: 'The organizer will review your request soon.'
      });

      setRequestModal({
        show: false,
        event: null,
        message: '',
        submitting: false
      });

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit request';
      toast.error('Request Failed', {
        description: errorMessage
      });
      setRequestModal(prev => ({ ...prev, submitting: false }));
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to check if promoter has already requested for this event
  const getEventRequest = (eventId: string) => {
    return requests.find(req => req.event_id === eventId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Events to Promote</h1>
        <p className="text-gray-600 mt-1 font-body">
          Request permission from organizers to promote their events and earn commission
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="available">Available Events</TabsTrigger>
          <TabsTrigger value="requests">
            My Requests
            {requests.filter(r => r.status === 'PENDING').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {requests.filter(r => r.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Available Events Tab */}
        <TabsContent value="available" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search events by name, location, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No events found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const existingRequest = getEventRequest(event.id);
                return (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-primary/10">
                      <Image
                        src={getImageUrl(event.portrait_image_url || event.banner_image_url)}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary">{event.category.replace('_', ' ')}</Badge>
                      </div>
                      {existingRequest && (
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(existingRequest.status)}
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-bold text-lg line-clamp-2 font-comfortaa">{event.title}</h3>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.start_datetime), 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 font-body">
                        By {event.organizer.business_name}
                      </p>

                      <div className="flex gap-2 pt-2">
                        {existingRequest ? (
                          existingRequest.status === 'APPROVED' ? (
                            <Button
                              size="sm"
                              onClick={() => router.push('/promoter/codes')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Create Promo Code
                            </Button>
                          ) : existingRequest.status === 'PENDING' ? (
                            <Button
                              size="sm"
                              disabled
                              variant="secondary"
                              className="flex-1"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Request Pending
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleRequestToPromote(event)}
                              variant="outline"
                              className="flex-1"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Request Again
                            </Button>
                          )
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleRequestToPromote(event)}
                            className="flex-1"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Request to Promote
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/events/${event.slug}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No requests yet</p>
                <p className="text-sm text-gray-400">
                  Browse available events and request permission to promote them
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg font-comfortaa">
                            {request.event.title}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(request.event.start_datetime), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{request.event.location}</span>
                          </div>
                        </div>

                        {request.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 italic">
                              Your message: "{request.message}"
                            </p>
                          </div>
                        )}

                        {request.status === 'APPROVED' && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm font-semibold text-green-900">Approved!</p>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <p>Commission: <strong>{request.commission_percentage}%</strong></p>
                              <p>Discount: <strong>{request.discount_percentage}%</strong></p>
                            </div>
                            {request.response_message && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                "{request.response_message}"
                              </p>
                            )}
                          </div>
                        )}

                        {request.status === 'REJECTED' && request.response_message && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-900">
                              Reason: {request.response_message}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-3">
                          Requested {format(new Date(request.created_at), 'PPP')}
                        </p>
                      </div>

                      {request.status === 'APPROVED' && (
                        <Button
                          onClick={() => router.push('/promoter/codes')}
                          size="sm"
                        >
                          Create Code
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Modal */}
      {requestModal.show && requestModal.event && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl">
            <CardHeader className="bg-white">
              <CardTitle className="font-comfortaa text-gray-900">Request to Promote Event</CardTitle>
              <CardDescription className="font-body text-gray-600">
                Send a request to the organizer to promote "{requestModal.event.title}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium mb-2 font-body">
                  Message to Organizer (Optional)
                </label>
                <Textarea
                  value={requestModal.message}
                  onChange={(e) => setRequestModal(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell the organizer why you'd be great at promoting their event, your audience reach, promotion strategy, etc."
                  rows={5}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {requestModal.message.length}/500 characters
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  The organizer will review your request and set commission rates if approved.
                  You'll be notified via email once they respond.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={submitRequest}
                  disabled={requestModal.submitting}
                  className="flex-1"
                >
                  {requestModal.submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRequestModal({ show: false, event: null, message: '', submitting: false })}
                  disabled={requestModal.submitting}
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

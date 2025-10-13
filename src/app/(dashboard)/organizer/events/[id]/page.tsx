'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ImageUpload from '@/components/shared/ImageUpload';
import { 
  ArrowLeft, Save, Trash2, Eye, EyeOff, Calendar, MapPin, 
  DollarSign, Users, Plus, Edit, Ticket 
} from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_available: number;
  is_active: boolean;
  is_sold_out: boolean;
  sold_percentage: number;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string | null;
  slug: string;
  status: string;
  is_published: boolean;
}

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEventDetails();
    fetchTicketTypes();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await apiClient.get(`/api/v1/events/${eventId}`);
      setEvent(response.data);
      setFormData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const response = await apiClient.get(`/api/v1/tickets/events/${eventId}/ticket-types`, {
        params: { include_inactive: true }
      });
      setTicketTypes(response.data);
    } catch (err: any) {
      console.error('Failed to load ticket types:', err);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiClient.patch(`/api/v1/events/${eventId}`, formData);
      setEvent(response.data);
      setFormData(response.data);
      setIsEditing(false);
      setSuccess('Event updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    try {
      const endpoint = event?.is_published ? 'unpublish' : 'publish';
      const response = await apiClient.post(`/api/v1/events/${eventId}/${endpoint}`);
      setEvent(response.data);
      setSuccess(`Event ${event?.is_published ? 'unpublished' : 'published'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update publish status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/events/${eventId}`);
      router.push('/organizer/events');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete event');
    }
  };

  const formatCurrency = (amount: string | number) => {
    return `KSh ${parseFloat(amount.toString()).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 font-body">Event not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">
              {event.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={event.is_published ? 'default' : 'secondary'}>
                {event.is_published ? 'Published' : 'Draft'}
              </Badge>
              <Badge variant="outline">{event.status}</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={togglePublish}>
            {event.is_published ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {event.is_published ? 'Unpublish' : 'Publish'}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/organizer/analytics`)}>
            Analytics
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Event Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-comfortaa">Event Details</CardTitle>
          <Button
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => {
              if (isEditing) {
                handleUpdate();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Event
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              {/* UPDATED: Image Upload Component */}
              <div>
                <ImageUpload
                  value={formData.banner_image_url || ''}
                  onChange={(url) => setFormData({ ...formData, banner_image_url: url })}
                  uploadType="event_banner"
                  entityId={eventId}
                  label="Event Banner"
                  aspectRatio="16:9"
                  recommendedSize="1920x1080px"
                  maxSizeMB={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">Title</label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Description</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 font-body">Category</label>
                  <select
                    className="w-full px-3 py-2 border rounded-md font-body"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="music">Music</option>
                    <option value="sports">Sports</option>
                    <option value="conference">Conference</option>
                    <option value="workshop">Workshop</option>
                    <option value="party">Party</option>
                    <option value="festival">Festival</option>
                    <option value="exhibition">Exhibition</option>
                    <option value="comedy">Comedy</option>
                    <option value="theater">Theater</option>
                    <option value="food_drink">Food & Drink</option>
                    <option value="charity">Charity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 font-body">Location</label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 font-body">Start Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_datetime?.slice(0, 16) || ''}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 font-body">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_datetime?.slice(0, 16) || ''}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {event.banner_image_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 font-body">Banner Image</h3>
                  <img 
                    src={event.banner_image_url} 
                    alt="Event banner" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500 font-body">Description</h3>
                <p className="mt-1 font-body">{event.description || 'No description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 font-body">
                    <Calendar className="w-4 h-4" /> Date & Time
                  </h3>
                  <p className="mt-1 font-body">{new Date(event.start_datetime).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 font-body">to {new Date(event.end_datetime).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 font-body">
                    <MapPin className="w-4 h-4" /> Location
                  </h3>
                  <p className="mt-1 font-body">{event.location}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ticket Types */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-comfortaa">
            <Ticket className="w-5 h-5" />
            Ticket Types
          </CardTitle>
          <Button onClick={() => router.push(`/organizer/events/${eventId}/tickets/create`)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Ticket Type
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ticketTypes.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold font-comfortaa">{ticket.name}</h4>
                    <Badge variant={ticket.is_active ? 'default' : 'secondary'}>
                      {ticket.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {ticket.is_sold_out && (
                      <Badge variant="destructive">Sold Out</Badge>
                    )}
                  </div>
                  {ticket.description && (
                    <p className="text-sm text-gray-600 mt-1 font-body">{ticket.description}</p>
                  )}
                  <div className="flex items-center gap-6 mt-2 text-sm">
                    <span className="flex items-center gap-1 font-medium text-[#EB7D30] font-body">
                      <DollarSign className="w-4 h-4" />
                      {formatCurrency(ticket.price)}
                    </span>
                    <span className="flex items-center gap-1 font-body">
                      <Users className="w-4 h-4" />
                      {ticket.quantity_sold} / {ticket.quantity_total} sold
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#EB7D30] h-2 rounded-full"
                          style={{ width: `${ticket.sold_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {ticketTypes.length === 0 && (
              <p className="text-center text-gray-500 py-8 font-body">No ticket types yet. Add one to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
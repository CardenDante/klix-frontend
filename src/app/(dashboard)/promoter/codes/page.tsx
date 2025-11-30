'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Code, Plus, Search, Share2, BarChart, Power,
  Twitter, Facebook, Instagram, MessageCircle, Copy,
  CheckCircle, ExternalLink, Ticket, DollarSign, AlertCircle
} from 'lucide-react';

interface ApprovedEvent {
  id: string; // approval id
  event_id: string;
  commission_percentage: number | null;
  discount_percentage: number | null;
  status: string;
  approved_at: string;
  event?: {
    id: string;
    title: string;
    slug: string;
    start_datetime: string;
  };
}

interface PromoCode {
  code_id: string;
  code: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  code_type: string;
  discount_percentage: number | null;
  commission_percentage: number | null;
  is_active: boolean;
  times_used: number;
  tickets_sold: number;
  revenue_generated: number;
  total_discount_given: number;
  total_commission_earned: number;
  created_at: string;
}

export default function PromoterCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<ApprovedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shareCode, setShareCode] = useState<PromoCode | null>(null);

  const [formData, setFormData] = useState({
    event_id: '',
    code_type: 'commission' as 'discount' | 'commission',
  });

  const [selectedEvent, setSelectedEvent] = useState<ApprovedEvent | null>(null);

  useEffect(() => {
    fetchCodes();
    fetchApprovedEvents();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await api.promoter.myCodes({ page_size: 100 });
      console.log('My Codes API Response:', response.data);
      console.log('Codes array:', response.data.data);
      setCodes(response.data.data || []);
    } catch (err) {
      console.error('Failed to load codes:', err);
      setError('Failed to load promo codes. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedEvents = async () => {
    try {
      // Fetch events promoter is approved for
      const response = await api.promoter.approvedEvents();
      setApprovedEvents(response.data || []);
    } catch (err) {
      console.error('Failed to load approved events:', err);
      setError('Failed to load approved events. Make sure you have organizer approval first.');
    }
  };

  const handleEventSelect = (eventId: string) => {
    const event = approvedEvents.find(e => e.event_id === eventId);
    setSelectedEvent(event || null);
    setFormData({
      ...formData,
      event_id: eventId,
      // Determine code type based on what organizer approved
      code_type: event?.commission_percentage ? 'commission' : 'discount'
    });
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedEvent) {
      setError('Please select an event');
      return;
    }

    const payload = {
      event_id: formData.event_id,
      code_type: formData.code_type
      // NO commission_percentage or discount_percentage - set by organizer!
    };

    try {
      const createResponse = await api.promoter.createCode(payload);
      console.log('Code created:', createResponse.data);
      setSuccess('Promo code created successfully!');
      setShowCreateForm(false);
      setFormData({
        event_id: '',
        code_type: 'commission',
      });
      setSelectedEvent(null);
      console.log('Fetching codes after creation...');
      await fetchCodes();
    } catch (err: any) {
      console.error('Create code error:', err);
      setError(err.response?.data?.detail || 'Failed to create code');
    }
  };

  const handleDeactivate = async (codeId: string) => {
    try {
      await api.promoter.deactivateCode(codeId);
      setSuccess('Code deactivated successfully');
      fetchCodes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deactivate code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Code copied to clipboard!');
  };

  const generateShareLink = (code: PromoCode, platform: string) => {
    // Build tracking URL with UTM parameters
    const params = new URLSearchParams({
      promo: code.code,
      utm_source: 'promoter',
      utm_medium: platform,
      utm_campaign: code.event_slug,
      platform: platform // For our custom tracking
    });

    const trackingUrl = `${window.location.origin}/events/${code.event_slug}?${params.toString()}`;
    const message = `🎉 Get tickets for ${code.event_name}! Use code ${code.code} at checkout.`;

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(trackingUrl)}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(message + ' ' + trackingUrl)}`;
      case 'instagram':
        // Instagram doesn't support direct sharing with pre-filled text
        // Return the tracking URL for manual copying
        return trackingUrl;
      default:
        return trackingUrl;
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const filteredCodes = codes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.event_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Comfortaa' }}>
            My Promo Codes
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Create and manage your promotional codes</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={approvedEvents.length === 0}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Code
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* No Approved Events Warning */}
      {approvedEvents.length === 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            You haven't been approved by any organizers yet.
            <a href="/promoter/events" className="underline ml-1 font-semibold text-primary">
              Request approval to promote an event →
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {showCreateForm && approvedEvents.length > 0 && (
        <Card className="border-[#EB7D30]">
          <CardHeader>
            <CardTitle>Create New Promo Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Event (You're Approved For)
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.event_id}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  required
                >
                  <option value="">Choose an event...</option>
                  {approvedEvents.map((approval) => (
                    <option key={approval.event_id} value={approval.event_id}>
                      {approval.event?.title || 'Unknown Event'} - {approval.event?.start_datetime ? new Date(approval.event.start_datetime).toLocaleDateString() : 'N/A'}
                      {approval.commission_percentage && ` (${approval.commission_percentage}% commission)`}
                      {approval.discount_percentage && ` (${approval.discount_percentage}% discount)`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only shows events where organizer has approved you
                </p>
              </div>

              {selectedEvent && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Organizer-Set Rates (Read-Only)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.commission_percentage && (
                      <div>
                        <p className="text-sm text-gray-600">Commission Rate</p>
                        <p className="text-2xl font-bold text-green-700">
                          {selectedEvent.commission_percentage}%
                        </p>
                      </div>
                    )}
                    {selectedEvent.discount_percentage && (
                      <div>
                        <p className="text-sm text-gray-600">Discount Rate</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {selectedEvent.discount_percentage}%
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    These rates were set by the organizer and cannot be changed.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={!selectedEvent}>Create Code</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setSelectedEvent(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search codes or events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Codes List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCodes.map((code) => (
          <Card key={code.code_id} className="hover:shadow-md transition">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="bg-[#EB7D30] text-base sm:text-lg px-3 sm:px-4 py-1">{code.code}</Badge>
                    <Badge variant={code.is_active ? 'default' : 'secondary'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={code.code_type === 'commission' ? 'bg-green-500' : 'bg-blue-500'}>
                      {code.code_type}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-base sm:text-lg mb-1">{code.event_name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    {new Date(code.event_date).toLocaleDateString()} • Created {new Date(code.created_at).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Times Used</p>
                      <p className="text-xl font-bold">{code.times_used}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tickets Sold</p>
                      <p className="text-xl font-bold flex items-center gap-1">
                        <Ticket className="w-4 h-4" />
                        {code.tickets_sold}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenue Generated</p>
                      <p className="text-xl font-bold">{formatCurrency(code.revenue_generated)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Commission Earned</p>
                      <p className="text-xl font-bold text-[#EB7D30] flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(code.total_commission_earned)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                    className="w-full sm:w-auto"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareCode(code)}
                    className="w-full sm:w-auto"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  {code.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(code.code_id)}
                      className="w-full sm:w-auto"
                    >
                      <Power className="w-4 h-4 mr-1" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCodes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Code className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {codes.length === 0 ? 'No promo codes yet' : 'No codes found matching your search'}
              </p>
              {codes.length === 0 && approvedEvents.length > 0 && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Code
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Share Modal */}
      {shareCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Share Code: {shareCode.code}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Share your promo code on social media to reach more people!
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(generateShareLink(shareCode, 'twitter'), '_blank')}
                  className="w-full"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(generateShareLink(shareCode, 'facebook'), '_blank')}
                  className="w-full"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(generateShareLink(shareCode, 'whatsapp'), '_blank')}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generateShareLink(shareCode, 'generic'))}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => setShareCode(null)} className="w-full">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

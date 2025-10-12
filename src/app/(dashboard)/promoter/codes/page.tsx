'use client';

import { useState, useEffect } from 'react';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Code, Plus, Search, Share2, BarChart, Power, 
  Twitter, Facebook, Instagram, MessageCircle, Copy,
  CheckCircle, ExternalLink, Ticket, DollarSign
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  start_datetime: string;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shareCode, setShareCode] = useState<PromoCode | null>(null);

  const [formData, setFormData] = useState({
    event_id: '',
    code_type: 'commission' as 'discount' | 'commission',
    discount_percentage: '',
    commission_percentage: ''
  });

  useEffect(() => {
    fetchCodes();
    fetchEvents();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await apiClient.get('/promoters/my-codes', {
        params: { page_size: 100 }
      });
      setCodes(response.data.data || []);
    } catch (err) {
      console.error('Failed to load codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/events', {
        params: { page_size: 100 }
      });
      setEvents(response.data.data || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload: any = {
      event_id: formData.event_id,
      code_type: formData.code_type
    };

    if (formData.code_type === 'discount') {
      payload.discount_percentage = parseFloat(formData.discount_percentage);
    } else {
      payload.commission_percentage = parseFloat(formData.commission_percentage);
    }

    try {
      await apiClient.post('/promoters/codes', payload);
      setSuccess('Promo code created successfully!');
      setShowCreateForm(false);
      setFormData({
        event_id: '',
        code_type: 'commission',
        discount_percentage: '',
        commission_percentage: ''
      });
      fetchCodes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create code');
    }
  };

  const handleDeactivate = async (codeId: string) => {
    try {
      await apiClient.post(`/promoters/code/${codeId}/deactivate`);
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
    const eventUrl = `${window.location.origin}/events/${code.event_slug}?promo=${code.code}`;
    const message = `🎉 Get tickets for ${code.event_name}! Use code ${code.code} at checkout.`;

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(eventUrl)}`;
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(message + ' ' + eventUrl)}`;
      default:
        return eventUrl;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
            My Promo Codes
          </h1>
          <p className="text-gray-600 mt-1">Create and manage your promotional codes</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Code
        </Button>
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

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-[#EB7D30]">
          <CardHeader>
            <CardTitle>Create New Promo Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Event</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.event_id}
                  onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                  required
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.start_datetime).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Code Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg transition ${
                      formData.code_type === 'discount'
                        ? 'border-[#EB7D30] bg-orange-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setFormData({ ...formData, code_type: 'discount' })}
                  >
                    <h4 className="font-semibold mb-1">Discount Code</h4>
                    <p className="text-sm text-gray-600">Give customers a discount</p>
                  </button>
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg transition ${
                      formData.code_type === 'commission'
                        ? 'border-[#EB7D30] bg-orange-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setFormData({ ...formData, code_type: 'commission' })}
                  >
                    <h4 className="font-semibold mb-1">Commission Code</h4>
                    <p className="text-sm text-gray-600">Earn commission on sales</p>
                  </button>
                </div>
              </div>

              {formData.code_type === 'discount' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Percentage</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="e.g., 10"
                    required
                  />
                </div>
              )}

              {formData.code_type === 'commission' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Commission Percentage</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.commission_percentage}
                    onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                    placeholder="e.g., 5"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">Create Code</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-[#EB7D30] text-lg px-4 py-1">{code.code}</Badge>
                    <Badge variant={code.is_active ? 'default' : 'secondary'}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={code.code_type === 'commission' ? 'bg-green-500' : 'bg-blue-500'}>
                      {code.code_type}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{code.event_name}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {new Date(code.event_date).toLocaleDateString()} • Created {new Date(code.created_at).toLocaleDateString()}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareCode(code)}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  {code.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(code.code_id)}
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
              {codes.length === 0 && (
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
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Trash2, Ticket } from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_available: number;
  sale_start_date: string | null;
  sale_end_date: string | null;
  min_purchase: number;
  max_purchase: number;
  is_active: boolean;
  is_sold_out: boolean;
}

export default function EditTicketTypePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const ticketId = params.ticketId as string;

  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity_total: '',
    sale_start_date: '',
    sale_end_date: '',
    min_purchase: '',
    max_purchase: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTicketType();
  }, [ticketId]);

  const fetchTicketType = async () => {
    try {
      const response = await apiClient.get(`/api/v1/tickets/events/${eventId}/ticket-types`);
      const tickets = response.data;
      const currentTicket = tickets.find((t: TicketType) => t.id === ticketId);

      if (currentTicket) {
        setTicket(currentTicket);
        setFormData({
          name: currentTicket.name,
          description: currentTicket.description || '',
          price: currentTicket.price,
          quantity_total: currentTicket.quantity_total.toString(),
          sale_start_date: currentTicket.sale_start_date ? currentTicket.sale_start_date.slice(0, 16) : '',
          sale_end_date: currentTicket.sale_end_date ? currentTicket.sale_end_date.slice(0, 16) : '',
          min_purchase: currentTicket.min_purchase.toString(),
          max_purchase: currentTicket.max_purchase.toString(),
          is_active: currentTicket.is_active,
        });
      } else {
        setError('Ticket type not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch ticket type:', err);
      setError(err.response?.data?.detail || 'Failed to load ticket type');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        quantity_total: parseInt(formData.quantity_total),
        sale_start_date: formData.sale_start_date || null,
        sale_end_date: formData.sale_end_date || null,
        min_purchase: parseInt(formData.min_purchase),
        max_purchase: parseInt(formData.max_purchase),
        is_active: formData.is_active,
      };

      const response = await apiClient.patch(`/api/v1/tickets/ticket-types/${ticketId}`, payload);
      setTicket(response.data);
      setSuccess('Ticket type updated successfully!');

      setTimeout(() => {
        router.push(`/organizer/events/${eventId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update ticket type:', err);
      setError(err.response?.data?.detail || 'Failed to update ticket type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;

    if (ticket.quantity_sold > 0) {
      setError('Cannot delete ticket type with sold tickets');
      return;
    }

    if (!confirm('Are you sure you want to delete this ticket type? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/tickets/ticket-types/${ticketId}`);
      router.push(`/organizer/events/${eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete ticket type');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Loading ticket type...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 font-body">Ticket type not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-comfortaa flex items-center gap-2">
              <Ticket className="w-8 h-8" />
              Edit Ticket Type
            </h1>
            <p className="text-gray-600 font-body mt-1">{ticket.name}</p>
          </div>
        </div>

        <Button variant="destructive" onClick={handleDelete} disabled={ticket.quantity_sold > 0}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 font-body">Sold</p>
            <p className="text-2xl font-bold text-gray-900 font-comfortaa">{ticket.quantity_sold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 font-body">Available</p>
            <p className="text-2xl font-bold text-gray-900 font-comfortaa">{ticket.quantity_available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 font-body">Revenue</p>
            <p className="text-2xl font-bold text-[#EB7D30] font-comfortaa">
              KSh {(parseFloat(ticket.price) * ticket.quantity_sold).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Ticket Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium font-body">Active Status</p>
                <p className="text-sm text-gray-600 font-body">
                  {formData.is_active ? 'Ticket is visible and available for purchase' : 'Ticket is hidden from customers'}
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 font-body">
                Ticket Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., General Admission, VIP, Early Bird"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 font-body">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what's included with this ticket..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Price (KSh) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Total Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min={ticket.quantity_sold}
                  value={formData.quantity_total}
                  onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cannot be less than sold tickets ({ticket.quantity_sold})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Sale Start Date</label>
                <Input
                  type="datetime-local"
                  value={formData.sale_start_date}
                  onChange={(e) => setFormData({ ...formData, sale_start_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">Sale End Date</label>
                <Input
                  type="datetime-local"
                  value={formData.sale_end_date}
                  onChange={(e) => setFormData({ ...formData, sale_end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">Min Purchase Per Order</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">Max Purchase Per Order</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_purchase}
                  onChange={(e) => setFormData({ ...formData, max_purchase: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

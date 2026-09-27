'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Ticket } from 'lucide-react';

export default function CreateTicketTypePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity_total: '',
    sale_start_date: '',
    sale_end_date: '',
    min_purchase: '1',
    max_purchase: '10',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Convert string values to appropriate types
      const payload = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        quantity_total: parseInt(formData.quantity_total),
        sale_start_date: formData.sale_start_date || null,
        sale_end_date: formData.sale_end_date || null,
        min_purchase: parseInt(formData.min_purchase),
        max_purchase: parseInt(formData.max_purchase),
        is_active: true,
      };

      await apiClient.post(`/api/v1/tickets/events/${eventId}/ticket-types`, payload);

      // Navigate back to event details
      router.push(`/organizer/events/${eventId}`);
    } catch (err: any) {
      console.error('Failed to create ticket type:', err);
      setError(err.response?.data?.detail || 'Failed to create ticket type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa flex items-center gap-2">
            <Ticket className="w-8 h-8" />
            Create Ticket Type
          </h1>
          <p className="text-gray-600 font-body mt-1">Add a new ticket type to your event</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="font-comfortaa">Ticket Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
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
                  placeholder="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Total Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity_total}
                  onChange={(e) => setFormData({ ...formData, quantity_total: e.target.value })}
                  placeholder="100"
                  required
                />
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
                <p className="text-xs text-gray-500 mt-1">Leave empty to start immediately</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">Sale End Date</label>
                <Input
                  type="datetime-local"
                  value={formData.sale_end_date}
                  onChange={(e) => setFormData({ ...formData, sale_end_date: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to sell until event</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Min Purchase Per Order
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-body">
                  Max Purchase Per Order
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_purchase}
                  onChange={(e) => setFormData({ ...formData, max_purchase: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Ticket Type'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

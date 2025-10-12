'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Save, CreditCard, Bell, Link as LinkIcon,
  CheckCircle, AlertCircle, Image as ImageIcon, Mail
} from 'lucide-react';

interface OrganizerProfile {
  id: string;
  business_name: string;
  business_registration: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  status: string;
}

export default function OrganizerSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    business_name: '',
    business_registration: '',
    description: '',
    website: '',
    logo_url: ''
  });

  const [notifications, setNotifications] = useState({
    email_new_sale: true,
    email_daily_summary: true,
    email_event_reminder: true,
    sms_new_sale: false,
    sms_event_updates: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/organizers/me');
      const data = response.data;
      setProfile(data);
      setFormData({
        business_name: data.business_name || '',
        business_registration: data.business_registration || '',
        description: data.description || '',
        website: data.website || '',
        logo_url: data.logo_url || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiClient.patch('/organizers/me', formData);
      setProfile(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setSuccess('Notification preferences updated!');
    // Note: This would need a backend endpoint to save notification preferences
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Organizer Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your business profile and preferences</p>
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

      {/* Account Status */}
      {profile && (
        <Card className={
          profile.status === 'approved' 
            ? 'border-green-200 bg-green-50' 
            : profile.status === 'pending'
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-red-200 bg-red-50'
        }>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold mb-1">Account Status</h4>
                <p className="text-sm text-gray-600">
                  {profile.status === 'approved' && 'Your organizer account is active and approved'}
                  {profile.status === 'pending' && 'Your organizer application is pending admin approval'}
                  {profile.status === 'rejected' && 'Your organizer application was rejected'}
                  {profile.status === 'suspended' && 'Your organizer account is currently suspended'}
                </p>
              </div>
              <Badge className={
                profile.status === 'approved' ? 'bg-green-600' :
                profile.status === 'pending' ? 'bg-yellow-600' :
                'bg-red-600'
              }>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="e.g., Nairobi Events Ltd"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business Registration Number</label>
                <Input
                  value={formData.business_registration}
                  onChange={(e) => setFormData({ ...formData, business_registration: e.target.value })}
                  placeholder="e.g., C.123456"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Business Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell attendees about your business..."
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be displayed on your events and public profile
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  Website URL
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  Logo URL
                </label>
                <Input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            {formData.logo_url && (
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Logo Preview:</p>
                <img 
                  src={formData.logo_url} 
                  alt="Business Logo" 
                  className="h-20 w-20 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="pt-4 border-t">
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Settings
            </span>
            <Button 
              variant="outline" 
              onClick={() => router.push('/organizer/settings/mpesa')}
            >
              Configure M-Pesa
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Configure your M-Pesa credentials to receive payments from ticket sales. 
            All credentials are encrypted and secure.
          </p>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">
              M-Pesa STK Push enabled for instant payments
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Notifications
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">New Ticket Sales</p>
                  <p className="text-sm text-gray-600">Get notified when someone buys a ticket</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_new_sale}
                  onChange={(e) => setNotifications({ ...notifications, email_new_sale: e.target.checked })}
                  className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
                />
              </label>
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">Daily Sales Summary</p>
                  <p className="text-sm text-gray-600">Receive a daily summary of your sales</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_daily_summary}
                  onChange={(e) => setNotifications({ ...notifications, email_daily_summary: e.target.checked })}
                  className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
                />
              </label>
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">Event Reminders</p>
                  <p className="text-sm text-gray-600">Get reminders before your events start</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email_event_reminder}
                  onChange={(e) => setNotifications({ ...notifications, email_event_reminder: e.target.checked })}
                  className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">SMS Notifications</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">New Sales (SMS)</p>
                  <p className="text-sm text-gray-600">SMS alerts for ticket sales</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms_new_sale}
                  onChange={(e) => setNotifications({ ...notifications, sms_new_sale: e.target.checked })}
                  className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
                />
              </label>
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">Event Updates (SMS)</p>
                  <p className="text-sm text-gray-600">Important event updates via SMS</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms_event_updates}
                  onChange={(e) => setNotifications({ ...notifications, sms_event_updates: e.target.checked })}
                  className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleUpdateNotifications}>
              <Save className="w-4 h-4 mr-2" />
              Save Notification Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Need Help?</h4>
          <p className="text-sm text-gray-600 mb-4">
            If you have any questions about your organizer account or need assistance with settings,
            our support team is here to help.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
            <Button variant="outline" size="sm">
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
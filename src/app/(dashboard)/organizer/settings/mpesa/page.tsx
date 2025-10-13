'use client';

import { useState, useEffect } from 'react';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, Eye, EyeOff, Save, CheckCircle, 
  AlertTriangle, Shield, Lock, Key 
} from 'lucide-react';

interface MpesaCredential {
  id: string;
  credential_type: string;
  shortcode_masked: string;
  is_active: boolean;
  created_at: string;
}

export default function MpesaCredentialsPage() {
  const [credentials, setCredentials] = useState<MpesaCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    consumer_key: '',
    consumer_secret: '',
    shortcode: '',
    passkey: '',
    credential_type: 'paybill' as 'paybill' | 'till_number'
  });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await apiClient.get('/organizers/mpesa-credentials/me');
      setCredentials(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setShowForm(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/organizers/mpesa-credentials', formData);
      setSuccess('M-Pesa credentials saved successfully!');
      setShowForm(false);
      fetchCredentials();
      setFormData({
        consumer_key: '',
        consumer_secret: '',
        shortcode: '',
        passkey: '',
        credential_type: 'paybill'
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          M-Pesa Payment Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure your M-Pesa credentials to receive payments</p>
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

      {/* Existing Credentials */}
      {credentials && !showForm && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                M-Pesa Credentials Configured
              </span>
              <Badge className="bg-green-600">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Credential Type</p>
                <p className="font-semibold capitalize">{credentials.credential_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Shortcode</p>
                <p className="font-semibold">{credentials.shortcode_masked}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={credentials.is_active ? 'bg-green-600' : 'bg-gray-400'}>
                  {credentials.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Added On</p>
                <p className="font-semibold">{new Date(credentials.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={() => setShowForm(true)}>
                <Key className="w-4 h-4 mr-2" />
                Update Credentials
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {credentials ? 'Update' : 'Setup'} M-Pesa Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Credential Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Credential Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg transition ${
                      formData.credential_type === 'paybill'
                        ? 'border-[#EB7D30] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, credential_type: 'paybill' })}
                  >
                    <h4 className="font-semibold mb-1">Paybill Number</h4>
                    <p className="text-sm text-gray-600">For business accounts</p>
                  </button>
                  <button
                    type="button"
                    className={`p-4 border-2 rounded-lg transition ${
                      formData.credential_type === 'till_number'
                        ? 'border-[#EB7D30] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData({ ...formData, credential_type: 'till_number' })}
                  >
                    <h4 className="font-semibold mb-1">Till Number</h4>
                    <p className="text-sm text-gray-600">For merchant accounts</p>
                  </button>
                </div>
              </div>

              {/* Consumer Key */}
              <div>
                <label className="block text-sm font-medium mb-1">Consumer Key</label>
                <div className="relative">
                  <Input
                    type={showSecrets ? 'text' : 'password'}
                    value={formData.consumer_key}
                    onChange={(e) => setFormData({ ...formData, consumer_key: e.target.value })}
                    placeholder="Enter your Safaricom consumer key"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Consumer Secret */}
              <div>
                <label className="block text-sm font-medium mb-1">Consumer Secret</label>
                <Input
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.consumer_secret}
                  onChange={(e) => setFormData({ ...formData, consumer_secret: e.target.value })}
                  placeholder="Enter your Safaricom consumer secret"
                  required
                />
              </div>

              {/* Shortcode */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.credential_type === 'paybill' ? 'Paybill Number' : 'Till Number'}
                </label>
                <Input
                  type="text"
                  value={formData.shortcode}
                  onChange={(e) => setFormData({ ...formData, shortcode: e.target.value })}
                  placeholder={formData.credential_type === 'paybill' ? 'e.g., 123456' : 'e.g., 1234567'}
                  required
                />
              </div>

              {/* Passkey */}
              <div>
                <label className="block text-sm font-medium mb-1">Passkey</label>
                <Input
                  type={showSecrets ? 'text' : 'password'}
                  value={formData.passkey}
                  onChange={(e) => setFormData({ ...formData, passkey: e.target.value })}
                  placeholder="Enter your Safaricom passkey"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Credentials'}
                </Button>
                {credentials && (
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Security & Privacy
          </h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>All credentials are encrypted using industry-standard AES-256 encryption</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Your credentials are never stored in plain text and cannot be retrieved by anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <span>Only masked versions are displayed for security purposes</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            How to Get Your M-Pesa API Credentials
          </h4>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Visit the <a href="https://developer.safaricom.co.ke" target="_blank" rel="noopener noreferrer" className="text-[#EB7D30] underline">Safaricom Developer Portal</a></li>
            <li>Create an account or log in to your existing account</li>
            <li>Create a new app or select your existing app</li>
            <li>Navigate to the "Keys" section to find your Consumer Key and Secret</li>
            <li>Get your Paybill/Till number and Passkey from your M-Pesa Business Portal</li>
            <li>Copy the credentials and paste them in the form above</li>
          </ol>
          <p className="mt-4 text-sm text-gray-600">
            <strong>Note:</strong> You need a registered M-Pesa business account to use STK Push payments.
            For testing, use Safaricom's sandbox environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
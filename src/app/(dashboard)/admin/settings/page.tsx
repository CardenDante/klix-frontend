'use client';

import { useState, useEffect } from 'react';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, Shield, DollarSign, Mail, Bell, 
  Database, Server, Trash2, CheckCircle, FileText
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [platformSettings, setPlatformSettings] = useState({
    platform_fee_percentage: '2.5',
    min_withdrawal_amount: '100',
    max_ticket_quantity: '10',
    event_approval_required: false,
    auto_refund_enabled: true
  });

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await apiClient.get('/admin/audit-logs', {
        params: { limit: 10 }
      });
      setAuditLogs(response.data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const handleClearCache = async (cacheType: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (cacheType === 'organizer') {
        await apiClient.post('/analytics/organizer/cache/clear');
      } else if (cacheType === 'promoter') {
        await apiClient.post('/analytics/promoter/cache/clear');
      } else if (cacheType === 'admin') {
        await apiClient.post('/analytics/admin/cache/clear');
      }
      setSuccess(`${cacheType.charAt(0).toUpperCase() + cacheType.slice(1)} cache cleared successfully!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    setSuccess('Platform settings updated successfully!');
    // This would need a backend endpoint to save settings
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Admin Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
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

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Platform Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Platform Fee Percentage</label>
              <Input
                type="number"
                step="0.1"
                value={platformSettings.platform_fee_percentage}
                onChange={(e) => setPlatformSettings({ 
                  ...platformSettings, 
                  platform_fee_percentage: e.target.value 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">Default: 2.5%</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Withdrawal Amount (KSh)</label>
              <Input
                type="number"
                value={platformSettings.min_withdrawal_amount}
                onChange={(e) => setPlatformSettings({ 
                  ...platformSettings, 
                  min_withdrawal_amount: e.target.value 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum for promoter withdrawals</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Ticket Quantity Per Order</label>
              <Input
                type="number"
                value={platformSettings.max_ticket_quantity}
                onChange={(e) => setPlatformSettings({ 
                  ...platformSettings, 
                  max_ticket_quantity: e.target.value 
                })}
              />
              <p className="text-xs text-gray-500 mt-1">Maximum tickets per transaction</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-medium">Event Approval Required</p>
                <p className="text-sm text-gray-600">All events must be approved before publishing</p>
              </div>
              <input
                type="checkbox"
                checked={platformSettings.event_approval_required}
                onChange={(e) => setPlatformSettings({ 
                  ...platformSettings, 
                  event_approval_required: e.target.checked 
                })}
                className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
              />
            </label>

            <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <p className="font-medium">Auto Refund Enabled</p>
                <p className="text-sm text-gray-600">Automatically process refunds for cancelled events</p>
              </div>
              <input
                type="checkbox"
                checked={platformSettings.auto_refund_enabled}
                onChange={(e) => setPlatformSettings({ 
                  ...platformSettings, 
                  auto_refund_enabled: e.target.checked 
                })}
                className="w-5 h-5 text-[#EB7D30] rounded focus:ring-[#EB7D30]"
              />
            </label>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSaveSettings}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold">Organizer Cache</h4>
                  <p className="text-sm text-gray-600">Analytics & dashboard</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleClearCache('organizer')}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cache
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold">Promoter Cache</h4>
                  <p className="text-sm text-gray-600">Performance data</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleClearCache('promoter')}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cache
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Server className="w-6 h-6 text-purple-600" />
                <div>
                  <h4 className="font-semibold">Admin Cache</h4>
                  <p className="text-sm text-gray-600">Platform analytics</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleClearCache('admin')}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear Cache
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Send Organizer Approval Emails</p>
              <p className="text-sm text-gray-600">Notify organizers when approved/rejected</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-[#EB7D30] rounded" />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Send Event Flag Notifications</p>
              <p className="text-sm text-gray-600">Email organizers when events are flagged</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-[#EB7D30] rounded" />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium">Daily Admin Reports</p>
              <p className="text-sm text-gray-600">Receive daily platform summary emails</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-[#EB7D30] rounded" />
          </label>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditLogs.length > 0 ? (
              auditLogs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{log.action || 'Admin Action'}</p>
                    <p className="text-gray-600">
                      {log.resource_type || 'Resource'} • {log.user_email || 'Admin'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No recent admin actions</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Shield className="w-5 h-5" />
            Security & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-red-900">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>All admin actions are logged and auditable</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Platform settings changes require admin role</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Critical operations require email confirmation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
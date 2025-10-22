'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';

// ==================== TYPES ====================

interface PlatformSettings {
  platform_fee_percentage: number;
  min_withdrawal_amount: number;
  max_ticket_quantity: number;
  event_approval_required: boolean;
  auto_refund_enabled: boolean;
  promoter_commission_rate: number;
  max_refund_days: number;
}

interface EmailSettings {
  send_organizer_approval_emails: boolean;
  send_event_flag_notifications: boolean;
  send_daily_admin_reports: boolean;
  send_promoter_approval_emails: boolean;
  send_payment_notifications: boolean;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

interface CacheStats {
  total_keys: number;
  total_size_mb: number;
  last_cleared?: string;
}

// ==================== COMPONENT ====================

export default function AdminSettingsPage() {
  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState<string | null>(null);

  // Settings states
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    platform_fee_percentage: 2.5,
    min_withdrawal_amount: 100,
    max_ticket_quantity: 10,
    event_approval_required: false,
    auto_refund_enabled: true,
    promoter_commission_rate: 10,
    max_refund_days: 7,
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    send_organizer_approval_emails: true,
    send_event_flag_notifications: true,
    send_daily_admin_reports: true,
    send_promoter_approval_emails: true,
    send_payment_notifications: true,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cacheStats, setCacheStats] = useState<Record<string, CacheStats>>({});

  // ==================== DATA FETCHING ====================

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch settings from the API
      // Note: These endpoints may not exist yet, so we handle gracefully
      
      // Fetch audit logs
      try {
        const logsResponse = await api.admin.auditLogs({ limit: 10 });
        const responseData = logsResponse.data;
        if (Array.isArray(responseData)) {
          setAuditLogs(responseData);
        } else if (responseData.logs && Array.isArray(responseData.logs)) {
          setAuditLogs(responseData.logs);
        }
      } catch (err) {
        console.log('Audit logs endpoint not available yet');
      }

    } catch (err) {
      console.error('Settings fetch error:', err);
      // Don't show error for missing endpoints - just use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ==================== ACTION HANDLERS ====================

  const handleSavePlatformSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // Note: This endpoint may not exist yet
      // You'll need to create it in your backend
      await api.admin.settings.updatePlatform(platformSettings);
      
      setSuccess('Platform settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      // If endpoint doesn't exist, show a helpful message
      if (axiosError.response?.status === 404) {
        setError('Settings endpoint not yet implemented. Settings updated locally only.');
      } else {
        setError(
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          'Failed to save platform settings'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // Note: This endpoint may not exist yet
      await api.admin.settings.updateEmail(emailSettings);
      
      setSuccess('Email settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      // If endpoint doesn't exist, show a helpful message
      if (axiosError.response?.status === 404) {
        setError('Settings endpoint not yet implemented. Settings updated locally only.');
      } else {
        setError(
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          'Failed to save email settings'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async (cacheType: 'organizer' | 'promoter' | 'admin' | 'all') => {
    try {
      setClearingCache(cacheType);
      setError(null);

      if (cacheType === 'organizer') {
        await api.analytics.clearOrganizerCache();
      } else if (cacheType === 'promoter') {
        await api.analytics.clearPromoterCache();
      } else if (cacheType === 'admin') {
        await api.analytics.clearAdminCache();
      } else if (cacheType === 'all') {
        // Clear all caches
        await Promise.all([
          api.analytics.clearOrganizerCache(),
          api.analytics.clearPromoterCache(),
          api.analytics.clearAdminCache(),
        ]);
      }
      
      setSuccess(`${cacheType.charAt(0).toUpperCase() + cacheType.slice(1)} cache cleared successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      setError(
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to clear cache'
      );
    } finally {
      setClearingCache(null);
    }
  };

  const handleTestEmail = async () => {
    try {
      setSaving(true);
      setError(null);

      await api.admin.sendTestEmail();
      
      setSuccess('Test email sent successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      // If endpoint doesn't exist, show a helpful message
      if (axiosError.response?.status === 404) {
        setError('Test email endpoint not yet implemented.');
      } else {
        setError(
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          'Failed to send test email'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform settings and preferences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800">{success}</p>
              <button onClick={() => setSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Platform Configuration */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Platform Configuration
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformSettings.platform_fee_percentage}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    platform_fee_percentage: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Fee charged on ticket sales</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Withdrawal (KSh)
                </label>
                <input
                  type="number"
                  min="0"
                  value={platformSettings.min_withdrawal_amount}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    min_withdrawal_amount: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum for withdrawals</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tickets Per Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={platformSettings.max_ticket_quantity}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    max_ticket_quantity: parseInt(e.target.value) || 1
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum per transaction</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promoter Commission (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformSettings.promoter_commission_rate}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    promoter_commission_rate: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Default commission rate</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Refund Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={platformSettings.max_refund_days}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    max_refund_days: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Days before event to allow refunds</p>
              </div>
            </div>

            <div className="pt-6 border-t space-y-3">
              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Event Approval Required</p>
                  <p className="text-sm text-gray-600">All events must be approved before publishing</p>
                </div>
                <input
                  type="checkbox"
                  checked={platformSettings.event_approval_required}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    event_approval_required: e.target.checked 
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium text-gray-900">Auto Refund Enabled</p>
                  <p className="text-sm text-gray-600">Automatically process refunds for cancelled events</p>
                </div>
                <input
                  type="checkbox"
                  checked={platformSettings.auto_refund_enabled}
                  onChange={(e) => setPlatformSettings({ 
                    ...platformSettings, 
                    auto_refund_enabled: e.target.checked 
                  })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="pt-6 border-t">
              <button
                onClick={handleSavePlatformSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? 'Saving...' : 'Save Platform Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Cache Management */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              Cache Management
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'organizer', label: 'Organizer Cache', description: 'Analytics & dashboard', color: 'blue' },
                { type: 'promoter', label: 'Promoter Cache', description: 'Performance data', color: 'green' },
                { type: 'admin', label: 'Admin Cache', description: 'Platform analytics', color: 'purple' },
                { type: 'all', label: 'All Caches', description: 'Clear everything', color: 'red' },
              ].map((cache) => (
                <div key={cache.type} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 bg-${cache.color}-100 rounded-lg flex items-center justify-center`}>
                      <svg className={`w-5 h-5 text-${cache.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{cache.label}</h4>
                      <p className="text-xs text-gray-600">{cache.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClearCache(cache.type as any)}
                    disabled={clearingCache === cache.type}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {clearingCache === cache.type ? 'Clearing...' : 'Clear Cache'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Notifications
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              {[
                { key: 'send_organizer_approval_emails', label: 'Organizer Approval Emails', desc: 'Notify organizers when approved/rejected' },
                { key: 'send_promoter_approval_emails', label: 'Promoter Approval Emails', desc: 'Notify promoters when approved/rejected' },
                { key: 'send_event_flag_notifications', label: 'Event Flag Notifications', desc: 'Email organizers when events are flagged' },
                { key: 'send_payment_notifications', label: 'Payment Notifications', desc: 'Send payment confirmation emails' },
                { key: 'send_daily_admin_reports', label: 'Daily Admin Reports', desc: 'Receive daily platform summary emails' },
              ].map((setting) => (
                <label key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-600">{setting.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailSettings[setting.key as keyof EmailSettings]}
                    onChange={(e) => setEmailSettings({ 
                      ...emailSettings, 
                      [setting.key]: e.target.checked 
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>

            <div className="pt-6 border-t flex gap-3">
              <button
                onClick={handleSaveEmailSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? 'Saving...' : 'Save Email Settings'}
              </button>
              <button
                onClick={handleTestEmail}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Send Test Email
              </button>
            </div>
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recent Admin Actions
            </h2>
          </div>
          <div className="p-6">
            {auditLogs.length > 0 ? (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <p className="text-sm text-gray-600">
                        {log.resource_type} • {log.user_email || 'Admin'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600">No recent admin actions</p>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-red-700 mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Security & Permissions
            </h2>
            <div className="space-y-3 text-sm text-red-900">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>All admin actions are logged and auditable</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Platform settings changes require admin role</p>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Critical operations may require email confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
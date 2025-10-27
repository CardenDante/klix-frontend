'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';

export default function AdminDebugPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(true);
    try {
      const response = await apiCall();
      console.log(`${name} response:`, response);
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          success: true,
          data: response.data,
          status: response.status,
          headers: response.headers
        }
      }));
    } catch (error: any) {
      console.error(`${name} error:`, error);
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          success: false,
          error: error.response?.data || error.message,
          status: error.response?.status,
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults({});
    
    // Test all admin analytics endpoints
    await testEndpoint('Overview', () => api.admin.analytics.overview());
    await testEndpoint('Summary', () => api.admin.analytics.summary());
    await testEndpoint('User Growth', () => api.admin.analytics.userGrowth());
    await testEndpoint('Revenue', () => api.admin.analytics.revenue());
    await testEndpoint('System Health', () => api.admin.analytics.systemHealth());
    
    // Test organizer endpoints
    await testEndpoint('All Organizers', () => api.admin.organizers.list({}));
    await testEndpoint('Pending Organizers', () => api.admin.organizers.pending({}));
    
    // Test statistics
    await testEndpoint('Admin Statistics', () => api.admin.statistics());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Admin API Debug Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            This page helps diagnose API response issues. Check the console for detailed logs.
          </p>
          
          <button
            onClick={runAllTests}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run All Tests'}
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            {Object.entries(results).map(([name, result]: [string, any]) => (
              <div
                key={name}
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  result.success ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.success ? `✓ ${result.status}` : `✗ ${result.status || 'Failed'}`}
                  </span>
                </div>

                <div className="bg-gray-50 rounded p-4 overflow-auto max-h-96">
                  <pre className="text-xs text-gray-800">
                    {JSON.stringify(result.success ? result.data : result.error, null, 2)}
                  </pre>
                </div>

                {result.success && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Data Type:</strong>{' '}
                    {Array.isArray(result.data)
                      ? `Array (${result.data.length} items)`
                      : typeof result.data === 'object'
                      ? `Object with keys: ${Object.keys(result.data).join(', ')}`
                      : typeof result.data}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { UserRole } from '@/lib/types';

// ==================== TYPES ====================

interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  email_verified: boolean;
  profile_image_url?: string;
  last_login?: string;
  total_tickets_purchased?: number;
  total_events_organized?: number;
  total_spent?: number;
  created_at: string;
  updated_at: string;
}

interface UserListParams {
  role?: UserRole;
  is_active?: boolean;
  email_verified?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// ==================== COMPONENT ====================

export default function AdminUsersPage() {
  // State management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [verifiedFilter, setVerifiedFilter] = useState<'verified' | 'unverified' | ''>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ==================== DATA FETCHING ====================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page,
        page_size: pageSize,
      };

      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.is_active = statusFilter === 'active';
      if (verifiedFilter) params.email_verified = verifiedFilter === 'verified';
      if (searchTerm.trim()) params.search = searchTerm.trim();

      console.log('Fetching users with params:', params);
      const response = await api.admin.users.list(params);
      console.log('Users response:', response);
      
      // Handle both paginated and non-paginated responses
      const responseData = response.data;
      
      if (Array.isArray(responseData)) {
        // Non-paginated response
        setUsers(responseData);
        setTotal(responseData.length);
        setTotalPages(1);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // Paginated response
        setUsers(responseData.data);
        setTotal(responseData.total || 0);
        setTotalPages(responseData.total_pages || 0);
      } else {
        // Fallback
        setUsers([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      console.error('Users fetch error:', err);
      console.error('Error response:', axiosError.response);
      console.error('Error request:', axiosError.request);
      
      let errorMessage = 'Failed to load users';
      
      if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to the server. Please check if the API is running and accessible.';
      } else if (axiosError.response) {
        // Server responded with error
        errorMessage = 
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          `Server error: ${axiosError.response.status} ${axiosError.response.statusText}`;
      } else if (axiosError.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your network connection and API availability.';
      } else {
        errorMessage = axiosError.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Set empty data on error
      setUsers([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleFilter, statusFilter, verifiedFilter, searchTerm]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [fetchUsers]);

  // ==================== ACTION HANDLERS ====================

  const handleSuspend = async (userId: string, userName: string) => {
    const reason = prompt(`Enter reason for suspending ${userName} (minimum 10 characters):`);
    if (!reason || reason.length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    if (!confirm(`Are you sure you want to suspend ${userName}?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await api.admin.users.suspend(userId, { 
        reason,
        suspended_until: undefined // Indefinite suspension
      });
      setSuccess(`User ${userName} suspended successfully`);
      await fetchUsers();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        axiosError.message || 
        'Failed to suspend user';
      setError(errorMessage);
      console.error('Suspend error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: UserRole, userName: string) => {
    const roleOptions = Object.values(UserRole).join(', ');
    const newRole = prompt(
      `Change role for ${userName}\nCurrent: ${currentRole}\n\nAvailable roles: ${roleOptions}\n\nEnter new role:`
    )?.toUpperCase();

    if (!newRole) return;

    if (!Object.values(UserRole).includes(newRole as UserRole)) {
      alert('Invalid role. Please enter one of: ' + roleOptions);
      return;
    }

    const notes = prompt('Enter reason for role change (optional):') || 'Role updated by admin';

    try {
      setActionLoading(userId);
      await api.admin.users.updateRole(userId, {
        role: newRole as UserRole,
        notes
      });
      setSuccess(`Role updated to ${newRole} for ${userName}`);
      await fetchUsers();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        axiosError.message || 
        'Failed to update role';
      setError(errorMessage);
      console.error('Update role error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    const reason = prompt(
      `⚠️ WARNING: This will permanently delete ${userName}\n\nEnter deletion reason (minimum 10 characters):`
    );
    
    if (!reason || reason.length < 10) {
      alert('Reason must be at least 10 characters long');
      return;
    }

    if (!confirm(`🚨 FINAL CONFIRMATION\n\nPermanently delete ${userName}?\n\nThis action CANNOT be undone!`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await api.admin.users.delete(userId, reason);
      setSuccess(`User ${userName} deleted successfully`);
      await fetchUsers();
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        axiosError.message || 
        'Failed to delete user';
      setError(errorMessage);
      console.error('Delete error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (userId: string) => {
    try {
      const response = await api.admin.users.get(userId);
      // Display user details in a formatted way
      const user = response.data;
      const details = JSON.stringify(user, null, 2);
      
      // Create a better formatted display
      const formattedDetails = `
User Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: ${user.id}
Email: ${user.email}
Name: ${user.first_name || ''} ${user.last_name || ''}
Phone: ${user.phone_number || 'N/A'}
Role: ${user.role}
Status: ${user.is_active ? 'Active' : 'Suspended'}
Verified: ${user.email_verified ? 'Yes' : 'No'}
Created: ${new Date(user.created_at).toLocaleString()}
Updated: ${new Date(user.updated_at).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full JSON:
${details}
      `.trim();
      
      alert(formattedDetails);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        axiosError.message || 
        'Failed to load user details';
      alert(errorMessage);
      console.error('View details error:', err);
    }
  };

  // ==================== HELPER FUNCTIONS ====================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserDisplayName = (user: AdminUser): string => {
    if (user.full_name) return user.full_name;
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    return user.email.split('@')[0];
  };

  const getUserInitials = (user: AdminUser): string => {
    const name = getUserDisplayName(user);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-800 border-red-200';
      case UserRole.ORGANIZER: return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.PROMOTER: return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.EVENT_STAFF: return 'bg-green-100 text-green-800 border-green-200';
      case UserRole.ATTENDEE: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
    setVerifiedFilter('');
    setPage(1);
  };

  // ==================== COMPUTED VALUES ====================

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    verified: users.filter(u => u.email_verified).length,
    suspended: users.filter(u => !u.is_active).length,
  };

  const hasActiveFilters = searchTerm || roleFilter || statusFilter || verifiedFilter;

  // ==================== RENDER ====================

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage platform users, roles, and permissions</p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Verified</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.verified}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Suspended</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.suspended}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value={UserRole.GUEST}>Guest</option>
                <option value={UserRole.ATTENDEE}>Attendee</option>
                <option value={UserRole.PROMOTER}>Promoter</option>
                <option value={UserRole.ORGANIZER}>Organizer</option>
                <option value={UserRole.EVENT_STAFF}>Event Staff</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Suspended</option>
              </select>

              {/* Verified Filter */}
              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Users ({users.length} {users.length === pageSize ? '+' : ''})
            </h3>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-600">
                {hasActiveFilters ? 'No users match your filters' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt={getUserDisplayName(user)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {getUserInitials(user)}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {getUserDisplayName(user)}
                        </h4>
                        
                        {/* Status Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Suspended'}
                        </span>

                        {/* Role Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>

                        {/* Verified Badge */}
                        {user.email_verified && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {user.email}
                        </span>
                        {user.phone_number && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {user.phone_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Joined {formatDate(user.created_at)}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {(user.total_tickets_purchased ?? 0) > 0 && (
                          <span>🎫 {user.total_tickets_purchased} tickets purchased</span>
                        )}
                        {(user.total_events_organized ?? 0) > 0 && (
                          <span>📅 {user.total_events_organized} events organized</span>
                        )}
                        {(user.total_spent ?? 0) > 0 && (
                          <span>💰 {formatCurrency(user.total_spent)}</span>
                        )}
                        {user.last_login && (
                          <span>🕒 Last login: {formatDateTime(user.last_login)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        title="View Details"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleChangeRole(user.id, user.role, getUserDisplayName(user))}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                        title="Change Role"
                      >
                        Role
                      </button>

                      {user.is_active ? (
                        <button
                          onClick={() => handleSuspend(user.id, getUserDisplayName(user))}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1.5 text-sm border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition disabled:opacity-50"
                          title="Suspend User"
                        >
                          {actionLoading === user.id ? '...' : 'Suspend'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleViewDetails(user.id)}
                          className="px-3 py-1.5 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition"
                          title="View to Reactivate"
                        >
                          Suspended
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(user.id, getUserDisplayName(user))}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        title="Delete User"
                      >
                        {actionLoading === user.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {page} of {totalPages} ({total} total users)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
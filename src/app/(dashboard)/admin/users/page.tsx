'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { AxiosError } from 'axios';
import { UserRole } from '@/lib/types';
import { X, Search, Loader2, User, Mail, Phone, Calendar, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface AdminUser {
  id: string;
  email?: string; // Made optional to reflect runtime reality
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone_number?: string;
  role?: UserRole; // Made optional to reflect runtime reality
  is_active: boolean;
  email_verified: boolean;
  profile_image_url?: string;
  last_login?: string;
  total_tickets_purchased?: number;
  total_events_organized?: number;
  total_spent?: number;
  created_at?: string; // Made optional
  updated_at?: string; // Made optional
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

  // Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
        setUsers(responseData);
        setTotal(responseData.length);
        setTotalPages(1);
      } else if (responseData.items && Array.isArray(responseData.items)) {
        setUsers(responseData.items);
        setTotal(responseData.total || 0);
        setTotalPages(responseData.total_pages || Math.ceil((responseData.total || 0) / pageSize));
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setUsers(responseData.data);
        setTotal(responseData.total || 0);
        setTotalPages(responseData.total_pages || Math.ceil((responseData.total || 0) / pageSize));
      } else {
        setUsers([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      
      console.error('Users fetch error:', err);
      
      let errorMessage = 'Failed to load users';
      
      if (axiosError.response?.status === 404) {
        errorMessage = 'Users endpoint not found. Check your backend.';
      } else if (axiosError.response?.status === 403) {
        errorMessage = 'Access denied. You may not have admin permissions.';
      } else if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
        errorMessage = 'Network error: Unable to connect to the server.';
      } else if (axiosError.response) {
        errorMessage = 
          axiosError.response?.data?.detail || 
          axiosError.response?.data?.message || 
          `Server error: ${axiosError.response.status}`;
      } else if (axiosError.request) {
        errorMessage = 'No response from server.';
      } else {
        errorMessage = axiosError.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
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

  const handleViewDetails = async (userId: string) => {
    try {
      console.log('Fetching user details for:', userId);
      const response = await api.admin.users.get(userId);
      console.log('User details response:', response);
      console.log('User details response.data:', response.data);
      
      // Extract user data - handle different response formats
      let userData = response.data;
      
      // Check if data is nested in a 'user' or 'data' property
      if (response.data?.user) {
        userData = response.data.user;
        console.log('Extracted from response.data.user:', userData);
      } else if (response.data?.data) {
        userData = response.data.data;
        console.log('Extracted from response.data.data:', userData);
      }
      
      console.log('Final user data being set:', userData);
      setSelectedUser(userData);
      setShowDetailsModal(true);
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to load user details';
      toast.error(errorMessage);
      console.error('Failed to fetch user details:', err);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const handleSuspend = async (userId: string, userName: string) => {
    const reason = prompt(`Enter reason for suspending ${userName} (minimum 10 characters):`);
    if (!reason || reason.length < 10) {
      toast.error('Reason must be at least 10 characters long');
      return;
    }

    if (!confirm(`Are you sure you want to suspend ${userName}?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await api.admin.users.suspend(userId, { 
        reason,
        duration_days: undefined
      });
      setSuccess(`User ${userName} suspended successfully`);
      toast.success(`${userName} suspended`);
      await fetchUsers();
      if (selectedUser?.id === userId) {
        closeDetailsModal();
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to suspend user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: UserRole | undefined, userName: string) => {
    const roleOptions = Object.values(UserRole).join(', ');
    const newRoleInput = prompt(
      `Change role for ${userName}\nCurrent: ${currentRole || 'No Role'}\n\nAvailable roles: ${roleOptions}\n\nEnter new role:`
    );

    if (!newRoleInput) return;

    const newRole = newRoleInput.toUpperCase() as UserRole;

    if (!Object.values(UserRole).includes(newRole)) {
      toast.error('Invalid role. Please use one of: ' + roleOptions);
      return;
    }

    if (newRole === currentRole) {
      toast.info('Role is already set to ' + newRole);
      return;
    }

    const notes = prompt('Optional: Add notes for this role change:') || undefined;

    try {
      setActionLoading(userId);
      await api.admin.users.updateRole(userId, { 
        role: newRole,
        notes 
      });
      setSuccess(`Role changed from ${currentRole || 'No Role'} to ${newRole}`);
      toast.success(`${userName}'s role changed to ${newRole}`);
      await fetchUsers();
      if (selectedUser?.id === userId) {
        const response = await api.admin.users.get(userId);
        setSelectedUser(response.data);
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to change role';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    const reason = prompt(
      `⚠️ WARNING: This will permanently delete ${userName}\n\nThis action cannot be undone!\n\nEnter deletion reason (minimum 10 characters):`
    );

    if (!reason || reason.length < 10) {
      if (reason !== null) {
        toast.error('Deletion reason must be at least 10 characters');
      }
      return;
    }

    const confirmation = prompt(
      `Type "DELETE ${userName.split(' ')[0]}" to confirm deletion:`
    );

    if (confirmation !== `DELETE ${userName.split(' ')[0]}`) {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      setActionLoading(userId);
      await api.admin.users.delete(userId, reason);
      setSuccess(`User ${userName} deleted successfully`);
      toast.success(`${userName} deleted`);
      await fetchUsers();
      if (selectedUser?.id === userId) {
        closeDetailsModal();
      }
    } catch (err) {
      const axiosError = err as AxiosError<any>;
      const errorMessage = 
        axiosError.response?.data?.detail || 
        axiosError.response?.data?.message || 
        'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const getUserDisplayName = (user: AdminUser): string => {
    return user.full_name || user.first_name || (user.email ? user.email.split('@')[0] : 'Unknown User');
  };

  const getUserInitials = (user: AdminUser): string => {
    const displayName = getUserDisplayName(user);
    const names = displayName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const getRoleDisplay = (role: UserRole | undefined): string => {
    if (!role) return 'No Role';
    return role.replace(/_/g, ' ');
  };

  const getRoleBadgeColor = (role: UserRole | undefined): string => {
    if (!role) return 'bg-gray-100 text-gray-800 border-gray-300';
    
    const colors = {
      [UserRole.ADMIN]: 'bg-red-100 text-red-800 border-red-300',
      [UserRole.ORGANIZER]: 'bg-purple-100 text-purple-800 border-purple-300',
      [UserRole.PROMOTER]: 'bg-blue-100 text-blue-800 border-blue-300',
      [UserRole.EVENT_STAFF]: 'bg-green-100 text-green-800 border-green-300',
      [UserRole.ATTENDEE]: 'bg-gray-100 text-gray-800 border-gray-300',
      [UserRole.GUEST]: 'bg-gray-50 text-gray-600 border-gray-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    if (!amount) return 'KSh 0';
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Check if there are active filters
  const hasActiveFilters = Boolean(searchTerm || roleFilter || statusFilter || verifiedFilter);

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    verified: users.filter(u => u.email_verified).length,
    admins: users.filter(u => u.role === UserRole.ADMIN).length,
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users, roles, and permissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-700">Active</p>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-700">Verified</p>
            <p className="text-2xl font-bold text-blue-900">{stats.verified}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-700">Admins</p>
            <p className="text-2xl font-bold text-red-900">{stats.admins}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>{getRoleDisplay(role)}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Suspended</option>
            </select>

            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value as 'verified' | 'unverified' | '')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-green-800">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">
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
                          {getRoleDisplay(user.role)}
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
                          <Mail className="w-4 h-4" />
                          {user.email || 'No email'}
                        </span>
                        {user.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {user.phone_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Joined {formatDate(user.created_at)}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        {(user.total_tickets_purchased ?? 0) > 0 && (
                          <span>🎫 {user.total_tickets_purchased} tickets</span>
                        )}
                        {(user.total_events_organized ?? 0) > 0 && (
                          <span>📅 {user.total_events_organized} events</span>
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
                    <div className="flex-shrink-0 flex items-center gap-2 flex-wrap">
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
                          {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Suspend'}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-sm text-gray-500">
                          Suspended
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(user.id, getUserDisplayName(user))}
                        disabled={actionLoading === user.id}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        title="Delete User"
                      >
                        {actionLoading === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
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

        {/* User Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Debug Info - Remove this after fixing */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <p className="font-semibold mb-1">Debug Info:</p>
                    <pre className="overflow-auto">{JSON.stringify(selectedUser, null, 2)}</pre>
                  </div>
                )}

                {/* Profile Section */}
                <div className="flex items-center gap-4">
                  {selectedUser.profile_image_url ? (
                    <img
                      src={selectedUser.profile_image_url}
                      alt={getUserDisplayName(selectedUser)}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getUserInitials(selectedUser)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{getUserDisplayName(selectedUser)}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.is_active ? 'Active' : 'Suspended'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(selectedUser.role)}`}>
                        {getRoleDisplay(selectedUser.role)}
                      </span>
                      {selectedUser.email_verified && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedUser.email || 'No email'}</span>
                    </div>
                    {selectedUser.phone_number && (
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">{selectedUser.phone_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Account Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">User ID:</span>
                      <p className="font-mono text-xs break-all">{selectedUser.id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Updated:</span>
                      <p className="font-medium">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                    {selectedUser.last_login && (
                      <div>
                        <span className="text-gray-600">Last Login:</span>
                        <p className="font-medium">{formatDateTime(selectedUser.last_login)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Statistics */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Statistics
                  </h5>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.total_tickets_purchased || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Tickets Purchased</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-purple-600">{selectedUser.total_events_organized || 0}</p>
                      <p className="text-xs text-gray-600 mt-1">Events Organized</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedUser.total_spent || 0)}</p>
                      <p className="text-xs text-gray-600 mt-1">Total Spent</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleChangeRole(selectedUser.id, selectedUser.role, getUserDisplayName(selectedUser))}
                    disabled={actionLoading === selectedUser.id}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Change Role
                  </button>
                  {selectedUser.is_active && (
                    <button
                      onClick={() => handleSuspend(selectedUser.id, getUserDisplayName(selectedUser))}
                      disabled={actionLoading === selectedUser.id}
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                    >
                      Suspend User
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedUser.id, getUserDisplayName(selectedUser))}
                    disabled={actionLoading === selectedUser.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
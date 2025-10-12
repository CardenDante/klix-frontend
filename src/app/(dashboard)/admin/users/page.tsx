'use client';

import { useState, useEffect } from 'react';
import  apiClient  from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, Search, Filter, UserX, UserCheck, 
  Shield, Mail, Calendar, MoreVertical, Trash2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  last_login: string | null;
  total_tickets_purchased: number;
  total_events_organized: number;
  total_paid: number;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const params: any = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.is_active = statusFilter === 'active';

      const response = await apiClient.get('/admin/users', { params });
      setUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    const reason = prompt('Enter suspension reason (minimum 10 characters):');
    if (!reason || reason.length < 10) return;

    try {
      await apiClient.post(`/admin/users/${userId}/suspend`, { reason });
      setSuccess('User suspended successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to suspend user');
    }
  };

  const handleActivate = async (userId: string) => {
    try {
      await apiClient.patch(`/users/${userId}/activate`);
      setSuccess('User activated successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to activate user');
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = prompt(`Change role from ${currentRole} to (GUEST/ATTENDEE/PROMOTER/ORGANIZER/EVENT_STAFF/ADMIN):`);
    if (!newRole) return;

    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { 
        role: newRole.toUpperCase(),
        notes: 'Role updated by admin'
      });
      setSuccess('User role updated successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDelete = async (userId: string) => {
    const reason = prompt('Enter deletion reason (minimum 10 characters):');
    if (!reason || reason.length < 10) return;

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/admin/users/${userId}`, {
        params: { reason }
      });
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#EB7D30] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          Users Management
        </h1>
        <p className="text-gray-600 mt-1">Manage platform users and their roles</p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Verified Users</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.is_verified).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Suspended</p>
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => !u.is_active).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-lg"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="GUEST">Guest</option>
                <option value="ATTENDEE">Attendee</option>
                <option value="PROMOTER">Promoter</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="EVENT_STAFF">Event Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
              <select
                className="px-4 py-2 border rounded-lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users List ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#EB7D30] to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{user.full_name || user.email}</h4>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {user.role.toLowerCase().replace('_', ' ')}
                      </Badge>
                      {user.is_verified && (
                        <Badge className="bg-blue-500">Verified</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </span>
                      {user.phone_number && <span>📱 {user.phone_number}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      {user.total_tickets_purchased > 0 && (
                        <span>{user.total_tickets_purchased} tickets purchased</span>
                      )}
                      {user.total_events_organized > 0 && (
                        <span>{user.total_events_organized} events organized</span>
                      )}
                      {user.total_paid > 0 && (
                        <span>Spent: {formatCurrency(user.total_paid)}</span>
                      )}
                      {user.last_login && (
                        <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeRole(user.id, user.role)}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Change Role
                  </Button>
                  {user.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspend(user.id)}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActivate(user.id)}
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <p className="text-center text-gray-500 py-12">
                {users.length === 0 ? 'No users found' : 'No users match your filters'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
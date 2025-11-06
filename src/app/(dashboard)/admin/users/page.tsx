'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  AlertCircle,
  Activity,
  Shield,
  Ban,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  UserCog
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  firebase_uid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: 'GUEST' | 'ATTENDEE' | 'PROMOTER' | 'ORGANIZER' | 'EVENT_STAFF' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  tickets_purchased?: number;
  total_spent?: number;
}

type ActionType = 'changeRole' | 'suspend' | 'delete' | null;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: (page - 1) * limit,
        limit,
      };

      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.admin.users.list(params);
      setUsers(response.data);
      setTotal(response.data.length); // In production, this should come from backend pagination
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch users';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    if (actionType === 'delete' && !actionReason.trim()) {
      toast.error('Please provide a reason for deletion');
      return;
    }

    try {
      setProcessing(true);

      switch (actionType) {
        case 'changeRole':
          if (!newRole) {
            toast.error('Please select a new role');
            return;
          }
          await api.admin.users.updateRole(selectedUser.id, { role: newRole });
          toast.success(`User role updated to ${newRole}`);
          break;

        case 'suspend':
          await api.admin.users.suspend(selectedUser.id, {
            reason: actionReason || 'Suspended by admin',
          });
          toast.success(`User ${selectedUser.email} has been suspended`);
          break;

        case 'delete':
          await api.admin.users.delete(selectedUser.id, actionReason);
          toast.success(`User ${selectedUser.email} has been deleted`);
          break;
      }

      closeDialog();
      fetchUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || `Failed to ${actionType} user`;
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (user: User, action: ActionType) => {
    setSelectedUser(user);
    setActionType(action);
    setNewRole(user.role);
    setActionReason('');
  };

  const closeDialog = () => {
    setSelectedUser(null);
    setActionType(null);
    setNewRole('');
    setActionReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      ORGANIZER: 'bg-purple-100 text-purple-800',
      PROMOTER: 'bg-blue-100 text-blue-800',
      EVENT_STAFF: 'bg-green-100 text-green-800',
      ATTENDEE: 'bg-gray-100 text-gray-800',
      GUEST: 'bg-gray-50 text-gray-600',
    };

    return (
      <Badge className={roleColors[role] || roleColors.GUEST}>
        {role}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search by email or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="promoter">Promoter</SelectItem>
                  <SelectItem value="event_staff">Event Staff</SelectItem>
                  <SelectItem value="attendee">Attendee</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Activity className="w-6 h-6 animate-spin mr-2" />
            <span>Loading users...</span>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : user.email.split('@')[0]}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone_number ? (
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {user.phone_number}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No phone</span>
                      )}
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {user.tickets_purchased !== undefined && (
                          <div>Tickets: {user.tickets_purchased}</div>
                        )}
                        {user.total_spent !== undefined && (
                          <div className="text-muted-foreground">
                            {formatCurrency(user.total_spent)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(user, 'changeRole')}
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Role
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(user, 'suspend')}
                          disabled={!user.is_active}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDialog(user, 'delete')}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'changeRole' && 'Change User Role'}
              {actionType === 'suspend' && 'Suspend User'}
              {actionType === 'delete' && 'Delete User'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'changeRole' && (
              <div className="space-y-2">
                <Label htmlFor="new-role">
                  New Role <span className="text-destructive">*</span>
                </Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATTENDEE">Attendee</SelectItem>
                    <SelectItem value="PROMOTER">Promoter</SelectItem>
                    <SelectItem value="ORGANIZER">Organizer</SelectItem>
                    <SelectItem value="EVENT_STAFF">Event Staff</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Current role: <strong>{selectedUser?.role}</strong>
                </p>
              </div>
            )}

            {actionType === 'suspend' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you are suspending this user..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {actionType === 'delete' && (
              <div className="space-y-2">
                <Label htmlFor="delete-reason">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="delete-reason"
                  placeholder="Explain why you are deleting this user..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={4}
                  required
                />
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg text-sm">
                  <p className="font-medium text-destructive mb-1">Warning: This action is irreversible!</p>
                  <ul className="list-disc list-inside space-y-1 text-destructive/80">
                    <li>Email will be anonymized</li>
                    <li>Personal data will be removed</li>
                    <li>User cannot be restored</li>
                    <li>Cannot delete users with active published events</li>
                  </ul>
                </div>
              </div>
            )}

            {actionType !== 'delete' && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {actionType === 'changeRole' && (
                    <>
                      <li>Update user role to {newRole}</li>
                      <li>Grant appropriate permissions</li>
                      <li>Record change in audit log</li>
                    </>
                  )}
                  {actionType === 'suspend' && (
                    <>
                      <li>Prevent user from logging in</li>
                      <li>Maintain all user data</li>
                      <li>Record suspension in audit log</li>
                      <li>Can be reversed later</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionType === 'delete' && !actionReason.trim())}
              variant={actionType === 'delete' ? 'destructive' : 'default'}
            >
              {processing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'changeRole' && <Shield className="w-4 h-4 mr-2" />}
                  {actionType === 'suspend' && <Ban className="w-4 h-4 mr-2" />}
                  {actionType === 'delete' && <Trash2 className="w-4 h-4 mr-2" />}
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

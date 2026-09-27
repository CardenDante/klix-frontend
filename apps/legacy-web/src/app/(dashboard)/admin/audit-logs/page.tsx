'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  AlertCircle,
  Activity,
  Shield,
  User,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: any;
  ip_address?: string;
  created_at: string;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip: (page - 1) * limit,
        limit,
      };

      if (actionFilter !== 'all') {
        params.action = actionFilter;
      }

      if (resourceFilter !== 'all') {
        params.resource_type = resourceFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.admin.auditLogs(params);
      setLogs(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to fetch audit logs';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, { variant: any; class: string }> = {
      APPROVE: { variant: 'default', class: 'bg-green-100 text-green-800' },
      REJECT: { variant: 'destructive', class: 'bg-red-100 text-red-800' },
      SUSPEND: { variant: 'destructive', class: 'bg-orange-100 text-orange-800' },
      DELETE: { variant: 'destructive', class: 'bg-red-200 text-red-900' },
      UPDATE: { variant: 'default', class: 'bg-blue-100 text-blue-800' },
      CREATE: { variant: 'default', class: 'bg-purple-100 text-purple-800' },
      FLAG: { variant: 'default', class: 'bg-yellow-100 text-yellow-800' },
      UNFLAG: { variant: 'default', class: 'bg-gray-100 text-gray-800' },
    };

    const actionKey = action.toUpperCase();
    const config = actionColors[actionKey] || { variant: 'default', class: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={config.class}>
        {action}
      </Badge>
    );
  };

  const getResourceIcon = (resourceType: string) => {
    const icons: Record<string, any> = {
      USER: User,
      ORGANIZER: Shield,
      EVENT: Calendar,
      PROMOTER: User,
    };

    const Icon = icons[resourceType.toUpperCase()] || FileText;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource_type.toLowerCase().includes(searchLower) ||
      log.resource_id.toLowerCase().includes(searchLower) ||
      log.user?.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track all administrative actions and changes
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
                    placeholder="Search by action, resource, or user..."
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
              <Label htmlFor="action-filter">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger id="action-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                  <SelectItem value="SUSPEND">Suspend</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="FLAG">Flag</SelectItem>
                  <SelectItem value="UNFLAG">Unflag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resource-filter">Resource Type</Label>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger id="resource-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                  <SelectItem value="PROMOTER">Promoter</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Activity className="w-6 h-6 animate-spin mr-2" />
            <span>Loading audit logs...</span>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Admin User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDate(log.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {log.user?.first_name || log.user?.last_name
                            ? `${log.user.first_name || ''} ${log.user.last_name || ''}`.trim()
                            : 'Admin'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resource_type)}
                        <div>
                          <div className="font-medium">{log.resource_type}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {log.resource_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.changes ? (
                        <div className="max-w-md">
                          <details className="cursor-pointer">
                            <summary className="text-sm text-muted-foreground hover:text-foreground">
                              View changes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No details</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.ip_address ? (
                        <div className="flex items-center gap-2 text-sm font-mono">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {log.ip_address}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredLogs.length)} audit logs
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
                Page {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={filteredLogs.length < limit}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">About Audit Logs</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All administrative actions are automatically logged</li>
                <li>Logs include user identity, timestamp, IP address, and changes made</li>
                <li>Logs are immutable and cannot be deleted</li>
                <li>Data is retained for compliance and security purposes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

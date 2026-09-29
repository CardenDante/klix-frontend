'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Badge, Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';
import type { User } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';

const ROLES = ['attendee', 'promoter', 'organizer', 'event_staff', 'admin'];

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({ queryKey: ['admin-users', search, role, page], queryFn: () => adminApi.users({ q: search, role, page }) });

  return (
    <div>
      <h1 className="text-3xl font-bold">Users</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className="pl-9" />
        </form>
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="sm:w-48" aria-label="Filter by role">
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-6">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">{query.data.total.toLocaleString()} users</p>
            <Card className="divide-y divide-line">
              {query.data.data.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </Card>
            <div className="mt-4 flex justify-between">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {query.data.page} of {query.data.total_pages}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= query.data.total_pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const me = useAuth((s) => s.user);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  const setRole = useMutation({
    mutationFn: (role: string) => adminApi.setRole(user.id, role),
    onSuccess: () => {
      toast.success('Role updated');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: () => (user.is_active ? adminApi.suspendUser(user.id) : adminApi.unsuspendUser(user.id)),
    onSuccess: () => {
      toast.success(user.is_active ? 'User suspended' : 'User reactivated');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const self = me?.id === user.id;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <p className="truncate font-medium">
          {user.full_name || '—'} {!user.is_active && <Badge tone="danger">Suspended</Badge>}
        </p>
        <p className="truncate text-xs text-muted">
          {user.email} · joined {formatDate(user.created_at)}
          {user.email_verified ? ' · verified' : ''}
        </p>
      </div>
      <Select
        value={user.role}
        disabled={self || setRole.isPending}
        onChange={(e) => {
          const role = e.target.value;
          if (window.confirm(`Change ${user.email} to ${role.replace('_', ' ')}?`)) setRole.mutate(role);
        }}
        className="h-9 flex-1 text-sm sm:w-40 sm:flex-none"
        aria-label={`Role for ${user.email}`}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.replace('_', ' ')}
          </option>
        ))}
      </Select>
      <Button size="sm" variant={user.is_active ? 'ghost' : 'secondary'} disabled={self} loading={toggle.isPending} onClick={() => {
          if (!user.is_active || window.confirm(`Suspend ${user.email}? They will be signed out and unable to sign in.`)) toggle.mutate();
        }}>
        {user.is_active ? 'Suspend' : 'Reactivate'}
      </Button>
    </div>
  );
}

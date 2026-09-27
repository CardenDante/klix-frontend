'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';
import type { Organizer } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const FILTERS = ['pending', 'approved', 'rejected', 'suspended'] as const;

export default function AdminPage() {
  return (
    <RequireAuth roles={['admin']}>
      <OrganizerReview />
    </RequireAuth>
  );
}

function OrganizerReview() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]>('pending');
  const query = useQuery({ queryKey: ['admin-organizers', status], queryFn: () => adminApi.organizers(status) });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Organizer applications</h1>
      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize',
              status === f ? 'border-ink bg-ink text-white' : 'border-line bg-white',
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : query.data.data.length === 0 ? (
          <EmptyState icon={<ShieldCheck className="size-5" />} title={`No ${status} organizers`} />
        ) : (
          query.data.data.map((o) => <OrganizerCard key={o.id} organizer={o} />)
        )}
      </div>
    </div>
  );
}

function OrganizerCard({ organizer }: { organizer: Organizer }) {
  const queryClient = useQueryClient();
  const done = (message: string) => {
    toast.success(message);
    void queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
  };

  const approve = useMutation({
    mutationFn: () => adminApi.approve(organizer.id),
    onSuccess: () => done(`${organizer.business_name} approved`),
    onError: (e) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: (reason: string) => adminApi.reject(organizer.id, reason),
    onSuccess: () => done(`${organizer.business_name} rejected`),
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg font-bold">{organizer.business_name}</h2>
            <Badge className="capitalize">{organizer.status}</Badge>
          </div>
          <p className="text-sm text-muted">
            {organizer.user?.full_name} · {organizer.user?.email}
            {organizer.business_registration && ` · Reg. ${organizer.business_registration}`}
          </p>
          {organizer.website && (
            <a href={organizer.website} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              {organizer.website} <ExternalLink className="size-3" />
            </a>
          )}
          {organizer.description && <p className="mt-3 whitespace-pre-line text-sm">{organizer.description}</p>}
        </div>
        {organizer.status === 'pending' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => approve.mutate()} loading={approve.isPending}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={reject.isPending}
              onClick={() => {
                const reason = prompt('Reason for rejection (shown to the applicant):');
                if (reason !== null) reject.mutate(reason);
              }}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

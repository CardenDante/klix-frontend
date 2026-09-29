'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';
import type { PromoterProfile } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const FILTERS = ['pending', 'approved', 'rejected', 'suspended'] as const;

export default function AdminPromotersPage() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]>('pending');
  const query = useQuery({ queryKey: ['admin-promoters', status], queryFn: () => adminApi.promoters(status) });

  return (
    <div>
      <h1 className="text-3xl font-bold">Promoters</h1>
      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={cn('rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize', status === f ? 'border-ink bg-ink text-white' : 'border-line bg-white')}
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
          <EmptyState icon={<Megaphone className="size-5" />} title={`No ${status} promoters`} />
        ) : (
          query.data.data.map((p) => <PromoterCard key={p.id} profile={p} />)
        )}
      </div>
    </div>
  );
}

function PromoterCard({ profile }: { profile: PromoterProfile }) {
  const queryClient = useQueryClient();
  const done = (m: string) => {
    toast.success(m);
    void queryClient.invalidateQueries({ queryKey: ['admin-promoters'] });
  };
  const approve = useMutation({ mutationFn: () => adminApi.approvePromoter(profile.id), onSuccess: () => done('Approved'), onError: (e) => toast.error(e.message) });
  const reject = useMutation({
    mutationFn: (reason: string) => adminApi.rejectPromoter(profile.id, reason),
    onSuccess: () => done('Rejected'),
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg font-bold">{profile.display_name}</h2>
            <Badge className="capitalize">{profile.status}</Badge>
          </div>
          <p className="text-sm text-muted">
            {profile.user?.full_name} · {profile.user?.email}
          </p>
          {profile.social_links && <p className="mt-2 whitespace-pre-line text-sm">{profile.social_links}</p>}
          {profile.experience && <p className="mt-1 whitespace-pre-line text-sm text-muted">{profile.experience}</p>}
        </div>
        {profile.status === 'pending' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => approve.mutate()} loading={approve.isPending}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={reject.isPending}
              onClick={() => {
                const reason = prompt('Reason (shown to the applicant):');
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

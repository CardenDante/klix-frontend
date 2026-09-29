'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import type { EventApproval } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const FILTERS = ['pending', 'approved', 'rejected', 'revoked'] as const;

export default function OrganizerPromotersPage() {
  const [status, setStatus] = useState<(typeof FILTERS)[number]>('pending');
  const query = useQuery({
    queryKey: ['promoter-requests', status],
    queryFn: () => organizerApi.promoterRequests(status).then((r) => r.requests),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Promoters</h1>
      <p className="mt-1 text-muted">Promoters sell your events with their own codes. You decide their commission and buyer discount.</p>
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
        ) : query.data.length === 0 ? (
          <EmptyState icon={<Megaphone className="size-5" />} title={`No ${status} promoters`}>
            {status === 'pending' ? 'Requests from promoters show up here.' : undefined}
          </EmptyState>
        ) : (
          query.data.map((r) => <RequestCard key={r.id} request={r} />)
        )}
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: EventApproval }) {
  const queryClient = useQueryClient();
  const [commission, setCommission] = useState(request.commission_percentage ? String(Number(request.commission_percentage)) : '10');
  const [discount, setDiscount] = useState(request.discount_percentage ? String(Number(request.discount_percentage)) : '0');
  const done = (message: string) => {
    toast.success(message);
    void queryClient.invalidateQueries({ queryKey: ['promoter-requests'] });
  };

  const approve = useMutation({
    mutationFn: () => organizerApi.approvePromoter(request.id, { commission_percentage: commission, discount_percentage: discount }),
    onSuccess: () => done('Promoter approved'),
    onError: (e) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: () => organizerApi.rejectPromoter(request.id),
    onSuccess: () => done('Request declined'),
    onError: (e) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: () => organizerApi.revokePromoter(request.id),
    onSuccess: () => done('Promoter removed and their codes switched off'),
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">
            {request.promoter_name ?? request.promoter?.full_name}{' '}
            <span className="font-normal text-muted">wants to promote</span> {request.event?.title}
          </p>
          <p className="text-sm text-muted">
            {request.promoter?.email} · requested {formatDate(request.created_at)}
          </p>
          {request.message && <p className="mt-2 text-sm italic">“{request.message}”</p>}
        </div>
        <Badge className="capitalize">{request.status}</Badge>
      </div>

      {request.status === 'pending' && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <Field label="Commission %" htmlFor={`c-${request.id}`} className="w-32">
            <Input id={`c-${request.id}`} type="number" min={0} max={50} value={commission} onChange={(e) => setCommission(e.target.value)} />
          </Field>
          <Field label="Buyer discount %" htmlFor={`d-${request.id}`} className="w-36">
            <Input id={`d-${request.id}`} type="number" min={0} max={50} value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </Field>
          <Button onClick={() => approve.mutate()} loading={approve.isPending}>
            Approve
          </Button>
          <Button variant="ghost" onClick={() => reject.mutate()} loading={reject.isPending}>
            Decline
          </Button>
        </div>
      )}
      {request.status === 'approved' && (
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
          <span>
            {Number(request.commission_percentage)}% commission · {Number(request.discount_percentage ?? 0)}% buyer discount
          </span>
          <Button size="sm" variant="ghost" onClick={() => revoke.mutate()} loading={revoke.isPending}>
            Remove promoter
          </Button>
        </div>
      )}
    </Card>
  );
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Badge, Card, Spinner } from '@/components/ui/misc';
import { SafeImg } from '@/components/ui/safe-img';
import { eventsApi, promoterApi } from '@/lib/api/endpoints';
import type { EventApproval, KlixEvent } from '@/lib/api/types';
import { formatDate, priceLabel } from '@/lib/format';

const TONE = { pending: 'warning', approved: 'success', rejected: 'danger', revoked: 'neutral' } as const;

export default function PromoterEventsPage() {
  const requests = useQuery({ queryKey: ['promoter-requests'], queryFn: promoterApi.myRequests });
  const byEvent = new Map((requests.data ?? []).map((r) => [r.event_id, r]));

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="mt-1 text-muted">Ask organizers to let you sell their events. Once approved, create a code.</p>
        <div className="mt-6">
          {requests.isPending ? (
            <Spinner />
          ) : requests.data?.length ? (
            <Card className="divide-y divide-line">
              {requests.data.map((r) => (
                <RequestRow key={r.id} request={r} />
              ))}
            </Card>
          ) : (
            <p className="rounded-card border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
              You haven&apos;t requested any events yet. Pick one below.
            </p>
          )}
        </div>
      </section>
      <Browse requested={byEvent} />
    </div>
  );
}

function RequestRow({ request }: { request: EventApproval }) {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () => promoterApi.createCode({ event_id: request.event_id }),
    onSuccess: (code) => {
      toast.success(`Code ${code.code} created`);
      void queryClient.invalidateQueries({ queryKey: ['promoter-codes'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{request.event?.title}</p>
          <Badge tone={TONE[request.status]} className="capitalize">
            {request.status}
          </Badge>
        </div>
        <p className="text-sm text-muted">
          {request.event && formatDate(request.event.start_datetime)}
          {request.status === 'approved' && (
            <>
              {' '}
              · {Number(request.commission_percentage)}% commission
              {Number(request.discount_percentage) > 0 && ` · ${Number(request.discount_percentage)}% off for buyers`}
            </>
          )}
        </p>
        {request.response_message && <p className="mt-1 text-sm italic text-muted">“{request.response_message}”</p>}
      </div>
      {request.status === 'approved' && (
        <Button size="sm" onClick={() => create.mutate()} loading={create.isPending}>
          Create code
        </Button>
      )}
    </div>
  );
}

function Browse({ requested }: { requested: Map<string, EventApproval> }) {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const events = useQuery({
    queryKey: ['promotable-events', search],
    queryFn: () => eventsApi.list({ q: search || undefined, page_size: 24, sort_by: search ? 'relevance' : 'date_asc' }),
  });

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-xl font-bold">Find events</h2>
        <form
          className="relative w-full sm:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" className="pl-9" />
        </form>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.isPending ? (
          <Spinner />
        ) : (
          events.data?.data.map((event) => <PromotableEvent key={event.id} event={event} request={requested.get(event.id)} />)
        )}
      </div>
    </section>
  );
}

function PromotableEvent({ event, request }: { event: KlixEvent; request?: EventApproval }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const ask = useMutation({
    mutationFn: () => promoterApi.requestEvent(event.id, message || undefined),
    onSuccess: () => {
      toast.success('Request sent to the organizer');
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['promoter-requests'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="flex flex-col overflow-hidden">
      {event.banner_image_url ? (
        <SafeImg src={event.banner_image_url} alt="" className="aspect-[16/8] w-full object-cover" />
      ) : (
        <div className="aspect-[16/8] bg-brand-50" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/events/${event.slug}`} className="font-semibold hover:text-brand-600">
          {event.title}
        </Link>
        <p className="text-sm text-muted">
          {formatDate(event.start_datetime)} · {priceLabel(event.min_price)}
        </p>
        <div className="mt-auto pt-3">
          {request ? (
            <Badge tone={TONE[request.status]} className="capitalize">
              {request.status === 'pending' ? 'Requested' : request.status}
            </Badge>
          ) : open ? (
            <div className="space-y-2">
              <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why you? (optional)" />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => ask.mutate()} loading={ask.isPending}>
                  Send request
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Request to promote
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, ChevronRight, Ticket, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import type { EventStatus, KlixEvent } from '@/lib/api/types';
import { formatDate, formatTime } from '@/lib/format';

const STATUS_TONE: Record<EventStatus, 'success' | 'neutral' | 'danger' | 'warning'> = {
  published: 'success',
  draft: 'neutral',
  cancelled: 'danger',
  completed: 'warning',
};

export default function OrganizerHome() {
  const query = useQuery({ queryKey: ['organizer-events'], queryFn: () => organizerApi.events() });
  const events = query.data?.data ?? [];

  const sold = events.reduce((sum, e) => sum + e.tickets_sold, 0);
  const live = events.filter((e) => e.status === 'published').length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your events</h1>
          <p className="mt-1 text-muted">Create events, manage tickets and track sales.</p>
        </div>
        <ButtonLink href="/organizer/events/new">
          <CalendarPlus className="size-4" /> New event
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat icon={TrendingUp} label="Live events" value={live} />
        <Stat icon={Ticket} label="Tickets sold" value={sold.toLocaleString()} />
        <Stat icon={Wallet} label="Total events" value={events.length} />
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : events.length === 0 ? (
          <EmptyState
            icon={<CalendarPlus className="size-5" />}
            title="Create your first event"
            action={<ButtonLink href="/organizer/events/new">New event</ButtonLink>}
          >
            Add the details, set up ticket types, then publish when you&apos;re ready.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

function EventRow({ event }: { event: KlixEvent }) {
  const pct = event.total_capacity ? Math.round((event.tickets_sold / event.total_capacity) * 100) : 0;
  return (
    <Link href={`/organizer/events/${event.id}`} className="flex items-center gap-4 p-4 hover:bg-canvas">
      {event.banner_image_url ? (
        <img src={event.banner_image_url} alt="" className="hidden size-14 rounded-xl object-cover sm:block" />
      ) : (
        <div className="hidden size-14 rounded-xl bg-brand-50 sm:block" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{event.title}</p>
          <Badge tone={STATUS_TONE[event.status]} className="capitalize">
            {event.status}
          </Badge>
        </div>
        <p className="text-sm text-muted">
          {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)} · {event.location}
        </p>
      </div>
      <div className="hidden w-40 sm:block">
        <p className="text-right text-sm font-semibold">
          {event.tickets_sold} / {event.total_capacity}
        </p>
        <div className="mt-1 h-1.5 rounded-full bg-ink/5">
          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ChevronRight className="size-5 text-muted" aria-hidden />
    </Link>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ticket; label: string; value: string | number }) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-5" aria-hidden />
      </div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { ButtonLink } from '@/components/ui/button';
import { Badge, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { SafeImg } from '@/components/ui/safe-img';
import { ticketsApi } from '@/lib/api/endpoints';
import type { Ticket } from '@/lib/api/types';
import { formatEventRange } from '@/lib/format';

export default function MyTicketsPage() {
  return (
    <RequireAuth>
      <TicketList />
    </RequireAuth>
  );
}

function TicketList() {
  const query = useQuery({ queryKey: ['my-tickets'], queryFn: ticketsApi.mine });

  const [now] = useState(() => Date.now());
  const tickets = query.data ?? [];
  const upcoming = tickets.filter((t) => t.event && new Date(t.event.end_datetime).getTime() > now);
  const past = tickets.filter((t) => !upcoming.includes(t));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">My tickets</h1>
      <div className="mt-8">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<TicketIcon className="size-5" />}
            title="No tickets yet"
            action={<ButtonLink href="/events">Find something to do</ButtonLink>}
          >
            Tickets you buy while signed in show up here.
          </EmptyState>
        ) : (
          <div className="space-y-10">
            <TicketGroup title="Upcoming" tickets={upcoming} />
            <TicketGroup title="Past" tickets={past} />
          </div>
        )}
      </div>
    </div>
  );
}

function TicketGroup({ title, tickets }: { title: string; tickets: Ticket[] }) {
  if (tickets.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <ul className="space-y-3">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/tickets/${t.id}`}
              className="flex items-center gap-4 rounded-card border border-line bg-white p-3 pr-4 transition hover:border-ink/20"
            >
              {t.event?.banner_image_url ? (
                <SafeImg src={t.event.banner_image_url} alt="" className="size-16 rounded-xl object-cover" />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <TicketIcon className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{t.event?.title}</p>
                {t.event && (
                  <p className="text-sm text-muted">{formatEventRange(t.event.start_datetime, t.event.end_datetime)}</p>
                )}
                <div className="mt-1 flex gap-2">
                  <Badge tone="brand">{t.ticket_type?.name}</Badge>
                  {t.status === 'used' && <Badge>Checked in</Badge>}
                </div>
              </div>
              <ChevronRight className="size-5 text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

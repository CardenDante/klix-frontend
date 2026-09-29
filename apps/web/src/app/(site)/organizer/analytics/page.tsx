'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, DoorOpen, Ticket, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Stat } from '@/components/stat';
import { Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import type { EventSummary } from '@/lib/api/types';
import { formatDate, formatKES } from '@/lib/format';

export default function OrganizerAnalyticsPage() {
  const query = useQuery({ queryKey: ['organizer-dashboard'], queryFn: organizerApi.dashboard, refetchInterval: 60_000 });

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorNote>{query.error.message}</ErrorNote>;
  const d = query.data;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Sales this month"
          value={formatKES(d.revenue_this_month)}
          trend={d.revenue_growth_percentage}
          hint="vs last month"
        />
        <Stat icon={Ticket} label="Tickets sold" value={d.total_tickets_sold.toLocaleString()} trend={d.ticket_sales_growth_percentage} />
        <Stat icon={CalendarCheck} label="Capacity sold" value={`${d.average_event_capacity_utilization}%`} hint="average per event" />
        <Stat icon={DoorOpen} label="Check-in rate" value={`${d.average_check_in_rate}%`} hint="past events" />
      </div>

      <Card className="grid gap-4 p-5 sm:grid-cols-4">
        {[
          ['Gross sales', d.total_revenue],
          ['Platform fees', d.total_platform_fees],
          ['Promoter commissions', d.total_promoter_commissions],
          ['Net to you', d.total_net_revenue],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="text-xl font-bold tabular-nums">{formatKES(value)}</p>
          </div>
        ))}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <EventTable title="Top events" events={d.top_events} />
        <EventTable title="Coming up" events={d.upcoming_events} />
      </div>
    </div>
  );
}

function EventTable({ title, events }: { title: string; events: EventSummary[] }) {
  return (
    <Card className="p-5">
      <h2 className="mb-3 font-sans font-bold">{title}</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {events.map((e) => (
            <li key={e.event_id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link href={`/organizer/events/${e.event_id}`} className="block truncate font-medium hover:text-brand-600">
                  {e.event_name}
                </Link>
                <p className="text-xs text-muted">{formatDate(e.event_date)}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold tabular-nums">{formatKES(e.revenue)}</p>
                <p className="text-xs text-muted">
                  {e.tickets_sold}/{e.total_capacity} sold
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

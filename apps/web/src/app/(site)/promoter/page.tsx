'use client';

import { useQuery } from '@tanstack/react-query';
import { MousePointerClick, Ticket, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Stat } from '@/components/stat';
import { ButtonLink } from '@/components/ui/button';
import { Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { promoterApi } from '@/lib/api/endpoints';
import { formatDate, formatKES } from '@/lib/format';

const growth = (now: number, before: number) => (before > 0 ? Math.round(((now - before) * 1000) / before) / 10 : null);

export default function PromoterDashboardPage() {
  const query = useQuery({ queryKey: ['promoter-dashboard'], queryFn: () => promoterApi.dashboard().then((r) => r.data) });

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorNote>{query.error.message}</ErrorNote>;
  const d = query.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Your promotions</h1>
        <ButtonLink href="/promoter/events">Find events to promote</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Commission this month"
          value={formatKES(d.commission_this_month)}
          trend={growth(Number(d.commission_this_month), Number(d.commission_last_month))}
        />
        <Stat icon={Ticket} label="Tickets sold" value={d.total_tickets_sold} trend={growth(d.tickets_this_month, d.tickets_last_month)} />
        <Stat icon={MousePointerClick} label="Link clicks" value={d.total_clicks} hint={`${d.active_codes} active codes`} />
        <Stat icon={TrendingUp} label="Available to withdraw" value={formatKES(d.earnings.available)} hint={`${formatKES(d.earnings.pending)} pending`} />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Top events</h2>
        {d.top_events.length === 0 ? (
          <EmptyState icon={<Ticket className="size-5" />} title="No sales yet" action={<ButtonLink href="/promoter/codes">Share your codes</ButtonLink>}>
            Once people buy with your codes, your best events show up here.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {d.top_events.map((e) => (
              <div key={e.event_id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <Link href={`/events/${e.event_slug}`} className="truncate font-semibold hover:text-brand-600">
                    {e.event_name}
                  </Link>
                  <p className="text-sm text-muted">{formatDate(e.event_date)}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{e.tickets_sold} tickets</p>
                  <p className="text-muted">{formatKES(e.commission_earned)} earned</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

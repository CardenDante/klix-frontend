'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Banknote, CalendarDays, Ticket, Users } from 'lucide-react';
import Link from 'next/link';
import { ColumnChart } from '@/components/charts';
import { Stat } from '@/components/stat';
import { Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';
import { CATEGORY_LABELS, formatKES } from '@/lib/format';

export default function AdminOverviewPage() {
  const query = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview, refetchInterval: 60_000 });

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorNote>{query.error.message}</ErrorNote>;
  const o = query.data;
  const todo = [
    { n: o.pending.organizers, label: 'organizer applications', href: '/admin/organizers' },
    { n: o.pending.promoters, label: 'promoter applications', href: '/admin/promoters' },
    { n: o.pending.withdrawals, label: `withdrawals (${formatKES(o.pending.withdrawal_amount)})`, href: '/admin/payouts' },
    { n: o.pending.refunds_required, label: 'late payments needing refunds', href: '/admin/payouts' },
  ].filter((t) => t.n > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Overview</h1>

      {todo.length > 0 && (
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="size-5 text-amber-700" />
          {todo.map((t) => (
            <Link key={t.label} href={t.href} className="text-sm font-medium text-amber-900 underline-offset-2 hover:underline">
              {t.n} {t.label}
            </Link>
          ))}
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Banknote} label="Sales this month" value={formatKES(o.orders.gmv_this_month)} hint={`${formatKES(o.orders.platform_fees_this_month)} fees`} />
        <Stat icon={Ticket} label="Tickets sold" value={o.tickets_sold.toLocaleString()} hint={`${o.orders.completed.toLocaleString()} orders`} />
        <Stat icon={Users} label="Users" value={o.users.total.toLocaleString()} hint={`${o.users.new_this_month} new this month`} />
        <Stat icon={CalendarDays} label="Upcoming events" value={o.events.upcoming} hint={`${o.events.flagged} flagged`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-6 font-sans font-bold">Sales by month</h2>
          <ColumnChart
            data={o.monthly.map((m) => ({ label: m.month.slice(5), value: Number(m.gmv) }))}
            format={(n) => formatKES(n)}
          />
        </Card>
        <Card className="p-5">
          <h2 className="mb-6 font-sans font-bold">New users by month</h2>
          <ColumnChart data={o.monthly.map((m) => ({ label: m.month.slice(5), value: m.new_users }))} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 font-sans font-bold">Top organizers</h2>
          <ul className="space-y-2 text-sm">
            {o.top_organizers.map((t) => (
              <li key={t.organizer_id} className="flex justify-between gap-2">
                <span className="truncate">{t.business_name}</span>
                <span className="font-semibold tabular-nums">{formatKES(t.revenue)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-sans font-bold">Top events</h2>
          <ul className="space-y-2 text-sm">
            {o.top_events.map((t) => (
              <li key={t.event_id} className="flex justify-between gap-2">
                <Link href={`/events/${t.slug}`} className="truncate hover:text-brand-600">
                  {t.title}
                </Link>
                <span className="font-semibold tabular-nums">{formatKES(t.revenue)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-sans font-bold">Categories</h2>
          <ul className="space-y-2 text-sm">
            {o.categories.map((c) => (
              <li key={c.category} className="flex justify-between gap-2">
                <span>{CATEGORY_LABELS[c.category] ?? c.category}</span>
                <span className="text-muted">
                  {c.events} events · {c.tickets_sold.toLocaleString()} tickets
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

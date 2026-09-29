'use client';

import { useQuery } from '@tanstack/react-query';
import { ColumnChart, ShareBars } from '@/components/charts';
import { Stat } from '@/components/stat';
import { Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import { formatKES } from '@/lib/format';

/** Sales, check-in and audience breakdown for one event. */
export function EventAnalyticsPanel({ eventId }: { eventId: string }) {
  const query = useQuery({
    queryKey: ['event-analytics', eventId],
    queryFn: () => organizerApi.eventAnalytics(eventId),
    refetchInterval: 30_000,
  });

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorNote>{query.error.message}</ErrorNote>;
  const a = query.data;
  const recent = a.daily_sales.slice(-14);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Gross sales" value={formatKES(a.total_revenue)} hint={`${formatKES(a.net_revenue)} after fees & commissions`} />
        <Stat label="Tickets sold" value={`${a.tickets_sold} / ${a.total_capacity}`} hint={`${a.capacity_utilization}% of capacity`} />
        <Stat label="Average ticket" value={formatKES(a.average_ticket_price)} hint={`${a.average_sales_per_day} tickets a day`} />
        <Stat
          label="Projected"
          value={`${a.projected_tickets} tickets`}
          hint={a.days_until_event > 0 ? `${a.days_until_event} days to go · ${formatKES(a.projected_revenue)}` : 'Event started'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-6 font-sans font-bold">Daily sales (last 14 days with sales)</h3>
          {recent.length ? (
            <ColumnChart data={recent.map((d) => ({ label: d.date.slice(5), value: d.tickets_sold }))} format={(n) => `${n} tickets`} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">No sales yet.</p>
          )}
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-sans font-bold">By ticket type</h3>
          <ShareBars
            rows={a.sales_by_type.map((t) => ({
              label: t.ticket_type_name,
              value: t.tickets_sold,
              detail: `${t.tickets_sold}/${t.quantity_total} · ${formatKES(t.revenue)}`,
            }))}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 font-sans font-bold">Audience</h3>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Customers', a.customer_demographics.total_customers],
              ['With accounts', a.customer_demographics.registered_customers],
              ['Guests', a.customer_demographics.guest_customers],
              ['Returning', a.customer_demographics.returning_customers],
              ['Tickets per buyer', a.customer_demographics.average_tickets_per_customer],
              ['Checked in', `${a.checkin_stats.checked_in} (${a.checkin_stats.check_in_rate}%)`],
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-muted">{label}</dt>
                <dd className="text-lg font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <h3 className="mb-4 font-sans font-bold">Promoters</h3>
          {a.top_promoters.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="pb-2 font-medium">Code</th>
                  <th className="pb-2 font-medium">Clicks</th>
                  <th className="pb-2 font-medium">Tickets</th>
                  <th className="pb-2 text-right font-medium">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {a.top_promoters.map((p) => (
                  <tr key={p.promoter_code}>
                    <td className="py-2">
                      <span className="font-mono font-semibold">{p.promoter_code}</span>
                      {p.promoter_name && <span className="block text-xs text-muted">{p.promoter_name}</span>}
                    </td>
                    <td className="py-2 tabular-nums">{p.clicks}</td>
                    <td className="py-2 tabular-nums">{p.tickets_sold}</td>
                    <td className="py-2 text-right tabular-nums">{formatKES(p.total_commission_earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">No promoter codes for this event yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

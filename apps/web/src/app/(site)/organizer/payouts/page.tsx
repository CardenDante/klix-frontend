'use client';

import { useQuery } from '@tanstack/react-query';
import { Banknote } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import { formatDate, formatKES } from '@/lib/format';

const STATUS = {
  accruing: { tone: 'neutral', label: 'Selling' },
  due: { tone: 'warning', label: 'Payout due' },
  paid: { tone: 'success', label: 'Paid' },
} as const;

export default function PayoutsPage() {
  const query = useQuery({ queryKey: ['settlements'], queryFn: () => organizerApi.settlements().then((r) => r.data) });

  return (
    <div>
      <h1 className="text-3xl font-bold">Payouts</h1>
      <p className="mt-1 max-w-2xl text-muted">
        After each event we pay out your sales minus the platform fee and promoter commissions. Money buyers paid straight into
        your own M-Pesa account is deducted, since you already have it.
      </p>
      <div className="mt-6">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : query.data.length === 0 ? (
          <EmptyState icon={<Banknote className="size-5" />} title="No payouts yet">
            Statements appear here once your events start selling.
          </EmptyState>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line text-left text-muted">
                <tr>
                  {['Event', 'Gross', 'Fees', 'Commissions', 'Collected by you', 'Net payout', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {query.data.map((s) => (
                  <tr key={s.event_id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.event_title}</p>
                      <p className="text-xs text-muted">Ends {formatDate(s.end_datetime)}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatKES(s.gross)}</td>
                    <td className="px-4 py-3 tabular-nums">−{formatKES(s.platform_fees)}</td>
                    <td className="px-4 py-3 tabular-nums">−{formatKES(s.promoter_commissions)}</td>
                    <td className="px-4 py-3 tabular-nums">−{formatKES(s.collected_by_organizer)}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">{formatKES(s.net_payable)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS[s.status].tone}>{STATUS[s.status].label}</Badge>
                      {s.paid_at && <p className="mt-1 text-xs text-muted">{formatDate(s.paid_at)}{s.reference && ` · ${s.reference}`}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

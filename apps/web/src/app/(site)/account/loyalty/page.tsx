'use client';

import { useQuery } from '@tanstack/react-query';
import { Coins, Gift, Hourglass } from 'lucide-react';
import { Stat } from '@/components/stat';
import { Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { loyaltyApi } from '@/lib/api/endpoints';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const LABELS: Record<string, string> = {
  earned: 'Earned',
  redeemed: 'Used',
  refunded: 'Returned',
  expired: 'Expired',
  adjusted: 'Bonus',
};

export default function LoyaltyPage() {
  const balance = useQuery({ queryKey: ['loyalty-balance'], queryFn: loyaltyApi.balance });
  const history = useQuery({ queryKey: ['loyalty-history'], queryFn: loyaltyApi.transactions });

  if (balance.isPending) return <Spinner />;
  if (balance.isError) return <ErrorNote>{balance.error.message}</ErrorNote>;
  const b = balance.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Coins} label="Available" value={b.available_credits.toLocaleString()} hint="1 credit = KES 1" />
        <Stat icon={Hourglass} label="Expiring in 30 days" value={b.expiring_soon.toLocaleString()} />
        <Stat icon={Gift} label="Earned all-time" value={b.total_credits.toLocaleString()} />
      </div>
      <Card className="p-5 text-sm text-muted">
        You earn 1 credit for every KES 100 you spend on tickets while signed in. Use credits at checkout to pay for up to{' '}
        {b.max_redeem_percentage}% of an order. Credits last a year.
      </Card>

      <section>
        <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-muted">History</h2>
        {history.isPending ? (
          <Spinner />
        ) : !history.data?.length ? (
          <EmptyState icon={<Coins className="size-5" />} title="No credits yet">
            Buy tickets while signed in to start earning.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {history.data.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-xs text-muted">
                    {LABELS[t.transaction_type]} · {formatDate(t.created_at)}
                    {t.expires_at && t.remaining > 0 && <> · {t.remaining} left, expires {formatDate(t.expires_at)}</>}
                  </p>
                </div>
                <span className={cn('font-bold tabular-nums', t.credits > 0 ? 'text-success' : 'text-muted')}>
                  {t.credits > 0 ? '+' : ''}
                  {t.credits.toLocaleString()}
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

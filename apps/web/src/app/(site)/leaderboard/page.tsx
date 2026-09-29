'use client';

import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { useState } from 'react';
import { Card, EmptyState, Spinner } from '@/components/ui/misc';
import { promoterApi } from '@/lib/api/endpoints';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: undefined, label: 'All time' },
] as const;

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | undefined>('month');
  const board = useQuery({ queryKey: ['leaderboard', period], queryFn: () => promoterApi.leaderboard(period).then((r) => r.data) });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Top promoters</h1>
      <p className="mt-1 text-muted">Ranked by tickets sold with their codes.</p>
      <div className="mt-6 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPeriod(p.value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium',
              period === p.value ? 'border-ink bg-ink text-white' : 'border-line bg-white',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {board.isPending ? (
          <Spinner />
        ) : !board.data?.length ? (
          <EmptyState icon={<Trophy className="size-5" />} title="No sales in this period yet" />
        ) : (
          <Card className="divide-y divide-line">
            {board.data.map((row) => (
              <div key={row.promoter_id} className="flex items-center gap-4 px-5 py-4">
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full font-bold',
                    row.rank === 1 ? 'bg-amber-100 text-amber-700' : row.rank <= 3 ? 'bg-brand-50 text-brand-700' : 'bg-ink/5',
                  )}
                >
                  {row.rank}
                </span>
                <p className="flex-1 font-semibold">{row.display_name}</p>
                <span className="font-bold tabular-nums">{row.tickets_sold.toLocaleString()} tickets</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

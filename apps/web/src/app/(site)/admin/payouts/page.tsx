'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';
import type { SettlementStatement, Withdrawal } from '@/lib/api/types';
import { formatDate, formatKES } from '@/lib/format';

export default function AdminPayoutsPage() {
  const withdrawals = useQuery({ queryKey: ['admin-withdrawals'], queryFn: () => adminApi.withdrawals('requested') });
  const settlements = useQuery({ queryKey: ['admin-settlements'], queryFn: () => adminApi.pendingSettlements().then((r) => r.data) });

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <h2 className="mt-6 mb-3 text-xl font-bold">Promoter withdrawals</h2>
        <p className="mb-4 text-sm text-muted">Send the money on M-Pesa, then record the transaction code here.</p>
        {withdrawals.isPending ? (
          <Spinner />
        ) : withdrawals.isError ? (
          <ErrorNote>{withdrawals.error.message}</ErrorNote>
        ) : withdrawals.data.data.length === 0 ? (
          <p className="text-sm text-muted">No withdrawals waiting.</p>
        ) : (
          <Card className="divide-y divide-line">
            {withdrawals.data.data.map((w) => (
              <WithdrawalRow key={w.id} withdrawal={w} />
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Organizer settlements due</h2>
        <p className="mb-4 text-sm text-muted">Events that have ended and haven&apos;t been paid out. A negative amount is owed to Klix.</p>
        {settlements.isPending ? (
          <Spinner />
        ) : settlements.isError ? (
          <ErrorNote>{settlements.error.message}</ErrorNote>
        ) : settlements.data.length === 0 ? (
          <p className="text-sm text-muted">Nothing due.</p>
        ) : (
          <Card className="divide-y divide-line">
            {settlements.data.map((s) => (
              <SettlementRow key={s.event_id} statement={s} />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function WithdrawalRow({ withdrawal: w }: { withdrawal: Withdrawal }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
  const pay = useMutation({
    mutationFn: (reference: string) => adminApi.payWithdrawal(w.id, reference),
    onSuccess: () => {
      toast.success('Marked as paid — the promoter has been emailed');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: (note: string) => adminApi.rejectWithdrawal(w.id, note),
    onSuccess: () => {
      toast.success('Rejected — the amount is back in their balance');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {formatKES(w.amount)} → {w.phone}
        </p>
        <p className="text-xs text-muted">
          {w.promoter?.full_name} · {w.promoter?.email} · requested {formatDate(w.created_at)}
        </p>
      </div>
      <Button
        size="sm"
        loading={pay.isPending}
        onClick={() => {
          const ref = prompt('M-Pesa transaction code:');
          if (ref) pay.mutate(ref.trim());
        }}
      >
        Mark paid
      </Button>
      <Button
        size="sm"
        variant="ghost"
        loading={reject.isPending}
        onClick={() => {
          const note = prompt('Reason for rejecting:');
          if (note) reject.mutate(note);
        }}
      >
        Reject
      </Button>
    </div>
  );
}

function SettlementRow({ statement: s }: { statement: SettlementStatement }) {
  const queryClient = useQueryClient();
  const settle = useMutation({
    mutationFn: (reference: string) => adminApi.settle(s.event_id, reference),
    onSuccess: () => {
      toast.success('Settlement recorded');
      void queryClient.invalidateQueries({ queryKey: ['admin-settlements'] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{s.event_title}</p>
        <p className="text-xs text-muted">
          {s.organizer_name} · ended {formatDate(s.end_datetime)} · gross {formatKES(s.gross)} · fees {formatKES(s.platform_fees)} ·
          commissions {formatKES(s.promoter_commissions)}
          {Number(s.collected_by_organizer) > 0 && ` · collected directly ${formatKES(s.collected_by_organizer)}`}
        </p>
      </div>
      <span className={`font-bold tabular-nums ${Number(s.net_payable) < 0 ? 'text-danger' : ''}`}>{formatKES(s.net_payable)}</span>
      <Button
        size="sm"
        loading={settle.isPending}
        onClick={() => {
          const ref = prompt('Payment reference (bank or M-Pesa):');
          if (ref) settle.mutate(ref.trim());
        }}
      >
        Record payout
      </Button>
    </div>
  );
}

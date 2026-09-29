'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Wallet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Stat } from '@/components/stat';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Badge, Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { promoterApi } from '@/lib/api/endpoints';
import { formatDate, formatKES, isKenyanPhone, normalizePhone } from '@/lib/format';

export default function EarningsPage() {
  const queryClient = useQueryClient();
  const earnings = useQuery({ queryKey: ['promoter-earnings'], queryFn: () => promoterApi.earnings().then((r) => r.data) });
  const history = useQuery({ queryKey: ['promoter-withdrawals'], queryFn: () => promoterApi.withdrawals().then((r) => r.data) });
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');

  const withdraw = useMutation({
    mutationFn: () => promoterApi.withdraw(amount, phone ? normalizePhone(phone) : undefined),
    onSuccess: () => {
      toast.success("Withdrawal requested — we'll send it to your M-Pesa shortly");
      setAmount('');
      void queryClient.invalidateQueries({ queryKey: ['promoter-earnings'] });
      void queryClient.invalidateQueries({ queryKey: ['promoter-withdrawals'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (earnings.isPending) return <Spinner />;
  if (earnings.isError) return <ErrorNote>{earnings.error.message}</ErrorNote>;
  const e = earnings.data;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Earnings</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Wallet} label="Available" value={formatKES(e.available)} />
        <Stat icon={Clock} label="Pending" value={formatKES(e.pending)} hint="Released after each event ends" />
        <Stat label="Paid out" value={formatKES(e.withdrawn)} hint={`${formatKES(e.total_earned)} earned all-time`} />
      </div>

      <Card className="p-6">
        <h2 className="font-sans text-lg font-bold">Withdraw to M-Pesa</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (phone && !isKenyanPhone(phone)) return toast.error('Enter a valid M-Pesa number');
            withdraw.mutate();
          }}
        >
          <Field label="Amount (KES)" htmlFor="amount" hint={`Minimum ${formatKES(e.minimum_withdrawal)}`}>
            <Input id="amount" type="number" min={1} inputMode="numeric" value={amount} onChange={(ev) => setAmount(ev.target.value)} />
          </Field>
          <Field label="M-Pesa number" htmlFor="phone" hint="Defaults to your payout number">
            <Input id="phone" type="tel" placeholder="0712 345 678" value={phone} onChange={(ev) => setPhone(ev.target.value)} />
          </Field>
          <Button type="submit" loading={withdraw.isPending} disabled={!amount || Number(e.available) <= 0} className="sm:mb-6">
            Withdraw
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-muted">Withdrawals</h2>
        {history.data?.length ? (
          <Card className="divide-y divide-line">
            {history.data.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div>
                  <p className="font-semibold">{formatKES(w.amount)}</p>
                  <p className="text-xs text-muted">
                    {formatDate(w.created_at)} · to {w.phone}
                    {w.reference && ` · ref ${w.reference}`}
                    {w.note && ` · ${w.note}`}
                  </p>
                </div>
                <Badge tone={w.status === 'paid' ? 'success' : w.status === 'rejected' ? 'danger' : 'warning'} className="capitalize">
                  {w.status}
                </Badge>
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-sm text-muted">No withdrawals yet.</p>
        )}
      </section>
    </div>
  );
}

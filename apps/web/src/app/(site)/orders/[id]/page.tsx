'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Smartphone, XCircle } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TicketQR } from '@/components/ticket-qr';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { checkoutApi } from '@/lib/api/endpoints';
import type { Order } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { formatKES, isKenyanPhone, normalizePhone } from '@/lib/format';
import { watchOrder } from '@/lib/socket';

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const hydrated = useAuth((s) => s.hydrated);
  const [openedAt] = useState(() => Date.now());

  const query = useQuery({
    queryKey: ['order', id],
    // After ~40s without news, ask the API to check with Safaricom directly.
    queryFn: () => checkoutApi.order(id, Date.now() - openedAt > 40_000).then((r) => r.data),
    enabled: hydrated,
    // Polling is only a fallback for the live channel.
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 6_000 : false),
  });

  const status = query.data?.status;

  useEffect(() => {
    if (status !== 'pending') return;
    return watchOrder(id, (update) => {
      if (update.status !== 'pending') void queryClient.invalidateQueries({ queryKey: ['order', id] });
    });
  }, [id, status, queryClient]);

  if (query.isPending) return <Spinner className="py-32" />;
  if (query.isError) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorNote>{query.error.message}</ErrorNote>
      </div>
    );
  }

  const order = query.data;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {order.status === 'pending' && <AwaitingPayment order={order} />}
      {order.status === 'completed' && <Success order={order} />}
      {['failed', 'cancelled', 'expired'].includes(order.status) && <Failed order={order} />}
      {order.status === 'refund_required' && (
        <StatusCard tone="warning" icon={<Clock className="size-7" />} title="We received your payment late">
          Your payment arrived after your reserved tickets were released, and the event sold out in the meantime. Our team
          will refund {formatKES(order.amount)} to your M-Pesa. Reference: {order.mpesa_receipt ?? order.id.slice(0, 8)}.
        </StatusCard>
      )}
    </div>
  );
}

function AwaitingPayment({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState(order.attendee_phone ? `0${order.attendee_phone.slice(3)}` : '');
  const [sending, setSending] = useState(false);
  const remaining = useCountdown(order.expires_at);

  const resend = async () => {
    if (!isKenyanPhone(phone)) {
      toast.error('Enter a valid Safaricom number');
      return;
    }
    setSending(true);
    try {
      await checkoutApi.initiateMpesa(order.id, normalizePhone(phone));
      toast.success('Prompt sent — check your phone');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const cancel = async () => {
    if (!confirm('Cancel this order and release the tickets?')) return;
    await checkoutApi.cancel(order.id).catch((e: Error) => toast.error(e.message));
    void queryClient.invalidateQueries({ queryKey: ['order', order.id] });
  };

  return (
    <Card className="p-8 text-center">
      <div className="relative mx-auto flex size-20 items-center justify-center">
        <span className="animate-pulse-ring absolute inset-0 rounded-full bg-brand-400" />
        <span className="relative flex size-20 items-center justify-center rounded-full bg-brand-500 text-white">
          <Smartphone className="size-9" />
        </span>
      </div>
      <h1 className="mt-6 text-2xl font-bold">Check your phone</h1>
      <p className="mx-auto mt-2 max-w-sm text-muted">
        Enter your M-Pesa PIN to pay <strong className="text-ink">{formatKES(order.amount)}</strong>
        {order.event && <> for {order.event.title}</>}. This page updates automatically.
      </p>
      <p className="mt-4 text-sm text-muted">
        Tickets held for <span className="font-semibold tabular-nums text-ink">{remaining}</span>
      </p>

      <div className="mx-auto mt-8 max-w-sm space-y-3 border-t border-line pt-6 text-left">
        <p className="text-sm font-medium">Didn&apos;t get the prompt?</p>
        <div className="flex gap-2">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" aria-label="M-Pesa phone number" />
          <Button variant="secondary" onClick={resend} loading={sending}>
            Resend
          </Button>
        </div>
        <button onClick={cancel} className="w-full pt-2 text-center text-sm text-muted hover:text-danger">
          Cancel order
        </button>
      </div>
    </Card>
  );
}

function Success({ order }: { order: Order }) {
  const user = useAuth((s) => s.user);
  return (
    <>
      <StatusCard tone="success" icon={<CheckCircle2 className="size-7" />} title="You're going!">
        {order.mpesa_receipt ? <>Payment received (M-Pesa {order.mpesa_receipt}). </> : null}
        Show these QR codes at the entrance — a screenshot works too.
      </StatusCard>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {order.tickets?.map((ticket) => (
          <TicketQR key={ticket.id} ticket={{ ...ticket, event: ticket.event ?? order.event }} />
        ))}
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {user ? (
          <ButtonLink href="/tickets">Go to my tickets</ButtonLink>
        ) : (
          <p className="text-center text-sm text-muted">Bookmark this page to find your tickets again.</p>
        )}
        <ButtonLink href="/events" variant="secondary">
          Discover more events
        </ButtonLink>
      </div>
    </>
  );
}

function Failed({ order }: { order: Order }) {
  const titles: Record<string, string> = {
    failed: 'Payment failed',
    cancelled: 'Payment cancelled',
    expired: 'Your reservation expired',
  };
  return (
    <StatusCard tone="danger" icon={<XCircle className="size-7" />} title={titles[order.status] ?? 'Order closed'}>
      {order.failure_reason && order.status !== 'expired' ? `${order.failure_reason}. ` : ''}
      You haven&apos;t been charged, and the tickets have been released.
      <div className="mt-6">
        {order.event ? (
          <ButtonLink href={`/events/${order.event.slug}`}>Try again</ButtonLink>
        ) : (
          <ButtonLink href="/events">Back to events</ButtonLink>
        )}
      </div>
    </StatusCard>
  );
}

function StatusCard({
  tone,
  icon,
  title,
  children,
}: {
  tone: 'success' | 'danger' | 'warning';
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-700',
  };
  return (
    <Card className="p-8 text-center">
      <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</div>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>
      <p className="mt-6 text-xs text-muted">
        Need help? <Link href="mailto:support@chach-a.com" className="underline">support@chach-a.com</Link>
      </p>
    </Card>
  );
}

function useCountdown(until: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const seconds = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

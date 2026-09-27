'use client';

import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/misc';
import { eventsApi } from '@/lib/api/endpoints';
import type { KlixEvent, TicketType } from '@/lib/api/types';
import { cartTotals, useCart } from '@/lib/cart';
import { formatKES } from '@/lib/format';
import { cn } from '@/lib/utils';

export function TicketPicker({ event, ticketTypes: initial }: { event: KlixEvent; ticketTypes: TicketType[] }) {
  const router = useRouter();
  const startCart = useCart((s) => s.start);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Keep availability fresh while people are deciding.
  const { data: ticketTypes = initial } = useQuery({
    queryKey: ['ticket-types', event.id],
    queryFn: () => eventsApi.ticketTypes(event.id),
    initialData: initial,
    refetchInterval: 20_000,
  });

  const lines = ticketTypes
    .filter((tt) => (quantities[tt.id] ?? 0) > 0)
    .map((tt) => ({ ticketTypeId: tt.id, name: tt.name, price: tt.price, quantity: quantities[tt.id]! }));
  const totals = cartTotals(lines);

  const change = (tt: TicketType, delta: number) => {
    setQuantities((q) => {
      const max = Math.min(tt.max_per_order, tt.quantity_available);
      const next = Math.max(0, Math.min(max, (q[tt.id] ?? 0) + delta));
      return { ...q, [tt.id]: next };
    });
  };

  const salesClosed = event.status !== 'published' || new Date(event.end_datetime) < new Date();

  return (
    <Card className="overflow-hidden shadow-xl shadow-ink/5">
      <div className="border-b border-line px-5 py-4">
        <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
          <Ticket className="size-5 text-brand-500" aria-hidden /> Tickets
        </h2>
      </div>

      {ticketTypes.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">Tickets aren&apos;t on sale yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {ticketTypes.map((tt) => {
            const qty = quantities[tt.id] ?? 0;
            const unavailable = salesClosed || tt.is_sold_out || !tt.is_on_sale;
            const max = Math.min(tt.max_per_order, tt.quantity_available);
            return (
              <li key={tt.id} className={cn('flex items-center gap-4 px-5 py-4', unavailable && 'opacity-60')}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{tt.name}</p>
                  <p className="text-sm font-bold text-brand-600">
                    {Number(tt.price) === 0 ? 'Free' : formatKES(tt.price)}
                  </p>
                  {tt.description && <p className="mt-0.5 text-xs text-muted">{tt.description}</p>}
                  {!unavailable && tt.quantity_available <= 20 && (
                    <p className="mt-0.5 text-xs font-semibold text-danger">Only {tt.quantity_available} left</p>
                  )}
                </div>
                {unavailable ? (
                  <span className="text-sm font-semibold text-muted">
                    {tt.is_sold_out ? 'Sold out' : salesClosed ? 'Closed' : 'Not on sale'}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 rounded-full border border-line p-1">
                    <button
                      onClick={() => change(tt, -1)}
                      disabled={qty === 0}
                      className="flex size-8 items-center justify-center rounded-full hover:bg-ink/5 disabled:opacity-30"
                      aria-label={`Remove one ${tt.name} ticket`}
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center font-semibold tabular-nums" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      onClick={() => change(tt, 1)}
                      disabled={qty >= max}
                      className="flex size-8 items-center justify-center rounded-full hover:bg-ink/5 disabled:opacity-30"
                      aria-label={`Add one ${tt.name} ticket`}
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-line bg-canvas px-5 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-muted">
            {totals.count} {totals.count === 1 ? 'ticket' : 'tickets'}
          </span>
          <span className="text-xl font-bold">{formatKES(totals.total)}</span>
        </div>
        <Button
          block
          size="lg"
          disabled={totals.count === 0}
          onClick={() => {
            startCart(event, ticketTypes, quantities);
            router.push('/checkout');
          }}
        >
          {totals.count === 0 ? 'Select tickets' : 'Continue to checkout'}
        </Button>
      </div>
    </Card>
  );
}

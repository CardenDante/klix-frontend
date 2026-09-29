'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Pencil, Plus, ScanLine, Trash2, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { EventAnalyticsPanel } from '@/components/event-analytics';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Badge, Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { organizerApi, ticketsApi, eventsApi, type TicketTypeInput } from '@/lib/api/endpoints';
import type { KlixEvent, TicketType } from '@/lib/api/types';
import { formatEventRange, formatKES, fromNairobiInput, toNairobiInput } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EventForm } from '../../event-form';

const TABS = ['Tickets', 'Analytics', 'Details', 'Staff', 'Door'] as const;
type Tab = (typeof TABS)[number];

export default function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('Tickets');

  const eventQuery = useQuery({ queryKey: ['event', id], queryFn: () => eventsApi.get(id) });

  const setEvent = (event: KlixEvent) => {
    queryClient.setQueryData(['event', id], event);
    void queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
  };

  const publish = useMutation({
    mutationFn: (live: boolean) => (live ? organizerApi.publish(id) : organizerApi.unpublish(id)),
    onSuccess: (event) => {
      setEvent(event);
      toast.success(event.status === 'published' ? 'Your event is live!' : 'Event moved back to draft');
    },
    onError: (e) => toast.error(e.message),
  });

  if (eventQuery.isPending) return <Spinner />;
  if (eventQuery.isError) return <ErrorNote>{eventQuery.error.message}</ErrorNote>;
  const event = eventQuery.data;
  const live = event.status === 'published';

  return (
    <>
      <Link href="/organizer" className="text-sm font-medium text-muted hover:text-ink">
        ← Your events
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            <Badge tone={live ? 'success' : 'neutral'} className="capitalize">
              {event.status}
            </Badge>
          </div>
          <p className="mt-1 text-muted">
            {formatEventRange(event.start_datetime, event.end_datetime)} · {event.location}
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href={`/events/${event.slug}`} variant="secondary" target="_blank">
            <ExternalLink className="size-4" /> {live ? 'View' : 'Preview'}
          </ButtonLink>
          {event.status !== 'cancelled' && (
            <Button
              variant={live ? 'secondary' : 'primary'}
              loading={publish.isPending}
              onClick={() => publish.mutate(!live)}
            >
              {live ? 'Unpublish' : 'Publish'}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-xl">
        <MiniStat label="Sold" value={event.tickets_sold} />
        <MiniStat label="Available" value={event.tickets_available} />
        <MiniStat label="Capacity" value={event.total_capacity} />
      </div>

      <div className="mt-8 flex gap-1 border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold',
              tab === t ? 'border-brand-500 text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'Tickets' && <TicketTypesPanel event={event} />}
        {tab === 'Analytics' && <EventAnalyticsPanel eventId={event.id} />}
        {tab === 'Details' && (
          <Card className="max-w-2xl p-6 sm:p-8">
            <EventForm
              event={event}
              submitLabel="Save changes"
              onSubmit={async (input) => {
                try {
                  setEvent(await organizerApi.updateEvent(event.id, input));
                  toast.success('Saved');
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            />
          </Card>
        )}
        {tab === 'Staff' && <StaffPanel event={event} />}
        {tab === 'Door' && <DoorPanel event={event} />}
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
    </Card>
  );
}

function TicketTypesPanel({ event }: { event: KlixEvent }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const query = useQuery({
    queryKey: ['ticket-types', event.id, 'all'],
    queryFn: () => eventsApi.ticketTypes(event.id, true),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['ticket-types', event.id] });
    void queryClient.invalidateQueries({ queryKey: ['event', event.id] });
  };

  const remove = async (tt: TicketType) => {
    if (!confirm(`Remove "${tt.name}"? If any were sold it will be hidden instead.`)) return;
    try {
      await organizerApi.deleteTicketType(tt.id);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (query.isPending) return <Spinner />;
  if (query.isError) return <ErrorNote>{query.error.message}</ErrorNote>;

  return (
    <div className="max-w-3xl space-y-3">
      {query.data.length === 0 && editing !== 'new' && (
        <p className="rounded-card border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
          No ticket types yet. Add at least one to publish.
        </p>
      )}
      {query.data.map((tt) =>
        editing === tt.id ? (
          <TicketTypeForm
            key={tt.id}
            ticketType={tt}
            onCancel={() => setEditing(null)}
            onSave={async (input) => {
              await organizerApi.updateTicketType(tt.id, input);
              setEditing(null);
              refresh();
            }}
          />
        ) : (
          <Card key={tt.id} className={cn('flex items-center gap-4 p-4', !tt.is_active && 'opacity-60')}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{tt.name}</p>
                {!tt.is_active && <Badge>Hidden</Badge>}
              </div>
              <p className="text-sm text-muted">
                {Number(tt.price) === 0 ? 'Free' : formatKES(tt.price)} · {tt.quantity_sold} sold
                {tt.quantity_reserved > 0 && ` · ${tt.quantity_reserved} in checkout`} · {tt.quantity_total} total
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditing(tt.id)} aria-label={`Edit ${tt.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remove(tt)} aria-label={`Remove ${tt.name}`}>
              <Trash2 className="size-4" />
            </Button>
          </Card>
        ),
      )}
      {editing === 'new' ? (
        <TicketTypeForm
          onCancel={() => setEditing(null)}
          onSave={async (input) => {
            await organizerApi.createTicketType(event.id, input);
            setEditing(null);
            refresh();
          }}
        />
      ) : (
        <Button variant="secondary" onClick={() => setEditing('new')}>
          <Plus className="size-4" /> Add ticket type
        </Button>
      )}
    </div>
  );
}

interface TicketTypeValues {
  name: string;
  price: string;
  quantity_total: number;
  max_per_order: number;
  description: string;
  sale_start: string;
  sale_end: string;
  is_active: boolean;
}

function TicketTypeForm({
  ticketType,
  onSave,
  onCancel,
}: {
  ticketType?: TicketType;
  onSave: (input: TicketTypeInput) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm<TicketTypeValues>({
    defaultValues: {
      name: ticketType?.name ?? '',
      price: ticketType ? String(Number(ticketType.price)) : '',
      quantity_total: ticketType?.quantity_total ?? 100,
      max_per_order: ticketType?.max_per_order ?? 10,
      description: ticketType?.description ?? '',
      sale_start: toNairobiInput(ticketType?.sale_start),
      sale_end: toNairobiInput(ticketType?.sale_end),
      is_active: ticketType?.is_active ?? true,
    },
  });
  const [error, setError] = useState<string | null>(null);

  const submit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      await onSave({
        name: v.name,
        price: v.price || '0',
        quantity_total: Number(v.quantity_total),
        max_per_order: Number(v.max_per_order),
        description: v.description || undefined,
        sale_start: v.sale_start ? fromNairobiInput(v.sale_start) : null,
        sale_end: v.sale_end ? fromNairobiInput(v.sale_end) : null,
        is_active: v.is_active,
      });
    } catch (e) {
      setError((e as Error).message);
    }
  });

  return (
    <Card className="border-brand-200 p-5">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="tt-name" className="sm:col-span-3">
            <Input id="tt-name" placeholder="e.g. Early Bird, VIP" required {...form.register('name', { required: true })} />
          </Field>
          <Field label="Price (KES)" htmlFor="tt-price" hint="0 for free">
            <Input id="tt-price" type="number" min={0} step="1" inputMode="numeric" {...form.register('price')} />
          </Field>
          <Field label="Quantity" htmlFor="tt-qty">
            <Input id="tt-qty" type="number" min={1} inputMode="numeric" {...form.register('quantity_total')} />
          </Field>
          <Field label="Max per order" htmlFor="tt-max">
            <Input id="tt-max" type="number" min={1} max={100} inputMode="numeric" {...form.register('max_per_order')} />
          </Field>
          <Field label="Sales open (optional)" htmlFor="tt-start">
            <Input id="tt-start" type="datetime-local" {...form.register('sale_start')} />
          </Field>
          <Field label="Sales close (optional)" htmlFor="tt-end">
            <Input id="tt-end" type="datetime-local" {...form.register('sale_end')} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
            <input type="checkbox" className="size-4 accent-brand-500" {...form.register('is_active')} /> Visible to buyers
          </label>
          <Field label="Description (optional)" htmlFor="tt-desc" className="sm:col-span-3">
            <Input id="tt-desc" placeholder="What's included?" {...form.register('description')} />
          </Field>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div className="flex gap-2">
          <Button type="submit" loading={form.formState.isSubmitting}>
            {ticketType ? 'Save' : 'Add ticket type'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function StaffPanel({ event }: { event: KlixEvent }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const query = useQuery({ queryKey: ['staff', event.id], queryFn: () => organizerApi.staff(event.id) });

  const add = useMutation({
    mutationFn: () => organizerApi.addStaff(event.id, email.trim()),
    onSuccess: () => {
      setEmail('');
      toast.success('Staff member added');
      void queryClient.invalidateQueries({ queryKey: ['staff', event.id] });
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = async (assignmentId: string) => {
    await organizerApi.removeStaff(event.id, assignmentId).catch((e: Error) => toast.error(e.message));
    void queryClient.invalidateQueries({ queryKey: ['staff', event.id] });
  };

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted">
        Staff can scan tickets for this event at <strong>/staff/scanner</strong>. They need a Klix account first.
      </p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) add.mutate();
        }}
      >
        <Input type="email" placeholder="staff@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Staff email" />
        <Button type="submit" loading={add.isPending}>
          <UserPlus className="size-4" /> Add
        </Button>
      </form>
      {query.isPending ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorNote>{query.error.message}</ErrorNote>
      ) : query.data.staff.length === 0 ? (
        <p className="text-sm text-muted">No staff added yet.</p>
      ) : (
        <Card className="divide-y divide-line">
          {query.data.staff.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{s.user?.full_name || s.user?.email}</p>
                <p className="text-sm text-muted">{s.user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="Remove staff member">
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function DoorPanel({ event }: { event: KlixEvent }) {
  const query = useQuery({
    queryKey: ['checkin-stats', event.id],
    queryFn: () => ticketsApi.checkinStats(event.id).then((r) => r.data),
    refetchInterval: 10_000,
  });
  const stats = query.data;
  const pct = stats && stats.total ? Math.round((stats.checked_in / stats.total) * 100) : 0;

  return (
    <div className="max-w-xl space-y-4">
      <Card className="p-6">
        <p className="text-sm text-muted">Checked in</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          {stats?.checked_in ?? '–'} <span className="text-lg font-medium text-muted">/ {stats?.total ?? '–'}</span>
        </p>
        <div className="mt-4 h-2 rounded-full bg-ink/5">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>
      <ButtonLink href={`/staff/scanner?event=${event.id}`}>
        <ScanLine className="size-4" /> Open scanner
      </ButtonLink>
    </div>
  );
}

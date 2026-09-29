'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { Badge, Card, ErrorNote, Spinner } from '@/components/ui/misc';
import { adminApi } from '@/lib/api/endpoints';
import type { KlixEvent } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

export default function AdminEventsPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [flagged, setFlagged] = useState(false);
  const query = useQuery({ queryKey: ['admin-events', search, flagged], queryFn: () => adminApi.events({ q: search, flagged }) });

  return (
    <div>
      <h1 className="text-3xl font-bold">Events</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(q.trim());
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" className="pl-9" />
        </form>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="size-4 accent-brand-500" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} />
          Flagged only
        </label>
      </div>
      <div className="mt-6">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : (
          <Card className="divide-y divide-line">
            {query.data.data.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: KlixEvent }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-events'] });
  const flag = useMutation({
    mutationFn: (reason: string) => adminApi.flagEvent(event.id, reason),
    onSuccess: () => {
      toast.success('Event hidden from the public');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });
  const unflag = useMutation({
    mutationFn: () => adminApi.unflagEvent(event.id),
    onSuccess: () => {
      toast.success('Event restored');
      void refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/events/${event.slug}`} className="truncate font-medium hover:text-brand-600">
            {event.title}
          </Link>
          <Badge className="capitalize">{event.status}</Badge>
          {event.is_flagged && <Badge tone="danger">Flagged</Badge>}
        </div>
        <p className="truncate text-xs text-muted">
          {event.organizer?.business_name} · {formatDate(event.start_datetime)} · {event.tickets_sold} sold
          {event.flag_reason && ` · ${event.flag_reason}`}
        </p>
      </div>
      {event.is_flagged ? (
        <Button size="sm" variant="secondary" loading={unflag.isPending} onClick={() => unflag.mutate()}>
          Restore
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          loading={flag.isPending}
          onClick={() => {
            const reason = prompt('Why hide this event?');
            if (reason) flag.mutate(reason);
          }}
        >
          Hide
        </Button>
      )}
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { EventCard } from '@/components/event-card';
import { discoveryApi } from '@/lib/api/endpoints';

export function SimilarEvents({ eventId }: { eventId: string }) {
  const { data } = useQuery({
    queryKey: ['similar', eventId],
    queryFn: () => discoveryApi.similar(eventId, 4).then((r) => r.data),
    staleTime: 60_000,
  });

  if (!data?.length) return null;
  return (
    <section className="mx-auto mt-16 max-w-5xl px-4">
      <h2 className="mb-5 text-2xl font-bold">You might also like</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

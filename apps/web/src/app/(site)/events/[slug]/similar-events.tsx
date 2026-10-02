'use client';

import { useQuery } from '@tanstack/react-query';
import { EventRow } from '@/components/event-card';
import { SectionTitle } from '@/components/landing/section-title';
import { discoveryApi } from '@/lib/api/endpoints';

export function SimilarEvents({ eventId }: { eventId: string }) {
  const { data } = useQuery({
    queryKey: ['similar', eventId],
    queryFn: () => discoveryApi.similar(eventId, 3).then((r) => r.data),
    staleTime: 60_000,
  });

  if (!data?.length) return null;
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle accent="Also Like" className="mb-8 text-3xl lg:text-4xl">
          You Might
        </SectionTitle>
        <EventRow events={data} />
      </div>
    </section>
  );
}

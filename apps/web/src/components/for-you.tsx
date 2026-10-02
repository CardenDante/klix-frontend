'use client';

import { useQuery } from '@tanstack/react-query';
import { EventRow } from '@/components/event-card';
import { discoveryApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { SectionTitle } from '@/components/landing/section-title';

/** Personal picks for signed-in users; renders nothing for guests. */
export function ForYou() {
  const user = useAuth((s) => s.user);
  const { data } = useQuery({
    queryKey: ['for-you', user?.id],
    queryFn: () => discoveryApi.forYou(3).then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  if (!user || !data?.length) return null;
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle accent="You" className="mb-10">
          Picked for
        </SectionTitle>
        <EventRow events={data} />
      </div>
    </section>
  );
}

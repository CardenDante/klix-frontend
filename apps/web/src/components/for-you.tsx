'use client';

import { useQuery } from '@tanstack/react-query';
import { EventRow } from '@/components/event-card';
import { discoveryApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';

/** Personal picks for signed-in users; renders nothing for guests. */
export function ForYou() {
  const user = useAuth((s) => s.user);
  const { data } = useQuery({
    queryKey: ['for-you', user?.id],
    queryFn: () => discoveryApi.forYou(4).then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  if (!user || !data?.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14">
      <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Picked for you</h2>
      <EventRow events={data} />
    </section>
  );
}

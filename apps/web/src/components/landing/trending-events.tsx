'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Briefcase, Grid3x3, Music, PartyPopper, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EventCard, EventCardSkeleton } from '@/components/event-card';
import { eventsApi } from '@/lib/api/endpoints';
import type { KlixEvent, Paginated } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { Pattern, SectionTitle } from './section-title';

const CATEGORIES = [
  { label: 'All', value: '', icon: Grid3x3 },
  { label: 'Music', value: 'music', icon: Music },
  { label: 'Sports', value: 'sports', icon: Trophy },
  { label: 'Business', value: 'conference', icon: Briefcase },
  { label: 'Festivals', value: 'festival', icon: PartyPopper },
];

export function TrendingEvents({ initial }: { initial: Paginated<KlixEvent> | null }) {
  const [category, setCategory] = useState('');
  const query = useQuery({
    queryKey: ['events', 'trending', category],
    queryFn: () => eventsApi.list({ category: category || undefined, sort_by: 'popularity', page_size: 6 }),
    initialData: category === '' && initial ? initial : undefined,
    staleTime: 30_000,
  });
  const events = query.data?.data ?? [];

  return (
    <section id="trending" className="relative scroll-mt-20 overflow-hidden bg-orange-50/50 py-20">
      <Pattern className="right-0 top-0 h-full w-2/3 bg-right-top opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <SectionTitle accent="Events">Trending</SectionTitle>
            <p className="mt-2 font-body text-gray-600">Don&apos;t miss out on these popular events</p>
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 rounded-md border border-primary bg-white/50 px-4 py-2 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white"
          >
            View All Events
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>

        <div className="-mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
          {CATEGORIES.map(({ label, value, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={cn(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                category === value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white hover:text-primary',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {query.isPending ? (
            Array.from({ length: 3 }, (_, i) => <EventCardSkeleton key={i} />)
          ) : events.length > 0 ? (
            events.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <p className="col-span-full rounded-2xl border border-dashed border-primary/30 bg-white/70 px-6 py-12 text-center font-body text-gray-600">
              {query.isError
                ? 'Events are unavailable right now. Please try again shortly.'
                : 'No events here yet — check back soon.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

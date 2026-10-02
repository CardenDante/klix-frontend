import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EventCardSkeleton } from '@/components/event-card';
import { Pattern, SectionTitle } from '@/components/landing/section-title';
import { EventBrowser } from './event-browser';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming concerts, festivals, conferences and more across Kenya.',
};

export default function EventsPage() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-orange-50/50 pb-20">
      <Pattern className="right-0 top-0 h-full w-2/3 bg-right-top opacity-20" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <SectionTitle as="h1" accent="Experience">
          Find your next
        </SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-600">
          Search for events, filter by category, and discover what&apos;s happening near you.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <EventBrowser />
      </Suspense>
      </div>
    </div>
  );
}

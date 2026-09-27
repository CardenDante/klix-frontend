import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EventCardSkeleton } from '@/components/event-card';
import { EventBrowser } from './event-browser';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Browse upcoming concerts, festivals, conferences and more across Kenya.',
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Discover events</h1>
      <Suspense
        fallback={
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <EventBrowser />
      </Suspense>
    </div>
  );
}

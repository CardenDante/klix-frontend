'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { CalendarSearch, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { EventCard, EventCardSkeleton } from '@/components/event-card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { EmptyState, ErrorNote } from '@/components/ui/misc';
import { eventsApi } from '@/lib/api/endpoints';
import { EVENT_CATEGORIES, type EventFilters } from '@/lib/api/types';
import { CATEGORY_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';

const SORTS: { value: NonNullable<EventFilters['sort_by']>; label: string }[] = [
  { value: 'date_asc', label: 'Soonest' },
  { value: 'popularity', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Recently added' },
];

const PAGE_SIZE = 12;

export function EventBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sortBy = (params.get('sort_by') as EventFilters['sort_by']) ?? (q ? 'relevance' : 'date_asc');

  const update = (next: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) sp.set(key, value);
      else sp.delete(key);
    }
    router.replace(`${pathname}${sp.size ? `?${sp}` : ''}`, { scroll: false });
  };

  const query = useInfiniteQuery({
    queryKey: ['events', { q, category, sortBy }],
    queryFn: ({ pageParam }) =>
      eventsApi.list({ q, category, sort_by: sortBy, page: pageParam, page_size: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
  });

  const events = query.data?.pages.flatMap((p) => p.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Keyed on the URL query so the box resets when it changes elsewhere. */}
        <SearchBox key={q} initial={q} onSearch={(value) => update({ q: value || null, sort_by: null })} />
        <Select
          value={sortBy === 'relevance' ? '' : sortBy}
          onChange={(e) => update({ sort_by: e.target.value || null })}
          aria-label="Sort events"
          className="rounded-full sm:w-52"
        >
          {q && <option value="">Best match</option>}
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {['', ...EVENT_CATEGORIES].map((c) => (
          <button
            key={c || 'all'}
            onClick={() => update({ category: c || null })}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              category === c ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink/75 hover:border-ink/30',
            )}
          >
            {c ? CATEGORY_LABELS[c] : 'All'}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <Grid>
            {Array.from({ length: 8 }, (_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </Grid>
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : events.length === 0 ? (
          <EmptyState icon={<CalendarSearch className="size-5" />} title="No events found">
            {q || category ? 'Try a different search or category.' : 'New events are added all the time — check back soon.'}
          </EmptyState>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {total} {total === 1 ? 'event' : 'events'}
            </p>
            <Grid>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Grid>
            {query.hasNextPage && (
              <div className="mt-10 flex justify-center">
                <Button variant="secondary" onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>
                  Show more events
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function SearchBox({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search events, artists or venues"
        aria-label="Search events"
        className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-10 text-[15px] focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15"
      />
      {initial && (
        <button
          type="button"
          onClick={() => onSearch('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}

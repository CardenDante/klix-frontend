'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Search, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { discoveryApi } from '@/lib/api/endpoints';
import type { SearchSuggestion } from '@/lib/api/types';
import { CATEGORY_LABELS } from '@/lib/format';

const ICONS = { event: CalendarDays, location: MapPin, category: Tag };

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  const suggestions = useQuery({
    queryKey: ['suggestions', debounced],
    queryFn: () => discoveryApi.suggestions(debounced).then((r) => r.data),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
  });

  const go = (s: SearchSuggestion) => {
    setOpen(false);
    if (s.type === 'event') router.push(`/events/${s.value}`);
    else if (s.type === 'category') router.push(`/events?category=${s.value}`);
    else router.push(`/events?q=${encodeURIComponent(s.value)}`);
  };

  const items = debounced.length >= 2 ? (suggestions.data ?? []) : [];

  return (
    <div className="relative mt-8 max-w-xl">
      <form
        role="search"
        className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-xl shadow-black/20"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : '/events');
        }}
      >
        <Search className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search events, artists or venues"
          aria-label="Search events"
          aria-autocomplete="list"
          className="min-w-0 flex-1 bg-transparent py-2 text-ink placeholder:text-muted focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          Search
        </button>
      </form>
      {open && items.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-white py-2 text-ink shadow-xl" role="listbox">
          {items.map((s) => {
            const Icon = ICONS[s.type];
            return (
              <li key={`${s.type}-${s.value}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(s)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-canvas"
                >
                  <Icon className="size-4 text-muted" aria-hidden />
                  <span className="truncate">{s.type === 'category' ? CATEGORY_LABELS[s.value] ?? s.label : s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

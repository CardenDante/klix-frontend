'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, CalendarDays, MapPin, Search, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { discoveryApi } from '@/lib/api/endpoints';
import type { SearchSuggestion } from '@/lib/api/types';
import { CATEGORY_LABELS } from '@/lib/format';

const ICONS = { event: CalendarDays, location: MapPin, category: Tag };

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
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

  const field =
    'h-12 w-full rounded-full border border-white/20 bg-white/10 pl-12 pr-4 text-white placeholder:text-gray-300 focus:border-primary/50 focus:bg-white/20 focus:outline-none md:border-0 md:bg-transparent md:focus:bg-white/10';
  const icon = 'pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-300';

  return (
    <div className="relative mx-auto max-w-4xl animate-fade-in-up text-left" style={{ animationDelay: '0.4s' }}>
      <form
        role="search"
        className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md md:flex-row md:items-center md:rounded-full md:p-2"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(false);
          const sp = new URLSearchParams();
          if (q.trim()) sp.set('q', q.trim());
          if (location.trim()) sp.set('location', location.trim());
          if (date) sp.set('start_date', date);
          router.push(sp.size ? `/events?${sp}` : '/events');
        }}
      >
        <div className="relative md:flex-1">
          <Search className={icon} aria-hidden />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search for events..."
            aria-label="Search events"
            aria-autocomplete="list"
            className={field}
          />
        </div>
        <div className="hidden h-8 w-px self-center bg-white/20 md:block" />
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:w-auto md:flex-1">
          <div className="relative flex-1">
            <MapPin className={icon} aria-hidden />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              aria-label="Location"
              className={field}
            />
          </div>
          <div className="relative flex-1">
            <Calendar className={icon} aria-hidden />
            <input
              type={date ? 'date' : 'text'}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => !e.target.value && (e.target.type = 'text')}
              placeholder="Any Date"
              aria-label="Date"
              className={`${field} [color-scheme:dark]`}
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-12 w-full animate-glow rounded-full bg-primary px-8 font-semibold text-white hover:bg-primary-dark md:w-auto"
        >
          Search
        </button>
      </form>
      {open && items.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl bg-white py-2 text-ink shadow-xl md:right-1/2" role="listbox">
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

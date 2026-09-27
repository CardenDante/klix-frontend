'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');

  return (
    <form
      role="search"
      className="mt-8 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-xl shadow-black/20"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : '/events');
      }}
    >
      <Search className="size-5 shrink-0 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search events, artists or venues"
        aria-label="Search events"
        className="min-w-0 flex-1 bg-transparent py-2 text-ink placeholder:text-muted focus:outline-none"
      />
      <button type="submit" className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
        Search
      </button>
    </form>
  );
}

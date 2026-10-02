import { Mic2, Music, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { HeroSearch } from '@/components/hero-search';

const POPULAR = [
  { label: 'Music', icon: Music, value: 'music' },
  { label: 'Festivals', icon: PartyPopper, value: 'festival' },
  { label: 'Comedy', icon: Mic2, value: 'comedy' },
];

export function Hero() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden text-center text-white">
      <img src="/hero/hero2.jpg" alt="" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <h1 className="mb-4 animate-fade-in-up font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
          Discover{' '}
          <span className="relative inline-block">
            <span className="gradient-text">Unforgettable</span>
            <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none" aria-hidden>
              <path d="M2 10C80 5 220 2 298 8" stroke="url(#hero-underline)" strokeWidth="4" strokeLinecap="round" />
              <defs>
                <linearGradient id="hero-underline" x1="0" y1="8" x2="300" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EB7D30" />
                  <stop offset="1" stopColor="#ff9554" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <br />
          <span className="mt-4 inline-block">Events Near You</span>
        </h1>

        <p
          className="mx-auto mb-10 max-w-2xl animate-fade-in-up font-body text-lg text-gray-200"
          style={{ animationDelay: '0.2s' }}
        >
          From concerts to conferences, find your next great experience in just one Klix.
        </p>

        <HeroSearch />

        <div
          className="mt-8 flex animate-fade-in-up flex-wrap items-center justify-center gap-x-4 gap-y-2"
          style={{ animationDelay: '0.6s' }}
        >
          <span className="mr-2 text-sm font-medium text-gray-300">Popular:</span>
          {POPULAR.map(({ label, icon: Icon, value }) => (
            <Link
              key={value}
              href={`/events?category=${value}`}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white transition-all hover:bg-white/20"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <a
        href="#trending"
        aria-label="Scroll to events"
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce text-white sm:block"
      >
        <svg className="size-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </a>
    </section>
  );
}

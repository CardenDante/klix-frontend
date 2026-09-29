import { ArrowRight, BadgeCheck, QrCode, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { EventCard } from '@/components/event-card';
import { ForYou } from '@/components/for-you';
import { HeroSearch } from '@/components/hero-search';
import { ButtonLink } from '@/components/ui/button';
import { fetchEvents } from '@/lib/api/server';
import { CATEGORY_LABELS } from '@/lib/format';

export const revalidate = 30;

const FEATURED_CATEGORIES = ['music', 'festival', 'conference', 'comedy', 'sports', 'party', 'food_drink', 'workshop'];

export default async function HomePage() {
  const [upcoming, popular] = await Promise.all([
    fetchEvents({ page_size: 8 }),
    fetchEvents({ page_size: 4, sort_by: 'popularity' }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <img src="/hero.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:pb-24 sm:pt-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
            <span className="size-2 rounded-full bg-brand-400" /> Pay with M-Pesa, get tickets instantly
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] sm:text-6xl">
            Where Kenya finds its <span className="text-brand-400">next great night out</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Concerts, festivals, conferences and comedy — discover what&apos;s on and book in seconds.
          </p>
          <HeroSearch />
          <div className="mt-6 flex flex-wrap gap-2">
            {FEATURED_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/events?category=${c}`}
                className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm text-white/85 hover:border-white/60 hover:text-white"
              >
                {CATEGORY_LABELS[c]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ForYou />

      <section className="mx-auto max-w-6xl px-4 pt-14">
        <SectionHeader title="Upcoming events" href="/events" />
        {upcoming && upcoming.data.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-line bg-white px-6 py-12 text-center text-muted">
            {upcoming ? 'No upcoming events yet — check back soon.' : 'Events are unavailable right now. Please try again shortly.'}
          </p>
        )}
      </section>

      {popular && popular.data.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16">
          <SectionHeader title="Selling fast" href="/events?sort_by=popularity" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {popular.data.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Smartphone, title: 'Pay with M-Pesa', body: 'Approve the prompt on your phone. No card needed.' },
            { icon: QrCode, title: 'Tickets in seconds', body: 'Your QR tickets appear the moment payment clears.' },
            { icon: BadgeCheck, title: 'Verified at the door', body: 'Every ticket is signed, so fakes are rejected on scan.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-card border border-line bg-white p-6">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 font-sans text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand-500 px-6 py-12 text-white sm:px-12">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
          <div className="relative max-w-xl">
            <h2 className="text-3xl font-bold">Hosting an event?</h2>
            <p className="mt-3 text-white/85">
              Sell tickets, get paid through M-Pesa, and scan guests in at the door — all from your phone.
            </p>
            <ButtonLink href="/become-organizer" variant="dark" size="lg" className="mt-6">
              Start selling <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
        See all <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

import { CalendarDays, Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventActions } from '@/components/event-actions';
import { Badge } from '@/components/ui/misc';
import { SafeImg } from '@/components/ui/safe-img';
import { fetchEventPage } from '@/lib/api/server';
import { CATEGORY_LABELS, formatDateLong, formatKES, formatTime, stripHtml } from '@/lib/format';
import { sanitizeDescription } from '@/lib/sanitize';
import { SITE_URL } from '@/lib/utils';
import { MobileBuyBar } from './mobile-buy-bar';
import { SimilarEvents } from './similar-events';
import { TicketPicker } from './ticket-picker';

export const revalidate = 10;

export async function generateMetadata({ params }: PageProps<'/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchEventPage(slug).catch(() => null);
  if (!page) return { title: 'Event not found' };

  const { event } = page;
  const description =
    stripHtml(event.description).slice(0, 160) ||
    `Join us for ${event.title} on ${formatDateLong(event.start_datetime)} at ${event.location}. Get your tickets now!`;
  const image = event.portrait_image_url ?? event.banner_image_url;
  const images = image ? [{ url: image, width: 1200, height: 630, alt: event.title }] : [];
  return {
    title: { absolute: `${event.title} - Klix Events` },
    description,
    keywords: [
      event.title,
      CATEGORY_LABELS[event.category] ?? event.category,
      event.location,
      'Kenya events',
      'event tickets',
      'buy tickets online',
      ...(event.organizer ? [event.organizer.business_name] : []),
    ],
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { type: 'website', title: event.title, description, url: `/events/${event.slug}`, images },
    twitter: { card: 'summary_large_image', title: event.title, description, images: image ? [image] : [] },
    other: {
      'event:start_time': event.start_datetime,
      'event:end_time': event.end_datetime,
      'event:location': event.location,
    },
  };
}

export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params;
  const page = await fetchEventPage(slug);
  if (!page) notFound();

  const { event, ticketTypes } = page;
  const prices = ticketTypes.map((t) => Number(t.price));
  const onSale = ticketTypes.filter((t) => t.is_on_sale && !t.is_sold_out).map((t) => Number(t.price));
  const salesClosed = event.status !== 'published' || new Date(event.end_datetime) < new Date();
  const buyBarDisabled =
    event.status === 'cancelled'
      ? 'Cancelled'
      : salesClosed
        ? 'Sales closed'
        : event.is_sold_out
          ? 'Sold out'
          : onSale.length === 0
            ? 'Not on sale'
            : undefined;
  const fromPrice = onSale.length ? Math.min(...onSale) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.start_datetime,
    endDate: event.end_datetime,
    eventStatus: event.status === 'cancelled' ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: event.location, address: event.location },
    image: event.banner_image_url ? [event.banner_image_url] : undefined,
    description: stripHtml(event.description),
    organizer: event.organizer ? { '@type': 'Organization', name: event.organizer.business_name } : undefined,
    offers: prices.length
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'KES',
          lowPrice: Math.min(...prices),
          highPrice: Math.max(...prices),
          availability: event.is_sold_out ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          url: `${SITE_URL}/events/${event.slug}`,
        }
      : undefined,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className="relative flex h-[60vh] min-h-[400px] items-end overflow-hidden text-white">
        <SafeImg
          src={event.banner_image_url ?? event.portrait_image_url ?? undefined}
          alt=""
          className="absolute inset-0 size-full object-cover"
          fallback={<img src="/hero/hero2.jpg" alt="" className="absolute inset-0 size-full object-cover" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <span className="glass rounded-full px-3 py-1 text-sm font-semibold">
              {CATEGORY_LABELS[event.category] ?? event.category}
            </span>
            {event.status === 'cancelled' && <Badge tone="danger">Cancelled</Badge>}
            {event.is_sold_out && <Badge tone="danger">Sold out</Badge>}
          </div>
          <h1 className="mt-4 max-w-4xl font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-body text-white/90">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-5" aria-hidden /> {formatDateLong(event.start_datetime)}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-5" aria-hidden /> {event.location}
            </span>
          </div>
        </div>
      </header>

      <div className="bg-gray-50 pb-16">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_400px] lg:px-8">
        <div>
          {event.organizer && <p className="font-body text-gray-600">Organized by <span className="font-semibold text-ink">{event.organizer.business_name}</span></p>}

          <dl className="mt-4 grid gap-4 rounded-2xl bg-white p-6 shadow-lg sm:grid-cols-2">
            <Detail icon={CalendarDays} label="Date">
              {formatDateLong(event.start_datetime)}
            </Detail>
            <Detail icon={Clock} label="Time">
              {formatTime(event.start_datetime)} – {formatTime(event.end_datetime)} (EAT)
            </Detail>
            <Detail icon={MapPin} label="Location" className="sm:col-span-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-600 hover:underline"
              >
                {event.location}
              </a>
            </Detail>
          </dl>

          <EventActions
            className="mt-4"
            title={event.title}
            url={`${SITE_URL}/events/${event.slug}`}
            location={event.location}
            start={event.start_datetime}
            end={event.end_datetime}
          />
        </div>

        {/* Tickets sit right under the key facts on phones, and in a sticky sidebar on desktop. */}
        <aside id="tickets" className="scroll-mt-24 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <TicketPicker event={event} ticketTypes={ticketTypes} />
          <p className="mt-3 text-center text-xs text-muted">Pay securely with M-Pesa · Tickets arrive instantly by email and SMS</p>
        </aside>

        <div>

          {event.description && (
            <section className="rounded-2xl bg-white p-6 shadow-lg lg:mt-8">
              <h2 className="font-heading text-2xl font-bold">About this Event</h2>
              <div className="prose-event mt-3" dangerouslySetInnerHTML={{ __html: sanitizeDescription(event.description) }} />
            </section>
          )}

          {event.organizer && (
            <section className="mt-8 flex items-center gap-4 rounded-2xl bg-white p-6 shadow-lg">
              {event.organizer.logo_url ? (
                <img src={event.organizer.logo_url} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-primary font-bold text-white">
                  {event.organizer.business_name.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Organized by</p>
                <p className="font-semibold">{event.organizer.business_name}</p>
              </div>
            </section>
          )}
        </div>
      </div>
      </div>
      <SimilarEvents eventId={event.id} />
      <MobileBuyBar
        priceLabel={fromPrice === null ? event.title : fromPrice === 0 ? 'Free' : `From ${formatKES(fromPrice)}`}
        disabledLabel={buyBarDisabled}
      />
    </article>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 ${className ?? ''}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="size-4" aria-hidden />
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
        <dd className="font-medium">{children}</dd>
      </div>
    </div>
  );
}

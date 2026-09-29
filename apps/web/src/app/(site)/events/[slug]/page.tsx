import { CalendarDays, Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/misc';
import { fetchEventPage } from '@/lib/api/server';
import { CATEGORY_LABELS, formatDateLong, formatEventRange, formatTime, stripHtml } from '@/lib/format';
import { sanitizeDescription } from '@/lib/sanitize';
import { SITE_URL } from '@/lib/utils';
import { SimilarEvents } from './similar-events';
import { TicketPicker } from './ticket-picker';

export const revalidate = 10;

export async function generateMetadata({ params }: PageProps<'/events/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchEventPage(slug).catch(() => null);
  if (!page) return { title: 'Event not found' };

  const { event } = page;
  const description = stripHtml(event.description).slice(0, 160) || `${event.title} at ${event.location}`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      images: event.banner_image_url ? [event.banner_image_url] : [],
    },
  };
}

export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
  const { slug } = await params;
  const page = await fetchEventPage(slug);
  if (!page) notFound();

  const { event, ticketTypes } = page;
  const prices = ticketTypes.map((t) => Number(t.price));

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

      <div className="relative bg-ink">
        {event.banner_image_url && (
          <>
            <img src={event.banner_image_url} alt="" className="absolute inset-0 size-full object-cover opacity-30 blur-2xl" />
            <div className="relative mx-auto max-w-5xl px-0 sm:px-4 sm:pt-8">
              <img
                src={event.banner_image_url}
                alt={event.title}
                className="aspect-[16/9] w-full object-cover sm:aspect-[21/9] sm:rounded-3xl"
              />
            </div>
          </>
        )}
        {!event.banner_image_url && <div className="h-40" />}
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{CATEGORY_LABELS[event.category] ?? event.category}</Badge>
            {event.status === 'cancelled' && <Badge tone="danger">Cancelled</Badge>}
            {event.is_sold_out && <Badge tone="danger">Sold out</Badge>}
          </div>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
          {event.organizer && <p className="mt-2 text-muted">by {event.organizer.business_name}</p>}

          <dl className="mt-6 grid gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-2">
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

          {event.description && (
            <section className="mt-8">
              <h2 className="text-xl font-bold">About this event</h2>
              <div className="prose-event mt-3" dangerouslySetInnerHTML={{ __html: sanitizeDescription(event.description) }} />
            </section>
          )}

          {event.organizer && (
            <section className="mt-8 flex items-center gap-4 rounded-card border border-line bg-white p-5">
              {event.organizer.logo_url ? (
                <img src={event.organizer.logo_url} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
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

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <TicketPicker event={event} ticketTypes={ticketTypes} />
          <p className="mt-3 text-center text-xs text-muted">{formatEventRange(event.start_datetime, event.end_datetime)}</p>
        </aside>
      </div>
      <SimilarEvents eventId={event.id} />
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

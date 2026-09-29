import { CalendarDays, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { KlixEvent } from '@/lib/api/types';
import { CATEGORY_LABELS, formatDate, formatTime, priceLabel } from '@/lib/format';
import { SafeImg } from '@/components/ui/safe-img';

export function EventCard({ event }: { event: KlixEvent }) {
  const fewLeft =
    !event.is_sold_out && event.total_capacity > 0 && event.tickets_available / event.total_capacity < 0.1;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand-50">
        <SafeImg
          src={event.banner_image_url ?? undefined}
          alt=""
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
          fallback={
            <div className="flex size-full items-center justify-center font-display text-3xl font-bold text-brand-300">
              klix
            </div>
          }
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">
          {CATEGORY_LABELS[event.category] ?? event.category}
        </span>
        {event.is_sold_out ? (
          <span className="absolute right-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white">
            Sold out
          </span>
        ) : fewLeft ? (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
            Few left
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-sans text-[17px] font-bold leading-snug group-hover:text-brand-600">
          {event.title}
        </h3>
        <div className="mt-2 space-y-1 text-sm text-muted">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
        </div>
        <p className="mt-auto pt-3 text-sm font-bold text-ink">{priceLabel(event.min_price)}</p>
      </div>
    </Link>
  );
}

/** A swipeable row on phones, a grid from tablet up. */
export function EventRow({ events }: { events: KlixEvent[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
      {events.map((event) => (
        <div key={event.id} className="grid w-[78%] shrink-0 snap-start sm:w-auto">
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="aspect-[16/10] animate-pulse bg-ink/5" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-ink/5" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-ink/5" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-ink/5" />
      </div>
    </div>
  );
}

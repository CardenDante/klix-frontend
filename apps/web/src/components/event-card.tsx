import { CalendarDays, MapPin, Users } from 'lucide-react';
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-2xl"
    >
      <div className="relative aspect-[330/320] overflow-hidden bg-brand-50">
        <SafeImg
          src={event.portrait_image_url ?? event.banner_image_url ?? undefined}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
          fallback={<img src="/hero/hero3.jpg" alt="" className="size-full object-cover" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {event.is_sold_out ? (
          <span className="absolute right-3 top-3 rounded-md bg-danger px-2.5 py-1 text-xs font-bold text-white">
            Sold Out
          </span>
        ) : (
          <span className="absolute right-3 top-3 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-primary">
            {formatDate(event.start_datetime)}
          </span>
        )}
        {fewLeft && (
          <span className="absolute left-3 top-3 rounded-md bg-ink px-2.5 py-1 text-xs font-bold text-white">Few left</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="mb-2 self-start rounded-md border border-primary/50 px-2 py-0.5 text-xs font-semibold text-primary">
          {CATEGORY_LABELS[event.category] ?? event.category}
        </span>
        <h3 className="line-clamp-2 font-heading text-lg font-bold leading-snug text-gray-900">{event.title}</h3>
        <div className="mt-2 space-y-1 font-body text-sm text-gray-500">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {formatDate(event.start_datetime)} · {formatTime(event.start_datetime)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{priceLabel(event.min_price)}</p>
            {event.tickets_sold > 0 && (
              <p className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                <Users className="size-3.5 text-primary" aria-hidden /> {event.tickets_sold}+ attending
              </p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors group-hover:bg-primary-dark">
            {event.is_sold_out ? 'View' : 'Get Tickets'}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** A swipeable row on phones, a grid from tablet up. */
export function EventRow({ events }: { events: KlixEvent[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-8">
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
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
      <div className="aspect-[330/320] animate-wave" />
      <div className="space-y-2 p-5">
        <div className="h-4 w-1/4 animate-wave rounded" />
        <div className="h-5 w-3/4 animate-wave rounded" />
        <div className="h-3 w-1/2 animate-wave rounded" />
        <div className="h-3 w-2/3 animate-wave rounded" />
      </div>
    </div>
  );
}

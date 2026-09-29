'use client';

import { CalendarPlus, Navigation, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  url: string;
  location: string;
  start: string;
  end: string;
  description?: string;
  /** Show the directions button (useful on tickets, where the event page's map link isn't visible). */
  directions?: boolean;
  className?: string;
}

const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsText = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');

/** Share, add-to-calendar and directions buttons for an event. */
export function EventActions({ title, url, location, start, end, description, directions, className }: Props) {
  const share = async () => {
    const text = `${title} — get tickets on Klix`;
    if (navigator.share) {
      await navigator.share({ title, text, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', {
        action: { label: 'WhatsApp', onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`) },
      });
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
    }
  };

  const addToCalendar = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Klix//Events//EN',
      'BEGIN:VEVENT',
      `UID:${icsDate(start)}-${encodeURIComponent(url)}@klix`,
      `DTSTAMP:${icsDate(new Date().toISOString())}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsText(title)}`,
      `LOCATION:${icsText(location)}`,
      `DESCRIPTION:${icsText(`${description ? `${description}\n\n` : ''}${url}`)}`,
      `URL:${url}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT3H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsText(title)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    link.download = `${title.replace(/[^\w]+/g, '-').toLowerCase()}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  const button =
    'inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink/30';

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button type="button" onClick={share} className={button}>
        <Share2 className="size-4" aria-hidden /> Share
      </button>
      <button type="button" onClick={addToCalendar} className={button}>
        <CalendarPlus className="size-4" aria-hidden /> Add to calendar
      </button>
      {directions && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
          target="_blank"
          rel="noreferrer"
          className={button}
        >
          <Navigation className="size-4" aria-hidden /> Directions
        </a>
      )}
    </div>
  );
}

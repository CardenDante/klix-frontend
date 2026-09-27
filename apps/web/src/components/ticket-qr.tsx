import { QRCodeSVG } from 'qrcode.react';
import type { Ticket } from '@/lib/api/types';
import { formatEventRange } from '@/lib/format';
import { Badge } from './ui/misc';

/** A printable, scannable ticket stub. */
export function TicketQR({ ticket }: { ticket: Ticket }) {
  const used = ticket.status === 'used';
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="flex items-start justify-between gap-3 bg-ink px-5 py-4 text-white">
        <div className="min-w-0">
          <p className="truncate font-sans font-bold">{ticket.event?.title}</p>
          {ticket.event && (
            <p className="mt-0.5 text-xs text-white/70">
              {formatEventRange(ticket.event.start_datetime, ticket.event.end_datetime)}
            </p>
          )}
        </div>
        <Badge tone={used ? 'neutral' : 'brand'} className={used ? 'bg-white/15 text-white' : ''}>
          {used ? 'Used' : ticket.ticket_type?.name}
        </Badge>
      </div>
      <div className="relative flex flex-col items-center px-5 py-6">
        <div className="absolute -left-3 -top-3 size-6 rounded-full bg-canvas" />
        <div className="absolute -right-3 -top-3 size-6 rounded-full bg-canvas" />
        {ticket.qr_code ? (
          <div className={used ? 'opacity-25' : ''}>
            <QRCodeSVG value={ticket.qr_code} size={196} level="M" marginSize={1} aria-label="Ticket QR code" />
          </div>
        ) : (
          <p className="py-16 text-sm text-muted">QR code appears once payment is confirmed.</p>
        )}
        <p className="mt-3 font-mono text-sm font-semibold tracking-wider">{ticket.ticket_number}</p>
        <p className="text-sm text-muted">{ticket.attendee_name}</p>
        {ticket.event && <p className="mt-1 text-center text-xs text-muted">{ticket.event.location}</p>}
      </div>
    </div>
  );
}

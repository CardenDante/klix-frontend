'use client';

import React, { useState, useEffect } from 'react';
import { Download, Calendar, MapPin, QrCode, Ticket as TicketIcon, User, ArrowRight } from 'lucide-react';
import { ticketsApi } from '@/lib/api/tickets';
import type { Ticket } from '@/lib/api/tickets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsApi.getMyTickets();
      // Sort tickets by date by default (upcoming first)
      response.sort((a: { event: { start_datetime: any; }; }, b: { event: { start_datetime: any; }; }) => new Date(a.event?.start_datetime || 0).getTime() - new Date(b.event?.start_datetime || 0).getTime());
      setTickets(response);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    const eventDate = new Date(ticket.event?.start_datetime || '');
    const now = new Date();
    // Set hours to 0 to compare dates only
    now.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') return eventDate >= now;
    if (filter === 'past') return eventDate < now;
    return true;
  });

  const downloadTicket = (ticketId: string) => {
    // This would ideally point to a backend endpoint that generates a PDF
    alert(`Downloading ticket ${ticketId}. (Placeholder)`);
    // window.open(`/api/v1/tickets/${ticketId}/download`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'used':
        return <Badge variant="secondary">Checked In</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 w-1/3 bg-gray-200 rounded-md" />
        <div className="animate-pulse h-8 w-1/2 bg-gray-200 rounded-md" />
        <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />
        <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />
        <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">My Tickets</h1>
          <p className="text-gray-600 mt-1 font-body">Your access to unforgettable events.</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex-shrink-0 flex gap-2 p-1 bg-gray-100 rounded-full">
          {(['upcoming', 'past', 'all'] as const).map((f) => (
             <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className={`capitalize rounded-full text-sm font-semibold transition-colors w-24 ${filter === f ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-white'}`}
              >
                {f}
              </Button>
          ))}
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <Card className="text-center py-16 bg-gray-50 border-dashed">
          <CardContent>
            <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-comfortaa">No tickets here... yet!</h3>
            <p className="text-gray-600 mb-6 font-body">
              {filter === 'upcoming' ? "You have no upcoming events. Let's find your next one!" : "You haven't purchased any tickets yet."}
            </p>
            <Button asChild size="lg">
              <Link href="/events">
                Browse Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Event Image */}
                <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/10">
                   {ticket.event?.banner_image_url ? (
                    <img
                      src={ticket.event.banner_image_url}
                      alt={ticket.event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <TicketIcon className="w-16 h-16 text-primary/50" />
                    </div>
                  )}
                </div>

                {/* Ticket Info */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                        <div>
                            <h3 className="font-comfortaa text-xl font-bold text-gray-900">
                                {ticket.event?.title}
                            </h3>
                            <p className="text-sm text-gray-500 font-mono">
                                Ticket #{ticket.ticket_number}
                            </p>
                        </div>
                        <div className="mt-2 sm:mt-0">
                            {getStatusBadge(ticket.status)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 my-4 text-sm font-body">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>
                                {ticket.event?.start_datetime && new Date(ticket.event.start_datetime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="line-clamp-1">{ticket.event?.location}</span>
                        </div>
                         <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-4 h-4 text-primary" />
                            <span>{ticket.attendee_name}</span>
                        </div>
                         <div className="flex items-center gap-2 text-gray-700">
                            <TicketIcon className="w-4 h-4 text-primary" />
                            <span>{ticket.ticket_type?.name}</span>
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t mt-4">
                     <p className="text-lg font-bold text-primary flex-1 text-center sm:text-left">
                        KSh {parseFloat(ticket.final_price).toLocaleString()}
                     </p>
                     <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                            // TODO: Show QR code modal
                            alert('QR Code: ' + ticket.qr_code);
                            }}
                        >
                            <QrCode className="w-4 h-4 mr-2" />
                            Show QR Code
                        </Button>
                        <Button
                            onClick={() => downloadTicket(ticket.id)}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                     </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
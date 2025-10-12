'use client';

import React, { useState, useEffect } from 'react';
import { Download, Calendar, MapPin, QrCode, Ticket as TicketIcon } from 'lucide-react';
import { ticketsApi, Ticket } from '@/lib/api/tickets';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketsApi.getMyTickets();
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
    if (filter === 'upcoming') return eventDate >= now;
    if (filter === 'past') return eventDate < now;
    return true;
  });

  const downloadTicket = (ticketId: string) => {
    // Implement PDF download
    window.open(`/api/tickets/${ticketId}/download`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-comfortaa text-3xl font-bold text-gray-900">My Tickets</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'all' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'upcoming' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'past' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Past
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="font-comfortaa text-xl font-bold text-gray-900 mb-2">No tickets yet</h3>
          <p className="text-gray-600 mb-6">Start exploring events and book your first ticket!</p>
          <a
            href="/events"
            className="inline-block px-6 py-3 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors"
          >
            Browse Events
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Event Image */}
                <div className="md:w-48 h-48 md:h-auto bg-gradient-to-br from-[#EB7D30] to-[#f5a56d] flex items-center justify-center">
                  {ticket.event?.banner_image_url ? (
                    <img
                      src={ticket.event.banner_image_url}
                      alt={ticket.event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <TicketIcon className="w-16 h-16 text-white/50" />
                  )}
                </div>

                {/* Ticket Info */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-comfortaa text-xl font-bold text-gray-900 mb-1">
                        {ticket.event?.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Ticket #{ticket.ticket_number}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      ticket.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      ticket.status === 'used' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-[#EB7D30]" />
                      <span>
                        {ticket.event?.start_datetime && new Date(ticket.event.start_datetime).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[#EB7D30]" />
                      <span className="line-clamp-1">{ticket.event?.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Attendee</p>
                      <p className="font-semibold text-gray-900">{ticket.attendee_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Show QR code modal
                          alert('QR Code: ' + ticket.qr_code);
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:border-[#EB7D30] transition-colors"
                        title="Show QR Code"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => downloadTicket(ticket.id)}
                        className="p-2 bg-[#EB7D30] text-white rounded-lg hover:bg-[#d66d20] transition-colors"
                        title="Download Ticket"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
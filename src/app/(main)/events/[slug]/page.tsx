'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, Share2, Bookmark, Users, Ticket, AlertCircle } from 'lucide-react';
import { eventsApi, Event, TicketType } from '@/lib/api/events';
import EventCard from '@/components/events/EventCard';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [similarEvents, setSimilarEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [promoterCode, setPromoterCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [slug]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const eventData = await eventsApi.getEventBySlug(slug);
      setEvent(eventData);

      if (eventData.id) {
        const [types, similar] = await Promise.all([
          eventsApi.getTicketTypes(eventData.id),
          eventsApi.getSimilarEvents(eventData.id, 3),
        ]);
        setTicketTypes(types);
        setSimilarEvents(similar.events || []);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (ticketTypeId: string, change: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketTypeId] || 0;
      const newValue = Math.max(0, Math.min(10, current + change));
      if (newValue === 0) {
        const { [ticketTypeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketTypeId]: newValue };
    });
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [typeId, qty]) => {
      const ticketType = ticketTypes.find(t => t.id === typeId);
      return total + (ticketType ? parseFloat(ticketType.price) * qty : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = () => {
    if (getTotalTickets() === 0) return;
    
    // Store checkout data in session
    sessionStorage.setItem('checkout_data', JSON.stringify({
      event,
      selectedTickets,
      ticketTypes,
      promoterCode,
    }));
    
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 animate-pulse">
        <div className="h-96 bg-gray-200" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button
            onClick={() => router.push('/events')}
            className="text-[#EB7D30] hover:underline"
          >
            Browse all events
          </button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);
  const now = new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-96 bg-gray-900">
        {event.banner_image_url ? (
          <img
            src={event.banner_image_url}
            alt={event.title}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#EB7D30] to-[#f5a56d]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Countdown Badge */}
        {daysUntil > 0 && (
          <div className="absolute top-6 right-6 bg-[#EB7D30] text-white px-4 py-2 rounded-full font-bold">
            {daysUntil} {daysUntil === 1 ? 'day' : 'days'} to go
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              {/* Title & Organizer */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="font-comfortaa text-3xl md:text-4xl font-bold text-gray-900 flex-1">
                    {event.title}
                  </h1>
                  <div className="flex gap-2 ml-4">
                    <button className="p-2 border-2 border-gray-200 rounded-full hover:border-[#EB7D30] transition-colors">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 border-2 border-gray-200 rounded-full hover:border-[#EB7D30] transition-colors">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-lg text-gray-600">
                  by <span className="font-semibold text-[#EB7D30]">{event.organizer.business_name}</span>
                </p>
              </div>

              {/* Event Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-[#EB7D30]" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold">{eventDate.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 text-[#EB7D30]" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold">{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-[#EB7D30]" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold line-clamp-1">{event.location}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                <div className="prose prose-lg max-w-none text-gray-600">
                  {event.description || 'No description available.'}
                </div>
              </div>

              {/* Capacity Info */}
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-blue-900">
                  <strong>{event.total_capacity - event.tickets_sold}</strong> tickets remaining out of {event.total_capacity}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-6">Select Tickets</h2>

              {/* Ticket Types */}
              <div className="space-y-4 mb-6">
                {ticketTypes.map((type) => (
                  <div key={type.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{type.name}</h3>
                        {type.description && (
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        )}
                      </div>
                      <p className="font-bold text-[#EB7D30] text-lg">
                        KSh {parseFloat(type.price).toLocaleString()}
                      </p>
                    </div>

                    {type.is_sold_out ? (
                      <p className="text-sm text-red-600 font-semibold">Sold Out</p>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {type.quantity_available} available
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(type.id, -1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
                            disabled={!selectedTickets[type.id]}
                          >
                            -
                          </button>
                          <span className="font-bold w-8 text-center">
                            {selectedTickets[type.id] || 0}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(type.id, 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Promoter Code */}
              <div className="mb-6">
                {!showCodeInput ? (
                  <button
                    onClick={() => setShowCodeInput(true)}
                    className="text-[#EB7D30] text-sm font-semibold hover:underline"
                  >
                    + Have a promoter code?
                  </button>
                ) : (
                  <input
                    type="text"
                    value={promoterCode}
                    onChange={(e) => setPromoterCode(e.target.value)}
                    placeholder="Enter promoter code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                  />
                )}
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">KSh {getTotalAmount().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{getTotalTickets()} ticket(s)</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={getTotalTickets() === 0 || event.is_sold_out}
                className="w-full py-4 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {event.is_sold_out ? 'Sold Out' : 'Continue to Checkout'}
              </button>
            </div>
          </div>
        </div>

        {/* Similar Events */}
        {similarEvents.length > 0 && (
          <div className="mt-16 mb-12">
            <h2 className="font-comfortaa text-2xl font-bold text-gray-900 mb-6">Similar Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Plus, Minus, Ticket as TicketIcon, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

// --- Define Types ---
interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  is_sold_out: boolean;
}

interface Organizer {
  id: string;
  business_name: string;
  profile_image_url: string | null;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string;
  organizer: Organizer;
  ticket_types?: TicketType[];
}

interface EventPreviewClientProps {
  event: Event;
  ticketTypes: TicketType[];
}

export default function EventPreviewClient({ event: initialEvent, ticketTypes }: EventPreviewClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [event] = useState<Event>({
    ...initialEvent,
    ticket_types: ticketTypes
  });
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>(() => {
    return ticketTypes.reduce((acc: any, tt: TicketType) => {
      acc[tt.id] = 0;
      return acc;
    }, {});
  });
  const [isFollowing, setIsFollowing] = useState(false);

  const handleQuantityChange = (ticketTypeId: string, delta: number) => {
    setTicketQuantities(prev => {
      const newQuantity = (prev[ticketTypeId] || 0) + delta;
      return {
        ...prev,
        [ticketTypeId]: Math.max(0, newQuantity)
      };
    });
  };

  const totalCost = event?.ticket_types?.reduce((total, tt) => {
    return total + (ticketQuantities[tt.id] || 0) * tt.price;
  }, 0) || 0;

  const totalTickets = Object.values(ticketQuantities).reduce((total, qty) => total + qty, 0);

  const handleGetTickets = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${event.slug}`);
      return;
    }
    console.log("Proceeding to checkout with:", ticketQuantities);
  };

  const handleFollowOrganizer = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/events/${event.slug}`);
      return;
    }

    setIsFollowing(!isFollowing);
    console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} organizer:`, event?.organizer.business_name);
  };

  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);

  return (
    <div className="bg-gray-50">
      {/* --- Hero Section --- */}
      <section className="relative h-[50vh] min-h-[300px] text-white">
        <div className="absolute inset-0">
          <Image
            src={getImageUrl(event.banner_image_url) || '/hero/hero2.jpg'}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-12">
          <Badge variant="outline" className="mb-4 text-white border-white/50 bg-white/10 w-fit capitalize">{event.category.replace('_', ' ')}</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold font-heading">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{format(startDate, 'E, MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-3 gap-x-12 gap-y-8">

          {/* Left Column: Details */}
          <div className="lg:col-span-2">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold font-comfortaa text-gray-900">About this Event</h2>
              <p className="font-body">{event.description}</p>
            </div>

            <div className="mt-12">
              <h3 className="text-2xl font-bold font-comfortaa text-gray-900 mb-4">Organizer</h3>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border">
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={getImageUrl(event.organizer.profile_image_url) || '/logo.png'}
                    alt={event.organizer.business_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-800">{event.organizer.business_name}</p>
                  <Button
                    variant={isFollowing ? "default" : "outline"}
                    size="sm"
                    className="mt-1"
                    onClick={handleFollowOrganizer}
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Ticket Box */}
          <div className="relative">
            <div className="lg:sticky lg:top-28 bg-white rounded-2xl shadow-2xl border">
              <div className="p-6">
                <h3 className="text-2xl font-bold font-comfortaa text-gray-900 mb-6">Get Your Tickets</h3>
                <div className="space-y-4">
                  {event.ticket_types && event.ticket_types.length > 0 ? event.ticket_types.map((tt) => (
                    <div key={tt.id} className="p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">{tt.name}</p>
                          <p className="text-primary font-semibold">KSh {tt.price.toLocaleString()}</p>
                        </div>
                        {tt.is_sold_out ? (
                          <Badge variant="destructive">Sold Out</Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleQuantityChange(tt.id, -1)} disabled={ticketQuantities[tt.id] === 0}>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-lg">{ticketQuantities[tt.id]}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleQuantityChange(tt.id, 1)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <TicketIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-700 font-semibold mb-2">Tickets Not Yet Available</p>
                      <p className="text-sm text-gray-500 mb-4">
                        The organizer hasn't added ticket types yet. Check back soon!
                      </p>
                      <p className="text-xs text-gray-400">
                        Tip: Organizers can add tickets from their dashboard
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {totalTickets > 0 && (
                <div className="border-t p-6 bg-gray-50/50 rounded-b-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-semibold text-gray-700">Total</p>
                    <p className="text-2xl font-bold text-gray-900">KSh {totalCost.toLocaleString()}</p>
                  </div>
                  <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold" onClick={handleGetTickets}>
                    Checkout ({totalTickets} {totalTickets === 1 ? 'Ticket' : 'Tickets'})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

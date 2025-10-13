'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, Plus, Minus, Ticket as TicketIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

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
  title: string;
  description: string;
  category: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  banner_image_url: string;
  organizer: Organizer;
  ticket_types: TicketType[];
}

// --- Skeleton Loader Component ---
const EventDetailSkeleton = () => (
  <div>
    <div className="h-[50vh] bg-gray-200 animate-wave"></div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-3 gap-12 -mt-16">
        <div className="lg:col-span-2">
          <div className="h-16 bg-gray-300 rounded-lg w-3/4 animate-wave mb-8"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-full animate-wave"></div>
            <div className="h-6 bg-gray-200 rounded w-full animate-wave"></div>
            <div className="h-6 bg-gray-200 rounded w-5/6 animate-wave"></div>
          </div>
        </div>
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl border p-6 h-96">
            <div className="h-8 bg-gray-300 rounded w-1/2 animate-wave mb-6"></div>
            <div className="h-12 bg-gray-200 rounded animate-wave mb-4"></div>
            <div className="h-12 bg-gray-200 rounded animate-wave"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);


export default function EventDetailPage() {
  const router = useRouter();
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketQuantities, setTicketQuantities] = useState<{ [key: string]: number }>({});
  
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await api.events.getBySlug(slug as string);
        setEvent(response.data);
        // Initialize quantities
        const initialQuantities = response.data.ticket_types.reduce((acc: any, tt: TicketType) => {
          acc[tt.id] = 0;
          return acc;
        }, {});
        setTicketQuantities(initialQuantities);
      } catch (error) {
        console.error("Failed to fetch event details:", error);
        // Optionally redirect to a 404 page
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const handleQuantityChange = (ticketTypeId: string, delta: number) => {
    setTicketQuantities(prev => {
      const newQuantity = (prev[ticketTypeId] || 0) + delta;
      return {
        ...prev,
        [ticketTypeId]: Math.max(0, newQuantity) // Ensure quantity doesn't go below 0
      };
    });
  };

  const totalCost = event?.ticket_types.reduce((total, tt) => {
    return total + (ticketQuantities[tt.id] || 0) * tt.price;
  }, 0) || 0;

  const totalTickets = Object.values(ticketQuantities).reduce((total, qty) => total + qty, 0);

  const handleGetTickets = () => {
    if (!isAuthenticated) {
        router.push(`/login?redirect=/events/${slug}`);
        return;
    }
    // Logic to proceed to checkout
    console.log("Proceeding to checkout with:", ticketQuantities);
    // router.push('/checkout');
  };

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    return <div className="text-center py-40">Event not found.</div>;
  }

  const startDate = new Date(event.start_datetime);
  const endDate = new Date(event.end_datetime);

  return (
    <div className="bg-gray-50">
      {/* --- Hero Section --- */}
      <section className="relative h-[50vh] min-h-[300px] text-white">
        <div className="absolute inset-0">
          <Image 
            src={event.banner_image_url || '/hero/hero2.jpg'}
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
                    src={event.organizer.profile_image_url || '/logo.png'}
                    alt={event.organizer.business_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-800">{event.organizer.business_name}</p>
                  <Button variant="outline" size="sm" className="mt-1">Follow</Button>
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
                  {event.ticket_types.map((tt) => (
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
                  ))}
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
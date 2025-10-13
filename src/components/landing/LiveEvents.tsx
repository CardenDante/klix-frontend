'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Users, TrendingUp, Music, Gamepad2, Briefcase, PartyPopper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  start_datetime: string;
  banner_image_url: string;
  tickets_sold: number;
  is_sold_out: boolean;
}

// --- Skeleton Card Component (with wave effect) ---
const SkeletonCard = () => (
  <div className="bg-white/50 rounded-2xl h-96 overflow-hidden border border-gray-200/50">
    <div className="h-48 bg-gray-200 animate-wave" />
    <div className="p-5 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-wave" />
      <div className="h-6 bg-gray-300 rounded w-3/4 animate-wave" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-wave" />
      <div className="h-10 bg-gray-300 rounded-full w-full mt-4 animate-wave" />
    </div>
  </div>
);

export default function LiveEvents() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All', icon: TrendingUp },
    { value: 'music', label: 'Music', icon: Music },
    { value: 'sports', label: 'Sports', icon: Gamepad2 },
    { value: 'conference', label: 'Business', icon: Briefcase },
    { value: 'festival', label: 'Festivals', icon: PartyPopper },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const params = selectedCategory !== 'all' ? { category: selectedCategory, limit: 6 } : { limit: 6 };
        const response = await api.events.list(params);
        setEvents(response.data.data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchEvents();
  }, [selectedCategory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="py-20 relative bg-orange-50/50 overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute top-0 right-0 h-full w-2/3 bg-no-repeat bg-contain bg-right-top opacity-30 pointer-events-none"
        style={{ backgroundImage: "url('/bckpattern2.png')" }} 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              Trending <span className="gradient-text font-playful pr-2">Events</span>
            </h2>
            <p className="text-gray-600 mt-2 font-body">Don't miss out on these popular events</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/events')}
            className="mt-4 sm:mt-0 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 group bg-white/50"
          >
            View All Events
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap text-sm relative ${
                  selectedCategory === category.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white/60 text-gray-600 hover:bg-white hover:text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>


        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loading ? (
            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/events/${event.slug}`)}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-transparent hover:border-primary/50"
              >
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.banner_image_url || '/hero/hero3.jpg'} // Fallback image
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {event.is_sold_out ? (
                    <Badge variant="destructive" className="absolute top-3 right-3">Sold Out</Badge>
                  ) : (
                    <Badge className="absolute top-3 right-3 bg-white text-primary font-bold">{formatDate(event.start_datetime)}</Badge>
                  )}
                </div>

                {/* Event Details */}
                <div className="p-5">
                  <Badge variant="outline" className="mb-2 text-primary border-primary/50 capitalize">{event.category.replace('_', ' ')}</Badge>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-comfortaa line-clamp-2 h-14">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-body mb-4">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold">
                       <Users className="h-4 w-4 text-primary" />
                       <span>{event.tickets_sold}+ Attending</span>
                     </div>
                     <Button size="sm" className="bg-primary hover:bg-primary-dark text-white rounded-full">
                       Get Tickets
                     </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
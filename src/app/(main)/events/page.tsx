'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Calendar, Users, Frown, Music, Gamepad2, Briefcase, PartyPopper, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

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
  <div className="bg-white rounded-2xl h-96 overflow-hidden border border-gray-200/80">
    <div className="h-48 bg-gray-200 animate-wave" />
    <div className="p-5 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-wave" />
      <div className="h-6 bg-gray-300 rounded w-3/4 animate-wave" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-wave" />
      <div className="h-10 bg-gray-300 rounded-full w-full mt-4 animate-wave" />
    </div>
  </div>
);

// --- Main Events Page Component ---
function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');

  const categories = [
    { value: 'all', label: 'All', icon: TrendingUp },
    { value: 'music', label: 'Music', icon: Music },
    { value: 'sports', label: 'Sports', icon: Gamepad2 },
    { value: 'conference', label: 'Business', icon: Briefcase },
    { value: 'festival', label: 'Festivals', icon: PartyPopper },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const params: any = { limit: 20 };
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (searchTerm) {
        params.q = searchTerm;
      }

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('category', selectedCategory);
      if (searchTerm) {
        newUrl.searchParams.set('q', searchTerm);
      } else {
        newUrl.searchParams.delete('q');
      }
      window.history.pushState({}, '', newUrl);

      try {
        const response = await api.events.list(params);
        setEvents(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setTimeout(() => setLoading(false), 300);
      }
    };
    fetchEvents();
  }, [selectedCategory, searchTerm]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* --- MODIFIED: Search & Filter Section --- */}
      <section className="pt-28 pb-12 relative bg-orange-50/50 overflow-hidden">
        {/* Background Pattern */}
        <div 
            className="absolute inset-0 bg-no-repeat bg-contain bg-center opacity-20 pointer-events-none"
            style={{ backgroundImage: "url('/bckpattern2.png')" }} 
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight text-center">
            Find your next <span className="gradient-text font-playful pb-4 pr-4">Experience</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body text-center">
            Search for events, filter by category, and discover what's happening near you.
          </p>
          
          <div className="max-w-2xl mx-auto mt-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by event, artist, or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-white border border-gray-200 rounded-full focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/30"
              />
            </div>
          </div>

          <div className="flex justify-center gap-3 overflow-x-auto pb-4 mt-8 scrollbar-hide">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap text-sm relative ${
                    selectedCategory === category.value
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white border border-gray-200/80'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Events Grid Section --- */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {loading ? (
              [...Array(8)].map((_, i) => <SkeletonCard key={i} />)
            ) : events.length > 0 ? (
              events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.slug}`)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-200/80"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.banner_image_url || '/hero/hero3.jpg'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {event.is_sold_out ? (
                      <Badge variant="destructive" className="absolute top-3 right-3">Sold Out</Badge>
                    ) : (
                      <Badge className="absolute top-3 right-3 bg-white text-primary font-bold">{formatDate(event.start_datetime)}</Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <Badge variant="outline" className="mb-2 text-primary border-primary/50 capitalize">{event.category.replace('_', ' ')}</Badge>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 font-comfortaa line-clamp-2 h-14">{event.title}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-body mb-4">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <Button size="sm" className="w-full bg-primary hover:bg-primary-dark text-white rounded-full">Get Tickets</Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <Frown className="h-16 w-16 mx-auto text-gray-400" />
                <h3 className="mt-4 text-xl font-semibold text-gray-800">No Events Found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Wrapper component to handle Suspense for useSearchParams
export default function EventsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EventsPageContent />
        </Suspense>
    );
}
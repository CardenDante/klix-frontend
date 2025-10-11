'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';

interface Event {
  id: string;
  title: string;
  category: string;
  location: string;
  start_datetime: string;
  banner_image_url: string;
  tickets_sold: number;
  is_sold_out: boolean;
}

export default function LiveEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: 'All Events', icon: '🎉' },
    { value: 'music', label: 'Music', icon: '🎵' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'theater', label: 'Theater', icon: '🎭' },
    { value: 'conference', label: 'Conference', icon: '💼' },
    { value: 'festival', label: 'Festival', icon: '🎪' },
  ];

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await api.events.list(params);
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 font-heading flex items-center gap-3">
              <TrendingUp className="text-[#EB7D30]" />
              Trending Events
            </h2>
            <p className="text-gray-600 mt-2 font-body">Don't miss out on these popular events</p>
          </div>
          <Button variant="outline" className="border-[#EB7D30] text-[#EB7D30] hover:bg-[#EB7D30] hover:text-white">
            View All
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                selectedCategory === category.value
                  ? 'bg-[#EB7D30] text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-80 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map((event) => (
              <div
                key={event.id}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2"
              >
                {/* Event Image */}
                <div className="relative h-48 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] overflow-hidden">
                  {event.banner_image_url ? (
                    <img
                      src={event.banner_image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      🎉
                    </div>
                  )}
                  
                  {/* Badge */}
                  {event.is_sold_out ? (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Sold Out
                    </div>
                  ) : event.tickets_sold > 50 ? (
                    <div className="absolute top-4 right-4 bg-[#EB7D30] text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                      Hot 🔥
                    </div>
                  ) : null}
                </div>

                {/* Event Details */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[#EB7D30] font-semibold mb-2">
                    <span className="capitalize">{event.category}</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 font-heading line-clamp-2 group-hover:text-[#EB7D30] transition-colors">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.start_datetime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{event.tickets_sold} attending</span>
                    </div>
                  </div>

                  <Button className="w-full bg-[#EB7D30] hover:bg-[#d16a1f] text-white">
                    Get Tickets
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
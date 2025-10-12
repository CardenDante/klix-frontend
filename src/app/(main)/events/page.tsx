'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, X } from 'lucide-react';
import EventCard from '@/components/events/EventCard';
import { eventsApi, Event, SearchFilters } from '@/lib/api/events';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    page: 1,
    page_size: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  // Load events
  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsApi.listEvents(filters);
      setEvents(response.data || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, q: searchQuery, page: 1 });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    setFilters({ page: 1, page_size: 20 });
    setSearchQuery('');
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => !['page', 'page_size'].includes(key) && filters[key as keyof SearchFilters]
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-[#EB7D30] to-[#f5a56d] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-comfortaa text-3xl md:text-4xl font-bold text-white mb-3 text-center">
            Discover Amazing Events
          </h1>
          <p className="text-white/90 text-center mb-8">
            Find concerts, conferences, workshops, and more in Nairobi
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, venues, organizers..."
                className="w-full pl-12 pr-32 py-4 rounded-full text-gray-900 font-dmsans focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Category Pills */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                {eventsApi.CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleFilterChange('category', filters.category === cat.value ? undefined : cat.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      filters.category === cat.value
                        ? 'bg-[#EB7D30] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-full hover:border-[#EB7D30] transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="font-semibold">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-[#EB7D30] text-white text-xs rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="e.g., Nairobi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="inline w-4 h-4 mr-1" />
                    Price Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.min_price || ''}
                      onChange={(e) => handleFilterChange('min_price', e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                    />
                    <input
                      type="number"
                      value={filters.max_price || ''}
                      onChange={(e) => handleFilterChange('max_price', e.target.value)}
                      placeholder="Max"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Sort By
                  </label>
                  <select
                    value={filters.sort_by || 'relevance'}
                    onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date_asc">Date (Earliest)</option>
                    <option value="date_desc">Date (Latest)</option>
                    <option value="price_asc">Price (Low to High)</option>
                    <option value="price_desc">Price (High to Low)</option>
                    <option value="popularity">Most Popular</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-[#EB7D30]"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="font-comfortaa text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-[#EB7D30] text-white rounded-full hover:bg-[#d66d20] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-dmsans text-lg text-gray-600">
                {events.length} events found
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                  disabled={filters.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg">
                  Page {filters.page} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: Math.min(totalPages, (filters.page || 1) + 1) })}
                  disabled={filters.page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
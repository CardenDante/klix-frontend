'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Calendar, MapPin, Ticket, Edit, Trash2, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { organizersApi } from '@/lib/api/organizers';
import { Event } from '@/lib/api/events';
import { getImageUrl } from '@/lib/utils';

export default function MyEventsPage() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadEvents();
    // Check if redirected after creating event
    if (searchParams.get('created') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await organizersApi.getMyEvents();
      setEvents(response.data.data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId: string) => {
    try {
      await organizersApi.publishEvent(eventId);
      loadEvents();
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  };

  const handleUnpublish = async (eventId: string) => {
    try {
      await organizersApi.unpublishEvent(eventId);
      loadEvents();
    } catch (error) {
      console.error('Failed to unpublish event:', error);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await organizersApi.deleteEvent(eventId);
        loadEvents();
      } catch (error: any) {
        alert(error.response?.data?.detail || 'Failed to delete event');
      }
    }
  };

  const filteredEvents = events.filter(event => {
    // Filter by status
    if (filter === 'published' && !event.is_published) return false;
    if (filter === 'draft' && event.is_published) return false;
    if (filter === 'completed' && event.status !== 'completed') return false;
    
    // Filter by search
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (event: Event) => {
    if (event.status === 'completed') return 'bg-gray-100 text-gray-700';
    if (event.is_published) return 'bg-green-100 text-green-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getStatusLabel = (event: Event) => {
    if (event.status === 'completed') return 'Completed';
    if (event.is_published) return 'Published';
    return 'Draft';
  };

  return (
    <div className="p-8">
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-semibold">✅ Event created successfully! You can now add images and publish it.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="font-comfortaa text-3xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">Manage all your events</p>
        </div>
        <Link href="/organizer/events/create">
          <button className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors">
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'all' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'published' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'draft' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                filter === 'completed' ? 'bg-[#EB7D30] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-comfortaa text-xl font-bold text-gray-900 mb-2">
            {searchQuery ? 'No events found' : 'No events yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? 'Try adjusting your search' : 'Create your first event to get started'}
          </p>
          {!searchQuery && (
            <Link href="/organizer/events/create">
              <button className="px-6 py-3 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors">
                Create Event
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Event Image - Portrait format (330x320px aspect ratio ~1:1) */}
                <div className="w-full md:w-64 h-48 md:h-64 bg-gradient-to-br from-[#EB7D30] to-[#f5a56d] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {(event.portrait_image_url || event.banner_image_url) ? (
                    <img
                      src={getImageUrl(event.portrait_image_url || event.banner_image_url)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Calendar className="w-16 h-16 text-white/50" />
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-comfortaa text-xl font-bold text-gray-900">
                          {event.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event)}`}>
                          {getStatusLabel(event)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.description || 'No description'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-[#EB7D30]" />
                      <span>{new Date(event.start_datetime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-[#EB7D30]" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Ticket className="w-4 h-4 text-[#EB7D30]" />
                      <span>{event.tickets_sold} / {event.total_capacity} sold</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/organizer/events/${event.id}`}>
                      <button className="px-4 py-2 bg-[#EB7D30] text-white rounded-lg hover:bg-[#d66d20] transition-colors text-sm font-semibold flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Manage
                      </button>
                    </Link>

                    <Link href={`/events/${event.slug}`} target="_blank">
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </button>
                    </Link>

                    {event.is_published ? (
                      <button
                        onClick={() => handleUnpublish(event.id)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <EyeOff className="w-4 h-4" />
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(event.id)}
                        className="px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Publish
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(event.id)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-semibold flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
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
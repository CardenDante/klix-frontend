'use client';

import React from 'react';
import Link from 'next/link';
import { Event } from '@/lib/api/events';
import { MapPin, Calendar, Ticket, Share2, Bookmark } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  const eventDate = new Date(event.start_datetime);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      music: 'bg-purple-100 text-purple-700',
      sports: 'bg-green-100 text-green-700',
      conference: 'bg-blue-100 text-blue-700',
      workshop: 'bg-orange-100 text-orange-700',
      networking: 'bg-pink-100 text-pink-700',
      party: 'bg-yellow-100 text-yellow-700',
      festival: 'bg-red-100 text-red-700',
      exhibition: 'bg-indigo-100 text-indigo-700',
      comedy: 'bg-amber-100 text-amber-700',
      theater: 'bg-violet-100 text-violet-700',
      food_drink: 'bg-lime-100 text-lime-700',
      charity: 'bg-rose-100 text-rose-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  return (
    <Link 
      href={`/events/${event.slug}`}
      className={`group relative block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 ${featured ? 'md:col-span-2' : ''}`}
    >
      {/* Image */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gray-100">
        <img
          src={getImageUrl(event.portrait_image_url || event.banner_image_url, undefined)}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            // Show fallback gradient if image fails to load
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('.fallback-gradient')) {
              const fallback = document.createElement('div');
              fallback.className = 'fallback-gradient w-full h-full bg-gradient-to-br from-[#EB7D30] to-[#f5a56d] flex items-center justify-center';
              fallback.innerHTML = '<svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>';
              parent.appendChild(fallback);
            }
          }}
        />

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(event.category)}`}>
            {event.category.replace('_', ' ')}
          </span>
          {event.is_sold_out && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick actions */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.preventDefault();
              // Add bookmark logic
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Bookmark className="w-4 h-4 text-gray-700" />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              // Add share logic
            }}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Title */}
        <h3 className="font-comfortaa text-lg md:text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#EB7D30] transition-colors">
          {event.title}
        </h3>

        {/* Organizer */}
        <p className="text-sm text-gray-600 mb-3">
          by {event.organizer.business_name}
        </p>

        {/* Event details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-[#EB7D30]" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-[#EB7D30]" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {event.total_capacity - event.tickets_sold} left
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">From</p>
            <p className="font-bold text-[#EB7D30] text-lg">
              KSh {parseInt(String(event.tickets_sold)).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 border-2 border-[#EB7D30] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Link>
  );
}
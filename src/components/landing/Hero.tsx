'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');

  const floatingTickets = [
    { top: '15%', left: '10%', delay: '0s', color: 'bg-orange-500' },
    { top: '25%', right: '15%', delay: '0.5s', color: 'bg-purple-500' },
    { top: '60%', left: '20%', delay: '1s', color: 'bg-blue-500' },
    { top: '70%', right: '10%', delay: '1.5s', color: 'bg-pink-500' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pattern-bg">
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"></div>

      {/* Floating Tickets */}
      {floatingTickets.map((ticket, index) => (
        <div
          key={index}
          className={`absolute w-24 h-32 ${ticket.color} rounded-lg shadow-2xl opacity-20 animate-float`}
          style={{
            top: ticket.top,
            left: ticket.left,
            right: ticket.right,
            animationDelay: ticket.delay,
          }}
        ></div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Main Heading */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up font-heading">
          Discover{' '}
          <span className="relative inline-block">
            <span className="gradient-text">Unforgettable</span>
            <svg
              className="absolute -bottom-2 left-0 w-full"
              height="12"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 10C80 5 220 2 298 8"
                stroke="#EB7D30"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <br />
          Events Near You
        </h1>

        <p className="text-xl text-gray-200 mb-12 max-w-2xl mx-auto animate-fade-in-up font-body" style={{ animationDelay: '0.2s' }}>
          From concerts to conferences, find and book tickets to the hottest events in town
        </p>

        {/* Search Bar */}
        <div className="glass-dark rounded-2xl p-2 max-w-4xl mx-auto mb-8 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search events, artists, or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
              />
            </div>

            {/* Location */}
            <div className="relative md:w-48">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Location"
                className="pl-12 h-14 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
              />
            </div>

            {/* Date */}
            <div className="relative md:w-48">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="date"
                className="pl-12 h-14 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
              />
            </div>

            {/* Search Button */}
            <Button className="h-14 px-8 bg-[#EB7D30] hover:bg-[#d16a1f] text-white font-semibold animate-glow">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Quick Categories */}
        <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {['🎵 Music', '🏀 Sports', '🎭 Theater', '🎪 Festivals', '🎨 Arts', '🍔 Food'].map((category) => (
            <button
              key={category}
              className="glass-dark px-6 py-2 rounded-full text-white hover:bg-white/20 transition-all hover:scale-105"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="text-center">
            <div className="text-4xl font-bold text-white font-heading">10K+</div>
            <div className="text-gray-300 font-body">Events</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white font-heading">500K+</div>
            <div className="text-gray-300 font-body">Tickets Sold</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white font-heading">50K+</div>
            <div className="text-gray-300 font-body">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white font-heading">1K+</div>
            <div className="text-gray-300 font-body">Organizers</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}
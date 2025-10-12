'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar, Music, Gamepad2, Briefcase, Users, Utensils, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { icon: Music, label: 'Music', value: 'music' },
    { icon: Gamepad2, label: 'Sports', value: 'sports' },
    { icon: Briefcase, label: 'Business', value: 'conference' },
    { icon: PartyPopper, label: 'Festivals', value: 'festival' },
    { icon: Users, label: 'Networking', value: 'networking' },
    { icon: Utensils, label: 'Food & Drink', value: 'food_drink' },
  ];

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Static Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero/hero2.jpg')" }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Pattern Overlay - Subtle */}
      <div className="absolute inset-0 pattern-bg pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in-up font-heading">
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

        <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto animate-fade-in-up font-body" style={{ animationDelay: '0.2s' }}>
          From concerts to conferences, find and book tickets to the hottest events in Kenya
        </p>

        {/* Search Bar */}
        <div className="glass-dark rounded-2xl p-2 max-w-4xl mx-auto mb-8 animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search events, artists, or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
              />
            </div>

            {/* Location */}
            <div className="relative md:w-48">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Location"
                className="pl-12 h-12 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
              />
            </div>

            {/* Date */}
            <div className="relative md:w-48">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="date"
                className="pl-12 h-12 bg-white/10 border-0 text-white placeholder:text-gray-400 focus:bg-white/20 transition-colors"
              />
            </div>

            {/* Search Button */}
            <Button className="h-12 px-8 bg-[#EB7D30] hover:bg-[#d16a1f] text-white font-semibold animate-glow">
              <Search className="h-5 w-5 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Quick Categories */}
        <div className="flex flex-wrap justify-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          {categories.map((category) => (
            <button
              key={category.value}
              className="glass-dark px-5 py-2.5 rounded-full text-white hover:bg-white/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <category.icon className="h-4 w-4" />
              {category.label}
            </button>
          ))}
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
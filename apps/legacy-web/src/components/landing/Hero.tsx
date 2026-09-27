'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Music, Mic2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (searchQuery.trim()) {
      searchParams.append('q', searchQuery);
    }
    // Note: Add logic here to get values from location and date inputs
    // if you want them to be part of the search query.
    router.push(`/events?${searchParams.toString()}`);
  };

  const categories = [
    { label: 'Music', icon: Music, value: 'music' },
    { label: 'Festivals', icon: PartyPopper, value: 'festival' },
    { label: 'Comedy', icon: Mic2, value: 'comedy' },
  ];
  
  // Reusable classes for inputs and icons
  const inputClasses = "relative w-full h-12 pl-12 pr-4 bg-white/10 border border-white/20 rounded-full text-white placeholder:text-gray-300 focus:bg-white/20 focus:ring-primary/50 focus:border-primary/50 md:bg-transparent md:border-0 md:focus:ring-0";
  const iconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 h-5 w-5 pointer-events-none";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-center text-white">
      {/* Layer 1: Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero/hero2.jpg')" }}
      />
      
      {/* Layer 2: Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Layer 4: Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 animate-fade-in-up font-heading tracking-tight">
          Discover{' '}
          <span className="relative inline-block">
            <span className="gradient-text">Unforgettable</span>
            {/* --- Underline Restored --- */}
            <svg
              className="absolute -bottom-2 left-0 w-full"
              height="12"
              viewBox="0 0 300 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 10C80 5 220 2 298 8"
                stroke="url(#paint0_linear_1_2)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="paint0_linear_1_2" x1="0" y1="8" x2="300" y2="8" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EB7D30"/>
                  <stop offset="1" stopColor="#ff9554"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <br />
          <span className="mt-4 inline-block">Events Near You</span>
        </h1>

        <p className="text-lg text-gray-200 mb-10 max-w-2xl mx-auto animate-fade-in-up font-body" style={{ animationDelay: '0.2s' }}>
          From concerts to conferences, find your next great experience in just one Klix.
        </p>

        {/* --- Search Form --- */}
        <form 
          onSubmit={handleSearch} 
          className="max-w-4xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:rounded-full md:p-2 animate-fade-in-up" 
          style={{ animationDelay: '0.4s' }}
        >
          {/* Main container for inputs and button */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">

            {/* Main Search Input */}
            <div className="relative md:flex-1">
              <Search className={iconClasses} />
              <Input
                type="text"
                placeholder="Search for events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={inputClasses}
              />
            </div>
            
            {/* Desktop-only separator */}
            <div className="hidden md:block w-px h-8 bg-white/20 self-center" />

            {/* Location & Date Wrapper */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 md:flex md:w-auto md:flex-1">
                <div className="relative flex-1">
                    <MapPin className={iconClasses} />
                    <Input
                        type="text"
                        placeholder="Location"
                        className={inputClasses}
                    />
                </div>
                <div className="relative flex-1">
                    <Calendar className={iconClasses} />
                    <Input
                        type="text"
                        placeholder="Any Date"
                        onFocus={(e) => (e.target.type = 'date')}
                        onBlur={(e) => (e.target.type = 'text')}
                        className={inputClasses}
                    />
                </div>
            </div>

            {/* Search Button */}
            <Button 
              type="submit"
              className="w-full md:w-auto h-12 px-8 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full animate-glow"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Quick Categories */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <span className="text-sm font-medium text-gray-300 mr-2">Popular:</span>
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => router.push(`/events?category=${category.value}`)}
              className={`px-4 py-1.5 rounded-full text-white bg-white/10 hover:bg-white/20 transition-all text-sm flex items-center gap-2 ${
                category.value === 'comedy' ? 'hidden sm:flex' : 'flex'
              }`}
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
          className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round"
          strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  );
}
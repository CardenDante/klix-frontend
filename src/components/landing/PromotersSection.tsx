'use client';

import { useState } from 'react';
import { TrendingUp, Share2, DollarSign, Trophy, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function PromotersSection() {
  const [ticketsSold, setTicketsSold] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(50);
  const commissionRate = 10; // 10% commission

  const earnings = (ticketsSold * ticketPrice * commissionRate) / 100;

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Up to 10% Commission',
      description: 'Get paid for every ticket sold using your unique code',
    },
    {
      icon: Share2,
      title: 'Easy Sharing Tools',
      description: 'Share on WhatsApp, Twitter, Instagram with one click',
    },
    {
      icon: Target,
      title: 'Real-Time Tracking',
      description: 'Monitor your performance and earnings live',
    },
    {
      icon: Trophy,
      title: 'Leaderboard & Rewards',
      description: 'Compete with other promoters and earn bonuses',
    },
  ];

  const topPromoters = [
    { rank: 1, name: 'Sarah K.', sales: 456, earnings: '$2,280', badge: '🏆' },
    { rank: 2, name: 'John M.', sales: 389, earnings: '$1,945', badge: '🥈' },
    { rank: 3, name: 'Emma L.', sales: 312, earnings: '$1,560', badge: '🥉' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-orange-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#EB7D30] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#EB7D30]/10 text-[#EB7D30] px-6 py-2 rounded-full mb-6 font-semibold">
            <Sparkles className="h-5 w-5" />
            Turn Events Into Income
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-heading">
            Become a{' '}
            <span className="gradient-text font-playful">Promoter</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
            Share events you love and earn commission on every ticket sold
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
          {/* Left: Earnings Calculator */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 font-heading">
                Earnings Calculator
              </h3>
            </div>

            {/* Calculator Inputs */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tickets Sold: <span className="text-[#EB7D30]">{ticketsSold}</span>
                </label>
                <Slider
                  value={[ticketsSold]}
                  onValueChange={(value) => setTicketsSold(value[0])}
                  min={1}
                  max={500}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Ticket Price: <span className="text-[#EB7D30]">${ticketPrice}</span>
                </label>
                <Slider
                  value={[ticketPrice]}
                  onValueChange={(value) => setTicketPrice(value[0])}
                  min={10}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Commission Rate:</span>
                  <span className="font-semibold">{commissionRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Total Sales:</span>
                  <span className="font-semibold">${ticketsSold * ticketPrice}</span>
                </div>
              </div>
            </div>

            {/* Earnings Display */}
            <div className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-xl p-6 text-white">
              <div className="text-sm opacity-90 mb-2">Your Potential Earnings</div>
              <div className="text-5xl font-bold mb-2 font-heading">${earnings.toFixed(2)}</div>
              <div className="text-sm opacity-90">Per event campaign</div>
            </div>

            <p className="text-center text-gray-600 text-sm mt-6 font-body">
              Actual earnings may vary based on event and promoter performance
            </p>
          </div>

          {/* Right: Benefits & Leaderboard */}
          <div className="space-y-8">
            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 font-heading">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 font-body">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 font-heading">
                  Top Promoters
                </h3>
                <Trophy className="h-6 w-6 text-[#EB7D30]" />
              </div>

              <div className="space-y-3">
                {topPromoters.map((promoter) => (
                  <div
                    key={promoter.rank}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      promoter.rank === 1
                        ? 'bg-gradient-to-r from-[#EB7D30]/20 to-[#ff9554]/20 border border-[#EB7D30]/30'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{promoter.badge}</span>
                      <div>
                        <div className="font-semibold text-gray-900">{promoter.name}</div>
                        <div className="text-sm text-gray-600">{promoter.sales} tickets sold</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#EB7D30] text-lg">{promoter.earnings}</div>
                      <div className="text-xs text-gray-600">earned</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-center text-sm text-gray-600 mt-4 font-body">
                Could you be the next top promoter? 🚀
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button className="bg-gradient-to-r from-[#EB7D30] to-[#ff9554] hover:from-[#d16a1f] hover:to-[#EB7D30] text-white px-12 py-6 text-lg animate-glow">
            Become a Promoter
          </Button>
          <p className="text-gray-600 mt-4 font-body">
            Join 5,000+ promoters earning with Klix
          </p>
        </div>
      </div>
    </section>
  );
}
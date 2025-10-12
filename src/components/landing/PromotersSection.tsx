'use client';

import { useState } from 'react';
import { TrendingUp, Share2, DollarSign, Trophy, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function PromotersSection() {
  const [ticketsSold, setTicketsSold] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(5000);
  const commissionRate = 10; // 10% commission

  const earnings = (ticketsSold * ticketPrice * commissionRate) / 100;

  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn Up to 10%',
      description: 'Get commission on every ticket sold',
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'WhatsApp, Twitter, Instagram ready',
    },
    {
      icon: Target,
      title: 'Live Tracking',
      description: 'Monitor performance in real-time',
    },
    {
      icon: Trophy,
      title: 'Leaderboards',
      description: 'Compete and earn bonuses',
    },
  ];

  const topPromoters = [
    { rank: 1, name: 'Sarah K.', sales: 456, earnings: 'KSh 228,000', badge: '🏆' },
    { rank: 2, name: 'John M.', sales: 389, earnings: 'KSh 194,500', badge: '🥈' },
    { rank: 3, name: 'Emma L.', sales: 312, earnings: 'KSh 156,000', badge: '🥉' },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-orange-50 relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#EB7D30]/10 text-[#EB7D30] px-5 py-2 rounded-full mb-4 font-semibold">
            <Sparkles className="h-4 w-4" />
            Turn Events Into Income
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-heading">
            Become a{' '}
            <span className="gradient-text font-playful">Promoter</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-body">
            Share events you love and earn commission on every ticket
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          {/* Left: Calculator */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-heading">
                Earnings Calculator
              </h3>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tickets Sold: <span className="text-[#EB7D30]">{ticketsSold}</span>
                </label>
                <Slider
                  value={[ticketsSold]}
                  onValueChange={(value) => setTicketsSold(value[0])}
                  min={1}
                  max={500}
                  step={1}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ticket Price: <span className="text-[#EB7D30]">KSh {ticketPrice.toLocaleString()}</span>
                </label>
                <Slider
                  value={[ticketPrice]}
                  onValueChange={(value) => setTicketPrice(value[0])}
                  min={500}
                  max={20000}
                  step={500}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-xl p-5 text-white">
              <div className="text-sm opacity-90 mb-1">Your Potential Earnings</div>
              <div className="text-4xl font-bold mb-1 font-heading">KSh {earnings.toLocaleString()}</div>
              <div className="text-sm opacity-90">Per event campaign</div>
            </div>
          </div>

          {/* Right: Benefits & Leaderboard */}
          <div className="space-y-6">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                    <benefit.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1 font-heading">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm font-body">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 font-heading">
                  Top Promoters
                </h3>
                <Trophy className="h-5 w-5 text-[#EB7D30]" />
              </div>

              <div className="space-y-3">
                {topPromoters.map((promoter) => (
                  <div
                    key={promoter.rank}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      promoter.rank === 1
                        ? 'bg-gradient-to-r from-[#EB7D30]/20 to-[#ff9554]/20 border border-[#EB7D30]/30'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{promoter.badge}</span>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{promoter.name}</div>
                        <div className="text-xs text-gray-600">{promoter.sales} tickets</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#EB7D30] text-sm">{promoter.earnings}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button className="bg-gradient-to-r from-[#EB7D30] to-[#ff9554] hover:from-[#d16a1f] hover:to-[#EB7D30] text-white px-10 py-6 text-lg">
            Become a Promoter
          </Button>
          <p className="text-gray-600 mt-3 font-body">
            Join 5,000+ promoters earning with Klix
          </p>
        </div>
      </div>
    </section>
  );
}
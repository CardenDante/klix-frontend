'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Star, Zap, Crown, Sparkles, Award, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LoyaltySection() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleJoinClick = () => {
    if (isAuthenticated) {
      // Already logged in, go to loyalty dashboard
      router.push('/dashboard/loyalty');
    } else {
      // Not logged in, go to signup with redirect
      router.push('/login?redirect=/dashboard/loyalty');
    }
  };

  const tiers = [
    {
      name: 'Bronze',
      icon: Award,
      color: 'from-amber-700 to-amber-500',
      bgColor: 'bg-amber-50',
      requirement: '0-499 credits',
      benefits: ['5% cashback on tickets', 'Early event access', 'Birthday bonus credits'],
    },
    {
      name: 'Silver',
      icon: Star,
      color: 'from-gray-500 to-gray-300',
      bgColor: 'bg-gray-50',
      requirement: '500-1,999 credits',
      benefits: ['10% cashback on tickets', 'Priority support', 'VIP pre-sales access', 'Partner discounts'],
    },
    {
      name: 'Gold',
      icon: Crown,
      color: 'from-yellow-600 to-yellow-400',
      bgColor: 'bg-yellow-50',
      requirement: '2,000+ credits',
      benefits: ['15% cashback on tickets', 'Concierge service', 'Ticket upgrades', 'Lounge access', 'Special invitations'],
    },
  ];

  const howItWorks = [
    { step: '1', title: 'Buy Tickets', description: 'Earn 1 credit per KSh 100 spent', icon: ShoppingCart },
    { step: '2', title: 'Accumulate Credits', description: 'Credits never expire', icon: Sparkles },
    { step: '3', title: 'Unlock Rewards', description: 'Redeem for discounts', icon: Zap },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 via-white to-orange-50 pattern-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-white/80"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-5 py-2 rounded-full mb-4 font-semibold">
            <Gift className="h-4 w-4" />
            Loyalty Rewards
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-comfortaa">
            Get Rewarded for{' '}
            <span className="gradient-text">Every Event</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-body">
            The more events you attend, the more you save
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {howItWorks.map((item, index) => (
            <div key={index} className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-full flex items-center justify-center mx-auto">
                  <item.icon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg font-bold text-[#EB7D30] text-sm font-comfortaa">
                  {item.step}
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 font-comfortaa">{item.title}</h3>
              <p className="text-gray-600 text-sm font-body">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Tier Selection */}
        <div className="flex justify-center gap-3 mb-8">
          {tiers.map((tier, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all ${
                activeTab === index
                  ? `bg-gradient-to-r ${tier.color} text-white shadow-lg scale-105`
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tier.icon className="h-4 w-4" />
              {tier.name}
            </button>
          ))}
        </div>

        {/* Tier Details */}
        <div className="max-w-3xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`${activeTab === index ? 'block' : 'hidden'} animate-scale-in`}
            >
              <div className={`${tier.bgColor} rounded-2xl p-6 shadow-xl`}>
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${tier.color} rounded-full mb-3`}>
                    <tier.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1 font-comfortaa">{tier.name} Tier</h3>
                  <p className="text-gray-600 font-body">{tier.requirement}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {tier.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                      <div className={`w-5 h-5 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-700 text-sm font-body">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA - UPDATED */}
        <div className="text-center mt-10">
          <Button 
            onClick={handleJoinClick}
            className="bg-gradient-to-r from-purple-600 to-[#EB7D30] hover:from-purple-700 hover:to-[#d16a1f] text-white px-10 py-6 text-lg"
          >
            {isAuthenticated ? 'View My Rewards' : 'Join Free'}
          </Button>
          <p className="text-gray-600 mt-3 font-body">
            {isAuthenticated 
              ? 'Check your loyalty credits and rewards'
              : 'Start earning credits with your first purchase'
            }
          </p>
        </div>
      </div>
    </section>
  );
}
'use client';

import { useState } from 'react';
import { Gift, Star, Zap, Crown, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoyaltySection() {
  const [activeTab, setActiveTab] = useState(0);

  const tiers = [
    {
      name: 'Bronze',
      icon: Award,
      color: 'from-amber-700 to-amber-500',
      bgColor: 'bg-amber-50',
      requirement: '0-499 credits',
      benefits: [
        '5% cashback on all tickets',
        'Early access to select events',
        'Birthday bonus credits',
        'Exclusive member newsletters',
      ],
    },
    {
      name: 'Silver',
      icon: Star,
      color: 'from-gray-500 to-gray-300',
      bgColor: 'bg-gray-50',
      requirement: '500-1,999 credits',
      benefits: [
        '10% cashback on all tickets',
        'Priority customer support',
        'Free ticket on your birthday',
        'Access to VIP pre-sales',
        'Partner discounts & offers',
      ],
    },
    {
      name: 'Gold',
      icon: Crown,
      color: 'from-yellow-600 to-yellow-400',
      bgColor: 'bg-yellow-50',
      requirement: '2,000+ credits',
      benefits: [
        '15% cashback on all tickets',
        'Dedicated concierge service',
        'Complimentary ticket upgrades',
        'Exclusive lounge access',
        'Special event invitations',
        'Premium partner rewards',
      ],
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Buy Tickets',
      description: 'Earn 1 credit for every $1 spent on tickets',
      icon: Gift,
    },
    {
      step: '2',
      title: 'Accumulate Credits',
      description: 'Credits never expire and can be used anytime',
      icon: Sparkles,
    },
    {
      step: '3',
      title: 'Unlock Rewards',
      description: 'Redeem credits for discounts on future events',
      icon: Zap,
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-orange-50 pattern-bg relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white/80"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-6 py-2 rounded-full mb-6 font-semibold">
            <Gift className="h-5 w-5" />
            Loyalty Rewards Program
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-heading">
            Get Rewarded for{' '}
            <span className="gradient-text font-playful">Every Event</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
            The more events you attend, the more you save. It's that simple!
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {howItWorks.map((item, index) => (
            <div
              key={index}
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-full flex items-center justify-center mx-auto">
                  <item.icon className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg font-bold text-[#EB7D30] font-heading">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 font-heading">
                {item.title}
              </h3>
              <p className="text-gray-600 font-body">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Tier Selection */}
        <div className="flex justify-center gap-4 mb-8">
          {tiers.map((tier, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                activeTab === index
                  ? `bg-gradient-to-r ${tier.color} text-white shadow-lg scale-105`
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tier.icon className="h-5 w-5" />
              {tier.name}
            </button>
          ))}
        </div>

        {/* Tier Details */}
        <div className="max-w-4xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`${
                activeTab === index ? 'block' : 'hidden'
              } animate-scale-in`}
            >
              <div className={`${tier.bgColor} rounded-2xl p-8 shadow-xl border-2 border-${tier.color.split('-')[1]}-200`}>
                {/* Tier Header */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br ${tier.color} rounded-full mb-4`}>
                    <tier.icon className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
                    {tier.name} Tier
                  </h3>
                  <p className="text-gray-600 font-body">{tier.requirement}</p>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {tier.benefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 bg-white rounded-lg"
                    >
                      <div className={`w-6 h-6 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-body">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Progress Indicator */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Your Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {index === 0 ? '120' : index === 1 ? '750' : '2,340'} credits
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${tier.color} transition-all duration-1000`}
                      style={{ width: `${index === 0 ? 24 : index === 1 ? 37.5 : 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button className="bg-gradient-to-r from-purple-600 to-[#EB7D30] hover:from-purple-700 hover:to-[#d16a1f] text-white px-12 py-6 text-lg animate-glow">
            Join Rewards Program - It's Free!
          </Button>
          <p className="text-gray-600 mt-4 font-body">
            Start earning credits with your first ticket purchase
          </p>
        </div>
      </div>
    </section>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Star, Crown, Check, ArrowRight, ShoppingCart, Sparkles, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LoyaltySection() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleJoinClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard/loyalty');
    } else {
      router.push('/login?redirect=/dashboard/loyalty');
    }
  };

  const howItWorks = [
    { icon: ShoppingCart, title: 'Buy Tickets', description: 'Earn credits for every purchase you make.' },
    { icon: Sparkles, title: 'Unlock Tiers', description: 'The more you attend, the higher your status.' },
    { icon: Gift, title: 'Get Rewards', description: 'Redeem credits for exclusive discounts.' },
  ];
  
  // --- MODIFIED: Icons are now unique ---
  const tiers = [
    { name: 'Bronze', icon: Award, color: 'text-amber-600', benefits: ['5% Cashback', 'Birthday Bonus'] },
    { name: 'Silver', icon: Star, color: 'text-gray-500', benefits: ['10% Cashback', 'Priority Support', 'Pre-Sales Access'] },
    { name: 'Gold', icon: Crown, color: 'text-yellow-500', benefits: ['15% Cashback', 'Concierge Service', 'Ticket Upgrades'] },
  ];

  return (
    <section className="py-20 relative bg-orange-50/50 overflow-hidden">
        {/* Background Pattern on the RIGHT */}
        <div 
            className="absolute top-0 right-0 h-full w-2/3 bg-no-repeat bg-contain bg-right-top opacity-15 pointer-events-none"
            style={{ backgroundImage: "url('/bckpattern2.png')" }} 
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 font-semibold">
                    <Gift className="h-5 w-5" />
                    Klix Rewards
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
                    Get Rewarded for <span className="gradient-text font-playful pr-2">Every Event</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body">
                    Join the Klix Loyalty Program and turn every ticket into a treat.
                </p>
            </div>

            {/* How It Works */}
            <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 md:gap-8 mb-16">
              {howItWorks.map((item, index) => (
                <div key={index} className="text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-white shadow-md rounded-full flex items-center justify-center mb-4 border">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 font-comfortaa">{item.title}</h3>
                  <p className="text-gray-600 text-xs md:text-sm font-body">{item.description}</p>
                </div>
              ))}
            </div>

            {/* --- MODIFIED: Tiers Section grid for vertical stacking on mobile --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {tiers.map((tier, index) => (
                <div key={index} className={`bg-white rounded-2xl p-8 text-center shadow-xl border hover:-translate-y-2 transition-transform duration-300 ${index === 2 ? 'border-yellow-400' : 'border-gray-200'}`}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 mx-auto`}>
                        <tier.icon className={`h-8 w-8 ${tier.color}`} />
                    </div>
                    <h3 className={`text-2xl font-bold font-comfortaa ${tier.color}`}>{tier.name}</h3>
                    <ul className="space-y-3 mt-6 text-left">
                        {tier.benefits.map((benefit) => (
                            <li key={benefit} className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-gray-700 font-body">{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
                <Button 
                    onClick={handleJoinClick}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-lg font-bold"
                >
                    {isAuthenticated ? 'View My Rewards' : 'Join For Free'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-gray-600 mt-3 font-body">
                    Start earning credits with your very first purchase.
                </p>
            </div>
        </div>
    </section>
  );
}
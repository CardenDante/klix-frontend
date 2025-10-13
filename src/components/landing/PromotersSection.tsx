'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, Share2, DollarSign, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export default function PromotersSection() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const handleBecomePromoter = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/become-promoter');
    } else if (user?.role === 'promoter') {
      router.push('/promoter');
    } else {
      router.push('/become-promoter');
    }
  };

  const benefits = [
    { icon: DollarSign, title: 'Earn Commission', description: 'Get up to 10% on every ticket sold.' },
    { icon: Share2, title: 'Easy Sharing', description: 'One-click sharing to all social media.' },
    { icon: TrendingUp, title: 'Live Tracking', description: 'Monitor your performance in real-time.' },
    { icon: Trophy, title: 'Compete & Win', description: 'Climb leaderboards for extra bonuses.' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
           <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 font-semibold">
            <Sparkles className="h-5 w-5" />
            Turn Events Into Income
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
            Become a <span className="gradient-text font-playful pr-2">Promoter</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body">
            Share events you love and earn commission on every ticket sold through your unique code.
          </p>
        </div>

        {/* --- MODIFIED: Reduced gap for desktop --- */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side: Benefits List */}
          <div className="space-y-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-comfortaa">{benefit.title}</h3>
                  <p className="text-gray-600 font-body">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Image */}
          <div className="relative h-96 lg:h-full w-full rounded-2xl overflow-hidden shadow-2xl order-first lg:order-last">
            <Image
                src="/hero/hero1.jpg" // Using an existing vibrant image
                alt="Event promoter sharing on a phone"
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button 
            onClick={handleBecomePromoter}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-lg font-bold"
          >
            {user?.role === 'promoter' ? 'Go to Your Dashboard' : 'Become a Promoter Today'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-gray-600 mt-3 font-body">
            {user?.role === 'promoter' 
              ? 'Manage your codes and track your earnings'
              : 'Join over 5,000 promoters earning with Klix'
            }
          </p>
        </div>
      </div>
    </section>
  );
}
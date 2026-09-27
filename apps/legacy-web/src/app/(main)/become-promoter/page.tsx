'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Share2, DollarSign, TrendingUp, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

export default function BecomePromoterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard/apply-promoter'); // This route might need to be created
    } else {
      router.push('/login?redirect=/dashboard/apply-promoter');
    }
  };

  const howItWorks = [
    { step: '01', title: 'Find an Event', description: 'Browse our marketplace for events you’re passionate about.' },
    { step: '02', title: 'Share Your Code', description: 'Generate a unique promoter code and share it with your network.' },
    { step: '03', title: 'Get Paid', description: 'Earn a commission for every ticket sold with your code, paid out directly.' },
  ];

  const benefits = [
    { icon: DollarSign, title: 'Generous Commissions', description: 'Earn a competitive percentage on every single ticket you help sell.' },
    { icon: TrendingUp, title: 'Real-Time Dashboard', description: 'Track your clicks, sales, and earnings with a simple, powerful analytics dashboard.' },
    { icon: Share2, title: 'Effortless Sharing', description: 'Get unique, shareable links and codes that are easy to post anywhere.' },
    { icon: Trophy, title: 'Leaderboard & Bonuses', description: 'Compete with other promoters for top spots and earn bonus rewards.' },
  ];

  return (
    <div className="bg-white">
      {/* --- Hero Section --- */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero4.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern3.png')" }} />
        <div className="relative z-10 p-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight animate-fade-in-up">
            Share Events,
            <br />
            <span className="gradient-text font-playful mt-2 inline-block pr-4">Earn Rewards</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Join the Klix promoter network and turn your influence into income by sharing events you love.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="mt-8 bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            Start Earning Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
              Start Earning in <span className="gradient-text font-playful pr-2">Minutes</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {howItWorks.map((step) => (
              <div key={step.step} className="p-6">
                <div className="text-6xl font-bold gradient-text mb-4 font-heading">{step.step}</div>
                <h3 className="text-xl font-bold font-comfortaa text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 font-body">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Benefits Section --- */}
      <section className="py-20 relative bg-orange-50/50 overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-1/2 bg-no-repeat bg-contain bg-right-top opacity-30 pointer-events-none" style={{ backgroundImage: "url('/bckpattern2.png')" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side: Image */}
            <div className="relative w-full h-80 lg:h-[450px] rounded-2xl overflow-hidden shadow-2xl">
                <Image 
                  src="/hero/hero1.jpg"
                  alt="Promoter sharing event on phone"
                  fill
                  className="object-cover"
                />
            </div>
            {/* Right Side: Benefits */}
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight mb-8">
                Perks of being a <span className="gradient-text font-playful pr-2">Promoter</span>
              </h2>
              <div className="space-y-6">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 font-comfortaa">{benefit.title}</h3>
                      <p className="text-gray-600 font-body">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '200%' }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 font-comfortaa">
              Ready to Start Earning?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-body">
              Apply in minutes and start promoting events today. It's free to join!
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
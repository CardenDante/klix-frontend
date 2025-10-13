'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Users, Ticket, DollarSign, Shield, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function BecomeOrganizerPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard/apply-organizer');
    } else {
      router.push('/login?redirect=/dashboard/apply-organizer');
    }
  };

  const features = [
    { icon: BarChart3, title: 'Real-Time Analytics', description: 'Track sales, revenue, and attendee data instantly.' },
    { icon: Ticket, title: 'Easy Ticket Setup', description: 'Create multiple ticket types and pricing tiers in minutes.' },
    { icon: Users, title: 'Staff Management', description: 'Assign roles with granular permissions for check-ins.' },
    { icon: DollarSign, title: 'Instant Payouts', description: 'Direct M-Pesa integration with transparent, low fees.' },
    { icon: Shield, title: 'Secure Payments', description: 'Bank-grade security and fraud prevention for all transactions.' },
    { icon: Zap, title: 'Quick Setup', description: 'Publish your first event in under 5 minutes. It\'s that simple.' },
  ];

  const howItWorks = [
    { step: '01', title: 'Create Your Account', description: 'Sign up for free and tell us a bit about your events.' },
    { step: '02', title: 'Publish Your Event', description: 'Use our simple tools to set up your event page and ticket types.' },
    { step: '03', title: 'Start Selling', description: 'Share your event and watch the sales roll in with real-time analytics.' },
  ];

  return (
    <div className="bg-white">
      {/* --- Hero Section --- */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero2.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern3.png')" }} />
        <div className="relative z-10 p-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight animate-fade-in-up">
            Host Your Next Great
            <br />
            <span className="gradient-text font-playful mt-2 inline-block pr-4">Event</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Powerful tools, transparent pricing, and local support to help you create unforgettable experiences.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="mt-8 bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            Get Started For Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* --- How It Works Section --- */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
              Get Started in <span className="gradient-text font-playful pr-2">3 Easy Steps</span>
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

      {/* --- Features Section --- */}
      <section className="py-20 relative bg-orange-50/50 overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1/2 bg-no-repeat bg-contain bg-left-top opacity-30 pointer-events-none" style={{ backgroundImage: "url('/bckpattern2.png')" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
              Tools to Help You <span className="gradient-text font-playful pr-2">Succeed</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="relative p-0.5 bg-gradient-to-br from-primary via-purple-500 to-primary rounded-2xl shadow-lg">
                <div className="bg-white/90 backdrop-blur-sm rounded-[15px] p-6 h-full">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 font-comfortaa">{feature.title}</h3>
                  <p className="text-gray-600 text-sm font-body">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* --- Pricing Section --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
            <div>
                 <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
                    Simple, Transparent <span className="gradient-text font-playful pr-2">Pricing</span>
                </h2>
                 <p className="text-lg text-gray-600 mt-4 font-body">
                    No setup fees, no monthly costs. We only make money when you do.
                 </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border">
                <p className="text-lg text-gray-600 font-body">Pay-as-you-go</p>
                <div className="text-5xl font-bold text-gray-900 my-2 font-heading">
                    2.5% 
                </div>
                <p className="text-gray-600 font-body">Per ticket sold</p>
            </div>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '200%' }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 font-comfortaa">
              Ready to Create an Event?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-body">
              Join hundreds of successful organizers and start selling tickets in minutes.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold"
            >
              Start Organizing Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
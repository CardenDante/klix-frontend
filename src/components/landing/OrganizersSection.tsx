'use client';

import { BarChart3, Users, Ticket, DollarSign, Shield, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function OrganizersSection() {
  const router = useRouter();

  const features = [
    { icon: BarChart3, title: 'Real-Time Analytics', description: 'Track sales, revenue, and attendee data instantly.' },
    { icon: Ticket, title: 'Easy Ticket Setup', description: 'Create multiple ticket types and pricing tiers in minutes.' },
    { icon: Users, title: 'Staff Management', description: 'Assign roles with granular permissions for check-ins.' },
    { icon: DollarSign, title: 'Instant Payouts', description: 'Direct M-Pesa integration with transparent, low fees.' },
    { icon: Shield, title: 'Secure Payments', description: 'Bank-grade security and fraud prevention for all transactions.' },
    { icon: Zap, title: 'Quick Setup', description: 'Publish your first event in under 5 minutes. It\'s that simple.' },
  ];

  const stats = [
    { value: '2.5%', label: 'Platform Fee', subtext: 'Industry-leading low cost' },
    { value: '24/7', label: 'Support', subtext: 'Always available to help' },
    { value: '99.9%', label: 'Uptime', subtext: 'A reliable platform' },
  ];

  return (
    <section className="py-20 relative bg-orange-50/50 overflow-hidden">
      {/* Background Pattern on the LEFT */}
      <div 
        className="absolute top-0 left-0 h-full w-1/2 bg-no-repeat bg-contain bg-left-top opacity-25 pointer-events-none"
        style={{ backgroundImage: "url('/bckpattern2.png')" }} 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
            Built for Event <span className="gradient-text font-playful pr-2">Organizers</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body">
            Everything you need to create, manage, and grow successful events.
          </p>
        </div>

        {/* --- MODIFIED: Features Grid --- */}
        {/* Now uses grid-cols-2 on mobile, and lg:grid-cols-3 on large screens */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-0.5 bg-gradient-to-br from-primary via-purple-500 to-primary rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-[15px] p-4 sm:p-6 h-full flex flex-col">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 font-comfortaa">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm font-body">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- MODIFIED: Stats Section --- */}
        {/* Now uses grid-cols-3 on all screen sizes */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-4xl md:text-5xl font-bold gradient-text mb-1 font-heading">
                {stat.value}
              </div>
              <div className="text-sm md:text-lg font-semibold text-gray-900 font-body">{stat.label}</div>
              <div className="text-gray-500 text-xs md:text-sm font-body">{stat.subtext}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => router.push('/become-organizer')}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-lg font-bold"
          >
            Start Organizing Events
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-gray-600 mt-3 font-body">
            Free to start • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
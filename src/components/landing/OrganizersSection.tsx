'use client';

import { BarChart3, Users, Ticket, DollarSign, Shield, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function OrganizersSection() {
  const router = useRouter();

  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track sales, revenue, and attendee data instantly',
    },
    {
      icon: Ticket,
      title: 'Easy Ticket Setup',
      description: 'Create multiple ticket types in minutes',
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Assign roles with granular permissions',
    },
    {
      icon: DollarSign,
      title: 'Instant Payouts',
      description: 'M-Pesa integration with transparent fees',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Bank-grade security for all transactions',
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Launch events in under 5 minutes',
    },
  ];

  const stats = [
    { value: '2.5%', label: 'Platform Fee', subtext: 'Industry-leading' },
    { value: '24/7', label: 'Support', subtext: 'Always available' },
    { value: '99.9%', label: 'Uptime', subtext: 'Reliable platform' },
  ];

  return (
    <section className="py-16 bg-white pattern-bg-2 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-orange-50/95"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-heading">
            Built for{' '}
            <span className="gradient-text font-playful">Event Organizers</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-body">
            Everything you need to create and manage successful events
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex gap-4 p-5 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-lg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 font-heading">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm font-body">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold gradient-text mb-1 font-heading">
                {stat.value}
              </div>
              <div className="text-lg font-semibold text-gray-900">{stat.label}</div>
              <div className="text-gray-600 text-sm font-body">{stat.subtext}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => router.push('/become-organizer')}
            className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white px-10 py-6 text-lg"
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
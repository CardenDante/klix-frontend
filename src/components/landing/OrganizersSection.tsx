'use client';

import { BarChart3, Users, Ticket, DollarSign, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrganizersSection() {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track sales, revenue, and attendee data with comprehensive dashboards',
    },
    {
      icon: Ticket,
      title: 'Easy Ticket Management',
      description: 'Create multiple ticket types with custom pricing and availability',
    },
    {
      icon: Users,
      title: 'Staff Control',
      description: 'Assign roles and manage event staff with granular permissions',
    },
    {
      icon: DollarSign,
      title: 'Instant Payouts',
      description: 'Get paid fast with M-Pesa integration and transparent fee structure',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Bank-grade security for all transactions and customer data',
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Launch your event in minutes with our intuitive tools',
    },
  ];

  const stats = [
    { value: '2.5%', label: 'Platform Fee', subtext: 'Industry-leading low fee' },
    { value: '24/7', label: 'Support', subtext: 'Always here to help' },
    { value: '99.9%', label: 'Uptime', subtext: 'Reliable infrastructure' },
  ];

  return (
    <section className="py-20 bg-white pattern-bg-2 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-orange-50/95"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-heading">
            Built for{' '}
            <span className="gradient-text font-playful">Event Organizers</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-body">
            Everything you need to create, manage, and grow successful events
          </p>
        </div>

        {/* Main Content - Split Screen */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left: Benefits */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex gap-4 p-6 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-in-right"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-lg flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 font-heading">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 font-body">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Dashboard Preview */}
          <div className="relative animate-scale-in">
            <div className="glass rounded-2xl p-8 shadow-2xl">
              {/* Mock Dashboard */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
                    Organizer Dashboard
                  </h3>
                  <p className="text-gray-600 font-body">Your event performance at a glance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-xl p-4 text-white">
                    <div className="text-sm opacity-90">Total Revenue</div>
                    <div className="text-3xl font-bold mt-1 font-heading">$45,230</div>
                    <div className="text-sm mt-2 opacity-90">↑ 23% this month</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-sm opacity-90">Tickets Sold</div>
                    <div className="text-3xl font-bold mt-1 font-heading">1,847</div>
                    <div className="text-sm mt-2 opacity-90">↑ 15% this week</div>
                  </div>
                </div>

                {/* Chart Preview */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#EB7D30] to-[#ff9554] rounded-t-lg transition-all hover:scale-105"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 text-sm text-gray-600">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 py-3 bg-[#EB7D30] text-white rounded-lg font-semibold hover:bg-[#d16a1f] transition-colors">
                    <Ticket className="h-5 w-5" />
                    Create Event
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                    <BarChart3 className="h-5 w-5" />
                    View Analytics
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#EB7D30] rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl font-bold gradient-text mb-2 font-heading">
                {stat.value}
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-1">{stat.label}</div>
              <div className="text-gray-600 font-body">{stat.subtext}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white px-12 py-6 text-lg animate-glow">
            Start Organizing Events
          </Button>
          <p className="text-gray-600 mt-4 font-body">
            Free to get started • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
'use client';

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PricingPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 font-comfortaa">Simple, Transparent Pricing</h1>
          <p className="text-gray-600 text-xl font-body">No hidden fees. Pay only when you sell tickets.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4 font-comfortaa">Attendees</h3>
              <div className="text-5xl font-bold text-primary mb-4 font-comfortaa">Free</div>
              <ul className="space-y-3 mb-6">
                {['Browse unlimited events', 'Secure ticket purchases', 'Loyalty rewards', 'QR code tickets'].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 font-body">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
              Most Popular
            </Badge>
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4 font-comfortaa">Organizers</h3>
              <div className="text-5xl font-bold text-primary mb-2 font-comfortaa">2.5%</div>
              <p className="text-gray-600 mb-4 font-body">per ticket sold</p>
              <ul className="space-y-3 mb-6">
                {['Unlimited events', 'Analytics dashboard', 'Staff management', 'M-Pesa integration', 'Promoter codes'].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 font-body">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-4 font-comfortaa">Promoters</h3>
              <div className="text-5xl font-bold text-primary mb-4 font-comfortaa">Free</div>
              <ul className="space-y-3 mb-6">
                {['Create promo codes', 'Earn commissions', 'Performance analytics', 'Leaderboard rankings'].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 font-body">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
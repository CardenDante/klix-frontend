'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from '@/hooks/useAuth';

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/dashboard/apply-organizer');
    } else {
      router.push('/login?redirect=/dashboard/apply-organizer');
    }
  };

  const includedFeatures = [
    'Unlimited Events',
    'Multiple Ticket Types',
    'Real-time Analytics Dashboard',
    'Secure M-Pesa Payments',
    'Customizable Event Page',
    'Promoter & Staff Management Tools',
    'Attendee Check-in System',
    '24/7 Customer Support',
  ];

  const faqItems = [
    {
      question: "Are there any setup fees or monthly costs?",
      answer: "Absolutely not. Klix is completely free to get started with. There are no monthly subscriptions, setup fees, or hidden charges. We only make money when you successfully sell a ticket."
    },
    {
      question: "What payment methods are supported?",
      answer: "We proudly support M-Pesa, Kenya's most popular mobile payment service, for all transactions. This ensures a fast, secure, and convenient checkout experience for your attendees."
    },
    {
      question: "How and when do I get paid?",
      answer: "Payouts are processed automatically and sent directly to your registered M-Pesa account after your event concludes. You can track all your earnings in real-time from your organizer dashboard."
    },
    {
      question: "Can I use Klix for free events?",
      answer: "Yes! Creating listings and managing RSVPs for free events is 100% free on Klix. Our platform fee only applies to paid tickets."
    }
  ];

  return (
    <div className="bg-white">
      {/* --- Hero Section --- */}
      <section className="pt-28 pb-20 relative bg-orange-50/50 overflow-hidden">
        <div 
            className="absolute inset-0 bg-no-repeat bg-contain bg-center opacity-20 pointer-events-none"
            style={{ backgroundImage: "url('/bckpattern2.png')" }} 
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
            Simple, Transparent <span className="gradient-text font-playful pr-2">Pricing</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4 font-body">
            No setup fees. No monthly costs. No surprises. We only succeed when your event does.
          </p>
        </div>
      </section>

      {/* --- Pricing & Features Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
          
          {/* --- MODIFIED: Pricing Card --- */}
          <div className="lg:sticky lg:top-28">
            <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 text-center text-white">
              <p className="text-lg font-semibold text-primary font-body">PAY-AS-YOU-GO</p>
              <div className="my-4">
                <span className="text-8xl font-bold gradient-text font-heading">2.5%</span>
              </div>
              <p className="text-gray-300 font-body text-lg">
                Per ticket sold – no setup costs.
              </p>
              <Button onClick={handleGetStarted} size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 text-lg mt-8">
                Get Started For Free
              </Button>
            </div>
          </div>

          {/* Right Column: Included Features */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 font-comfortaa mb-6">Everything You Need is Included</h2>
            <ul className="space-y-4">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 font-body text-lg">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
           <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
                Your Questions, <span className="gradient-text font-playful pr-2">Answered</span>
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger className="text-lg font-semibold text-gray-800 text-left hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 font-body">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
        </div>
      </section>

       {/* --- Final CTA Section --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '200%' }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 font-comfortaa">
              Ready to Start Selling?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-body">
              Create your event and start selling tickets in minutes. It's free to join!
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold"
            >
              Create Your Event Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Phone, Mail, MapPin, Twitter, Instagram, Facebook, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function ContactPage() {
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add form submission logic here
    alert('Form submitted! (This is a placeholder)');
  };
  
  const faqItems = [
    {
      question: "How do I get a refund for my ticket?",
      answer: "Refund policies are set by the event organizer for each event. You can request a refund directly from your ticket in the 'My Tickets' section of your dashboard, and the organizer will be notified. Klix does not control individual event refund policies."
    },
    {
      question: "Can I change the name or details on my ticket?",
      answer: "For most events, ticket details like the attendee name cannot be changed after purchase for security reasons. Please contact the event organizer directly to inquire about their specific policy on ticket transfers."
    },
    {
      question: "How do I become an event organizer or promoter?",
      answer: "We'd love to have you! You can apply to become an organizer or promoter by visiting the 'For Organizers' or 'For Promoters' pages on our website. The application process is quick and our team will review it within 48 hours."
    },
    {
      question: "I haven't received my ticket email. What should I do?",
      answer: "First, please check your spam or junk folder. If you still can't find it, you can access all your purchased tickets directly from the 'My Tickets' section in your Klix dashboard at any time. All your tickets are securely stored there."
    }
  ];

  return (
    <div className="bg-white">
      {/* --- Header Section --- */}
      <section className="pt-28 pb-16 relative bg-orange-50/50 overflow-hidden">
        <div 
            className="absolute inset-0 bg-no-repeat bg-contain bg-center opacity-20 pointer-events-none"
            style={{ backgroundImage: "url('/bckpattern2.png')" }} 
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
            Get in <span className="gradient-text font-playful pr-2">Touch</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body">
            We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, our team is ready to help.
          </p>
        </div>
      </section>

      {/* --- Main Contact Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-5">
            {/* Left Side: Contact Info */}
            <div className="lg:col-span-2 bg-gradient-to-br from-primary to-orange-400 text-white p-8 sm:p-12">
              <h2 className="text-3xl font-bold font-comfortaa mb-4">Contact Information</h2>
              <p className="opacity-90 mb-8 font-body">
                Fill up the form and our Team will get back to you within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Phone className="w-6 h-6 flex-shrink-0" />
                  <span className="font-body">+254 712 345 678</span>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="w-6 h-6 flex-shrink-0" />
                  <span className="font-body">support@klix.co.ke</span>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="font-body">Thika, Kiambu County, Kenya</span>
                </div>
              </div>

              <div className="flex gap-4 mt-12">
                  <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
              </div>
            </div>

            {/* Right Side: Contact Form */}
            <div className="lg:col-span-3 p-8 sm:p-12">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="font-semibold font-body text-gray-700">First Name</Label>
                    <Input id="first-name" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="font-semibold font-body text-gray-700">Last Name</Label>
                    <Input id="last-name" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold font-body text-gray-700">Email Address</Label>
                  <Input id="email" type="email" placeholder="john.doe@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="font-semibold font-body text-gray-700">Message</Label>
                  <Textarea id="message" placeholder="How can we help you?" rows={5} />
                </div>
                <div>
                  <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                    Send Message
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- NEW: FAQ Section --- */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
           <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
                Frequently Asked <span className="gradient-text font-playful pr-2">Questions</span>
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
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

      {/* --- NEW: Bottom Space (CTA Section) --- */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '200%' }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 font-comfortaa">
              Still Can't Find an Answer?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-body">
              Our team is ready to help. Or, you can explore the amazing events happening now on Klix.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/events')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold"
            >
              Browse Events
              <Search className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
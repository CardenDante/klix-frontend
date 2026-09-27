'use client';

import { Users, Target, Heart, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AboutPage() {
  const router = useRouter();

  const values = [
    {
      title: 'Simplicity',
      description: 'We believe technology should be intuitive. Our platform is designed to be easy for everyone, from first-time ticket buyers to seasoned event organizers.'
    },
    {
      title: 'Trust',
      description: 'Security and transparency are at our core. We protect your data, ensure secure payments, and maintain honest communication with our community.'
    },
    {
      title: 'Community',
      description: 'We\'re building a platform for everyone. We support diverse voices and celebrate the unique experiences that bring people together.'
    }
  ];

  return (
    <div className="bg-white">
      {/* --- Hero Section --- */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero1.jpg')" }} />
        {/* --- MODIFIED: Added a gradient overlay for better text contrast --- */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        
        <div className="relative z-10 p-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight animate-fade-in-up">
            Connecting People Through
            <br />
            <span className="gradient-text font-playful mt-2 inline-block pr-4 pb-6">Experiences</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Klix was founded with a simple vision: to bridge the gap between amazing events and the people who want to experience them.
          </p>
        </div>
      </section>

      {/* --- Our Mission Section --- */}
      {/* --- MODIFIED: Switched to flexbox and re-ordered elements for mobile-first layout --- */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          {/* Text content now comes first in the code */}
          <div className="lg:w-1/2">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 font-heading tracking-tight mb-6">
              Our <span className="gradient-text font-playful pr-2">Mission</span>
            </h2>
            <p className="text-gray-600 mb-6 font-body text-lg">
              We're building more than just a ticketing platform – we're creating a community where organizers can thrive, promoters can succeed, and attendees can discover unforgettable moments.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-gray-700 font-body">
                  <span className="font-bold">For Attendees:</span> To make finding and attending events simple, secure, and rewarding.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-gray-700 font-body">
                  <span className="font-bold">For Organizers:</span> To provide powerful, easy-to-use tools that help events of all sizes succeed.
                </p>
              </div>
            </div>
          </div>
          {/* Image now comes second in the code */}
          <div className="relative w-full h-80 lg:h-[450px] lg:w-1/2 rounded-2xl overflow-hidden shadow-2xl">
              <Image 
                src="/hero/hero3.jpg"
                alt="Happy people at an event"
                fill
                className="object-cover"
              />
          </div>
        </div>
      </section>

      {/* --- Values Section --- */}
      <section className="py-20 relative bg-orange-50/50 overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full w-1/2 bg-no-repeat bg-contain bg-left-top opacity-30 pointer-events-none"
          style={{ backgroundImage: "url('/bckpattern2.png')" }} 
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
              Our Core <span className="gradient-text font-playful pr-2">Values</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200/50 text-center">
                <h3 className="text-2xl font-bold font-comfortaa mb-4 text-primary">{value.title}</h3>
                <p className="text-gray-600 font-body">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Join Our Journey CTA --- */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '200%' }}
          />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 font-comfortaa">
              Join Our Journey
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-body">
              We're a passionate team building the future of event experiences in Kenya. If you're excited by our mission, we'd love to hear from you.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/careers')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold"
            >
              View Open Positions
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
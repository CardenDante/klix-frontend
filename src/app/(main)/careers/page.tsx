'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Briefcase, MapPin, BrainCircuit, Coffee, HeartHandshake, Zap } from 'lucide-react';

export default function CareersPage() {
  const router = useRouter();

  const jobOpenings = [
    {
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      location: 'Thika, Kenya',
      type: 'Full-time',
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Nairobi, Kenya',
      type: 'Full-time',
    },
    {
      title: 'Customer Support Specialist',
      department: 'Support',
      location: 'Remote',
      type: 'Contract',
    },
  ];

  const perks = [
    { icon: BrainCircuit, title: 'Meaningful Work' },
    { icon: Zap, title: 'Growth Opportunities' },
    { icon: HeartHandshake, title: 'Inclusive Culture' },
    { icon: Coffee, title: 'Flexible Environment' },
  ];

  return (
    <div className="bg-white">
      {/* --- Hero Section --- */}
      <section className="relative h-[60vh] min-h-[450px] flex items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero1.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern3.png')" }} />
        <div className="relative z-10 p-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-heading tracking-tight animate-fade-in-up">
            Build the Future of
            <br />
            <span className="gradient-text font-playful mt-2 inline-block">Events</span>
          </h1>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Join our passionate team and help us connect people through unforgettable experiences.
          </p>
        </div>
      </section>

      {/* --- Perks & Culture Section --- */}
      <section className="py-20 relative bg-orange-50/50 overflow-hidden">
        <div 
          className="absolute top-0 right-0 h-full w-2/3 bg-no-repeat bg-contain bg-right-top opacity-30 pointer-events-none"
          style={{ backgroundImage: "url('/bckpattern2.png')" }} 
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
              Work with <span className="gradient-text font-playful pr-2">Purpose</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4 font-body">
              We're a team of creators, thinkers, and innovators dedicated to making a difference.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {perks.map((perk) => (
              <div key={perk.title} className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200/50">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <perk.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-comfortaa text-gray-800">{perk.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Open Positions Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 font-heading tracking-tight">
              Current <span className="gradient-text font-playful pr-2">Openings</span>
            </h2>
          </div>
          <div className="space-y-6">
            {jobOpenings.map((job, index) => (
              // --- MODIFIED: Job Card Layout ---
              <div key={index} className="bg-white p-6 rounded-2xl border shadow-md hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Job Title and Details */}
                  <div>
                    <h3 className="text-xl font-bold text-primary font-comfortaa">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 text-sm mt-2 font-body">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.department}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                  </div>
                  {/* Apply Button */}
                  <div className="flex-shrink-0">
                    <Button 
                      onClick={() => router.push('/contact')}
                      className="w-full sm:w-auto"
                    >
                      Apply Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Final CTA Section --- */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gray-900 rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '200%' }} />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4 font-comfortaa">
              Don't See Your Role?
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto mb-8 font-body">
              We're always looking for passionate people. Send us your resume and tell us why you'd be a great fit for the Klix team.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/contact')}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg font-bold"
            >
              Get in Touch
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
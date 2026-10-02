import { ArrowRight, BrainCircuit, Briefcase, Clock, Coffee, HeartHandshake, MapPin, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { CONTACT } from '@/lib/site';

export const metadata: Metadata = { title: 'Careers', description: 'Help us connect people through unforgettable experiences.' };

const OPENINGS = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Thika, Kenya', type: 'Full-time' },
  { title: 'Marketing Manager', department: 'Marketing', location: 'Nairobi, Kenya', type: 'Full-time' },
  { title: 'Customer Support Specialist', department: 'Support', location: 'Remote', type: 'Contract' },
];

const PERKS = [
  { icon: BrainCircuit, title: 'Meaningful Work' },
  { icon: Zap, title: 'Growth Opportunities' },
  { icon: HeartHandshake, title: 'Inclusive Culture' },
  { icon: Coffee, title: 'Flexible Environment' },
];

const mailto = (subject: string) => `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;

export default function CareersPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[450px] items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero1.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/bckpattern3.webp')" }}
        />
        <div className="relative z-10 p-4">
          <h1 className="animate-fade-in-up font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Build the Future of
            <br />
            <span className="gradient-text mt-2 inline-block pr-4 pb-4 font-playful font-normal">Events</span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto mt-6 max-w-3xl font-body text-lg text-gray-200"
            style={{ animationDelay: '0.2s' }}
          >
            Join our passionate team and help us connect people through unforgettable experiences.
          </p>
        </div>
      </section>

      {/* Perks & culture */}
      <section className="relative overflow-hidden bg-orange-50/50 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 h-full w-2/3 bg-contain bg-right-top bg-no-repeat opacity-30"
          style={{ backgroundImage: "url('/bckpattern2.webp')" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Work with <span className="gradient-text pr-2 font-playful font-normal">Purpose</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-600">
              We&apos;re a team of creators, thinkers, and innovators dedicated to making a difference.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
            {PERKS.map(({ icon: Icon, title }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200/50 bg-white/80 p-6 text-center shadow-lg backdrop-blur-sm sm:p-8"
              >
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="size-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-gray-800">{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open positions */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Current <span className="gradient-text pr-2 font-playful font-normal">Openings</span>
            </h2>
          </div>
          <div className="space-y-6">
            {OPENINGS.map((job) => (
              <div key={job.title} className="rounded-2xl border bg-white p-6 shadow-md transition-shadow hover:shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-primary">{job.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="size-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ButtonLink href={mailto(`Application: ${job.title}`)} className="w-full sm:w-auto">
                      Apply Now
                    </ButtonLink>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-12 text-center">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('/bckpattern1.webp')", backgroundSize: '200%' }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 font-heading text-3xl font-bold text-white">Don&apos;t See Your Role?</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-gray-300">
              We&apos;re always looking for passionate people. Send us your CV and tell us why you&apos;d be a great fit
              for the Klix team.
            </p>
            <ButtonLink
              href={mailto('Working at Klix')}
              size="lg"
              className="bg-primary px-8 text-lg font-bold hover:bg-primary-dark"
            >
              Get in Touch
              <ArrowRight className="size-5" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

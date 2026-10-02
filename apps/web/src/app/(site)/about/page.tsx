import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'About', description: 'Connecting people through experiences.' };

const VALUES = [
  {
    title: 'Simplicity',
    description:
      'We believe technology should be intuitive. Our platform is designed to be easy for everyone, from first-time ticket buyers to seasoned event organizers.',
  },
  {
    title: 'Trust',
    description:
      'Security and transparency are at our core. We protect your data, ensure secure payments, and maintain honest communication with our community.',
  },
  {
    title: 'Community',
    description:
      "We're building a platform for everyone. We support diverse voices and celebrate the unique experiences that bring people together.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[400px] items-center justify-center text-center text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero/hero1.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div className="relative z-10 p-4">
          <h1 className="animate-fade-in-up font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Connecting People Through
            <br />
            <span className="gradient-text mt-2 inline-block pr-4 pb-6 font-playful font-normal">Experiences</span>
          </h1>
          <p
            className="animate-fade-in-up mx-auto mt-6 max-w-3xl font-body text-lg text-gray-200"
            style={{ animationDelay: '0.2s' }}
          >
            Klix was founded with a simple vision: to bridge the gap between amazing events and the people who want to
            experience them.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="px-4 py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row">
          <div className="lg:w-1/2">
            <h2 className="mb-6 font-heading text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
              Our <span className="gradient-text pr-2 font-playful font-normal">Mission</span>
            </h2>
            <p className="mb-6 font-body text-lg text-gray-600">
              We&apos;re building more than just a ticketing platform – we&apos;re creating a community where organizers
              can thrive, promoters can succeed, and attendees can discover unforgettable moments.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-6 shrink-0 text-primary" />
                <p className="font-body text-gray-700">
                  <span className="font-bold">For Attendees:</span> To make finding and attending events simple, secure,
                  and rewarding.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 size-6 shrink-0 text-primary" />
                <p className="font-body text-gray-700">
                  <span className="font-bold">For Organizers:</span> To provide powerful, easy-to-use tools that help
                  events of all sizes succeed.
                </p>
              </div>
            </div>
          </div>
          <div className="relative h-80 w-full overflow-hidden rounded-2xl shadow-2xl lg:h-[450px] lg:w-1/2">
            <img src="/hero/hero3.jpg" alt="Happy people at an event" className="absolute inset-0 size-full object-cover" />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden bg-orange-50/50 py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-full w-1/2 bg-contain bg-left-top bg-no-repeat opacity-30"
          style={{ backgroundImage: "url('/bckpattern2.webp')" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Our Core <span className="gradient-text pr-2 font-playful font-normal">Values</span>
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-gray-200/50 bg-white/80 p-8 text-center shadow-lg backdrop-blur-sm"
              >
                <h3 className="mb-4 font-heading text-2xl font-bold text-primary">{value.title}</h3>
                <p className="font-body text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join our journey */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-12 text-center">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('/bckpattern1.webp')", backgroundSize: '200%' }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 font-heading text-3xl font-bold text-white">Join Our Journey</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-gray-300">
              We&apos;re a passionate team building the future of event experiences in Kenya. If you&apos;re excited by
              our mission, we&apos;d love to hear from you.
            </p>
            <ButtonLink href="/careers" size="lg" className="bg-primary px-8 text-lg font-bold hover:bg-primary-dark">
              View Open Positions
              <ArrowRight className="size-5" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

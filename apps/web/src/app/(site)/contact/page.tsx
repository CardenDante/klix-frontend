import { Mail, MapPin, Phone, Search } from 'lucide-react';
import type { Metadata } from 'next';
import { Faq } from '@/components/content-page';
import { SocialIcons } from '@/components/social-icons';
import { ButtonLink } from '@/components/ui/button';
import { CONTACT } from '@/lib/site';
import { ContactForm } from './contact-form';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with the Klix team.' };

const FAQ: [string, string][] = [
  [
    'How do I get a refund for my ticket?',
    'Refund policies are set by the event organizer for each event. Contact the organizer, or email us with your order link and we will help you reach them. If an event is cancelled, you will be contacted about a refund.',
  ],
  [
    'Can I change the name or details on my ticket?',
    'For most events, ticket details like the attendee name cannot be changed after purchase for security reasons. Please contact the event organizer directly to ask about their policy on ticket transfers.',
  ],
  [
    'How do I become an event organizer or promoter?',
    "We'd love to have you! Apply from the Sell tickets or Become a promoter pages. Our team reviews applications within 48 hours.",
  ],
  [
    "I haven't received my ticket email. What should I do?",
    'First, check your spam or junk folder. Your tickets are always on the order page linked from checkout, and if you bought while signed in, under My tickets.',
  ],
];

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <section className="relative overflow-hidden bg-orange-50/50 pt-16 pb-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/bckpattern2.webp')" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Get in <span className="gradient-text pr-2 font-playful font-normal">Touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-600">
            We&apos;d love to hear from you! Whether you have a question, feedback, or just want to say hello, our team is
            ready to help.
          </p>
        </div>
      </section>

      {/* Contact card */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="grid lg:grid-cols-5">
            <div className="bg-gradient-to-br from-primary to-orange-400 p-8 text-white sm:p-12 lg:col-span-2">
              <h2 className="mb-4 font-heading text-3xl font-bold">Contact Information</h2>
              <p className="mb-8 font-body opacity-90">
                Fill up the form and our Team will get back to you within 24 hours.
              </p>
              <div className="space-y-6 font-body">
                <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="flex items-center gap-4 hover:underline">
                  <Phone className="size-6 shrink-0" />
                  {CONTACT.phone}
                </a>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-4 break-all hover:underline">
                  <Mail className="size-6 shrink-0" />
                  {CONTACT.email}
                </a>
                <div className="flex items-start gap-4">
                  <MapPin className="mt-1 size-6 shrink-0" />
                  <span>{CONTACT.address}</span>
                </div>
              </div>
              <SocialIcons
                className="mt-12"
                itemClassName="bg-white/20 text-white hover:bg-white/30 hover:text-white"
              />
            </div>
            <div className="p-8 sm:p-12 lg:col-span-3">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Frequently Asked <span className="gradient-text pr-2 font-playful font-normal">Questions</span>
            </h2>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-12 text-center">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('/bckpattern1.webp')", backgroundSize: '200%' }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 font-heading text-3xl font-bold text-white">Still Can&apos;t Find an Answer?</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-gray-300">
              Our team is ready to help. Or, you can explore the amazing events happening now on Klix.
            </p>
            <ButtonLink href="/events" size="lg" className="bg-primary px-8 text-lg font-bold hover:bg-primary-dark">
              Browse Events
              <Search className="size-5" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

'use client';

import { ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { CONTACT } from '@/lib/site';

const field =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-body text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none';
const label = 'block font-body font-semibold text-gray-700';

/** Opens the visitor's mail app with a pre-filled message to Klix support. */
export function ContactForm() {
  const [opened, setOpened] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? '').trim();
    const name = [get('firstName'), get('lastName')].filter(Boolean).join(' ');
    const subject = `Message from ${name || 'the Klix website'}`;
    const body = `${get('message')}\n\n—\n${name}\n${get('email')}`;
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="first-name" className={label}>
            First Name
          </label>
          <input id="first-name" name="firstName" required autoComplete="given-name" placeholder="John" className={field} />
        </div>
        <div className="space-y-2">
          <label htmlFor="last-name" className={label}>
            Last Name
          </label>
          <input id="last-name" name="lastName" autoComplete="family-name" placeholder="Doe" className={field} />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className={label}>
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="john.doe@example.com"
          className={field}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="message" className={label}>
          Message
        </label>
        <textarea id="message" name="message" required rows={5} placeholder="How can we help you?" className={field} />
      </div>
      <div>
        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
        >
          Send Message
          <ArrowRight className="size-5" />
        </button>
        <p className="mt-3 text-center font-body text-sm text-gray-500" aria-live="polite">
          {opened ? (
            <>
              Your email app should open with your message. If it didn&apos;t, email us at{' '}
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary hover:underline">
                {CONTACT.email}
              </a>
              .
            </>
          ) : (
            <>This opens your email app with your message addressed to {CONTACT.email}.</>
          )}
        </p>
      </div>
    </form>
  );
}

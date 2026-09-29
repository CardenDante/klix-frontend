'use client';

import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNote } from '@/components/ui/misc';
import { authApi } from '@/lib/api/endpoints';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <MailCheck className="size-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-muted">
          If {email} has a Klix account, we&apos;ve sent a link to reset the password. It works for one hour.
        </p>
        <Link href="/login" className="mt-6 inline-block font-semibold text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold">Forgot your password?</h1>
      <p className="mt-2 text-muted">Enter your email and we&apos;ll send you a reset link.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setLoading(true);
          try {
            await authApi.requestPasswordReset(email.trim());
            setSent(true);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" block size="lg" loading={loading}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

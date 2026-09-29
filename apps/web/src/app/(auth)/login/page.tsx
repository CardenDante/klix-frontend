'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { safeNext } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNote } from '@/components/ui/misc';
import { useAuth } from '@/lib/auth';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const login = useAuth((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await login(email, password);
      router.replace(next);
    } catch (e) {
      setError((e as Error).message);
    }
  });

  return (
    <>
      <h1 className="text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to see your tickets and manage events.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint={
            <Link href="/forgot-password" className="font-medium text-brand-600 hover:underline">
              Forgot your password?
            </Link>
          }
        >
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" block size="lg" loading={form.formState.isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to Klix?{' '}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

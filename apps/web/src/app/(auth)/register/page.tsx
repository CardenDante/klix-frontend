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
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth';
import { isKenyanPhone, normalizePhone } from '@/lib/format';

const schema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name'),
  last_name: z.string().trim().min(1, 'Enter your last name'),
  email: z.email('Enter a valid email'),
  phone_number: z
    .string()
    .refine((v) => v === '' || isKenyanPhone(v), 'Enter a Kenyan number, e.g. 0712 345 678'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const register = useAuth((s) => s.register);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', email: '', phone_number: '', password: '' },
  });
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await register({
        ...values,
        phone_number: values.phone_number ? normalizePhone(values.phone_number) : undefined,
      });
      router.replace(next);
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        for (const [field, messages] of Object.entries(e.errors)) {
          if (field in values) form.setError(field as keyof Values, { message: messages[0] });
        }
      }
      setError((e as Error).message);
    }
  });

  return (
    <>
      <h1 className="text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-muted">Keep all your tickets in one place.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="first_name" error={errors.first_name?.message}>
            <Input id="first_name" autoComplete="given-name" {...form.register('first_name')} />
          </Field>
          <Field label="Last name" htmlFor="last_name" error={errors.last_name?.message}>
            <Input id="last_name" autoComplete="family-name" {...form.register('last_name')} />
          </Field>
        </div>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        </Field>
        <Field label="Phone (optional)" htmlFor="phone_number" error={errors.phone_number?.message} hint="Used to prefill M-Pesa at checkout.">
          <Input id="phone_number" type="tel" autoComplete="tel" placeholder="0712 345 678" {...form.register('phone_number')} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" block size="lg" loading={form.formState.isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorNote } from '@/components/ui/misc';
import { authApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const setSession = useAuth((s) => s.setSession);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <ErrorNote>
        This reset link is incomplete. <Link href="/forgot-password" className="underline">Request a new one</Link>.
      </ErrorNote>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <p className="mt-2 text-muted">You&apos;ll be signed out of your other devices.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (password.length < 8) return setError('Use at least 8 characters');
          if (password !== confirm) return setError("Passwords don't match");
          setLoading(true);
          try {
            setSession(await authApi.resetPassword(token, password));
            toast.success('Password updated');
            router.replace('/');
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Field label="New password" htmlFor="password">
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && (
          <ErrorNote>
            {error}
            {error.includes('expired') && (
              <>
                {' '}
                <Link href="/forgot-password" className="underline">Request a new link</Link>.
              </>
            )}
          </ErrorNote>
        )}
        <Button type="submit" block size="lg" loading={loading}>
          Update password
        </Button>
      </form>
    </>
  );
}

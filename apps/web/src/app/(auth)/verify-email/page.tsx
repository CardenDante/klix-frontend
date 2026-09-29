'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { authApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <Verify />
    </Suspense>
  );
}

function Verify() {
  const token = useSearchParams().get('token') ?? '';
  const setUser = useAuth((s) => s.setUser);
  const signedIn = useAuth((s) => !!s.user);

  const result = useQuery({
    queryKey: ['verify-email', token],
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await authApi.verifyEmail(token);
      if (signedIn) setUser(res.user);
      return res;
    },
  });

  if (result.isPending && token) return <Spinner />;

  const ok = result.isSuccess;
  return (
    <div className="text-center">
      <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
        {ok ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}
      </div>
      <h1 className="mt-4 text-2xl font-bold">{ok ? 'Email confirmed' : 'This link has expired'}</h1>
      <p className="mt-2 text-muted">
        {ok
          ? 'Tickets bought with this email now show up in your account.'
          : 'Request a new confirmation email from your account page.'}
      </p>
      <ButtonLink href={ok ? '/tickets' : '/account'} className="mt-6">
        {ok ? 'See my tickets' : 'Go to my account'}
      </ButtonLink>
    </div>
  );
}

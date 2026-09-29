'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import type { Session } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const googleSignInEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

/**
 * Google sign-in through Firebase. Firebase only proves who the user is; the
 * Klix API verifies the ID token and issues its own session. The Firebase SDK
 * is loaded on click, so pages don't pay for it up front.
 */
export function GoogleSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const setSession = useAuth((s) => s.setSession);
  const [loading, setLoading] = useState(false);

  if (!googleSignInEnabled) return null;

  const signIn = async () => {
    setLoading(true);
    try {
      const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      const session = await api<Session>('/api/v1/auth/firebase-login', {
        method: 'POST',
        body: { id_token: idToken },
        anonymous: true,
      });
      // The Klix session is all we need from here on.
      await signOut(auth).catch(() => undefined);
      setSession(session);
      onSignedIn();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        toast.error((e as Error).message || 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-white font-semibold hover:border-ink/30 disabled:opacity-60"
      >
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

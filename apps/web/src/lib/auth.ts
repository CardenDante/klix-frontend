'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { installAuthBridge } from './api/client';
import { authApi } from './api/endpoints';
import type { Session, User } from './api/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (session: Session) => void;
  setUser: (user: User) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (input: Parameters<typeof authApi.register>[0]) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setSession: (session) =>
        set({ accessToken: session.access_token, refreshToken: session.refresh_token, user: session.user }),

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const session = await authApi.login(email, password);
        get().setSession(session);
        return session.user;
      },

      register: async (input) => {
        const session = await authApi.register(input);
        get().setSession(session);
        return session.user;
      },

      logout: async () => {
        const refreshToken = get().refreshToken;
        set({ accessToken: null, refreshToken: null, user: null });
        await authApi.logout(refreshToken).catch(() => undefined);
      },

      refreshUser: async () => {
        if (!get().accessToken) return;
        try {
          set({ user: await authApi.me() });
        } catch {
          // A failed refresh already signs the user out via the bridge.
        }
      },
    }),
    {
      name: 'klix-auth',
      partialize: ({ accessToken, refreshToken, user }) => ({ accessToken, refreshToken, user }),
      // Rehydrated from Providers after mount, so the first client render
      // matches the server render (signed out) and there's no mismatch.
      skipHydration: true,
    },
  ),
);

// `persist` is undefined on the server, where there is no storage.
useAuth.persist?.onFinishHydration(() => useAuth.setState({ hydrated: true }));

installAuthBridge({
  getAccessToken: () => useAuth.getState().accessToken,
  getRefreshToken: () => useAuth.getState().refreshToken,
  onRefreshed: (session) =>
    useAuth.setState({ accessToken: session.access_token, refreshToken: session.refresh_token }),
  onUnauthorized: () => useAuth.setState({ accessToken: null, refreshToken: null, user: null }),
});

export function hasRole(user: User | null, ...roles: User['role'][]) {
  return !!user && (user.role === 'admin' || roles.includes(user.role));
}

'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards — for browser-only state like sessionStorage. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

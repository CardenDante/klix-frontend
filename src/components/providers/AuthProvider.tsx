'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Attempt to restore session on mount
    const fetchUser = useAuth.getState().fetchUser
    fetchUser()
  }, [])

  return <>{children}</>
}

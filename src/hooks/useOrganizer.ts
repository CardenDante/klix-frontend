// hooks/useOrganizer.ts
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { organizersApi, OrganizerProfile } from '@/lib/api/organizers'

export const useOrganizer = () => {
  const { user, isAuthenticated } = useAuth()
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch organizer profile if user has organizer role
  useEffect(() => {
    const fetchOrganizerProfile = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      // Only fetch if user is organizer, event_staff, or admin
      if (!['organizer', 'event_staff', 'admin'].includes(user?.role || '')) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await organizersApi.getMyProfile()
        setOrganizerProfile(response.data)
        setError(null)
      } catch (err: any) {
        // 404 means no organizer profile yet (hasn't applied)
        if (err.response?.status === 404) {
          setOrganizerProfile(null)
          setError(null)
        } else {
          setError(err.message || 'Failed to fetch organizer profile')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizerProfile()
  }, [isAuthenticated, user?.role])

  return {
    organizerProfile,
    status: organizerProfile?.status,
    isApproved: organizerProfile?.status === 'approved',
    isPending: organizerProfile?.status === 'pending',
    isRejected: organizerProfile?.status === 'rejected',
    isSuspended: organizerProfile?.status === 'suspended',
    hasApplication: !!organizerProfile,
    loading,
    error,
    refetch: async () => {
      try {
        const response = await organizersApi.getMyProfile()
        setOrganizerProfile(response.data)
      } catch (err) {
        console.error('Failed to refetch organizer profile:', err)
      }
    }
  }
}
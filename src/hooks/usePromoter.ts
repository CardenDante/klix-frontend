'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiClient from '@/lib/api-client';

interface PromoterProfile {
  id: string;
  user_id: string;
  business_name: string;
  phone_number: string;
  social_media_links: any;
  audience_size: string;
  experience_description: string;
  why_join: string;
  sample_content?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
}

export function usePromoter() {
  const { user, isAuthenticated } = useAuth();
  const [promoterProfile, setPromoterProfile] = useState<PromoterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPromoterProfile();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchPromoterProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/promoters/my-application');
      setPromoterProfile(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No application exists
        setPromoterProfile(null);
      } else {
        console.error('Failed to fetch promoter profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const isPending = promoterProfile?.status === 'pending';
  const isApproved = promoterProfile?.status === 'approved';
  const isRejected = promoterProfile?.status === 'rejected';
  const hasApplication = !!promoterProfile;

  return {
    promoterProfile,
    loading,
    isPending,
    isApproved,
    isRejected,
    hasApplication,
    refetch: fetchPromoterProfile,
  };
}
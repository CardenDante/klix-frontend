import { ForYou } from '@/components/for-you';
import { Hero } from '@/components/landing/hero';
import { LoyaltySection } from '@/components/landing/loyalty-section';
import { OrganizersSection } from '@/components/landing/organizers-section';
import { PartnersSection } from '@/components/landing/partners-section';
import { PromotersSection } from '@/components/landing/promoters-section';
import { TrendingEvents } from '@/components/landing/trending-events';
import { fetchEvents } from '@/lib/api/server';

export const revalidate = 30;

export default async function HomePage() {
  const trending = await fetchEvents({ page_size: 6, sort_by: 'popularity' });

  return (
    <>
      <Hero />
      <TrendingEvents initial={trending} />
      <ForYou />
      <OrganizersSection />
      <PromotersSection />
      <LoyaltySection />
      <PartnersSection />
    </>
  );
}

import Navbar from '@/components/shared/Navbar';
import Hero from '@/components/landing/Hero';
import LiveEvents from '@/components/landing/LiveEvents';
import OrganizersSection from '@/components/landing/OrganizersSection';
import PromotersSection from '@/components/landing/PromotersSection';
import LoyaltySection from '@/components/landing/LoyaltySection';
import  PartnersSection, {Footer}  from '@/components/landing/PartnersAndFooter';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <LiveEvents />
      <OrganizersSection />
      <PromotersSection />
      <LoyaltySection />
      <PartnersSection />
      <Footer />
    </main>
  );
}
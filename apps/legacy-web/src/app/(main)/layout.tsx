import Navbar from '@/components/shared/Navbar';
import { SimpleFooter } from '@/components/landing/PartnersAndFooter';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <SimpleFooter />
    </>
  );
}
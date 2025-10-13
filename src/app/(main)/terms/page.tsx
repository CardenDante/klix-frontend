// app/(main)/terms/page.tsx
import Navbar from '@/components/shared/Navbar';

export function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Comfortaa' }}>Terms of Service</h1>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">By accessing and using Klix, you accept and agree to be bound by these Terms of Service.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">2. User Accounts</h2>
            <p className="mb-4">You are responsible for maintaining the confidentiality of your account and password.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Ticket Purchases</h2>
            <p className="mb-4">All ticket sales are final unless the event is cancelled or rescheduled by the organizer.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Prohibited Activities</h2>
            <p className="mb-4">Users must not engage in fraudulent activities, ticket scalping, or unauthorized reselling.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">Klix is not responsible for event cancellations, changes, or issues beyond our control.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
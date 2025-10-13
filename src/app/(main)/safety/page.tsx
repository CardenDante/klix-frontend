import Navbar from '@/components/shared/Navbar';

// app/(main)/safety/page.tsx
export function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Comfortaa' }}>Safety & Security</h1>
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mt-8 mb-4">Your Safety is Our Priority</h2>
            <p className="mb-4">At Klix, we're committed to providing a safe and secure platform for all users.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Secure Payments</h2>
            <p className="mb-4">All transactions are encrypted and processed through secure M-Pesa integration.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Verified Organizers</h2>
            <p className="mb-4">All event organizers go through a verification process before hosting events on our platform.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Fraud Prevention</h2>
            <p className="mb-4">We actively monitor for suspicious activity and have systems in place to prevent ticket fraud.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">Report Issues</h2>
            <p className="mb-4">If you encounter any safety concerns, please contact us immediately at safety@klix.com</p>
          </div>
        </div>
      </main>

    </div>
  );
}
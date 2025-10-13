
import Navbar from '@/components/shared/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Comfortaa' }}>Privacy Policy</h1>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us when you create an account, purchase tickets, or use our services.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">3. Information Sharing</h2>
            <p className="mb-4">We do not sell your personal information. We may share your information with event organizers when you purchase tickets.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Security</h2>
            <p className="mb-4">We implement appropriate security measures to protect your personal information against unauthorized access.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Your Rights</h2>
            <p className="mb-4">You have the right to access, update, or delete your personal information at any time.</p>
            
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Contact Us</h2>
            <p className="mb-4">If you have questions about this Privacy Policy, please contact us at privacy@klix.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}
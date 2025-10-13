
import Navbar from '@/components/shared/Navbar';

// app/(main)/pricing/page.tsx
export function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Comfortaa' }}>Simple, Transparent Pricing</h1>
            <p className="text-gray-600 text-lg">No hidden fees. Pay only when you sell tickets.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Attendees</h3>
              <div className="text-4xl font-bold text-[#EB7D30] mb-4">Free</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">✓ Browse unlimited events</li>
                <li className="flex items-center gap-2">✓ Secure ticket purchases</li>
                <li className="flex items-center gap-2">✓ Loyalty rewards</li>
                <li className="flex items-center gap-2">✓ QR code tickets</li>
              </ul>
            </div>
            
            <div className="border-2 border-[#EB7D30] rounded-lg p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#EB7D30] text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-4">Organizers</h3>
              <div className="text-4xl font-bold text-[#EB7D30] mb-4">2.5%</div>
              <p className="text-gray-600 mb-6">per ticket sold</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">✓ Unlimited events</li>
                <li className="flex items-center gap-2">✓ Analytics dashboard</li>
                <li className="flex items-center gap-2">✓ Staff management</li>
                <li className="flex items-center gap-2">✓ M-Pesa integration</li>
                <li className="flex items-center gap-2">✓ Promoter codes</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Promoters</h3>
              <div className="text-4xl font-bold text-[#EB7D30] mb-4">Free</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">✓ Create promo codes</li>
                <li className="flex items-center gap-2">✓ Earn commissions</li>
                <li className="flex items-center gap-2">✓ Performance analytics</li>
                <li className="flex items-center gap-2">✓ Leaderboard rankings</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
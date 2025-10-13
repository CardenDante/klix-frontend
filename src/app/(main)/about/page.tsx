
import Navbar from '@/components/shared/Navbar';
import { Users, Target, Heart, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#EB7D30] to-orange-600 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: 'Comfortaa' }}>
              About Klix
            </h1>
            <p className="text-xl max-w-3xl mx-auto opacity-90">
              We're on a mission to make event discovery and ticketing simple, fun, and rewarding for everyone.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Comfortaa' }}>
                  Our Mission
                </h2>
                <p className="text-gray-600 mb-4">
                  Klix was founded with a simple vision: to connect people with experiences that matter. We believe that every event, 
                  from small community gatherings to major concerts, deserves a platform that's easy to use, reliable, and rewarding.
                </p>
                <p className="text-gray-600">
                  We're building more than just a ticketing platform – we're creating a community where organizers can thrive, 
                  promoters can succeed, and attendees can discover amazing experiences while earning rewards.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-lg">
                  <Users className="w-12 h-12 text-[#EB7D30] mb-4" />
                  <h3 className="font-bold mb-2">10K+</h3>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <Target className="w-12 h-12 text-[#EB7D30] mb-4" />
                  <h3 className="font-bold mb-2">500+</h3>
                  <p className="text-sm text-gray-600">Events Monthly</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <Heart className="w-12 h-12 text-[#EB7D30] mb-4" />
                  <h3 className="font-bold mb-2">98%</h3>
                  <p className="text-sm text-gray-600">Satisfaction</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <Zap className="w-12 h-12 text-[#EB7D30] mb-4" />
                  <h3 className="font-bold mb-2">24/7</h3>
                  <p className="text-sm text-gray-600">Support</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'Comfortaa' }}>
              Our Values
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4">Simplicity</h3>
                <p className="text-gray-600">
                  We believe technology should be intuitive. Our platform is designed to be easy for everyone, 
                  whether you're buying your first ticket or organizing your hundredth event.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4">Trust</h3>
                <p className="text-gray-600">
                  Security and transparency are at our core. We protect your data, ensure secure payments, 
                  and maintain honest communication with our community.
                </p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4">Community</h3>
                <p className="text-gray-600">
                  We're building a platform for everyone. From local organizers to international promoters, 
                  we support diverse voices and celebrate unique experiences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Comfortaa' }}>
              Join Our Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              We're always looking for passionate individuals to join our team and help shape the future of event experiences.
            </p>
            <a
              href="/careers"
              className="inline-block bg-[#EB7D30] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#d16a1f] transition-colors"
            >
              View Open Positions
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
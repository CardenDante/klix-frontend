// app/(main)/safety/page.tsx
import Navbar from '@/components/shared/Navbar';
// app/(main)/careers/page.tsx
export function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Comfortaa' }}>Join Our Team</h1>
            <p className="text-gray-600 text-lg">Help us build the future of event experiences</p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border rounded-lg p-6 hover:shadow-md transition">
              <h3 className="text-xl font-bold mb-2">Senior Full Stack Developer</h3>
              <p className="text-gray-600 mb-4">Remote • Full-time</p>
              <p className="mb-4">We're looking for an experienced developer to help build and scale our platform.</p>
              <button className="bg-[#EB7D30] text-white px-6 py-2 rounded-lg hover:bg-[#d16a1f]">Apply Now</button>
            </div>
            
            <div className="border rounded-lg p-6 hover:shadow-md transition">
              <h3 className="text-xl font-bold mb-2">Product Designer</h3>
              <p className="text-gray-600 mb-4">Nairobi • Full-time</p>
              <p className="mb-4">Join our design team to create beautiful, intuitive experiences for our users.</p>
              <button className="bg-[#EB7D30] text-white px-6 py-2 rounded-lg hover:bg-[#d16a1f]">Apply Now</button>
            </div>
            
            <div className="border rounded-lg p-6 hover:shadow-md transition">
              <h3 className="text-xl font-bold mb-2">Customer Success Manager</h3>
              <p className="text-gray-600 mb-4">Nairobi • Full-time</p>
              <p className="mb-4">Help our organizers and users get the most out of the Klix platform.</p>
              <button className="bg-[#EB7D30] text-white px-6 py-2 rounded-lg hover:bg-[#d16a1f]">Apply Now</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
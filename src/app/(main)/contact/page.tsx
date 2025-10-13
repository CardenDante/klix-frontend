
import Navbar from '@/components/shared/Navbar';


export function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center" style={{ fontFamily: 'Comfortaa' }}>Contact Us</h1>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">support@klix.com</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-gray-600">+254 712 345 678</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-gray-600">Nairobi, Kenya</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Business Hours</h3>
                  <p className="text-gray-600">Mon-Fri: 9am - 6pm EAT</p>
                </div>
              </div>
            </div>
            
            <div>
              <form className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Name</label>
                  <input type="text" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-medium mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block font-medium mb-2">Message</label>
                  <textarea rows={5} className="w-full px-4 py-2 border rounded-lg"></textarea>
                </div>
                <button className="w-full bg-[#EB7D30] text-white py-3 rounded-lg font-semibold hover:bg-[#d16a1f]">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
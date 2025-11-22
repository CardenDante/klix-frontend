'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Image as ImageIcon, Ticket, Check } from 'lucide-react';
import { organizersApi, EventCreateData } from '@/lib/api/organizers';
import { eventsApi } from '@/lib/api/events';

export default function CreateEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<EventCreateData>({
    title: '',
    description: '',
    category: 'music',
    location: '',
    latitude: undefined,
    longitude: undefined,
    start_datetime: '',
    end_datetime: '',
    banner_image_url: '',
    additional_images: [],
    settings: {},
  });

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', description: '', price: '', quantity_total: '' },
  ]);

  const steps = [
    { number: 1, title: 'Basic Info', icon: Calendar },
    { number: 2, title: 'Date & Location', icon: MapPin },
    { number: 3, title: 'Media', icon: ImageIcon },
    { number: 4, title: 'Tickets', icon: Ticket },
    { number: 5, title: 'Review', icon: Check },
  ];

  const handleNext = () => {
    // Validate current step before moving forward
    if (currentStep === 1) {
      if (!formData.title.trim()) {
        setError('Please enter an event title');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.start_datetime || !formData.end_datetime || !formData.location.trim()) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    setError('');
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.title || !formData.start_datetime || !formData.end_datetime || !formData.location) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create event
      const eventResponse = await organizersApi.createEvent(formData);
      const eventId = eventResponse.data.id;

      // Create ticket types
      for (const ticket of ticketTypes) {
        if (ticket.name && ticket.price && ticket.quantity_total) {
          await organizersApi.createTicketType(eventId, {
            name: ticket.name,
            description: ticket.description,
            price: parseFloat(ticket.price),
            quantity_total: parseInt(ticket.quantity_total),
          });
        }
      }

      // Redirect to event page
      router.push(`/organizer/events/${eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Your organizer account must be approved before creating events');
    } finally {
      setLoading(false);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', description: '', price: '', quantity_total: '' }]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-[#EB7D30] mb-6 font-body"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <h1 className="font-comfortaa text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-600 mb-8 font-body">Fill in the details to create your event</p>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-[#EB7D30] text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <p className={`mt-2 text-xs font-semibold font-body ${
                      isActive ? 'text-[#EB7D30]' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 font-body">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Summer Music Festival 2025"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                >
                  {eventsApi.CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell attendees what makes your event special..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                />
              </div>
            </div>
          )}

          {/* Step 2: Date & Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Carnivore Grounds, Nairobi"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Latitude (optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || undefined })}
                    placeholder="-1.286389"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                    Longitude (optional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || undefined })}
                    placeholder="36.817223"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <ImageIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2 font-comfortaa">
                  Banner Image (Optional)
                </h3>
                <p className="text-sm text-gray-700 mb-4 font-body">
                  You can add a banner image after creating your event. A high-quality banner helps attract more attendees!
                </p>
                <p className="text-xs text-gray-600 font-body">
                  💡 <strong>Recommended:</strong> 1920x1080px (16:9 ratio) • Max 5MB • JPEG, PNG, or WebP
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-body">
                  ✅ <strong>Next Step:</strong> After creating your event, you'll be able to edit it and upload a banner image.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Tickets */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 font-comfortaa">Ticket Types</h3>
                <button
                  onClick={addTicketType}
                  className="text-[#EB7D30] hover:underline text-sm font-semibold font-body"
                >
                  + Add Ticket Type
                </button>
              </div>

              {ticketTypes.map((ticket, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 font-comfortaa">Ticket Type #{index + 1}</h4>
                    {ticketTypes.length > 1 && (
                      <button
                        onClick={() => removeTicketType(index)}
                        className="text-red-600 hover:underline text-sm font-body"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={ticket.name}
                        onChange={(e) => {
                          const updated = [...ticketTypes];
                          updated[index].name = e.target.value;
                          setTicketTypes(updated);
                        }}
                        placeholder="e.g., VIP"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Price (KSh) *
                      </label>
                      <input
                        type="number"
                        value={ticket.price}
                        onChange={(e) => {
                          const updated = [...ticketTypes];
                          updated[index].price = e.target.value;
                          setTicketTypes(updated);
                        }}
                        placeholder="2000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={ticket.quantity_total}
                        onChange={(e) => {
                          const updated = [...ticketTypes];
                          updated[index].quantity_total = e.target.value;
                          setTicketTypes(updated);
                        }}
                        placeholder="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                        Description
                      </label>
                      <input
                        type="text"
                        value={ticket.description}
                        onChange={(e) => {
                          const updated = [...ticketTypes];
                          updated[index].description = e.target.value;
                          setTicketTypes(updated);
                        }}
                        placeholder="Optional"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB7D30] font-body"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="font-comfortaa text-xl font-bold text-gray-900 mb-4">Review Your Event</h3>
              
              <div className="space-y-4">
                {formData.banner_image_url && (
                  <div className="border-b pb-4">
                    <p className="text-sm text-gray-600 mb-2 font-body">Banner Image</p>
                    <img 
                      src={formData.banner_image_url} 
                      alt="Event banner" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600 font-body">Title</p>
                  <p className="font-semibold text-gray-900 font-comfortaa">{formData.title}</p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600 font-body">Category</p>
                  <p className="font-semibold text-gray-900 font-body capitalize">{formData.category}</p>
                </div>

                {formData.description && (
                  <div className="border-b pb-4">
                    <p className="text-sm text-gray-600 font-body">Description</p>
                    <p className="text-gray-900 font-body">{formData.description}</p>
                  </div>
                )}

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600 font-body">Date & Time</p>
                  <p className="font-semibold text-gray-900 font-body">
                    {formData.start_datetime && new Date(formData.start_datetime).toLocaleString()} - {formData.end_datetime && new Date(formData.end_datetime).toLocaleString()}
                  </p>
                </div>

                <div className="border-b pb-4">
                  <p className="text-sm text-gray-600 font-body">Location</p>
                  <p className="font-semibold text-gray-900 font-body">{formData.location}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2 font-body">Ticket Types</p>
                  <div className="space-y-2">
                    {ticketTypes.filter(t => t.name && t.price && t.quantity_total).map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-semibold text-gray-900 font-comfortaa">{ticket.name}</span>
                        <span className="text-gray-600 font-body">
                          KSh {parseFloat(ticket.price).toLocaleString()} • {ticket.quantity_total} available
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-body"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            {currentStep < 5 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-[#EB7D30] text-white font-semibold rounded-full hover:bg-[#d66d20] transition-colors font-body"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors font-body"
              >
                {loading ? 'Creating...' : 'Create Event'}
                <Check className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
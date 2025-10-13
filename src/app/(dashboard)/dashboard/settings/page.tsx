'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Phone, Bell, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-heading">Settings</h1>
        <p className="text-gray-600 mt-2 font-body">Manage your account preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-6 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#EB7D30] text-[#EB7D30]'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      defaultValue={user?.first_name}
                      className="pl-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input type="text" defaultValue={user?.last_name} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    defaultValue={user?.email}
                    className="pl-11"
                    disabled
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="tel"
                    defaultValue={user?.phone_number}
                    className="pl-11"
                    placeholder="+254 796 280 700"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white">
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-[#EB7D30] rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-600">Get SMS alerts for bookings</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-[#EB7D30] rounded" />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">Event Reminders</p>
                    <p className="text-sm text-gray-600">Reminders before events</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-[#EB7D30] rounded" defaultChecked />
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-semibold text-gray-900">Marketing Emails</p>
                    <p className="text-sm text-gray-600">Special offers and updates</p>
                  </div>
                  <input type="checkbox" className="h-5 w-5 text-[#EB7D30] rounded" defaultChecked />
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input type="password" className="pl-11" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input type="password" className="pl-11" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input type="password" className="pl-11" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white">
                  Update Password
                </Button>
              </div>

              <div className="pt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h3>
                <p className="text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
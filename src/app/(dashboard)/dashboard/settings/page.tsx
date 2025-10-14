'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Phone, Bell, Shield, Save, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, resetPassword } = useAuth();

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    reminders: true,
    marketing: true,
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  
  const handleProfileSave = async () => {
    // This is a placeholder for your update logic
    toast.success('Profile updated successfully! (Placeholder)');
  };
  
  const handleNotificationsSave = () => {
    toast.success('Notification preferences saved! (Placeholder)');
  };
  
  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error("Could not find user's email.");
      return;
    }
    try {
      await resetPassword(user.email);
      toast.success(`Password reset link sent to ${user.email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link.");
    }
  };

  const handleDeleteAccount = () => {
    // Add a confirmation modal before proceeding
    toast.error("This action is permanent! (Placeholder for delete logic)");
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-comfortaa">Settings</h1>
        <p className="text-gray-600 mt-2 font-body">Manage your account profile, notifications, and security.</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-comfortaa">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription className="font-body">Update your personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                First Name
              </label>
              <Input
                name="first_name"
                value={profileData.first_name}
                onChange={handleProfileChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                Last Name
              </label>
              <Input
                name="last_name"
                value={profileData.last_name}
                onChange={handleProfileChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="email"
                value={user?.email || ''}
                className="pl-11 bg-gray-100"
                disabled
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                name="phone_number"
                type="tel"
                value={profileData.phone_number || ''}
                onChange={handleProfileChange}
                placeholder="+254 712 345 678"
                className="pl-11"
              />
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button onClick={handleProfileSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-comfortaa">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription className="font-body">Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-semibold font-body">Email Notifications</p>
              <p className="text-sm text-gray-600 font-body">Receive updates and ticket confirmations via email.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.email}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-semibold font-body">Event Reminders</p>
              <p className="text-sm text-gray-600 font-body">Get reminders before your events start.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.reminders}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, reminders: e.target.checked })}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-semibold font-body">Marketing & Promotions</p>
              <p className="text-sm text-gray-600 font-body">Receive special offers and event recommendations.</p>
            </div>
            <input
              type="checkbox"
              checked={notificationPrefs.marketing}
              onChange={(e) => setNotificationPrefs({ ...notificationPrefs, marketing: e.target.checked })}
              className="w-5 h-5 text-primary rounded focus:ring-primary"
            />
          </label>
          <div className="pt-4 border-t">
            <Button onClick={handleNotificationsSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-comfortaa">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
          <CardDescription className="font-body">Manage your password and account security.</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 font-body mb-2">Change Password</h3>
            <p className="text-sm text-gray-600 mb-4 font-body">
              For security, we recommend sending a password reset link to your email.
            </p>
            <Button variant="outline" onClick={handlePasswordReset}>
              Send Password Reset Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
       <Card className="border-red-500 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 font-comfortaa">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                    <h4 className="font-semibold text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700 max-w-md">Once you delete your account, there is no going back. All your data, including tickets and loyalty points, will be permanently removed.</p>
                </div>
                 <Button variant="destructive" className="mt-4 sm:mt-0" onClick={handleDeleteAccount}>
                    Delete My Account
                </Button>
            </div>
          </CardContent>
       </Card>

    </div>
  );
}
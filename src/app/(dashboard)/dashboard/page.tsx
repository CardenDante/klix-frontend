'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';
import { Ticket, Calendar, TrendingUp, Crown, Users, DollarSign, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();

  // Attendee Dashboard
  if (user?.role === UserRole.ATTENDEE || user?.role === UserRole.GUEST) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-600 mt-2 font-body">Discover and book your next amazing event</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Upcoming Events</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">3</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Tickets</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">12</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-[#EB7D30]" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Loyalty Credits</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">450</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-2xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4 font-heading">Discover New Events</h2>
          <p className="mb-6 opacity-90">Find and book tickets to amazing events near you</p>
          <Link href="/events">
            <Button className="bg-white text-[#EB7D30] hover:bg-gray-100">
              Browse Events
            </Button>
          </Link>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 font-heading">Recent Tickets</h2>
          <p className="text-gray-500 text-center py-8">No tickets yet. Start exploring events!</p>
        </div>
      </div>
    );
  }

  // Organizer Dashboard
  if (user?.role === UserRole.ORGANIZER || user?.role === UserRole.ADMIN) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            Organizer Dashboard
          </h1>
          <p className="text-gray-600 mt-2 font-body">Manage your events and track performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Events</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">5</p>
            <p className="text-green-600 text-sm mt-2">↑ 2 this month</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Ticket className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Tickets Sold</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">1,247</p>
            <p className="text-green-600 text-sm mt-2">↑ 15% this week</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-[#EB7D30]" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">KSh 485K</p>
            <p className="text-green-600 text-sm mt-2">↑ 23% this month</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Avg. Ticket Price</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">KSh 3,890</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/events/create">
            <div className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-2xl p-8 text-white hover:scale-105 transition-transform cursor-pointer">
              <Calendar className="h-12 w-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2 font-heading">Create New Event</h3>
              <p className="opacity-90">Launch your next event in minutes</p>
            </div>
          </Link>

          <Link href="/dashboard/analytics">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 text-white hover:scale-105 transition-transform cursor-pointer">
              <BarChart3 className="h-12 w-12 mb-4" />
              <h3 className="text-2xl font-bold mb-2 font-heading">View Analytics</h3>
              <p className="opacity-90">Track your performance metrics</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Promoter Dashboard
  if (user?.role === UserRole.PROMOTER) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-heading">
            Promoter Dashboard
          </h1>
          <p className="text-gray-600 mt-2 font-body">Track your earnings and performance</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Tickets Sold</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">456</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">KSh 45,600</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-[#EB7D30]" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Codes</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">8</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900 font-heading">12.5%</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-2xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4 font-heading">Create Promoter Code</h2>
          <p className="mb-6 opacity-90">Start earning commission by promoting events</p>
          <Link href="/dashboard/promoter-codes/create">
            <Button className="bg-white text-[#EB7D30] hover:bg-gray-100">
              Create New Code
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, DollarSign, Ticket, Calendar, Users, Plus } from 'lucide-react';
import { organizersApi } from '@/lib/api/organizers';

export default function OrganizerDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await organizersApi.getDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Revenue',
      value: `KSh ${dashboard?.total_revenue?.toLocaleString() || 0}`,
      change: dashboard?.revenue_growth_percentage || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Total Events',
      value: dashboard?.total_events || 0,
      change: null,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Tickets Sold',
      value: dashboard?.total_tickets_sold?.toLocaleString() || 0,
      change: dashboard?.ticket_sales_growth_percentage || 0,
      icon: Ticket,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Active Events',
      value: dashboard?.active_events || 0,
      change: null,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-comfortaa text-3xl font-bold text-gray-900">
            Organizer Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {dashboard?.organizer_name}!
          </p>
        </div>
        <Link href="/organizer/events/create">
          <button className="flex items-center gap-2 px-6 py-3 bg-[#EB7D30] text-white font-bold rounded-full hover:bg-[#d66d20] transition-colors">
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.change !== null && (
                  <div className={`flex items-center gap-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm font-semibold">
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Events Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-comfortaa text-xl font-bold text-gray-900">Upcoming Events</h2>
            <Link href="/organizer/events" className="text-[#EB7D30] hover:underline text-sm font-semibold">
              View All
            </Link>
          </div>
          
          {dashboard?.upcoming_events?.length > 0 ? (
            <div className="space-y-4">
              {dashboard.upcoming_events.map((event: any) => (
                <Link
                  key={event.event_id}
                  href={`/organizer/events/${event.event_id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-[#EB7D30] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900">{event.event_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      event.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                    <span>{event.tickets_sold} / {event.total_capacity} sold</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No upcoming events</p>
              <Link href="/organizer/events/create">
                <button className="px-4 py-2 bg-[#EB7D30] text-white rounded-full hover:bg-[#d66d20] transition-colors">
                  Create Event
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Top Performing Events */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-comfortaa text-xl font-bold text-gray-900">Top Events</h2>
            <Link href="/organizer/analytics" className="text-[#EB7D30] hover:underline text-sm font-semibold">
              View Analytics
            </Link>
          </div>
          
          {dashboard?.top_events?.length > 0 ? (
            <div className="space-y-4">
              {dashboard.top_events.map((event: any, index: number) => (
                <div key={event.event_id} className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#EB7D30] text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{event.event_name}</h3>
                    <p className="text-sm text-gray-600">
                      {event.tickets_sold} tickets • KSh {event.revenue?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {((event.tickets_sold / event.total_capacity) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">sold</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No performance data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm mb-2">Average Capacity</p>
          <p className="text-3xl font-bold">
            {dashboard?.average_event_capacity_utilization?.toFixed(1) || 0}%
          </p>
          <p className="text-blue-100 text-sm mt-2">Utilization Rate</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm mb-2">Check-in Rate</p>
          <p className="text-3xl font-bold">
            {dashboard?.average_check_in_rate?.toFixed(1) || 0}%
          </p>
          <p className="text-green-100 text-sm mt-2">Average Attendance</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <p className="text-orange-100 text-sm mb-2">Promoter Commissions</p>
          <p className="text-3xl font-bold">
            KSh {dashboard?.total_promoter_commissions_owed?.toLocaleString() || 0}
          </p>
          <p className="text-orange-100 text-sm mt-2">Owed to Promoters</p>
        </div>
      </div>
    </div>
  );
}
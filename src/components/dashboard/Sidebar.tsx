'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, Ticket, Settings, LogOut, Menu, X, Users, BarChart3, DollarSign, Plus, Gift, Code, TrendingUp, Shield, UserCheck, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Attendee menu items
  const attendeeMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Browse Events', href: '/events', icon: Calendar },
    { name: 'Loyalty Rewards', href: '/dashboard/loyalty', icon: Gift },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Organizer menu items
  const organizerMenuItems = [
    { name: 'Dashboard', href: '/organizer', icon: LayoutDashboard },
    { name: 'My Events', href: '/organizer/events', icon: Calendar },
    { name: 'Create Event', href: '/organizer/events/create', icon: Plus },
    { name: 'Analytics', href: '/organizer/analytics', icon: BarChart3 },
    { name: 'Staff Management', href: '/organizer/staff', icon: Users },
    { name: 'Promoters', href: '/organizer/promoters', icon: TrendingUp },
    { name: 'Settings', href: '/organizer/settings', icon: Settings },
  ];

  // Promoter menu items
  const promoterMenuItems = [
    { name: 'Dashboard', href: '/promoter', icon: LayoutDashboard },
    { name: 'My Codes', href: '/promoter/codes', icon: Code },
    { name: 'Earnings', href: '/promoter/earnings', icon: DollarSign },
    { name: 'Analytics', href: '/promoter/analytics', icon: BarChart3 },
    { name: 'Leaderboard', href: '/promoter/leaderboard', icon: TrendingUp },
    { name: 'Settings', href: '/promoter/settings', icon: Settings },
  ];

  // Event Staff menu items
  const staffMenuItems = [
    { name: 'Dashboard', href: '/staff', icon: LayoutDashboard },
    { name: 'My Assignments', href: '/staff/assignments', icon: Calendar },
    { name: 'Check-in Scanner', href: '/staff/scanner', icon: UserCheck },
    { name: 'Settings', href: '/staff/settings', icon: Settings },
  ];

  // Admin menu items
  const adminMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Organizers', href: '/admin/organizers', icon: Shield },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  // Get menu items based on role
  const getMenuItems = () => {
    switch (user?.role) {
      case 'organizer':
        return organizerMenuItems;
      case 'promoter':
        return promoterMenuItems;
      case 'event_staff':
        return staffMenuItems;
      case 'admin':
        return adminMenuItems;
      default:
        return attendeeMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'organizer':
        return 'Organizer';
      case 'promoter':
        return 'Promoter';
      case 'event_staff':
        return 'Event Staff';
      case 'admin':
        return 'Admin';
      default:
        return 'Attendee';
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center border-b border-gray-200">
            <Link href="/" className="flex items-center">
              <div className="relative w-24 h-12">
                <img
                  src="/logo.png"
                  alt="Klix"
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#EB7D30] text-white rounded-full flex items-center justify-center font-bold">
                {user?.first_name?.[0] || user?.email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.first_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{getRoleLabel()}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#EB7D30] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
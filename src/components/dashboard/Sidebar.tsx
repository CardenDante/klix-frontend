'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Calendar, Ticket, Settings, LogOut, MoreHorizontal, X, Menu,
  Users, BarChart3, DollarSign, Plus, Gift, Code, TrendingUp, Shield, UserCheck, FileText 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

// --- Reusable Sidebar Panel Component ---
function SidebarPanel({ menuItems, user, logout, onClose, isMobile = false }: any) {
  const pathname = usePathname();
  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ORGANIZER': return 'Organizer';
      case 'PROMOTER': return 'Promoter';
      case 'EVENT_STAFF': return 'Event Staff';
      case 'ADMIN': return 'Admin';
      default: return 'Attendee';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Logo */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-gray-200">
        <Link href="/" className="flex items-center">
          <div className="relative w-24 h-12">
            <Image src="/logo.png" alt="Klix" fill className="object-contain" />
          </div>
        </Link>
        {isMobile && (
          <button onClick={onClose} className="lg:hidden p-2 -mr-2">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
            {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 truncate font-comfortaa">
              {user?.first_name || user?.email}
            </p>
            <p className="text-sm text-gray-500 truncate font-body">{getRoleLabel()}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item: any) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors font-medium text-sm font-body ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
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
            onClose();
          }}
          className="flex items-center gap-3 px-3 py-3 w-full text-gray-700 hover:bg-orange-50 hover:text-primary rounded-lg transition-colors font-medium text-sm font-body"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const attendeeMenuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tickets', href: '/dashboard/tickets', icon: Ticket },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Loyalty', href: '/dashboard/loyalty', icon: Gift },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];
  const organizerMenuItems = [
    { name: 'Dashboard', href: '/organizer', icon: LayoutDashboard },
    { name: 'My Events', href: '/organizer/events', icon: Calendar },
    { name: 'Create ', href: '/organizer/events/create', icon: Plus },
    { name: 'Analytics', href: '/organizer/analytics', icon: BarChart3 },
    { name: 'Staff', href: '/organizer/staff', icon: Users },
    { name: 'Promoters', href: '/organizer/promoters', icon: TrendingUp },
    { name: 'Settings', href: '/organizer/settings', icon: Settings },
  ];
  const promoterMenuItems = [
    { name: 'Dashboard', href: '/promoter', icon: LayoutDashboard },
    { name: 'My Codes', href: '/promoter/codes', icon: Code },
    { name: 'Earnings', href: '/promoter/earnings', icon: DollarSign },
    { name: 'Leaderboard', href: '/promoter/leaderboard', icon: TrendingUp },
  ];
  const staffMenuItems = [
    { name: 'Dashboard', href: '/staff', icon: LayoutDashboard },
    { name: 'Events', href: '/staff/events', icon: Calendar },
    { name: 'Scanner', href: '/staff/scanner', icon: UserCheck },
  ];
  const adminMenuItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Organizers', href: '/admin/organizers', icon: Shield },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  const getMenuItems = () => {
    switch (user?.role) {
      case 'ORGANIZER': return organizerMenuItems;
      case 'PROMOTER': return promoterMenuItems;
      case 'EVENT_STAFF': return staffMenuItems;
      case 'ADMIN': return adminMenuItems;
      default: return attendeeMenuItems;
    }
  };

  const allMenuItems = getMenuItems();
  const mobileBottomNavItems = allMenuItems.slice(0, 4);

  return (
    <>
      {/* --- MOBILE TOP BAR --- */}
      <header className="lg:hidden fixed top-0 left-0 w-full z-50 h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <div className="relative w-24 h-12">
            <Image src="/logo.png" alt="Klix" fill className="object-contain" />
          </div>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2">
          <Menu className="w-7 h-7 text-gray-700" />
        </button>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200">
        <SidebarPanel menuItems={allMenuItems} user={user} logout={logout} onClose={() => {}} />
      </aside>

      {/* --- MOBILE SLIDE-OUT MENU --- */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
        <aside className={`relative z-10 w-72 h-full bg-white transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarPanel menuItems={allMenuItems} user={user} logout={logout} onClose={() => setIsMobileMenuOpen(false)} isMobile={true} />
        </aside>
      </div>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full h-20 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
        <div className="grid h-full grid-cols-5">
          {mobileBottomNavItems.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className="flex flex-col items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-primary transition-colors">
                <Icon className={`w-6 h-6 mb-1 transition-colors ${isActive ? 'text-primary' : ''}`} />
                <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : ''}`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
          <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center justify-center text-gray-500 hover:bg-orange-50 hover:text-primary transition-colors">
            <MoreHorizontal className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>
    </>
  );
}
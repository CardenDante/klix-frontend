'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Ticket, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  Users,
  Share2,
  Crown,
  UserCog,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/lib/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Navigation items based on role
  const getNavItems = () => {
    const baseItems = [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/tickets', icon: Ticket, label: 'My Tickets' },
    ];

    if (user?.role === UserRole.ORGANIZER || user?.role === UserRole.ADMIN) {
      baseItems.push(
        { href: '/dashboard/events', icon: Calendar, label: 'My Events' },
        { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
        { href: '/dashboard/staff', icon: Users, label: 'Staff' }
      );
    }

    if (user?.role === UserRole.PROMOTER) {
      baseItems.push(
        { href: '/dashboard/promoter-codes', icon: Share2, label: 'My Codes' },
        { href: '/dashboard/earnings', icon: BarChart3, label: 'Earnings' }
      );
    }

    if (user?.role === UserRole.ADMIN) {
      baseItems.push(
        { href: '/dashboard/admin', icon: ShieldCheck, label: 'Admin Panel' }
      );
    }

    baseItems.push(
      { href: '/dashboard/loyalty', icon: Crown, label: 'Rewards' },
      { href: '/dashboard/settings', icon: Settings, label: 'Settings' }
    );

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <div className="relative w-24 h-10">
              <Image src="/logo.png" alt="Klix" fill className="object-contain" />
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r transition-transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b hidden lg:block">
              <Link href="/">
                <div className="relative w-28 h-12">
                  <Image src="/logo.png" alt="Klix" fill className="object-contain" />
                </div>
              </Link>
            </div>

            {/* User Info */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#EB7D30] to-[#ff9554] rounded-full flex items-center justify-center text-white font-bold">
                  {user?.first_name?.[0] || user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#EB7D30] text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="lg:ml-64 pt-16 lg:pt-0">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
// app/(dashboard)/layout.tsx
'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64"> {/* Offset for the static desktop sidebar */}
          {/* Padding to avoid overlap with fixed mobile top/bottom bars */}
          <div className="pt-24 lg:pt-8 pb-24 lg:pb-8 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
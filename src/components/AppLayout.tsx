'use client';

import Sidebar from './Sidebar';
import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Sidebar />
      
      {/* Main Content Area - Adjusted for sidebar */}
      <div className="lg:ml-64 min-h-screen">
        {/* Mobile header spacer */}
        <div className="h-14 sm:h-16 lg:hidden"></div>
        
        {/* Main content */}
        <main className="h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
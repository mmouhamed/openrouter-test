'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Chat', href: '/', icon: '💬' },
  // Add more items here later
  // { name: 'History', href: '/history', icon: '📜' },
  // { name: 'Settings', href: '/settings', icon: '⚙️' },
  // { name: 'Profile', href: '/profile', icon: '👤' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border border-white/30 dark:border-gray-600/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transform transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transform transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </div>
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white/70 dark:bg-gray-900/80 backdrop-blur-md border-r border-white/20 dark:border-gray-700/50 shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/20 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AI Chat Hub
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Premium Experience</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Future Features Section */}
        <div className="p-4 mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Coming Soon</p>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 px-4 py-3 opacity-50 cursor-not-allowed">
              <span className="text-xl">📜</span>
              <span className="font-medium text-gray-500 dark:text-gray-400">History</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 opacity-50 cursor-not-allowed">
              <span className="text-xl">⚙️</span>
              <span className="font-medium text-gray-500 dark:text-gray-400">Settings</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 opacity-50 cursor-not-allowed">
              <span className="text-xl">👤</span>
              <span className="font-medium text-gray-500 dark:text-gray-400">Profile</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">U</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Free Plan</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
              <span className="text-lg">🚪</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
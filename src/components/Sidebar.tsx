'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from './LoginForm';

interface SidebarItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  description?: string;
  adminOnly?: boolean;
  comingSoon?: boolean;
}

const getNavigationItems = (_isUserAdmin: boolean): SidebarItem[] => {
  const items: SidebarItem[] = [
    { 
      name: 'Home', 
      href: '/', 
      icon: '🏠'
    },
    { 
      name: 'Chat', 
      href: '/chat', 
      icon: '💬'
    }
  ];

  return items;
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const pathname = usePathname();
  const { user, logout, loading: _loading, isAdmin } = useAuth();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-3 left-3 z-50 p-2.5 bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border border-white/30 dark:border-gray-600/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 lg:hidden touch-manipulation"
        aria-label="Toggle sidebar"
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transform transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transition-opacity duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-full bg-gray-600 dark:bg-gray-300 transform transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
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
        className={`fixed top-0 left-0 h-full w-72 sm:w-64 bg-white/70 dark:bg-gray-900/80 backdrop-blur-md border-r border-white/20 dark:border-gray-700/50 shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-6 border-b border-white/20 dark:border-gray-700/50">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 flex-shrink-0">
              <img 
                src="/chatbot-icon.svg" 
                alt="ChatQora Logo" 
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                ChatQora
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Conversation Companion</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
          {getNavigationItems(isAdmin()).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 touch-manipulation ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 text-blue-600 dark:text-blue-400 shadow-sm'
                    : item.comingSoon
                    ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400'
                    : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium text-sm sm:text-base truncate">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-white/20 dark:border-gray-700/50">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs sm:text-sm font-medium">
                    {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{user.name || user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Premium User</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-1.5 sm:p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                title="Sign Out"
              >
                <span className="text-base sm:text-lg">🚪</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Login Modal */}
      {showLogin && (
        <LoginForm onClose={() => setShowLogin(false)} />
      )}
    </>
  );
}
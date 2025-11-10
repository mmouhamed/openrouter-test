'use client';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-3 sm:px-6 lg:px-8 py-6 sm:py-0">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section - Mobile Optimized */}
          <div className="backdrop-blur-md bg-white/70 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/50 rounded-2xl sm:rounded-3xl p-6 sm:p-12 lg:p-16 shadow-xl">
            {/* Logo/Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-6 sm:mb-8">
              <img 
                src="/chatbot-icon.svg" 
                alt="ChatQora Logo" 
                className="w-full h-full"
              />
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
              {user ? `Welcome back, ${user.name || user.username}!` : 'ChatQora'}
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 font-light">
              {user ? 'Ready for your next AI conversation?' : 'Your AI conversation companion'}
            </p>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
              {user 
                ? 'Continue your AI conversations with full chat history and memory. Your premium experience awaits!'
                : 'Experience the future of AI conversations with ChatQora. Connect with powerful language models, get intelligent responses, and explore limitless possibilities through natural dialogue.'
              }
            </p>

            {/* Call to Action Button - Mobile Optimized */}
            <Link href="/chat">
              <button className="group relative inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-3.5 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl font-semibold text-white bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-teal-700 hover:to-teal-800 focus:outline-none focus:ring-4 focus:ring-teal-500/50 touch-manipulation">
                <span className="mr-2 sm:mr-3">
                  {user ? 'Continue Chatting' : 'Start Chatting on ChatQora'}
                </span>
                <span className="text-xl sm:text-2xl group-hover:translate-x-1 transition-transform duration-200">
                  {user ? '💬' : '🚀'}
                </span>
              </button>
            </Link>

            {/* Features Preview - Mobile Responsive */}
            <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{user ? '📜' : '🧠'}</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  {user ? 'Chat History' : 'Smart AI Models'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  {user 
                    ? 'All your conversations saved and easily accessible anytime'
                    : 'Access to powerful language models for intelligent conversations'
                  }
                </p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{user ? '🧠' : '💬'}</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  {user ? 'Memory & Context' : 'Natural Dialogue'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  {user
                    ? 'AI remembers your conversations and maintains context across sessions'
                    : 'Chat naturally and get responses that feel human and helpful'
                  }
                </p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{user ? '👑' : '⚡'}</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  {user ? 'Premium Experience' : 'Fast & Reliable'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  {user
                    ? 'Enhanced features and personalized AI interactions for premium users'
                    : 'Quick responses with modern, optimized interface design'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
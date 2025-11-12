'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header - ChatGPT Style */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img 
                  src="/ChatQora.png" 
                  alt="ChatQora Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                ChatQora
              </h1>
            </div>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/chat" 
                  className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                >
                  Chat
                </Link>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <Link 
                href="/auth/login" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="text-center">
            {/* Hero Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center mx-auto mb-4 lg:mb-6">
              <img 
                src="/ChatQora.png" 
                alt="ChatQora Logo" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Main Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3 lg:mb-4">
              {user ? `Welcome back!` : 'How can I help you today?'}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mb-6 lg:mb-8 max-w-lg mx-auto">
              {user 
                ? 'Ready to continue your AI conversation? Your chat history and preferences are waiting.'
                : 'I\'m ChatQora, powered by NeuroFusion technology that combines multiple AI models for enhanced responses.'
              }
            </p>

            {/* CTA Buttons */}
            <div className="flex justify-center">
              <Link href="/chat">
                <button className="inline-flex items-center justify-center px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 text-sm sm:text-base lg:text-lg font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation">
                  Start Chatting
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              </Link>
            </div>

            {/* Feature Cards */}
            <div className="mt-8 lg:mt-12 grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
              <div className="p-3 lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-lg flex items-center justify-center mx-auto mb-2 lg:mb-3">
                  <span className="text-lg lg:text-xl">🧠</span>
                </div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white mb-1 lg:mb-2">
                  Smart AI Models
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Access to powerful language models for intelligent conversations
                </p>
              </div>

              <div className="p-3 lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-lg flex items-center justify-center mx-auto mb-2 lg:mb-3">
                  <span className="text-lg lg:text-xl">💬</span>
                </div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white mb-1 lg:mb-2">
                  Natural Dialogue
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Chat naturally and get responses that feel human and helpful
                </p>
              </div>

              <div className="p-3 lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-lg flex items-center justify-center mx-auto mb-2 lg:mb-3">
                  <span className="text-lg lg:text-xl">⚡</span>
                </div>
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 dark:text-white mb-1 lg:mb-2">
                  Fast & Reliable
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Quick responses with modern, optimized interface design
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by NeuroFusion-3.1 ensemble processing</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
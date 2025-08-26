'use client';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export default function LandingPage() {
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
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChatQora
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 font-light">
              Your AI conversation companion
            </p>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-500 dark:text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-2">
              Experience the future of AI conversations with ChatQora. Connect with powerful language models, 
              get intelligent responses, and explore limitless possibilities through natural dialogue.
            </p>

            {/* Call to Action Button - Mobile Optimized */}
            <Link href="/chat">
              <button className="group relative inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 lg:px-12 py-3.5 sm:py-4 lg:py-5 text-base sm:text-lg lg:text-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 touch-manipulation">
                <span className="mr-2 sm:mr-3">Start Chatting on ChatQora</span>
                <span className="text-xl sm:text-2xl group-hover:translate-x-1 transition-transform duration-200">🚀</span>
              </button>
            </Link>

            {/* Features Preview - Mobile Responsive */}
            <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🧠</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Smart AI Models</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  Access to powerful language models for intelligent conversations
                </p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💬</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Natural Dialogue</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  Chat naturally and get responses that feel human and helpful
                </p>
              </div>

              <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⚡</div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Fast & Reliable</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center">
                  Quick responses with modern, optimized interface design
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
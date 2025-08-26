'use client';

import Link from 'next/link';
import AppLayout from '@/components/AppLayout';

export default function LandingPage() {
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="backdrop-blur-md bg-white/70 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/50 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-xl">
            {/* Logo/Icon */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="text-white text-3xl sm:text-4xl font-bold">Q</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChatQora
            </h1>

            {/* Tagline */}
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-4 font-light">
              Your AI conversation companion
            </p>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Experience the future of AI conversations with ChatQora. Connect with powerful language models, 
              get intelligent responses, and explore limitless possibilities through natural dialogue.
            </p>

            {/* Call to Action Button */}
            <Link href="/chat">
              <button className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 text-lg sm:text-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50">
                <span className="mr-3">Start Chatting on ChatQora</span>
                <span className="text-2xl group-hover:translate-x-1 transition-transform duration-200">🚀</span>
              </button>
            </Link>

            {/* Features Preview */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="flex flex-col items-center p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Smart AI Models</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Access to powerful language models for intelligent conversations
                </p>
              </div>

              <div className="flex flex-col items-center p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Natural Dialogue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Chat naturally and get responses that feel human and helpful
                </p>
              </div>

              <div className="flex flex-col items-center p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast & Reliable</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
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
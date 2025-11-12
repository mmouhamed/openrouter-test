'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current day for dynamic greeting
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    
    // Store the initial message and redirect to chat
    sessionStorage.setItem('initialMessage', input.trim());
    router.push('/improved-chat');
  };
  
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
            <div className="flex items-center space-x-4">
              <Link 
                href="/improved-chat" 
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                Chat
              </Link>
              {user ? (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                  </span>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-12">
          <div className="text-center">
            {/* Hero Logo */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex items-center justify-center mx-auto mb-3 lg:mb-4">
              <img 
                src="/ChatQora.png" 
                alt="ChatQora Logo" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Main Heading */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-light text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 tracking-wide px-2">
              🌟 Hello Welcome, Happy {getCurrentDay()}!
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 lg:mb-6 max-w-lg mx-auto px-2 leading-relaxed">
              {user 
                ? 'Ready to continue your AI conversation? Your chat history and preferences are waiting.'
                : 'I\'m ChatQora, powered by NeuroFusion technology that combines multiple AI models for enhanced responses.'
              }
            </p>

            {/* Mobile-Optimized Chat Input Box */}
            <div className="w-full max-w-2xl mx-auto mb-4 px-2">
              <form onSubmit={handleSubmit} className="relative">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="How can I help you today?"
                    className="w-full px-3 py-3 bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm rounded-xl"
                    rows={1}
                    style={{ 
                      minHeight: '44px',
                      fontSize: '16px' // Prevents zoom on iOS
                    }}
                    disabled={isLoading}
                  />
                  
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center space-x-2">
                      <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation hidden sm:block">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">QoraFusion 3.1</span>
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-colors disabled:opacity-50 touch-manipulation"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Mobile-Optimized Quick Action Buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-1.5 mb-4 px-2 max-w-lg mx-auto">
              <button
                onClick={() => setInput('Write a creative story')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors touch-manipulation"
              >
                ✏️ Write
              </button>
              <button
                onClick={() => setInput('Teach me something new')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors touch-manipulation"
              >
                📚 Learn
              </button>
              <button
                onClick={() => setInput('Help me write code')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors touch-manipulation"
              >
                💻 Code
              </button>
              <button
                onClick={() => setInput('Help me with daily tasks')}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors touch-manipulation"
              >
                🗂️ Life stuff
              </button>
              <button
                onClick={() => setInput('Surprise me with something interesting')}
                className="col-span-2 sm:col-span-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors touch-manipulation"
              >
                🎯 Claude's choice
              </button>
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
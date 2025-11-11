'use client';

import SmartChatInterface from '@/components/SmartChatInterface';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useState } from 'react';
import Link from 'next/link';

export default function ChatPage() {
  const { user } = useAuth();
  const { conversations, activeConversation, switchConversation, createConversation } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Default closed on mobile

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Mobile Optimized */}
      <div className={`fixed md:relative inset-y-0 left-0 z-50 ${sidebarOpen ? 'w-64' : 'w-0 md:w-64'} transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => createConversation()}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">New chat</span>
          </button>
          
          <Link 
            href="/"
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors mt-2"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="font-medium">Home</span>
          </Link>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => switchConversation(conversation.id)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                  activeConversation?.id === conversation.id
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="truncate text-sm">
                  {conversation.title || `Chat ${conversation.id.slice(0, 8)}...`}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {conversation.messages.length} messages
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
              No conversations yet
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">NeuroFusion-3.1</div>
              <div className="text-xs text-green-600 dark:text-green-400">Online</div>
            </div>
          </div>
          {user && (
            <div className="mt-3 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-900 dark:text-white">
                  {user.name || user.username || 'User'}
                </div>
                <Link href="/" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Toggle */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                  ChatQora
                </h1>
              </Link>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <SmartChatInterface className="h-full" />
        </div>
      </div>
    </div>
  );
}
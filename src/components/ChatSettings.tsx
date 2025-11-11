'use client';

import { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSettings({ isOpen, onClose }: ChatSettingsProps) {
  const { activeConversation, toggleMemoryForConversation, getMemoryStats } = useChat();
  
  if (!isOpen || !activeConversation) return null;

  const memoryStats = getMemoryStats(activeConversation.id);

  const handleMemoryToggle = () => {
    toggleMemoryForConversation(activeConversation.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Chat Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure your conversation preferences
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Memory & Context Settings */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Memory & Context
              </h3>
              
              {/* Memory Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activeConversation.memoryEnabled ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Advanced Memory
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeConversation.memoryEnabled 
                          ? 'AI has enhanced memory and context optimization'
                          : 'Basic context awareness (recent messages only)'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleMemoryToggle}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    activeConversation.memoryEnabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={activeConversation.memoryEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      activeConversation.memoryEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Memory Stats */}
              {activeConversation.memoryEnabled && memoryStats && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Memory Statistics
                  </h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-blue-600 dark:text-blue-400">Total Segments:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        {memoryStats.totalSegments}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600 dark:text-blue-400">Compression:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        {Math.round((1 - memoryStats.compressionRatio) * 100)}%
                      </span>
                    </div>
                  </div>
                  {memoryStats.contextOptimized && (
                    <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Context optimized
                    </div>
                  )}
                </div>
              )}

              {/* Feature Description */}
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                  How it works
                </h5>
                <div className="text-xs text-purple-700 dark:text-purple-200 space-y-1">
                  <p><strong>Basic Mode:</strong> AI remembers recent messages in the conversation</p>
                  <p><strong>Advanced Memory:</strong> AI has enhanced context optimization, semantic search, and intelligent memory compression for longer conversations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Current Conversation
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p><span className="font-medium">Title:</span> {activeConversation.title}</p>
              <p><span className="font-medium">Messages:</span> {activeConversation.messages.length}</p>
              <p><span className="font-medium">Created:</span> {activeConversation.createdAt.toLocaleDateString()}</p>
              {activeConversation.contextOptimized && (
                <p className="text-green-600 dark:text-green-400">
                  <span className="font-medium">Status:</span> Context optimized
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
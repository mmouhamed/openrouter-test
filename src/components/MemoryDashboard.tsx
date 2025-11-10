'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';

interface MemoryDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryDashboard({ isOpen, onClose }: MemoryDashboardProps) {
  const { 
    activeConversation, 
    getMemoryStats, 
    toggleMemoryForConversation,
    conversations 
  } = useChat();
  const [stats, setStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isOpen && activeConversation) {
      const memoryStats = getMemoryStats(activeConversation.id);
      setStats(memoryStats);
    }
  }, [isOpen, activeConversation, getMemoryStats, refreshKey]);

  const refreshStats = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleToggleMemory = () => {
    if (activeConversation) {
      toggleMemoryForConversation(activeConversation.id);
      setTimeout(refreshStats, 100);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Memory Dashboard Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:right-4 sm:top-1/2 sm:-translate-y-1/2 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">🧠</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Memory System</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {activeConversation ? (
            <>
              {/* Conversation Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Current Conversation</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeConversation.memoryEnabled 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {activeConversation.memoryEnabled ? 'Memory ON' : 'Memory OFF'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {activeConversation.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {activeConversation.messages.length} messages • Updated {activeConversation.updatedAt.toLocaleDateString()}
                </p>
              </div>

              {/* Memory Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Smart Memory System
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {activeConversation.memoryEnabled 
                      ? 'Optimizing context with AI memory' 
                      : 'Using simple sliding window'
                    }
                  </p>
                </div>
                <button
                  onClick={handleToggleMemory}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    activeConversation.memoryEnabled 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      activeConversation.memoryEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Memory Statistics */}
              {activeConversation.memoryEnabled && stats && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Memory Statistics</h4>
                    <button
                      onClick={refreshStats}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-200">
                        {stats.totalSegments}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">
                        Memory Segments
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-900 dark:text-green-200">
                        {Math.round((1 - stats.compressionRatio) * 100)}%
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        Space Saved
                      </div>
                    </div>
                  </div>

                  {/* Segment Types */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Memory Composition
                    </h5>
                    {Object.entries(stats.segmentTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            type === 'summary' ? 'bg-blue-500' :
                            type === 'important' ? 'bg-orange-500' :
                            type === 'semantic' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`} />
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {type}
                          </span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {String(count)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Efficiency Indicator */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Memory Efficiency
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        stats.compressionRatio < 0.5 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : stats.compressionRatio < 0.8
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {stats.compressionRatio < 0.5 ? 'Excellent' : 
                         stats.compressionRatio < 0.8 ? 'Good' : 'Needs Optimization'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.max(10, (1 - stats.compressionRatio) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Context Optimization Status */}
              {activeConversation.memoryEnabled && (
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Context Status
                      </h4>
                      <p className="text-xs text-gray-500">
                        {activeConversation.contextOptimized 
                          ? 'Context optimized for efficiency' 
                          : 'Will optimize on next AI request'
                        }
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      activeConversation.contextOptimized 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`} />
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={refreshStats}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    🔄 Refresh Memory Stats
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    disabled
                  >
                    🧹 Optimize Memory (Coming Soon)
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-xl">💭</span>
              </div>
              <p className="text-sm">No active conversation</p>
              <p className="text-xs mt-1">Start a chat to see memory statistics</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
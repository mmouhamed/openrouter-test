'use client';

import { useState } from 'react';
import { useChat, Conversation } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationHistory({ isOpen, onClose }: ConversationHistoryProps) {
  const { user } = useAuth();
  const { 
    conversations, 
    activeConversationId, 
    createConversation, 
    switchConversation, 
    deleteConversation,
    updateConversationTitle 
  } = useChat();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleNewChat = () => {
    createConversation();
    onClose();
  };

  const handleEditTitle = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveTitle = () => {
    if (editingId && editingTitle.trim()) {
      updateConversationTitle(editingId, editingTitle.trim());
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Conversation History Sidebar - Mobile First */}
      <aside
        className={`fixed inset-x-0 bottom-0 h-4/5 sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t sm:border-l sm:border-t-0 border-white/20 dark:border-gray-700/50 shadow-xl z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0 sm:translate-x-0 sm:translate-y-0' : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        } rounded-t-xl sm:rounded-none`}
      >
        {/* Header - Mobile First */}
        <div className="p-4 border-b border-white/20 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Mobile: Show drag handle, Desktop: Show close button */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full sm:hidden"></div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
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

        {/* New Chat Button */}
        <div className="p-4 border-b border-white/20 dark:border-gray-700/50">
          <button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Conversation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.519L3 21l2.519-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`relative group rounded-lg border transition-all duration-200 cursor-pointer ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent'
                  }`}
                >
                  <div 
                    className="p-3 pr-10"
                    onClick={() => {
                      switchConversation(conversation.id);
                      onClose();
                    }}
                  >
                    {editingId === conversation.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full text-sm font-medium bg-transparent border-none outline-none p-0 text-gray-900 dark:text-white"
                        autoFocus
                      />
                    ) : (
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {conversation.title}
                      </h3>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.messages.length} messages
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTitle(conversation);
                        }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Edit title"
                      >
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete conversation"
                      >
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
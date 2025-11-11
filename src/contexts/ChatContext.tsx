'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { MemoryManager, ConversationMemory } from '@/lib/memory/MemoryManager';
import { AdvancedContextEngine } from '@/lib/context/AdvancedContextEngine';

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  base64?: string;
  thumbnailUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  memoryEnabled: boolean;
  contextOptimized?: boolean;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  memoryManager: MemoryManager;
  createConversation: (title?: string, enableMemory?: boolean) => string;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  deleteConversation: (id: string) => void;
  switchConversation: (id: string) => void;
  clearActiveConversation: () => void;
  updateConversationTitle: (id: string, title: string) => void;
  getOptimizedContext: (query?: string) => Promise<ChatMessage[]>;
  getMemoryStats: (conversationId?: string) => any;
  toggleMemoryForConversation: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [memoryManager] = useState(() => new MemoryManager({
    maxContextTokens: 8000,
    slidingWindowSize: 20,
    summaryThreshold: 25,
    compressionTarget: 0.4,
    semanticSearchThreshold: 0.6
  }));
  const [contextEngine] = useState(() => new AdvancedContextEngine({
    maxContextTokens: 8000,
    optimalContextTokens: 6000,
    importanceThreshold: 0.3,
    recencyWeight: 0.4,
    relevanceWeight: 0.4,
    importanceWeight: 0.2
  }));
  const { user } = useAuth();

  // Load conversations from localStorage when user logs in
  useEffect(() => {
    if (user) {
      const savedConversations = localStorage.getItem(`conversations_${user.id}`);
      if (savedConversations) {
        try {
          const parsed = JSON.parse(savedConversations);
          const conversationsWithDates = parsed.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            memoryEnabled: conv.memoryEnabled ?? false, // Default to false for backward compatibility
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setConversations(conversationsWithDates);

          // Load memory data
          const savedMemory = localStorage.getItem(`memory_${user.id}`);
          if (savedMemory) {
            const memoryData = JSON.parse(savedMemory);
            Object.values(memoryData).forEach((memory: any) => {
              memoryManager.importMemory(memory);
            });
          }

          // Set active conversation to the most recent one
          if (conversationsWithDates.length > 0) {
            const mostRecent = conversationsWithDates.reduce((latest: Conversation, current: Conversation) => 
              current.updatedAt > latest.updatedAt ? current : latest
            );
            setActiveConversationId(mostRecent.id);
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
        }
      }
    } else {
      // Clear conversations when user logs out
      setConversations([]);
      setActiveConversationId(null);
      // Clear all memory
      conversations.forEach(conv => {
        memoryManager.clearMemory(conv.id);
      });
    }
  }, [user, memoryManager]);

  // Save conversations and memory data to localStorage whenever they change
  const saveUserData = useCallback(() => {
    if (!user) return;

    try {
      // Save conversations
      localStorage.setItem(`conversations_${user.id}`, JSON.stringify(conversations));

      // Save memory data
      const memoryData: Record<string, ConversationMemory> = {};
      conversations.forEach(conv => {
        if (conv.memoryEnabled) {
          const memory = memoryManager.exportMemory(conv.id);
          if (memory) {
            memoryData[conv.id] = memory;
          }
        }
      });
      localStorage.setItem(`memory_${user.id}`, JSON.stringify(memoryData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }, [user, conversations, memoryManager]);

  useEffect(() => {
    if (user && conversations.length > 0) {
      saveUserData();
    }
  }, [conversations, user, saveUserData]);

  const createConversation = (title?: string, enableMemory: boolean = false): string => {
    if (!user) return '';

    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      memoryEnabled: enableMemory
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    return newConversation.id;
  };

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    if (!user || !activeConversationId) return;

    const messageWithId: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: message.timestamp || new Date()
    };

    setConversations(prev => 
      prev.map(conv => {
        if (conv.id === activeConversationId) {
          const updatedConversation = {
            ...conv,
            messages: [...conv.messages, messageWithId],
            updatedAt: new Date()
          };

          // Auto-generate title from first user message
          if (conv.messages.length === 0 && message.role === 'user' && conv.title === 'New Conversation') {
            updatedConversation.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
          }

          // Update memory if enabled
          if (conv.memoryEnabled) {
            // Memory will be updated when getOptimizedContext is called
            updatedConversation.contextOptimized = false;
          }

          return updatedConversation;
        }
        return conv;
      })
    );
  };

  const deleteConversation = (id: string) => {
    // Clear memory for the conversation
    memoryManager.clearMemory(id);
    
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    if (activeConversationId === id) {
      const remaining = conversations.filter(conv => conv.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        setActiveConversationId(null);
      }
    }
  };

  const switchConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const clearActiveConversation = () => {
    if (!user || !activeConversationId) return;

    // Clear memory for the conversation
    memoryManager.clearMemory(activeConversationId);

    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, messages: [], updatedAt: new Date(), contextOptimized: false }
          : conv
      )
    );
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id
          ? { ...conv, title, updatedAt: new Date() }
          : conv
      )
    );
  };

  const getOptimizedContext = async (query?: string): Promise<ChatMessage[]> => {
    const conversation = conversations.find(conv => conv.id === activeConversationId);
    if (!conversation) return [];

    try {
      let optimizedContext: ChatMessage[];

      if (!conversation.memoryEnabled) {
        // Use basic sliding window for non-memory conversations
        optimizedContext = conversation.messages.slice(-20);
      } else {
        // Use advanced context engine for memory-enabled conversations
        optimizedContext = await contextEngine.getOptimizedContext(
          conversation.id,
          conversation.messages,
          query || '',
          undefined // Could pass user preferences here
        );
        
        // Fallback to memory manager if advanced engine fails
        if (optimizedContext.length === 0) {
          console.warn('Advanced context engine returned empty context, falling back to memory manager');
          optimizedContext = await memoryManager.getOptimizedContext(
            conversation.id,
            conversation.messages,
            query
          );
        }
      }

      // Mark conversation as context optimized
      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeConversationId
            ? { ...conv, contextOptimized: true }
            : conv
        )
      );

      return optimizedContext;
    } catch (error) {
      console.error('Error getting optimized context:', error);
      // Fallback to recent messages
      return conversation.messages.slice(-10);
    }
  };

  const getMemoryStats = (conversationId?: string) => {
    const id = conversationId || activeConversationId;
    if (!id) return null;

    const conversation = conversations.find(conv => conv.id === id);
    if (!conversation || !conversation.memoryEnabled) return null;

    return memoryManager.getMemoryStats(id);
  };

  const toggleMemoryForConversation = (id: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === id) {
          const newMemoryEnabled = !conv.memoryEnabled;
          
          // Clear memory if disabling
          if (!newMemoryEnabled) {
            memoryManager.clearMemory(id);
          }
          
          return {
            ...conv,
            memoryEnabled: newMemoryEnabled,
            contextOptimized: false
          };
        }
        return conv;
      })
    );
  };

  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || null;

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      activeConversation,
      memoryManager,
      createConversation,
      addMessage,
      deleteConversation,
      switchConversation,
      clearActiveConversation,
      updateConversationTitle,
      getOptimizedContext,
      getMemoryStats,
      toggleMemoryForConversation
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
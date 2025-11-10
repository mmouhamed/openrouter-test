'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  createConversation: (title?: string) => string;
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  deleteConversation: (id: string) => void;
  switchConversation: (id: string) => void;
  clearActiveConversation: () => void;
  updateConversationTitle: (id: string, title: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
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
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setConversations(conversationsWithDates);

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
    }
  }, [user]);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (user && conversations.length > 0) {
      localStorage.setItem(`conversations_${user.id}`, JSON.stringify(conversations));
    }
  }, [conversations, user]);

  const createConversation = (title?: string): string => {
    if (!user) return '';

    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: title || 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
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

          return updatedConversation;
        }
        return conv;
      })
    );
  };

  const deleteConversation = (id: string) => {
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

    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeConversationId
          ? { ...conv, messages: [], updatedAt: new Date() }
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

  const activeConversation = conversations.find(conv => conv.id === activeConversationId) || null;

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationId,
      activeConversation,
      createConversation,
      addMessage,
      deleteConversation,
      switchConversation,
      clearActiveConversation,
      updateConversationTitle
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
// 🚀 ConversationContext - The Fuel Injection System
// This context provides conversation data to all components and handles state management

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Conversation,
  ChatMessage,
  ConversationID,
  ConversationState,
  ConversationActions,
  ConversationStorageError,
  ExportOptions
} from '@/types/conversation';
import { getConversationStorage } from '@/lib/storage/ConversationStorageManager';

// 🎯 Why React Context?
// 1. Global State: Any component can access conversation data
// 2. Performance: Avoids prop drilling through multiple components
// 3. Reactivity: Components automatically re-render when data changes
// 4. Centralized Logic: All conversation operations in one place

interface ConversationContextType extends ConversationState, ConversationActions {}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// 🎣 Custom hook for using the conversation context
export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};

// 🔌 Provider component that wraps the app
export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 📊 State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🚀 Initialize on component mount
  useEffect(() => {
    const initializeConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load all conversations from storage
        const storage = getConversationStorage();
        const allConversations = storage.getConversations();
        const active = storage.getActiveConversation();
        
        setConversations(allConversations);
        setActiveConversation(active);
        
        // If no conversations exist, create the first one
        if (allConversations.length === 0) {
          console.log('🎉 Welcome! Creating your first conversation...');
          const firstConversationId = await storage.createConversation('Welcome to ChatQora');
          const firstConversation = storage.getActiveConversation();
          
          if (firstConversation) {
            setConversations([firstConversation]);
            setActiveConversation(firstConversation);
          }
        }
        
        console.log(`💬 Loaded ${allConversations.length} conversations`);
      } catch (err) {
        const errorMessage = err instanceof ConversationStorageError 
          ? err.message 
          : 'Failed to load conversations';
        setError(errorMessage);
        console.error('❌ Failed to initialize conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversations();
  }, []);

  // 🔄 Refresh state from storage (useful after operations)
  const refreshState = useCallback(() => {
    const storage = getConversationStorage();
    const allConversations = storage.getConversations();
    const active = storage.getActiveConversation();
    
    setConversations(allConversations);
    setActiveConversation(active);
  }, []);

  // ➕ Create new conversation
  const createConversation = useCallback(async (title?: string, model?: string): Promise<ConversationID> => {
    try {
      setError(null);
      const storage = getConversationStorage();
      const conversationId = await storage.createConversation(title, model);
      refreshState(); // Update React state
      
      console.log(`✨ Created new conversation: ${title || 'New Chat'}`);
      return conversationId;
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to create conversation';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // 🗑️ Delete conversation
  const deleteConversation = useCallback(async (id: ConversationID): Promise<void> => {
    try {
      setError(null);
      const storage = getConversationStorage();
      await storage.deleteConversation(id);
      refreshState(); // Update React state
      
      console.log(`🗑️ Deleted conversation: ${id}`);
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to delete conversation';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // 🔄 Switch to different conversation
  const switchConversation = useCallback(async (id: ConversationID): Promise<void> => {
    try {
      setError(null);
      const storage = getConversationStorage();
      await storage.switchConversation(id);
      refreshState(); // Update React state
      
      console.log(`🔄 Switched to conversation: ${id}`);
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to switch conversation';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // ✏️ Update conversation title
  const updateConversationTitle = useCallback(async (id: ConversationID, title: string): Promise<void> => {
    try {
      setError(null);
      
      // Find and update the conversation
      const storage = getConversationStorage();
      const allConversations = storage.getConversations();
      const conversation = allConversations.find(conv => conv.id === id);
      
      if (!conversation) {
        throw new ConversationStorageError('Conversation not found', 'CONVERSATION_NOT_FOUND');
      }
      
      conversation.title = title;
      conversation.updatedAt = new Date();
      
      // Save changes
      storage.forceSave();
      refreshState(); // Update React state
      
      console.log(`✏️ Updated conversation title: ${title}`);
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to update conversation title';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // 💬 Add message to active conversation
  const addMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> => {
    try {
      setError(null);
      const storage = getConversationStorage();
      await storage.addMessage(message);
      refreshState(); // Update React state
      
      console.log(`💬 Added ${message.role} message`);
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to add message';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // 🧹 Clear conversation messages
  const clearConversation = useCallback(async (id: ConversationID): Promise<void> => {
    try {
      setError(null);
      const storage = getConversationStorage();
      await storage.clearConversation(id);
      refreshState(); // Update React state
      
      console.log(`🧹 Cleared conversation: ${id}`);
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to clear conversation';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // 📦 Archive conversation (for future use)
  const archiveConversation = useCallback(async (id: ConversationID): Promise<void> => {
    try {
      setError(null);
      
      // Find and archive the conversation
      const storage = getConversationStorage();
      const allConversations = storage.getConversations();
      const conversation = allConversations.find(conv => conv.id === id);
      
      if (!conversation) {
        throw new ConversationStorageError('Conversation not found', 'CONVERSATION_NOT_FOUND');
      }
      
      conversation.metadata.isArchived = true;
      conversation.updatedAt = new Date();
      
      // Save changes
      storage.forceSave();
      refreshState(); // Update React state
      
      console.log(`📦 Archived conversation: ${conversation.title}`);
    } catch (err) {
      const errorMessage = err instanceof ConversationStorageError 
        ? err.message 
        : 'Failed to archive conversation';
      setError(errorMessage);
      throw err;
    }
  }, [refreshState]);

  // 📤 Export conversations (placeholder for future implementation)
  const exportConversations = useCallback(async (options: ExportOptions): Promise<string> => {
    try {
      setError(null);
      
      // For now, just export as JSON
      const dataToExport = {
        conversations: options.conversationIds 
          ? conversations.filter(conv => options.conversationIds!.includes(conv.id))
          : conversations,
        exportedAt: new Date().toISOString(),
        format: options.format,
        includeMetadata: options.includeMetadata
      };
      
      console.log(`📤 Exported ${dataToExport.conversations.length} conversations`);
      return JSON.stringify(dataToExport, null, 2);
    } catch (err) {
      const errorMessage = 'Failed to export conversations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [conversations]);

  // 🔍 Search conversations (basic implementation)
  const searchConversations = useCallback(async (filter: any): Promise<Conversation[]> => {
    try {
      setError(null);
      
      let results = [...conversations];
      
      // Basic text search across conversation titles and messages
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        results = results.filter(conv => 
          conv.title.toLowerCase().includes(query) ||
          conv.messages.some(msg => msg.content.toLowerCase().includes(query))
        );
      }
      
      console.log(`🔍 Search returned ${results.length} conversations`);
      return results;
    } catch (err) {
      const errorMessage = 'Failed to search conversations';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [conversations]);

  // 🎯 Context value - everything that child components can access
  const contextValue: ConversationContextType = {
    // State
    conversations,
    activeConversation,
    isLoading,
    error,
    
    // Actions
    createConversation,
    deleteConversation,
    switchConversation,
    updateConversationTitle,
    addMessage,
    clearConversation,
    archiveConversation,
    exportConversations,
    searchConversations,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
};

// 🚀 Higher-order component for easier testing
export const withConversationProvider = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <ConversationProvider>
      <Component {...props} />
    </ConversationProvider>
  );
};
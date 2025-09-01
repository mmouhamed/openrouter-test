// 💾 ConversationStorageManager - The Heart of Our Memory System
// This class handles ALL storage operations and acts as the single source of truth

import {
  Conversation,
  ChatMessage,
  ConversationStorage,
  GlobalMemorySettings,
  StorageMetadata,
  ConversationStorageError,
  ConversationID,
  MessageID,
  ConversationFilter,
  ExportOptions,
  ContextWindow
} from '@/types/conversation';

// 🎯 Why this design?
// 1. Single Responsibility: One class handles all storage
// 2. Error Handling: Centralized error management
// 3. Performance: Optimized read/write operations
// 4. Extensibility: Easy to add features like cloud sync later

export class ConversationStorageManager {
  private readonly STORAGE_KEY = 'chatqora_conversations';
  private readonly STORAGE_VERSION = '1.0.0';
  private readonly MAX_STORAGE_SIZE_MB = 50; // 50MB limit for localStorage
  
  // In-memory cache for performance (avoids constant localStorage reads)
  private cache: ConversationStorage | null = null;
  private isDirty = false; // Track if cache needs to be saved

  constructor() {
    // Only initialize if we're in the browser (client-side)
    if (typeof window !== 'undefined') {
      this.initializeStorage();
    }
  }

  // 🚀 Initialize storage system (called on first load)
  private initializeStorage(): void {
    // Guard against server-side rendering
    if (typeof window === 'undefined') {
      console.warn('🚨 Storage initialization attempted on server-side');
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        // First time setup - create default storage structure
        console.log('🎉 Initializing ChatQora memory system...');
        this.cache = this.createDefaultStorage();
        this.saveToStorage();
      } else {
        // Load existing data
        const parsed = JSON.parse(stored);
        this.cache = this.migrateStorageIfNeeded(parsed);
      }
      
      console.log(`💾 Loaded ${Object.keys(this.cache.conversations).length} conversations`);
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error);
      // Fallback: create fresh storage
      this.cache = this.createDefaultStorage();
      throw new ConversationStorageError(
        'Failed to initialize conversation storage',
        'INVALID_DATA',
        error
      );
    }
  }

  // 🏗️ Create default storage structure
  private createDefaultStorage(): ConversationStorage {
    return {
      conversations: {},
      activeConversationId: null,
      settings: {
        maxConversations: 100,
        maxMessagesPerConversation: 1000,
        autoArchiveAfterDays: 30,
        defaultContextWindowSize: 10,
        storageQuotaMB: this.MAX_STORAGE_SIZE_MB,
        enableAnalytics: true,
        exportFormat: 'json'
      },
      metadata: {
        version: this.STORAGE_VERSION,
        createdAt: new Date(),
        lastBackup: null,
        totalStorageUsed: 0,
        conversationCount: 0,
        messageCount: 0
      }
    };
  }

  // 🔄 Handle storage migrations for future updates
  private migrateStorageIfNeeded(data: any): ConversationStorage {
    if (data.metadata?.version !== this.STORAGE_VERSION) {
      console.log('🔄 Migrating storage to new version...');
      // Future: Add migration logic here
    }
    
    // Convert date strings back to Date objects (JSON doesn't preserve Date types)
    return {
      ...data,
      metadata: {
        ...data.metadata,
        createdAt: new Date(data.metadata.createdAt),
        lastBackup: data.metadata.lastBackup ? new Date(data.metadata.lastBackup) : null
      },
      conversations: Object.fromEntries(
        Object.entries(data.conversations).map(([id, conv]: [string, any]) => [
          id,
          {
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }
        ])
      )
    };
  }

  // 💾 Save cache to localStorage
  private saveToStorage(): void {
    if (!this.isDirty || !this.cache) return;
    
    try {
      const dataString = JSON.stringify(this.cache);
      const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
      
      if (sizeInMB > this.MAX_STORAGE_SIZE_MB) {
        throw new ConversationStorageError(
          `Storage quota exceeded: ${sizeInMB.toFixed(2)}MB / ${this.MAX_STORAGE_SIZE_MB}MB`,
          'QUOTA_EXCEEDED',
          { currentSize: sizeInMB, maxSize: this.MAX_STORAGE_SIZE_MB }
        );
      }
      
      localStorage.setItem(this.STORAGE_KEY, dataString);
      this.cache.metadata.totalStorageUsed = sizeInMB * 1024 * 1024; // Store in bytes
      this.isDirty = false;
      
      console.log(`💾 Saved ${sizeInMB.toFixed(2)}MB to storage`);
    } catch (error) {
      console.error('❌ Failed to save to storage:', error);
      throw new ConversationStorageError(
        'Failed to save conversation data',
        'STORAGE_FULL',
        error
      );
    }
  }

  // 📝 Create a new conversation
  public async createConversation(title?: string, model = 'openai/gpt-4o'): Promise<ConversationID> {
    if (!this.cache) throw new ConversationStorageError('Storage not initialized', 'INVALID_DATA');
    
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const conversation: Conversation = {
      id,
      title: title || `New Chat ${Object.keys(this.cache.conversations).length + 1}`,
      messages: [],
      createdAt: now,
      updatedAt: now,
      model,
      settings: {
        contextWindowSize: this.cache.settings.defaultContextWindowSize,
        autoTitle: true,
        retainContext: true
      },
      metadata: {
        totalTokensUsed: 0,
        messageCount: 0,
        averageResponseTime: 0,
        tags: [],
        isArchived: false,
        isPinned: false
      }
    };
    
    this.cache.conversations[id] = conversation;
    this.cache.activeConversationId = id;
    this.cache.metadata.conversationCount = Object.keys(this.cache.conversations).length;
    
    this.isDirty = true;
    this.saveToStorage();
    
    console.log(`✨ Created conversation: ${title || 'New Chat'}`);
    return id;
  }

  // 📖 Get all conversations
  public getConversations(): Conversation[] {
    // Ensure we're initialized
    if (!this.cache) {
      if (typeof window !== 'undefined') {
        this.initializeStorage();
      } else {
        return [];
      }
    }
    if (!this.cache) return [];
    
    return Object.values(this.cache.conversations)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()); // Most recent first
  }

  // 🎯 Get active conversation
  public getActiveConversation(): Conversation | null {
    // Ensure we're initialized
    if (!this.cache) {
      if (typeof window !== 'undefined') {
        this.initializeStorage();
      } else {
        return null;
      }
    }
    if (!this.cache?.activeConversationId) return null;
    return this.cache.conversations[this.cache.activeConversationId] || null;
  }

  // 🔄 Switch to a different conversation
  public async switchConversation(id: ConversationID): Promise<void> {
    if (!this.cache) throw new ConversationStorageError('Storage not initialized', 'INVALID_DATA');
    
    if (!this.cache.conversations[id]) {
      throw new ConversationStorageError(
        `Conversation not found: ${id}`,
        'CONVERSATION_NOT_FOUND'
      );
    }
    
    this.cache.activeConversationId = id;
    this.isDirty = true;
    this.saveToStorage();
    
    console.log(`🔄 Switched to conversation: ${this.cache.conversations[id].title}`);
  }

  // ➕ Add message to active conversation
  public async addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
    const conversation = this.getActiveConversation();
    if (!conversation) {
      throw new ConversationStorageError('No active conversation', 'CONVERSATION_NOT_FOUND');
    }
    
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    conversation.messages.push(fullMessage);
    conversation.updatedAt = new Date();
    conversation.metadata.messageCount = conversation.messages.length;
    
    // Update token usage if provided
    if (fullMessage.usage) {
      conversation.metadata.totalTokensUsed += fullMessage.usage.total_tokens;
    }
    
    // Auto-generate title for first user message
    if (conversation.messages.length === 1 && message.role === 'user' && conversation.settings.autoTitle) {
      const title = this.generateConversationTitle(message.content);
      conversation.title = title;
    }
    
    this.cache!.metadata.messageCount = this.getTotalMessageCount();
    this.isDirty = true;
    this.saveToStorage();
    
    console.log(`💬 Added ${message.role} message to: ${conversation.title}`);
  }

  // 🏷️ Generate conversation title from first message
  private generateConversationTitle(content: string): string {
    // Simple title generation - take first 50 chars and clean up
    let title = content.trim().substring(0, 50);
    
    // Remove line breaks and extra spaces
    title = title.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    // Add ellipsis if truncated
    if (content.length > 50) {
      title += '...';
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    return title || 'New Chat';
  }

  // 🗑️ Delete conversation
  public async deleteConversation(id: ConversationID): Promise<void> {
    if (!this.cache) throw new ConversationStorageError('Storage not initialized', 'INVALID_DATA');
    
    const conversation = this.cache.conversations[id];
    if (!conversation) {
      throw new ConversationStorageError(`Conversation not found: ${id}`, 'CONVERSATION_NOT_FOUND');
    }
    
    delete this.cache.conversations[id];
    
    // If we deleted the active conversation, switch to the most recent one
    if (this.cache.activeConversationId === id) {
      const remaining = this.getConversations();
      this.cache.activeConversationId = remaining.length > 0 ? remaining[0].id : null;
    }
    
    this.cache.metadata.conversationCount = Object.keys(this.cache.conversations).length;
    this.cache.metadata.messageCount = this.getTotalMessageCount();
    
    this.isDirty = true;
    this.saveToStorage();
    
    console.log(`🗑️ Deleted conversation: ${conversation.title}`);
  }

  // 🧹 Clear all messages from a conversation
  public async clearConversation(id: ConversationID): Promise<void> {
    if (!this.cache) throw new ConversationStorageError('Storage not initialized', 'INVALID_DATA');
    
    const conversation = this.cache.conversations[id];
    if (!conversation) {
      throw new ConversationStorageError(`Conversation not found: ${id}`, 'CONVERSATION_NOT_FOUND');
    }
    
    conversation.messages = [];
    conversation.updatedAt = new Date();
    conversation.metadata.messageCount = 0;
    conversation.metadata.totalTokensUsed = 0;
    
    this.cache.metadata.messageCount = this.getTotalMessageCount();
    this.isDirty = true;
    this.saveToStorage();
    
    console.log(`🧹 Cleared conversation: ${conversation.title}`);
  }

  // 🔍 Build context window for API calls
  public buildContextWindow(conversationId: ConversationID): ContextWindow {
    const conversation = this.cache?.conversations[conversationId];
    if (!conversation) {
      return { messages: [], totalTokens: 0, truncated: false, strategy: 'sliding' };
    }
    
    const { contextWindowSize } = conversation.settings;
    const messages = conversation.messages;
    
    if (messages.length <= contextWindowSize) {
      // All messages fit in context window
      return {
        messages: [...messages],
        totalTokens: this.estimateTokenCount(messages),
        truncated: false,
        strategy: 'sliding'
      };
    }
    
    // Use sliding window strategy (keep most recent N messages)
    const contextMessages = messages.slice(-contextWindowSize);
    
    return {
      messages: contextMessages,
      totalTokens: this.estimateTokenCount(contextMessages),
      truncated: true,
      strategy: 'sliding'
    };
  }

  // 🔢 Estimate token count (rough approximation)
  private estimateTokenCount(messages: ChatMessage[]): number {
    // Rough estimation: ~4 characters per token for English text
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  // 📊 Get total message count across all conversations
  private getTotalMessageCount(): number {
    if (!this.cache) return 0;
    return Object.values(this.cache.conversations)
      .reduce((sum, conv) => sum + conv.messages.length, 0);
  }

  // 📈 Get storage statistics
  public getStorageStats() {
    if (!this.cache) return null;
    
    return {
      conversationCount: this.cache.metadata.conversationCount,
      messageCount: this.cache.metadata.messageCount,
      storageUsedMB: (this.cache.metadata.totalStorageUsed / (1024 * 1024)).toFixed(2),
      storageQuotaMB: this.cache.settings.storageQuotaMB,
      createdAt: this.cache.metadata.createdAt,
    };
  }

  // 🔄 Force save cache to storage
  public forceSave(): void {
    this.isDirty = true;
    this.saveToStorage();
  }

  // 🗑️ Clear all data (nuclear option)
  public clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.cache = this.createDefaultStorage();
    this.saveToStorage();
    console.log('🗑️ Cleared all conversation data');
  }
}

// 🏭 Singleton instance - one storage manager for the entire app
// Lazy initialization to avoid SSR issues
let conversationStorageInstance: ConversationStorageManager | null = null;

export const getConversationStorage = (): ConversationStorageManager => {
  if (!conversationStorageInstance) {
    conversationStorageInstance = new ConversationStorageManager();
  }
  return conversationStorageInstance;
};

// For backward compatibility
export const conversationStorage = {
  get instance() {
    return getConversationStorage();
  },
  getConversations: () => getConversationStorage().getConversations(),
  getActiveConversation: () => getConversationStorage().getActiveConversation(),
  createConversation: (title?: string, model?: string) => getConversationStorage().createConversation(title, model),
  switchConversation: (id: string) => getConversationStorage().switchConversation(id),
  addMessage: (message: any) => getConversationStorage().addMessage(message),
  buildContextWindow: (id: string) => getConversationStorage().buildContextWindow(id),
  forceSave: () => getConversationStorage().forceSave(),
};
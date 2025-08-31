// 🧠 Core Types for Conversation Memory System
// Think of these as the DNA of our memory system - they define the structure of everything

export interface ChatMessage {
  id: string;                    // Unique identifier for each message
  role: 'user' | 'assistant';   // Who sent the message
  content: string;              // The actual message content
  model?: string;               // Which AI model was used (for assistant messages)
  usage?: {                     // Token usage statistics
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timestamp: Date;              // When the message was sent
  metadata?: {                  // Additional data we might need later
    edited?: boolean;
    importance?: number;        // 1-10 scale for context prioritization
    tags?: string[];           // User-defined tags
  };
}

export interface Conversation {
  id: string;                   // Unique conversation identifier
  title: string;                // Auto-generated or user-defined title
  messages: ChatMessage[];      // Array of all messages in this conversation
  createdAt: Date;             // When conversation was started
  updatedAt: Date;             // Last message timestamp
  model: string;               // Default/last used model for this conversation
  settings: {                  // Conversation-specific settings
    contextWindowSize: number;  // How many messages to include in API calls
    autoTitle: boolean;         // Whether to auto-generate titles
    retainContext: boolean;     // Whether to include conversation history
  };
  metadata: {
    totalTokensUsed: number;    // Cumulative token usage
    messageCount: number;       // Total message count
    averageResponseTime: number; // Performance tracking
    tags: string[];            // User-defined organizational tags
    isArchived: boolean;       // Whether conversation is archived
    isPinned: boolean;         // Whether conversation is pinned to top
  };
}

// 💾 Storage container for all conversation data
export interface ConversationStorage {
  conversations: Record<string, Conversation>;  // All conversations keyed by ID
  activeConversationId: string | null;          // Currently active conversation
  settings: GlobalMemorySettings;               // Global memory settings
  metadata: StorageMetadata;                     // Storage system metadata
}

// ⚙️ Global settings for the memory system
export interface GlobalMemorySettings {
  maxConversations: number;          // Maximum number of conversations to keep
  maxMessagesPerConversation: number; // Maximum messages per conversation
  autoArchiveAfterDays: number;      // Auto-archive conversations after N days
  defaultContextWindowSize: number;   // Default context window for new conversations
  storageQuotaMB: number;            // Maximum storage usage in MB
  enableAnalytics: boolean;          // Whether to track usage analytics
  exportFormat: 'json' | 'markdown' | 'csv'; // Default export format
}

// 📊 Metadata about the storage system itself
export interface StorageMetadata {
  version: string;                   // Schema version for migrations
  createdAt: Date;                  // When storage was first initialized
  lastBackup: Date | null;          // Last backup timestamp
  totalStorageUsed: number;         // Current storage usage in bytes
  conversationCount: number;        // Total number of conversations
  messageCount: number;             // Total number of messages across all conversations
}

// 🔍 Search and filter types
export interface ConversationFilter {
  searchQuery?: string;             // Text to search for
  models?: string[];               // Filter by AI models used
  dateRange?: {                    // Filter by date range
    start: Date;
    end: Date;
  };
  tags?: string[];                 // Filter by tags
  isArchived?: boolean;            // Show archived/unarchived
  isPinned?: boolean;              // Show pinned conversations
  minMessages?: number;            // Minimum message count
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'messageCount'; // Sort options
  sortOrder?: 'asc' | 'desc';      // Sort direction
}

// 📤 Export/Import types
export type ExportFormat = 'json' | 'markdown' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeUsageStats: boolean;
  conversationIds?: string[];       // Specific conversations to export (empty = all)
  dateRange?: {                    // Date range filter for export
    start: Date;
    end: Date;
  };
}

// 🎯 Context window management types
export interface ContextWindow {
  messages: ChatMessage[];          // Messages to send to API
  totalTokens: number;             // Estimated token count
  truncated: boolean;              // Whether context was truncated
  strategy: 'sliding' | 'importance' | 'summarized'; // Which strategy was used
}

// 📈 Analytics types for tracking usage
export interface ConversationAnalytics {
  conversationId: string;
  metrics: {
    totalMessages: number;
    totalTokensUsed: number;
    averageResponseTime: number;
    modelsUsed: string[];
    createdAt: Date;
    lastActiveAt: Date;
    sessionDuration: number;        // Total time spent in conversation (minutes)
  };
}

// 🚨 Error types for better error handling
export class ConversationStorageError extends Error {
  constructor(
    message: string,
    public code: 'STORAGE_FULL' | 'CONVERSATION_NOT_FOUND' | 'INVALID_DATA' | 'QUOTA_EXCEEDED',
    public details?: any
  ) {
    super(message);
    this.name = 'ConversationStorageError';
  }
}

// 🔧 Utility types
export type ConversationID = string;
export type MessageID = string;

// Hook return types for React components
export interface ConversationState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
}

export interface ConversationActions {
  createConversation: (title?: string, model?: string) => Promise<ConversationID>;
  deleteConversation: (id: ConversationID) => Promise<void>;
  switchConversation: (id: ConversationID) => Promise<void>;
  updateConversationTitle: (id: ConversationID, title: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  clearConversation: (id: ConversationID) => Promise<void>;
  archiveConversation: (id: ConversationID) => Promise<void>;
  exportConversations: (options: ExportOptions) => Promise<string>;
  searchConversations: (filter: ConversationFilter) => Promise<Conversation[]>;
}
/**
 * Super Efficient LLM Memory Architecture
 * 
 * Features:
 * - Conversation Summarization for long-term memory
 * - Sliding Window Context Management
 * - Semantic Search for relevant context retrieval
 * - Memory Compression and Optimization
 * - Intelligent Context Prioritization
 */

import { ChatMessage } from '@/contexts/ChatContext';

export interface MemorySegment {
  id: string;
  type: 'summary' | 'important' | 'recent' | 'semantic';
  content: string;
  timestamp: Date;
  relevanceScore: number;
  tokenCount: number;
  messageIds: string[];
}

export interface ConversationMemory {
  conversationId: string;
  totalTokens: number;
  segments: MemorySegment[];
  lastUpdated: Date;
  compressionRatio: number;
}

export interface MemoryConfig {
  maxContextTokens: number;
  slidingWindowSize: number;
  summaryThreshold: number;
  compressionTarget: number;
  semanticSearchThreshold: number;
}

export class MemoryManager {
  private config: MemoryConfig;
  private memories: Map<string, ConversationMemory> = new Map();

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxContextTokens: 8000, // Max tokens to send to LLM
      slidingWindowSize: 20,   // Keep last N messages in full
      summaryThreshold: 30,    // Summarize when more than N messages
      compressionTarget: 0.3,  // Target 30% of original size
      semanticSearchThreshold: 0.7, // Similarity threshold for relevance
      ...config
    };
  }

  /**
   * Get optimized context for LLM request
   */
  async getOptimizedContext(
    conversationId: string, 
    messages: ChatMessage[], 
    currentQuery?: string
  ): Promise<ChatMessage[]> {
    try {
      // Detect self-referential queries that might cause loops
      if (currentQuery && this.isSelfReferentialQuery(currentQuery)) {
        console.warn('Detected self-referential query, using simple context');
        return messages.slice(-this.config.slidingWindowSize);
      }

      // Add timeout protection for memory operations
      const memory = await Promise.race([
        this.getOrCreateMemory(conversationId, messages),
        new Promise<ConversationMemory>((_, reject) => 
          setTimeout(() => reject(new Error('Memory operation timeout')), 3000)
        )
      ]);
    
      // Start with recent messages (sliding window)
      const recentMessages = messages.slice(-this.config.slidingWindowSize);
      const contextTokens = this.estimateTokenCount(recentMessages);

      // If we're under the limit, return recent messages
      if (contextTokens <= this.config.maxContextTokens) {
        return recentMessages;
      }

      // Need to optimize - create compressed context
      return this.createCompressedContext(memory, recentMessages, currentQuery);
    } catch (error) {
      console.warn('Memory system error, falling back to recent messages:', error);
      // Fallback to simple sliding window on any error
      return messages.slice(-this.config.slidingWindowSize);
    }
  }

  /**
   * Detect self-referential queries that might cause infinite loops
   */
  private isSelfReferentialQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Patterns that indicate the user is asking about the conversation itself
    const selfReferentialPatterns = [
      /what.*my.*message/,
      /what.*first.*message/,
      /what.*second.*message/,
      /what.*previous.*message/,
      /what.*last.*message/,
      /my.*message.*was/,
      /what.*i.*said/,
      /what.*i.*asked/,
      /previous.*conversation/,
      /earlier.*conversation/,
      /conversation.*history/,
      /what.*we.*discussed/,
      /what.*we.*talked.*about/
    ];
    
    return selfReferentialPatterns.some(pattern => pattern.test(lowerQuery));
  }

  /**
   * Create compressed context using memory segments
   */
  private async createCompressedContext(
    memory: ConversationMemory,
    recentMessages: ChatMessage[],
    currentQuery?: string
  ): Promise<ChatMessage[]> {
    const context: ChatMessage[] = [];
    let tokenBudget = this.config.maxContextTokens;

    // Reserve space for recent messages (highest priority)
    const recentTokens = this.estimateTokenCount(recentMessages.slice(-5));
    tokenBudget -= recentTokens;

    // Add relevant memory segments based on query
    if (currentQuery) {
      const relevantSegments = this.findRelevantSegments(memory, currentQuery);
      
      for (const segment of relevantSegments) {
        if (tokenBudget >= segment.tokenCount) {
          context.push({
            id: `memory-${segment.id}`,
            role: 'assistant',
            content: `[Memory Summary]: ${segment.content}`,
            timestamp: segment.timestamp
          });
          tokenBudget -= segment.tokenCount;
        }
      }
    }

    // Add conversation summary if available
    const summarySegment = memory.segments.find(s => s.type === 'summary');
    if (summarySegment && tokenBudget >= summarySegment.tokenCount) {
      context.unshift({
        id: `summary-${summarySegment.id}`,
        role: 'assistant',
        content: `[Conversation Summary]: ${summarySegment.content}`,
        timestamp: summarySegment.timestamp
      });
    }

    // Add recent messages
    context.push(...recentMessages.slice(-5));

    return context;
  }

  /**
   * Find relevant memory segments using semantic search
   */
  private findRelevantSegments(
    memory: ConversationMemory, 
    query: string
  ): MemorySegment[] {
    // Limit the number of segments to prevent infinite loops
    const maxSegments = Math.min(memory.segments.length, 10);
    
    // Simple keyword-based relevance for now
    // In production, use embeddings and vector search
    const queryWords = query.toLowerCase().split(' ');
    
    return memory.segments
      .filter(segment => segment.type !== 'summary')
      .slice(0, maxSegments) // Limit processing to prevent loops
      .map(segment => ({
        ...segment,
        relevanceScore: this.calculateRelevanceScore(segment.content, queryWords)
      }))
      .filter(segment => segment.relevanceScore > this.config.semanticSearchThreshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Top 3 most relevant
  }

  /**
   * Calculate relevance score using keyword matching
   */
  private calculateRelevanceScore(content: string, queryWords: string[]): number {
    const contentWords = content.toLowerCase().split(' ');
    const matches = queryWords.filter(word => 
      contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))
    );
    return matches.length / queryWords.length;
  }

  /**
   * Get or create memory for a conversation
   */
  private async getOrCreateMemory(
    conversationId: string, 
    messages: ChatMessage[]
  ): Promise<ConversationMemory> {
    let memory = this.memories.get(conversationId);

    if (!memory) {
      memory = {
        conversationId,
        totalTokens: 0,
        segments: [],
        lastUpdated: new Date(),
        compressionRatio: 1.0
      };
      this.memories.set(conversationId, memory);
    }

    // Update memory if new messages
    if (messages.length > memory.segments.reduce((acc, seg) => acc + seg.messageIds.length, 0)) {
      await this.updateMemory(memory, messages);
    }

    return memory;
  }

  /**
   * Update memory with new messages
   */
  private async updateMemory(memory: ConversationMemory, messages: ChatMessage[]): Promise<void> {
    const processedIds = new Set(
      memory.segments.flatMap(segment => segment.messageIds)
    );

    const newMessages = messages.filter(msg => !processedIds.has(msg.id));
    
    if (newMessages.length === 0) return;

    // Check if we need to summarize
    if (messages.length > this.config.summaryThreshold) {
      await this.createConversationSummary(memory, messages);
    }

    // Create segments for important messages
    await this.processNewMessages(memory, newMessages);

    // Compress old segments if needed
    await this.compressMemorySegments(memory);

    memory.lastUpdated = new Date();
    memory.totalTokens = this.estimateTokenCount(messages);
    memory.compressionRatio = this.calculateCompressionRatio(memory, messages);
  }

  /**
   * Create conversation summary
   */
  private async createConversationSummary(
    memory: ConversationMemory, 
    messages: ChatMessage[]
  ): Promise<void> {
    // Remove old summary
    memory.segments = memory.segments.filter(s => s.type !== 'summary');

    // Create new summary (simplified - in production use LLM)
    const summary = this.createSimpleSummary(messages);
    
    if (summary) {
      const summarySegment: MemorySegment = {
        id: `summary-${Date.now()}`,
        type: 'summary',
        content: summary,
        timestamp: new Date(),
        relevanceScore: 1.0,
        tokenCount: this.estimateTokenCount([{ content: summary } as ChatMessage]),
        messageIds: messages.map(m => m.id)
      };

      memory.segments.unshift(summarySegment);
    }
  }

  /**
   * Create simple summary of conversation
   */
  private createSimpleSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return '';

    const topics = userMessages.map(m => {
      const content = m.content.slice(0, 100);
      return content.length === 100 ? content + '...' : content;
    });

    return `This conversation covered: ${topics.slice(0, 5).join('; ')}`;
  }

  /**
   * Process new messages and create memory segments
   */
  private async processNewMessages(
    memory: ConversationMemory, 
    newMessages: ChatMessage[]
  ): Promise<void> {
    for (const message of newMessages) {
      // Mark important messages (long responses, code, etc.)
      if (this.isImportantMessage(message)) {
        const segment: MemorySegment = {
          id: `important-${message.id}`,
          type: 'important',
          content: message.content,
          timestamp: message.timestamp,
          relevanceScore: 0.9,
          tokenCount: this.estimateTokenCount([message]),
          messageIds: [message.id]
        };
        
        memory.segments.push(segment);
      }
    }
  }

  /**
   * Determine if a message is important enough to preserve
   */
  private isImportantMessage(message: ChatMessage): boolean {
    const content = message.content.toLowerCase();
    
    // Code blocks
    if (content.includes('```')) return true;
    
    // Long responses (likely detailed explanations)
    if (message.content.length > 500) return true;
    
    // Questions
    if (message.role === 'user' && content.includes('?')) return true;
    
    // Technical terms
    const techTerms = ['function', 'class', 'algorithm', 'database', 'api', 'error'];
    if (techTerms.some(term => content.includes(term))) return true;
    
    return false;
  }

  /**
   * Compress old memory segments
   */
  private async compressMemorySegments(memory: ConversationMemory): Promise<void> {
    // Remove segments older than 7 days except summaries and important ones
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    memory.segments = memory.segments.filter(segment => 
      segment.type === 'summary' ||
      segment.type === 'important' ||
      segment.timestamp > cutoffDate
    );

    // Limit number of segments
    const maxSegments = 20;
    if (memory.segments.length > maxSegments) {
      memory.segments = memory.segments
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxSegments);
    }
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(
    memory: ConversationMemory, 
    originalMessages: ChatMessage[]
  ): number {
    const originalTokens = this.estimateTokenCount(originalMessages);
    const compressedTokens = memory.segments.reduce((acc, seg) => acc + seg.tokenCount, 0);
    
    return originalTokens > 0 ? compressedTokens / originalTokens : 1.0;
  }

  /**
   * Estimate token count for messages
   */
  private estimateTokenCount(messages: ChatMessage[]): number {
    // Rough estimation: ~4 characters per token
    return messages.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0);
  }

  /**
   * Get memory statistics for debugging
   */
  getMemoryStats(conversationId: string): {
    totalSegments: number;
    compressionRatio: number;
    lastUpdated: Date;
    segmentTypes: Record<string, number>;
  } | null {
    const memory = this.memories.get(conversationId);
    if (!memory) return null;

    const segmentTypes = memory.segments.reduce((acc, seg) => {
      acc[seg.type] = (acc[seg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSegments: memory.segments.length,
      compressionRatio: memory.compressionRatio,
      lastUpdated: memory.lastUpdated,
      segmentTypes
    };
  }

  /**
   * Clear memory for a conversation
   */
  clearMemory(conversationId: string): void {
    this.memories.delete(conversationId);
  }

  /**
   * Export memory for persistence
   */
  exportMemory(conversationId: string): ConversationMemory | null {
    return this.memories.get(conversationId) || null;
  }

  /**
   * Import memory from persistence
   */
  importMemory(memory: ConversationMemory): void {
    this.memories.set(memory.conversationId, {
      ...memory,
      lastUpdated: new Date(memory.lastUpdated),
      segments: memory.segments.map(seg => ({
        ...seg,
        timestamp: new Date(seg.timestamp)
      }))
    });
  }
}
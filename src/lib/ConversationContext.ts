/**
 * Conversation Context Manager
 * Handles smart context management and conversation memory
 */

import { Message } from '@/types/chat';

export interface ConversationMemory {
  id: string;
  messages: Message[];
  summary?: string;
  userFacts: string[];
  topicContext: string[];
  lastActivity: Date;
  messageCount: number;
}

export interface CachedResponse {
  response: string;
  timestamp: Date;
  context: string;
  confidence: number;
}

export class ConversationContextManager {
  private conversations = new Map<string, ConversationMemory>();
  private cache = new Map<string, CachedResponse>();
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Initialize or update conversation memory
   */
  initializeConversation(conversationId: string, messages: Message[] = []): void {
    const existing = this.conversations.get(conversationId);
    
    this.conversations.set(conversationId, {
      id: conversationId,
      messages: messages,
      summary: existing?.summary,
      userFacts: existing?.userFacts || [],
      topicContext: existing?.topicContext || [],
      lastActivity: new Date(),
      messageCount: messages.length
    });
  }

  /**
   * Add a new message to conversation memory
   */
  addMessage(conversationId: string, message: Message): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      this.initializeConversation(conversationId, [message]);
      return;
    }

    conversation.messages.push(message);
    conversation.lastActivity = new Date();
    conversation.messageCount = conversation.messages.length;

    // Extract facts and topics from new messages
    if (message.role === 'user') {
      this.extractUserFacts(message.content, conversation);
      this.updateTopicContext(message.content, conversation);
    }

    // Trim old messages if conversation gets too long
    if (conversation.messages.length > 100) {
      // Keep summary and recent messages
      const recentMessages = conversation.messages.slice(-50);
      const oldMessages = conversation.messages.slice(0, -50);
      
      conversation.summary = this.generateSummary(oldMessages, conversation.summary);
      conversation.messages = recentMessages;
    }
  }

  /**
   * Get optimized context for a new message
   */
  getContextForMessage(conversationId: string, newMessage: string): {
    recentMessages: Message[];
    relevantFacts: string[];
    topicContinuity: string[];
    summary?: string;
    contextPrompt: string;
  } {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return {
        recentMessages: [],
        relevantFacts: [],
        topicContinuity: [],
        contextPrompt: ''
      };
    }

    const recentMessages = conversation.messages.slice(-8); // Last 8 messages
    const relevantFacts = this.extractRelevantFacts(newMessage, conversation.userFacts);
    const topicContinuity = this.maintainTopicContext(newMessage, conversation.topicContext);

    const contextPrompt = this.buildContextPrompt({
      recentMessages,
      relevantFacts,
      topicContinuity,
      summary: conversation.summary,
      newMessage
    });

    return {
      recentMessages,
      relevantFacts,
      topicContinuity,
      summary: conversation.summary,
      contextPrompt
    };
  }

  /**
   * Check if we should make a model call or use cached/contextual response
   */
  shouldCallModel(message: string, conversationId: string): {
    shouldCall: boolean;
    reason: string;
    confidence: number;
  } {
    const conversation = this.conversations.get(conversationId);
    
    // Simple clarification patterns
    const clarificationPatterns = [
      { pattern: /^(yes|yeah|yep|sure|ok|okay|correct|right|exactly)\.?$/i, type: 'agreement' },
      { pattern: /^(no|nope|not really|incorrect|wrong)\.?$/i, type: 'disagreement' },
      { pattern: /^(thanks|thank you|got it|i see|understood|makes sense)\.?$/i, type: 'acknowledgment' },
      { pattern: /^(what|who|when|where|why|how)\s+(do you mean|is that|about)/i, type: 'clarification' },
      { pattern: /^(can you|could you)\s+(explain|clarify|elaborate|expand)/i, type: 'elaboration' },
      { pattern: /^(tell me more|more|continue|go on)\.?$/i, type: 'continuation' },
      { pattern: /^(hello|hi|hey|good morning|good afternoon)\.?$/i, type: 'greeting' }
    ];

    // Check for simple patterns
    for (const { pattern, type } of clarificationPatterns) {
      if (pattern.test(message.trim())) {
        // Some types still need model calls (like elaboration, continuation)
        if (type === 'elaboration' || type === 'continuation') {
          return { shouldCall: true, reason: `${type} requires model response`, confidence: 0.9 };
        }
        return { shouldCall: false, reason: `Simple ${type} detected`, confidence: 0.8 };
      }
    }

    // Check if asking about recent context
    const hasRecentContext = conversation && conversation.messages.length > 0;
    const lastMessage = hasRecentContext ? conversation.messages[conversation.messages.length - 1] : null;
    const isRecentFollowUp = lastMessage && 
      Date.now() - lastMessage.timestamp.getTime() < 60000; // 1 minute

    // Check for cached response
    const cacheKey = this.getCacheKey(message);
    const cachedResponse = this.cache.get(cacheKey);
    if (cachedResponse && this.isCacheValid(cachedResponse)) {
      return { shouldCall: false, reason: 'Cached response available', confidence: cachedResponse.confidence };
    }

    // Default to model call for complex queries
    return { shouldCall: true, reason: 'Complex query requires model response', confidence: 0.95 };
  }

  /**
   * Generate contextual response for simple interactions
   */
  generateContextualResponse(message: string, conversationId: string): string | null {
    const conversation = this.conversations.get(conversationId);
    const lastAssistantMessage = conversation?.messages
      .slice()
      .reverse()
      .find(m => m.role === 'assistant');

    const trimmedMessage = message.trim();

    // Handle acknowledgments
    if (/^(thanks|thank you|got it|i see|understood|makes sense)\.?$/i.test(trimmedMessage)) {
      const responses = [
        "You're welcome! Is there anything else you'd like to explore?",
        "Glad I could help! What would you like to discuss next?",
        "Happy to help! Any other questions?",
        "You're welcome! Feel free to ask if you need clarification on anything else."
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Handle agreement
    if (/^(yes|yeah|yep|sure|ok|okay|correct|right|exactly)\.?$/i.test(trimmedMessage)) {
      const responses = [
        "Great! What specific aspect would you like me to elaborate on?",
        "Perfect! Is there a particular part you'd like to dive deeper into?",
        "Excellent! What would you like to explore further?",
        "Wonderful! Any follow-up questions about this topic?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Handle disagreement
    if (/^(no|nope|not really|incorrect|wrong)\.?$/i.test(trimmedMessage)) {
      const responses = [
        "I understand. Could you help me understand what I got wrong?",
        "Thanks for the correction. What would you like me to clarify?",
        "I see. What aspect would you like me to reconsider?",
        "Got it. Could you provide more context so I can give a better response?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Handle greetings
    if (/^(hello|hi|hey|good morning|good afternoon|good evening)\.?$/i.test(trimmedMessage)) {
      const timeOfDay = new Date().getHours();
      let greeting;
      
      if (timeOfDay < 12) {
        greeting = "Good morning!";
      } else if (timeOfDay < 17) {
        greeting = "Good afternoon!";
      } else {
        greeting = "Good evening!";
      }

      return `${greeting} How can I help you today?`;
    }

    return null; // Trigger model call for everything else
  }

  /**
   * Cache a response for future use
   */
  cacheResponse(message: string, response: string, context: string = '', confidence: number = 0.8): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest cache entries
      const entries = Array.from(this.cache.entries());
      const sortedByAge = entries.sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      const toRemove = sortedByAge.slice(0, 20); // Remove 20 oldest
      
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    const cacheKey = this.getCacheKey(message);
    this.cache.set(cacheKey, {
      response,
      timestamp: new Date(),
      context,
      confidence
    });
  }

  /**
   * Check if should cache a response
   */
  shouldCacheResponse(message: string, response: string): boolean {
    // Cache factual questions
    const factualPatterns = [
      /^what is/i,
      /^define/i,
      /^explain/i,
      /^how does.*work/i,
      /^tell me about/i,
      /^describe/i,
      /^list/i
    ];

    const isFactual = factualPatterns.some(pattern => pattern.test(message));
    
    // Don't cache personal or contextual responses
    const isPersonal = message.toLowerCase().includes('i ') || 
                      message.toLowerCase().includes('my ') ||
                      response.toLowerCase().includes('you mentioned') ||
                      response.toLowerCase().includes('in your case');

    return isFactual && !isPersonal && response.length > 50;
  }

  /**
   * Get cached response if available and valid
   */
  getCachedResponse(message: string): string | null {
    const cacheKey = this.getCacheKey(message);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.response;
    }
    
    return null;
  }

  // Private helper methods
  private extractUserFacts(content: string, conversation: ConversationMemory): void {
    // Simple fact extraction - look for "I am", "I have", "My", etc.
    const factPatterns = [
      /I am (a|an)?\s*([^.!?]+)/gi,
      /I have ([^.!?]+)/gi,
      /My ([^.!?]+)/gi,
      /I work (at|for|in) ([^.!?]+)/gi,
      /I live (in|at) ([^.!?]+)/gi,
      /I like ([^.!?]+)/gi,
      /I prefer ([^.!?]+)/gi
    ];

    factPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.trim();
          if (!conversation.userFacts.includes(cleaned) && cleaned.length > 3) {
            conversation.userFacts.push(cleaned);
          }
        });
      }
    });

    // Keep only recent facts (last 20)
    if (conversation.userFacts.length > 20) {
      conversation.userFacts = conversation.userFacts.slice(-20);
    }
  }

  private updateTopicContext(content: string, conversation: ConversationMemory): void {
    // Simple topic extraction based on nouns and key terms
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const topics = words.filter(word => 
      word.length > 4 && 
      !['that', 'this', 'what', 'when', 'where', 'which', 'would', 'could', 'should'].includes(word)
    );

    topics.forEach(topic => {
      if (!conversation.topicContext.includes(topic)) {
        conversation.topicContext.push(topic);
      }
    });

    // Keep only recent topics (last 15)
    if (conversation.topicContext.length > 15) {
      conversation.topicContext = conversation.topicContext.slice(-15);
    }
  }

  private extractRelevantFacts(message: string, userFacts: string[]): string[] {
    const messageLower = message.toLowerCase();
    return userFacts.filter(fact => 
      messageLower.includes(fact.toLowerCase()) ||
      fact.toLowerCase().includes(messageLower.substring(0, 20))
    ).slice(0, 3); // Max 3 relevant facts
  }

  private maintainTopicContext(message: string, topicContext: string[]): string[] {
    const messageLower = message.toLowerCase();
    return topicContext.filter(topic => 
      messageLower.includes(topic) ||
      topic.includes(messageLower.substring(0, 15))
    ).slice(0, 5); // Max 5 relevant topics
  }

  private buildContextPrompt(params: {
    recentMessages: Message[];
    relevantFacts: string[];
    topicContinuity: string[];
    summary?: string;
    newMessage: string;
  }): string {
    const { recentMessages, relevantFacts, topicContinuity, summary, newMessage } = params;

    let prompt = '';

    if (summary) {
      prompt += `CONVERSATION SUMMARY: ${summary}\n\n`;
    }

    if (relevantFacts.length > 0) {
      prompt += `USER CONTEXT: ${relevantFacts.join('; ')}\n\n`;
    }

    if (topicContinuity.length > 0) {
      prompt += `RELATED TOPICS: ${topicContinuity.join(', ')}\n\n`;
    }

    if (recentMessages.length > 0) {
      prompt += `RECENT CONVERSATION:\n`;
      recentMessages.forEach(msg => {
        prompt += `${msg.role}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
      });
      prompt += '\n';
    }

    prompt += `CURRENT MESSAGE: ${newMessage}`;

    return prompt;
  }

  private generateSummary(messages: Message[], existingSummary?: string): string {
    // Simple summary generation - in production, you'd use an LLM
    const topics = new Set<string>();
    const keyPoints: string[] = [];

    messages.forEach(msg => {
      if (msg.role === 'assistant' && msg.content.length > 100) {
        // Extract first sentence as key point
        const firstSentence = msg.content.split('.')[0];
        if (firstSentence.length > 20) {
          keyPoints.push(firstSentence);
        }
      }
      
      // Extract topics from user messages
      if (msg.role === 'user') {
        const words = msg.content.toLowerCase().match(/\b\w+\b/g) || [];
        words.filter(word => word.length > 4).forEach(word => topics.add(word));
      }
    });

    const topicList = Array.from(topics).slice(0, 5).join(', ');
    const keyPointsList = keyPoints.slice(0, 3).join('; ');

    let summary = `Topics discussed: ${topicList}.`;
    if (keyPointsList) {
      summary += ` Key points: ${keyPointsList}.`;
    }

    if (existingSummary) {
      summary = `${existingSummary} ${summary}`;
    }

    return summary.substring(0, 500); // Keep summary under 500 chars
  }

  private getCacheKey(message: string): string {
    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .substring(0, 100);
  }

  private isCacheValid(cached: CachedResponse): boolean {
    const age = Date.now() - cached.timestamp.getTime();
    return age < this.CACHE_TTL;
  }

  /**
   * Clean up old conversations and cache
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Remove old conversations
    for (const [id, conversation] of this.conversations.entries()) {
      const age = now - conversation.lastActivity.getTime();
      if (age > maxAge) {
        this.conversations.delete(id);
      }
    }

    // Remove old cache entries
    for (const [key, cached] of this.cache.entries()) {
      if (!this.isCacheValid(cached)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const conversationManager = new ConversationContextManager();
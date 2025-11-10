'use client';

import { ChatMessage } from '@/contexts/ChatContext';

// Enhanced message types for better context engineering
export interface EnhancedMessage extends ChatMessage {
  category: MessageCategory;
  importance: number; // 0-1 score
  topicTags: string[];
  contextRelevance: number;
  conversationTurn: number;
  emotionalTone: EmotionalTone;
  intentType: IntentType;
  references: string[]; // Message IDs this references
}

export enum MessageCategory {
  QUESTION = 'question',
  ANSWER = 'answer', 
  INSTRUCTION = 'instruction',
  CLARIFICATION = 'clarification',
  FOLLOW_UP = 'follow_up',
  CODE_RELATED = 'code_related',
  CREATIVE = 'creative',
  ANALYTICAL = 'analytical',
  META_CONVERSATION = 'meta_conversation', // About the conversation itself
  SYSTEM_INFO = 'system_info'
}

export enum EmotionalTone {
  NEUTRAL = 'neutral',
  ENTHUSIASTIC = 'enthusiastic',
  FRUSTRATED = 'frustrated',
  CURIOUS = 'curious',
  CONFIDENT = 'confident',
  UNCERTAIN = 'uncertain'
}

export enum IntentType {
  SEEK_INFO = 'seek_info',
  PROVIDE_INFO = 'provide_info',
  REQUEST_ACTION = 'request_action',
  CONFIRM_UNDERSTANDING = 'confirm_understanding',
  EXPLORE_TOPIC = 'explore_topic',
  SOLVE_PROBLEM = 'solve_problem',
  CREATIVE_TASK = 'creative_task',
  CASUAL_CHAT = 'casual_chat'
}

export interface ConversationContext {
  messages: EnhancedMessage[];
  mainTopics: TopicCluster[];
  conversationFlow: ConversationFlow;
  currentFocus: string[];
  userPersonality: UserPersonality;
  sessionMetrics: SessionMetrics;
}

export interface TopicCluster {
  id: string;
  name: string;
  keywords: string[];
  messages: string[]; // Message IDs
  importance: number;
  lastMentioned: Date;
  coherenceScore: number;
}

export interface ConversationFlow {
  phases: ConversationPhase[];
  currentPhase: ConversationPhase;
  transitions: number;
  continuity: number; // 0-1 score
}

export interface ConversationPhase {
  id: string;
  type: PhaseType;
  startTurn: number;
  endTurn?: number;
  mainTopic: string;
  subTopics: string[];
  resolution: ResolutionStatus;
}

export enum PhaseType {
  OPENING = 'opening',
  INFORMATION_GATHERING = 'information_gathering', 
  PROBLEM_SOLVING = 'problem_solving',
  EXPLANATION = 'explanation',
  CREATIVE_EXPLORATION = 'creative_exploration',
  DEBUGGING = 'debugging',
  WRAP_UP = 'wrap_up'
}

export enum ResolutionStatus {
  UNRESOLVED = 'unresolved',
  IN_PROGRESS = 'in_progress', 
  RESOLVED = 'resolved',
  ABANDONED = 'abandoned'
}

export interface UserPersonality {
  communicationStyle: CommunicationStyle;
  technicalLevel: TechnicalLevel;
  preferredDetail: DetailLevel;
  learningStyle: LearningStyle;
  domainExpertise: string[];
}

export enum CommunicationStyle {
  DIRECT = 'direct',
  CONVERSATIONAL = 'conversational',
  TECHNICAL = 'technical',
  CASUAL = 'casual',
  FORMAL = 'formal'
}

export enum TechnicalLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate', 
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum DetailLevel {
  BRIEF = 'brief',
  MODERATE = 'moderate',
  COMPREHENSIVE = 'comprehensive',
  EXHAUSTIVE = 'exhaustive'
}

export enum LearningStyle {
  VISUAL = 'visual',
  PRACTICAL = 'practical',
  THEORETICAL = 'theoretical',
  EXAMPLE_BASED = 'example_based'
}

export interface SessionMetrics {
  totalMessages: number;
  averageResponseTime: number;
  topicSwitches: number;
  questionRatio: number;
  codeBlocksShared: number;
  complexityTrend: number[];
  engagementLevel: number;
}

export class AdvancedContextEngine {
  private conversationHistory: Map<string, ConversationContext> = new Map();
  private config: ContextEngineConfig;

  constructor(config: Partial<ContextEngineConfig> = {}) {
    this.config = {
      maxContextTokens: 8000,
      optimalContextTokens: 6000,
      importanceThreshold: 0.3,
      recencyWeight: 0.4,
      relevanceWeight: 0.4,
      importanceWeight: 0.2,
      topicCoherenceThreshold: 0.6,
      maxTopicClusters: 5,
      phaseTransitionThreshold: 3,
      personalityAdaptationRate: 0.1,
      ...config
    };
  }

  /**
   * Main method to get optimized context for current query
   */
  async getOptimizedContext(
    conversationId: string,
    messages: ChatMessage[],
    currentQuery: string,
    userPreferences?: Partial<UserPersonality>
  ): Promise<ChatMessage[]> {
    try {
      // Get or create conversation context
      const context = await this.getOrCreateContext(conversationId, messages, userPreferences);
      
      // Analyze current query
      const queryAnalysis = this.analyzeQuery(currentQuery);
      
      // Apply intelligent context selection
      const selectedMessages = await this.selectOptimalContext(context, queryAnalysis, currentQuery);
      
      // Apply context optimization
      return this.optimizeContextWindow(selectedMessages, queryAnalysis);
      
    } catch (error) {
      console.error('Context engine error:', error);
      // Fallback to recent messages
      return messages.slice(-20);
    }
  }

  /**
   * Enhance raw messages with intelligent categorization
   */
  private enhanceMessages(messages: ChatMessage[]): EnhancedMessage[] {
    return messages.map((message, index) => ({
      ...message,
      category: this.categorizeMessage(message),
      importance: this.calculateImportance(message, index, messages),
      topicTags: this.extractTopicTags(message),
      contextRelevance: 1.0, // Will be calculated dynamically
      conversationTurn: index + 1,
      emotionalTone: this.detectEmotionalTone(message),
      intentType: this.detectIntent(message),
      references: this.findMessageReferences(message, messages)
    }));
  }

  /**
   * Intelligent message categorization
   */
  private categorizeMessage(message: ChatMessage): MessageCategory {
    const content = message.content.toLowerCase();
    
    // Code-related patterns
    if (content.includes('```') || content.includes('code') || 
        content.includes('function') || content.includes('error')) {
      return MessageCategory.CODE_RELATED;
    }
    
    // Question patterns
    if (content.includes('?') || content.startsWith('what') || 
        content.startsWith('how') || content.startsWith('why') ||
        content.startsWith('when') || content.startsWith('where')) {
      return MessageCategory.QUESTION;
    }
    
    // Meta-conversation patterns (about the conversation itself)
    if (content.includes('my message') || content.includes('conversation') ||
        content.includes('what did i') || content.includes('previous')) {
      return MessageCategory.META_CONVERSATION;
    }
    
    // Instruction patterns
    if (content.includes('please') || content.startsWith('can you') ||
        content.includes('help me') || content.includes('show me')) {
      return MessageCategory.INSTRUCTION;
    }
    
    // Follow-up patterns
    if (content.startsWith('and') || content.startsWith('also') ||
        content.includes('additionally') || content.includes('furthermore')) {
      return MessageCategory.FOLLOW_UP;
    }
    
    // Creative patterns
    if (content.includes('create') || content.includes('design') ||
        content.includes('imagine') || content.includes('creative')) {
      return MessageCategory.CREATIVE;
    }
    
    // Default for assistant messages
    if (message.role === 'assistant') {
      return MessageCategory.ANSWER;
    }
    
    return MessageCategory.ANALYTICAL;
  }

  /**
   * Calculate message importance score (0-1)
   */
  private calculateImportance(message: ChatMessage, index: number, allMessages: ChatMessage[]): number {
    let score = 0.5; // Base score
    
    const content = message.content.toLowerCase();
    const wordCount = content.split(' ').length;
    
    // Length factor - longer messages often more important
    score += Math.min(wordCount / 100, 0.3);
    
    // Question bonus - questions drive conversation
    if (content.includes('?')) {
      score += 0.2;
    }
    
    // Code blocks - often important
    if (content.includes('```')) {
      score += 0.3;
    }
    
    // Error/problem keywords
    if (content.includes('error') || content.includes('issue') || 
        content.includes('problem') || content.includes('bug')) {
      score += 0.2;
    }
    
    // Solution keywords
    if (content.includes('solution') || content.includes('fix') ||
        content.includes('resolve') || content.includes('answer')) {
      score += 0.2;
    }
    
    // Recency bonus - recent messages more important
    const recencyFactor = (allMessages.length - index) / allMessages.length;
    score += recencyFactor * 0.2;
    
    return Math.min(score, 1.0);
  }

  /**
   * Extract topic tags from message content
   */
  private extractTopicTags(message: ChatMessage): string[] {
    const content = message.content.toLowerCase();
    const tags: string[] = [];
    
    // Technical keywords
    const techKeywords = ['api', 'database', 'frontend', 'backend', 'react', 'typescript', 
                         'javascript', 'python', 'ai', 'machine learning', 'authentication',
                         'deployment', 'docker', 'aws', 'git', 'testing', 'debugging'];
    
    techKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    // Extract entities (simple approach)
    const words = content.split(/\s+/);
    words.forEach(word => {
      // Capitalize words that might be proper nouns/entities
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        tags.push(word.toLowerCase());
      }
    });
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Detect emotional tone of message
   */
  private detectEmotionalTone(message: ChatMessage): EmotionalTone {
    const content = message.content.toLowerCase();
    
    // Enthusiasm indicators
    if (content.includes('!') || content.includes('great') || 
        content.includes('awesome') || content.includes('amazing')) {
      return EmotionalTone.ENTHUSIASTIC;
    }
    
    // Frustration indicators  
    if (content.includes('stuck') || content.includes('frustrated') ||
        content.includes("can't") || content.includes('not working')) {
      return EmotionalTone.FRUSTRATED;
    }
    
    // Curiosity indicators
    if (content.includes('interesting') || content.includes('curious') ||
        content.includes('wonder') || content.includes('explore')) {
      return EmotionalTone.CURIOUS;
    }
    
    // Uncertainty indicators
    if (content.includes('maybe') || content.includes('not sure') ||
        content.includes('think') || content.includes('uncertain')) {
      return EmotionalTone.UNCERTAIN;
    }
    
    return EmotionalTone.NEUTRAL;
  }

  /**
   * Detect user intent type
   */
  private detectIntent(message: ChatMessage): IntentType {
    const content = message.content.toLowerCase();
    
    if (message.role === 'assistant') {
      return IntentType.PROVIDE_INFO;
    }
    
    // Information seeking
    if (content.includes('what') || content.includes('how') || 
        content.includes('explain') || content.includes('tell me')) {
      return IntentType.SEEK_INFO;
    }
    
    // Action requests
    if (content.includes('help') || content.includes('fix') ||
        content.includes('create') || content.includes('build')) {
      return IntentType.REQUEST_ACTION;
    }
    
    // Problem solving
    if (content.includes('error') || content.includes('issue') ||
        content.includes('problem') || content.includes('debug')) {
      return IntentType.SOLVE_PROBLEM;
    }
    
    // Creative tasks
    if (content.includes('design') || content.includes('creative') ||
        content.includes('imagine') || content.includes('brainstorm')) {
      return IntentType.CREATIVE_TASK;
    }
    
    return IntentType.CASUAL_CHAT;
  }

  /**
   * Find references to other messages
   */
  private findMessageReferences(message: ChatMessage, allMessages: ChatMessage[]): string[] {
    const content = message.content.toLowerCase();
    const references: string[] = [];
    
    // Simple reference detection
    if (content.includes('previous') || content.includes('earlier') ||
        content.includes('above') || content.includes('that')) {
      // Find recent messages that might be referenced
      const recentMessages = allMessages.slice(-5);
      references.push(...recentMessages.map(m => m.id));
    }
    
    return references;
  }

  /**
   * Analyze the current query to understand context needs
   */
  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    return {
      intent: this.detectIntent({ id: 'temp', role: 'user', content: query, timestamp: new Date() } as ChatMessage),
      category: this.categorizeMessage({ id: 'temp', role: 'user', content: query, timestamp: new Date() } as ChatMessage),
      complexity: this.estimateComplexity(query),
      topicKeywords: this.extractTopicTags({ id: 'temp', role: 'user', content: query, timestamp: new Date() } as ChatMessage),
      requiresHistory: this.requiresConversationHistory(query),
      timeScope: this.detectTimeScope(query),
      specificity: this.calculateSpecificity(query)
    };
  }

  /**
   * Estimate query complexity (0-1)
   */
  private estimateComplexity(query: string): number {
    let complexity = 0.3; // Base complexity
    
    const wordCount = query.split(' ').length;
    complexity += Math.min(wordCount / 50, 0.3);
    
    // Technical terms increase complexity
    const technicalTerms = ['implementation', 'architecture', 'optimization', 'algorithm'];
    technicalTerms.forEach(term => {
      if (query.toLowerCase().includes(term)) {
        complexity += 0.1;
      }
    });
    
    // Multiple questions increase complexity
    const questionCount = (query.match(/\?/g) || []).length;
    complexity += questionCount * 0.1;
    
    return Math.min(complexity, 1.0);
  }

  /**
   * Check if query requires conversation history
   */
  private requiresConversationHistory(query: string): boolean {
    const historyIndicators = [
      'previous', 'earlier', 'before', 'last', 'first', 'what did',
      'conversation', 'discussed', 'mentioned', 'talked about'
    ];
    
    return historyIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    );
  }

  /**
   * Detect time scope of query (recent, session, all)
   */
  private detectTimeScope(query: string): TimeScope {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('just') || lowerQuery.includes('recent') ||
        lowerQuery.includes('latest') || lowerQuery.includes('current')) {
      return TimeScope.RECENT;
    }
    
    if (lowerQuery.includes('session') || lowerQuery.includes('today') ||
        lowerQuery.includes('conversation')) {
      return TimeScope.SESSION;
    }
    
    return TimeScope.CONTEXTUAL;
  }

  /**
   * Calculate query specificity (0-1)
   */
  private calculateSpecificity(query: string): number {
    let specificity = 0.5;
    
    // Specific technical terms
    if (/\b\w+\(\)/g.test(query)) { // Function calls
      specificity += 0.3;
    }
    
    // Specific numbers or versions
    if (/\d+\.?\d*/.test(query)) {
      specificity += 0.2;
    }
    
    // Proper nouns (capitalized words)
    const words = query.split(' ');
    const properNouns = words.filter(word => /^[A-Z]/.test(word)).length;
    specificity += (properNouns / words.length) * 0.3;
    
    return Math.min(specificity, 1.0);
  }

  /**
   * Get or create conversation context
   */
  private async getOrCreateContext(
    conversationId: string, 
    messages: ChatMessage[],
    userPreferences?: Partial<UserPersonality>
  ): Promise<ConversationContext> {
    let context = this.conversationHistory.get(conversationId);
    
    if (!context) {
      context = this.createNewContext(messages, userPreferences);
      this.conversationHistory.set(conversationId, context);
    } else {
      // Update context with new messages
      context = await this.updateContext(context, messages);
    }
    
    return context;
  }

  /**
   * Create new conversation context
   */
  private createNewContext(
    messages: ChatMessage[],
    userPreferences?: Partial<UserPersonality>
  ): ConversationContext {
    const enhancedMessages = this.enhanceMessages(messages);
    
    return {
      messages: enhancedMessages,
      mainTopics: this.extractTopicClusters(enhancedMessages),
      conversationFlow: this.analyzeConversationFlow(enhancedMessages),
      currentFocus: this.identifyCurrentFocus(enhancedMessages),
      userPersonality: this.deriveUserPersonality(enhancedMessages, userPreferences),
      sessionMetrics: this.calculateSessionMetrics(enhancedMessages)
    };
  }

  /**
   * Extract topic clusters from conversation
   */
  private extractTopicClusters(messages: EnhancedMessage[]): TopicCluster[] {
    const topicMap = new Map<string, string[]>();
    
    // Group messages by topic tags
    messages.forEach(message => {
      message.topicTags.forEach(tag => {
        if (!topicMap.has(tag)) {
          topicMap.set(tag, []);
        }
        topicMap.get(tag)!.push(message.id);
      });
    });
    
    // Convert to topic clusters
    const clusters: TopicCluster[] = Array.from(topicMap.entries()).map(([topic, messageIds]) => ({
      id: `topic-${topic}`,
      name: topic,
      keywords: [topic],
      messages: messageIds,
      importance: messageIds.length / messages.length, // Simple importance based on frequency
      lastMentioned: new Date(),
      coherenceScore: 0.8 // Simplified for now
    }));
    
    // Sort by importance and take top clusters
    return clusters
      .sort((a, b) => b.importance - a.importance)
      .slice(0, this.config.maxTopicClusters);
  }

  /**
   * Analyze conversation flow and phases
   */
  private analyzeConversationFlow(messages: EnhancedMessage[]): ConversationFlow {
    const phases: ConversationPhase[] = [];
    let currentPhase: ConversationPhase | null = null;
    
    messages.forEach((message, index) => {
      const phaseType = this.determinePhaseType(message, messages, index);
      
      if (!currentPhase || currentPhase.type !== phaseType) {
        // End current phase
        if (currentPhase) {
          currentPhase.endTurn = index - 1;
          phases.push(currentPhase);
        }
        
        // Start new phase
        currentPhase = {
          id: `phase-${phases.length}`,
          type: phaseType,
          startTurn: index,
          mainTopic: message.topicTags[0] || 'general',
          subTopics: message.topicTags,
          resolution: ResolutionStatus.IN_PROGRESS
        };
      }
    });
    
    // Add final phase
    if (currentPhase) {
      phases.push(currentPhase);
    }
    
    return {
      phases,
      currentPhase: phases[phases.length - 1] || phases[0],
      transitions: phases.length - 1,
      continuity: this.calculateContinuity(phases)
    };
  }

  /**
   * Determine conversation phase type for a message
   */
  private determinePhaseType(message: EnhancedMessage, allMessages: EnhancedMessage[], index: number): PhaseType {
    // Opening phase - first few messages
    if (index < 2) {
      return PhaseType.OPENING;
    }
    
    // Code/debugging related
    if (message.category === MessageCategory.CODE_RELATED) {
      return PhaseType.DEBUGGING;
    }
    
    // Creative tasks
    if (message.category === MessageCategory.CREATIVE) {
      return PhaseType.CREATIVE_EXPLORATION;
    }
    
    // Information seeking
    if (message.category === MessageCategory.QUESTION) {
      return PhaseType.INFORMATION_GATHERING;
    }
    
    // Problem solving
    if (message.intentType === IntentType.SOLVE_PROBLEM) {
      return PhaseType.PROBLEM_SOLVING;
    }
    
    // Explanations
    if (message.intentType === IntentType.PROVIDE_INFO && message.role === 'assistant') {
      return PhaseType.EXPLANATION;
    }
    
    return PhaseType.INFORMATION_GATHERING;
  }

  /**
   * Calculate conversation continuity score
   */
  private calculateContinuity(phases: ConversationPhase[]): number {
    if (phases.length <= 1) return 1.0;
    
    let continuityScore = 0;
    
    for (let i = 1; i < phases.length; i++) {
      const prevPhase = phases[i - 1];
      const currentPhase = phases[i];
      
      // Topic overlap
      const topicOverlap = currentPhase.subTopics.filter(topic => 
        prevPhase.subTopics.includes(topic)
      ).length;
      
      const maxTopics = Math.max(prevPhase.subTopics.length, currentPhase.subTopics.length);
      const topicContinuity = maxTopics > 0 ? topicOverlap / maxTopics : 0;
      
      continuityScore += topicContinuity;
    }
    
    return continuityScore / (phases.length - 1);
  }

  /**
   * Identify current conversation focus
   */
  private identifyCurrentFocus(messages: EnhancedMessage[]): string[] {
    const recentMessages = messages.slice(-5);
    const focusTopics = new Map<string, number>();
    
    recentMessages.forEach(message => {
      message.topicTags.forEach(tag => {
        focusTopics.set(tag, (focusTopics.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(focusTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  /**
   * Derive user personality from conversation patterns
   */
  private deriveUserPersonality(messages: EnhancedMessage[], preferences?: Partial<UserPersonality>): UserPersonality {
    const userMessages = messages.filter(m => m.role === 'user');
    
    // Communication style analysis
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const questionRatio = userMessages.filter(m => m.content.includes('?')).length / userMessages.length;
    
    let communicationStyle = CommunicationStyle.CONVERSATIONAL;
    if (avgLength < 50) communicationStyle = CommunicationStyle.DIRECT;
    if (avgLength > 200) communicationStyle = CommunicationStyle.FORMAL;
    
    // Technical level analysis
    const techTerms = userMessages.reduce((count, m) => {
      const techWords = ['api', 'function', 'variable', 'database', 'algorithm'];
      return count + techWords.filter(word => m.content.toLowerCase().includes(word)).length;
    }, 0);
    
    let technicalLevel = TechnicalLevel.BEGINNER;
    if (techTerms > 5) technicalLevel = TechnicalLevel.INTERMEDIATE;
    if (techTerms > 15) technicalLevel = TechnicalLevel.ADVANCED;
    
    return {
      communicationStyle,
      technicalLevel,
      preferredDetail: DetailLevel.MODERATE,
      learningStyle: LearningStyle.PRACTICAL,
      domainExpertise: [],
      ...preferences
    };
  }

  /**
   * Calculate session metrics
   */
  private calculateSessionMetrics(messages: EnhancedMessage[]): SessionMetrics {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    return {
      totalMessages: messages.length,
      averageResponseTime: 0, // Would need timestamps to calculate
      topicSwitches: this.countTopicSwitches(messages),
      questionRatio: userMessages.filter(m => m.content.includes('?')).length / userMessages.length,
      codeBlocksShared: messages.filter(m => m.content.includes('```')).length,
      complexityTrend: [], // Would track over time
      engagementLevel: this.calculateEngagement(messages)
    };
  }

  /**
   * Count topic switches in conversation
   */
  private countTopicSwitches(messages: EnhancedMessage[]): number {
    let switches = 0;
    let currentTopic = '';
    
    messages.forEach(message => {
      const primaryTopic = message.topicTags[0] || '';
      if (currentTopic && primaryTopic !== currentTopic) {
        switches++;
      }
      currentTopic = primaryTopic;
    });
    
    return switches;
  }

  /**
   * Calculate overall engagement level
   */
  private calculateEngagement(messages: EnhancedMessage[]): number {
    let engagement = 0.5; // Base engagement
    
    const avgImportance = messages.reduce((sum, m) => sum + m.importance, 0) / messages.length;
    engagement += avgImportance * 0.3;
    
    const questionRatio = messages.filter(m => m.content.includes('?')).length / messages.length;
    engagement += questionRatio * 0.2;
    
    return Math.min(engagement, 1.0);
  }

  /**
   * Update existing context with new messages
   */
  private async updateContext(context: ConversationContext, newMessages: ChatMessage[]): Promise<ConversationContext> {
    // Find new messages not already in context
    const existingIds = new Set(context.messages.map(m => m.id));
    const freshMessages = newMessages.filter(m => !existingIds.has(m.id));
    
    if (freshMessages.length === 0) {
      return context;
    }
    
    // Enhance new messages
    const enhancedNew = this.enhanceMessages(freshMessages);
    
    // Update context
    const updatedMessages = [...context.messages, ...enhancedNew];
    
    return {
      ...context,
      messages: updatedMessages,
      mainTopics: this.extractTopicClusters(updatedMessages),
      conversationFlow: this.analyzeConversationFlow(updatedMessages),
      currentFocus: this.identifyCurrentFocus(updatedMessages),
      sessionMetrics: this.calculateSessionMetrics(updatedMessages)
    };
  }

  /**
   * Select optimal context messages for current query
   */
  private async selectOptimalContext(
    context: ConversationContext, 
    queryAnalysis: QueryAnalysis,
    currentQuery: string
  ): Promise<EnhancedMessage[]> {
    const { messages } = context;
    const selectedMessages: EnhancedMessage[] = [];
    
    // Always include recent messages for continuity
    const recentMessages = messages.slice(-5);
    selectedMessages.push(...recentMessages);
    
    // If query requires history, add relevant historical context
    if (queryAnalysis.requiresHistory) {
      const historicalMessages = await this.selectHistoricalContext(messages, queryAnalysis, currentQuery);
      selectedMessages.push(...historicalMessages);
    }
    
    // Add topic-relevant messages
    const topicRelevantMessages = this.selectTopicRelevantMessages(context, queryAnalysis);
    selectedMessages.push(...topicRelevantMessages);
    
    // Remove duplicates and sort by relevance
    const uniqueMessages = this.deduplicateMessages(selectedMessages);
    return this.rankAndFilterByRelevance(uniqueMessages, queryAnalysis);
  }

  /**
   * Select historical context based on query analysis
   */
  private async selectHistoricalContext(
    messages: EnhancedMessage[],
    queryAnalysis: QueryAnalysis,
    currentQuery: string
  ): Promise<EnhancedMessage[]> {
    const historical: EnhancedMessage[] = [];
    
    // Find messages that match query keywords
    const queryKeywords = currentQuery.toLowerCase().split(' ').filter(word => word.length > 2);
    
    messages.forEach(message => {
      const content = message.content.toLowerCase();
      const matchScore = queryKeywords.filter(keyword => content.includes(keyword)).length;
      
      if (matchScore > 0) {
        message.contextRelevance = matchScore / queryKeywords.length;
        historical.push(message);
      }
    });
    
    // Sort by relevance and importance
    return historical
      .sort((a, b) => (b.contextRelevance * b.importance) - (a.contextRelevance * a.importance))
      .slice(0, 10);
  }

  /**
   * Select messages relevant to current topic focus
   */
  private selectTopicRelevantMessages(
    context: ConversationContext,
    queryAnalysis: QueryAnalysis
  ): EnhancedMessage[] {
    const relevant: EnhancedMessage[] = [];
    
    // Find messages related to current focus topics
    context.currentFocus.forEach(topic => {
      const topicMessages = context.messages.filter(message =>
        message.topicTags.includes(topic) && message.importance > this.config.importanceThreshold
      );
      relevant.push(...topicMessages);
    });
    
    // Find messages related to query topic keywords  
    queryAnalysis.topicKeywords.forEach(keyword => {
      const keywordMessages = context.messages.filter(message =>
        message.topicTags.includes(keyword)
      );
      relevant.push(...keywordMessages);
    });
    
    return relevant;
  }

  /**
   * Remove duplicate messages from selection
   */
  private deduplicateMessages(messages: EnhancedMessage[]): EnhancedMessage[] {
    const seen = new Set<string>();
    return messages.filter(message => {
      if (seen.has(message.id)) {
        return false;
      }
      seen.add(message.id);
      return true;
    });
  }

  /**
   * Rank messages by relevance and filter to fit token budget
   */
  private rankAndFilterByRelevance(
    messages: EnhancedMessage[],
    queryAnalysis: QueryAnalysis
  ): EnhancedMessage[] {
    // Calculate final relevance score for each message
    messages.forEach(message => {
      const recencyScore = (message.conversationTurn / messages.length) * this.config.recencyWeight;
      const importanceScore = message.importance * this.config.importanceWeight;
      const relevanceScore = message.contextRelevance * this.config.relevanceWeight;
      
      message.contextRelevance = recencyScore + importanceScore + relevanceScore;
    });
    
    // Sort by final relevance score
    const sorted = messages.sort((a, b) => b.contextRelevance - a.contextRelevance);
    
    // Filter to fit token budget
    let totalTokens = 0;
    const selected: EnhancedMessage[] = [];
    
    for (const message of sorted) {
      const messageTokens = Math.ceil(message.content.length / 4); // Rough token estimate
      
      if (totalTokens + messageTokens <= this.config.maxContextTokens) {
        selected.push(message);
        totalTokens += messageTokens;
      } else {
        break;
      }
    }
    
    // Ensure chronological order for final context
    return selected.sort((a, b) => a.conversationTurn - b.conversationTurn);
  }

  /**
   * Final optimization of context window
   */
  private optimizeContextWindow(
    messages: EnhancedMessage[],
    queryAnalysis: QueryAnalysis
  ): ChatMessage[] {
    // Convert back to ChatMessage format
    const optimized = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      model: msg.model,
      usage: msg.usage,
      timestamp: msg.timestamp
    }));
    
    // Ensure we have the most recent message for continuity
    if (optimized.length > 0) {
      const mostRecent = messages[messages.length - 1];
      if (!optimized.find(m => m.id === mostRecent.id)) {
        optimized.push({
          id: mostRecent.id,
          role: mostRecent.role,
          content: mostRecent.content,
          model: mostRecent.model,
          usage: mostRecent.usage,
          timestamp: mostRecent.timestamp
        });
      }
    }
    
    return optimized;
  }
}

// Supporting interfaces
export interface ContextEngineConfig {
  maxContextTokens: number;
  optimalContextTokens: number;
  importanceThreshold: number;
  recencyWeight: number;
  relevanceWeight: number;
  importanceWeight: number;
  topicCoherenceThreshold: number;
  maxTopicClusters: number;
  phaseTransitionThreshold: number;
  personalityAdaptationRate: number;
}

export interface QueryAnalysis {
  intent: IntentType;
  category: MessageCategory;
  complexity: number;
  topicKeywords: string[];
  requiresHistory: boolean;
  timeScope: TimeScope;
  specificity: number;
}

export enum TimeScope {
  RECENT = 'recent',
  SESSION = 'session',
  CONTEXTUAL = 'contextual'
}
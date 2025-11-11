'use client';

/**
 * Conversation Flow Manager - Advanced Conversation Continuity
 * 
 * Features:
 * - Topic transition tracking
 * - Context preservation across topic shifts
 * - Conversation branching and merging
 * - Intelligent conversation summarization
 * - Multi-turn conversation optimization
 * - Conversation health monitoring
 */

import { ChatMessage } from '@/contexts/ChatContext';
import { EnhancedMessage, ConversationState } from '@/lib/context/AdvancedContextEngine';

export interface ConversationTurn {
  id: string;
  turnNumber: number;
  userMessage: ChatMessage;
  assistantMessage?: ChatMessage;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  complexity: number; // 0-1 scale
  satisfactionScore: number; // 0-1 scale inferred from follow-ups
  timestamp: Date;
}

export interface ConversationBranch {
  id: string;
  parentTurnId: string;
  alternativeResponse: ChatMessage;
  branchReason: string;
  branchTimestamp: Date;
  isActive: boolean;
}

export interface TopicTransition {
  fromTopic: string;
  toTopic: string;
  transitionType: 'smooth' | 'abrupt' | 'related' | 'complete_shift';
  bridgeContent?: string;
  turnNumber: number;
  timestamp: Date;
}

export interface ConversationHealth {
  continuityScore: number; // 0-1
  topicCoherence: number; // 0-1
  responseQuality: number; // 0-1
  userSatisfaction: number; // 0-1
  contextUtilization: number; // 0-1
  issues: ConversationIssue[];
  lastAssessed: Date;
}

export interface ConversationIssue {
  type: 'context_loss' | 'topic_jump' | 'repetition' | 'confusion' | 'low_quality';
  severity: 'low' | 'medium' | 'high';
  description: string;
  turnNumber: number;
  suggestedFix: string;
  timestamp: Date;
}

export interface ConversationSummary {
  id: string;
  conversationId: string;
  type: 'periodic' | 'topic_change' | 'session_end';
  content: string;
  keyPoints: string[];
  decisions: string[];
  unresolved: string[];
  nextSteps: string[];
  confidence: number;
  turnRange: { start: number; end: number };
  createdAt: Date;
}

export interface FlowOptimization {
  contextWindowOptimization: {
    optimalSize: number;
    priorityMessages: string[];
    compressionRate: number;
  };
  topicTracking: {
    activeTopic: string;
    relatedTopics: string[];
    topicConfidence: number;
  };
  responseStrategy: {
    preferredStyle: string;
    complexityLevel: string;
    responseLength: 'brief' | 'moderate' | 'detailed';
  };
}

export class ConversationFlowManager {
  private conversationTurns: Map<string, ConversationTurn[]> = new Map();
  private conversationBranches: Map<string, ConversationBranch[]> = new Map();
  private topicTransitions: Map<string, TopicTransition[]> = new Map();
  private conversationSummaries: Map<string, ConversationSummary[]> = new Map();
  private conversationHealth: Map<string, ConversationHealth> = new Map();
  
  constructor(private config: {
    maxTurnsInMemory?: number;
    summaryInterval?: number; // turns
    healthCheckInterval?: number; // turns
    topicTransitionThreshold?: number;
    contextOptimizationEnabled?: boolean;
  } = {}) {
    this.config = {
      maxTurnsInMemory: 100,
      summaryInterval: 15,
      healthCheckInterval: 5,
      topicTransitionThreshold: 0.3,
      contextOptimizationEnabled: true,
      ...config
    };
  }

  /**
   * Process a new conversation turn
   */
  async processConversationTurn(
    conversationId: string,
    userMessage: ChatMessage,
    assistantMessage?: ChatMessage,
    additionalContext?: {
      topics?: string[];
      sentiment?: string;
      complexity?: number;
      externalFactsUsed?: boolean;
    }
  ): Promise<{
    turn: ConversationTurn;
    topicTransition?: TopicTransition;
    flowOptimization: FlowOptimization;
    healthUpdate: ConversationHealth;
    summaryGenerated?: ConversationSummary;
  }> {
    const turns = this.conversationTurns.get(conversationId) || [];
    const turnNumber = turns.length + 1;

    // Create conversation turn
    const turn: ConversationTurn = {
      id: `turn-${conversationId}-${turnNumber}`,
      turnNumber,
      userMessage,
      assistantMessage,
      topics: additionalContext?.topics || await this.extractTopics(userMessage.content),
      sentiment: (additionalContext?.sentiment as any) || await this.analyzeSentiment(userMessage.content),
      complexity: additionalContext?.complexity || await this.analyzeComplexity(userMessage.content),
      satisfactionScore: 0.5, // Will be updated based on follow-up interactions
      timestamp: new Date()
    };

    // Detect topic transition
    let topicTransition: TopicTransition | undefined;
    if (turns.length > 0) {
      const lastTurn = turns[turns.length - 1];
      topicTransition = await this.detectTopicTransition(lastTurn, turn);
      
      if (topicTransition) {
        const transitions = this.topicTransitions.get(conversationId) || [];
        transitions.push(topicTransition);
        this.topicTransitions.set(conversationId, transitions);
      }
    }

    // Add turn to conversation
    turns.push(turn);
    this.conversationTurns.set(conversationId, turns);

    // Generate flow optimization
    const flowOptimization = await this.generateFlowOptimization(conversationId, turn);

    // Update conversation health
    const healthUpdate = await this.updateConversationHealth(conversationId, turn);

    // Generate summary if needed
    let summaryGenerated: ConversationSummary | undefined;
    if (turnNumber % (this.config.summaryInterval || 15) === 0) {
      summaryGenerated = await this.generateConversationSummary(conversationId, 'periodic');
    }

    // Clean up old data if needed
    await this.cleanupOldData(conversationId);

    return {
      turn,
      topicTransition,
      flowOptimization,
      healthUpdate,
      summaryGenerated
    };
  }

  /**
   * Get optimized conversation context for current turn
   */
  async getOptimizedContext(
    conversationId: string,
    currentQuery: string,
    options: {
      maxTokens?: number;
      includeTopicBridges?: boolean;
      prioritizeRecentTurns?: boolean;
      includeRelatedTopics?: boolean;
    } = {}
  ): Promise<{
    optimizedMessages: ChatMessage[];
    contextStrategy: string;
    includedTurns: number;
    compressionApplied: boolean;
    topicBridges: string[];
  }> {
    const turns = this.conversationTurns.get(conversationId) || [];
    const maxTokens = options.maxTokens || 8000;
    
    if (turns.length === 0) {
      return {
        optimizedMessages: [],
        contextStrategy: 'empty_conversation',
        includedTurns: 0,
        compressionApplied: false,
        topicBridges: []
      };
    }

    // Analyze current query for context needs
    const queryAnalysis = await this.analyzeQueryContext(currentQuery, turns);
    
    // Select relevant turns based on analysis
    const relevantTurns = await this.selectRelevantTurns(
      turns,
      queryAnalysis,
      options
    );

    // Create optimized message sequence
    const optimizedMessages = await this.createOptimizedMessageSequence(
      relevantTurns,
      maxTokens,
      options
    );

    // Generate topic bridges if needed
    const topicBridges = options.includeTopicBridges 
      ? await this.generateTopicBridges(conversationId, relevantTurns)
      : [];

    return {
      optimizedMessages,
      contextStrategy: queryAnalysis.strategy,
      includedTurns: relevantTurns.length,
      compressionApplied: optimizedMessages.length < relevantTurns.length * 2,
      topicBridges
    };
  }

  /**
   * Handle conversation branching for alternative responses
   */
  async createConversationBranch(
    conversationId: string,
    turnId: string,
    alternativeResponse: ChatMessage,
    reason: string
  ): Promise<ConversationBranch> {
    const branch: ConversationBranch = {
      id: `branch-${Date.now()}`,
      parentTurnId: turnId,
      alternativeResponse,
      branchReason: reason,
      branchTimestamp: new Date(),
      isActive: false
    };

    const branches = this.conversationBranches.get(conversationId) || [];
    branches.push(branch);
    this.conversationBranches.set(conversationId, branches);

    return branch;
  }

  /**
   * Detect and analyze topic transitions
   */
  private async detectTopicTransition(
    previousTurn: ConversationTurn,
    currentTurn: ConversationTurn
  ): Promise<TopicTransition | undefined> {
    const prevTopics = new Set(previousTurn.topics);
    const currentTopics = new Set(currentTurn.topics);
    
    // Calculate topic overlap
    const intersection = new Set([...prevTopics].filter(x => currentTopics.has(x)));
    const union = new Set([...prevTopics, ...currentTopics]);
    const overlapRatio = intersection.size / union.size;

    if (overlapRatio < (this.config.topicTransitionThreshold || 0.3)) {
      // Significant topic transition detected
      let transitionType: TopicTransition['transitionType'] = 'abrupt';
      
      if (overlapRatio > 0.1) {
        transitionType = 'related';
      } else if (this.areTopicsRelated(previousTurn.topics, currentTurn.topics)) {
        transitionType = 'smooth';
      } else {
        transitionType = 'complete_shift';
      }

      return {
        fromTopic: previousTurn.topics[0] || 'unknown',
        toTopic: currentTurn.topics[0] || 'unknown',
        transitionType,
        bridgeContent: transitionType === 'abrupt' ? await this.generateTopicBridge(previousTurn.topics[0], currentTurn.topics[0]) : undefined,
        turnNumber: currentTurn.turnNumber,
        timestamp: new Date()
      };
    }

    return undefined;
  }

  /**
   * Generate conversation flow optimization
   */
  private async generateFlowOptimization(
    conversationId: string,
    currentTurn: ConversationTurn
  ): Promise<FlowOptimization> {
    const turns = this.conversationTurns.get(conversationId) || [];
    const recentTurns = turns.slice(-5); // Last 5 turns

    // Analyze context window optimization
    const contextAnalysis = await this.analyzeContextWindow(recentTurns);
    
    // Analyze topic tracking
    const topicAnalysis = await this.analyzeTopicFlow(turns);
    
    // Determine response strategy
    const responseStrategy = await this.determineResponseStrategy(currentTurn, recentTurns);

    return {
      contextWindowOptimization: {
        optimalSize: contextAnalysis.optimalSize,
        priorityMessages: contextAnalysis.priorityMessages,
        compressionRate: contextAnalysis.compressionRate
      },
      topicTracking: {
        activeTopic: topicAnalysis.activeTopic,
        relatedTopics: topicAnalysis.relatedTopics,
        topicConfidence: topicAnalysis.confidence
      },
      responseStrategy: {
        preferredStyle: responseStrategy.style,
        complexityLevel: responseStrategy.complexity,
        responseLength: responseStrategy.length
      }
    };
  }

  /**
   * Update conversation health metrics
   */
  private async updateConversationHealth(
    conversationId: string,
    currentTurn: ConversationTurn
  ): Promise<ConversationHealth> {
    const turns = this.conversationTurns.get(conversationId) || [];
    const transitions = this.topicTransitions.get(conversationId) || [];
    
    const health: ConversationHealth = {
      continuityScore: this.calculateContinuityScore(turns, transitions),
      topicCoherence: this.calculateTopicCoherence(turns),
      responseQuality: this.calculateResponseQuality(turns),
      userSatisfaction: this.calculateUserSatisfaction(turns),
      contextUtilization: this.calculateContextUtilization(turns),
      issues: await this.detectConversationIssues(turns, transitions),
      lastAssessed: new Date()
    };

    this.conversationHealth.set(conversationId, health);
    return health;
  }

  /**
   * Generate conversation summary
   */
  private async generateConversationSummary(
    conversationId: string,
    type: ConversationSummary['type'],
    turnRange?: { start: number; end: number }
  ): Promise<ConversationSummary> {
    const turns = this.conversationTurns.get(conversationId) || [];
    const rangeTurns = turnRange 
      ? turns.slice(turnRange.start, turnRange.end + 1)
      : turns.slice(-15); // Default: last 15 turns

    const summary: ConversationSummary = {
      id: `summary-${Date.now()}`,
      conversationId,
      type,
      content: await this.generateSummaryContent(rangeTurns),
      keyPoints: await this.extractKeyPoints(rangeTurns),
      decisions: await this.extractDecisions(rangeTurns),
      unresolved: await this.extractUnresolvedItems(rangeTurns),
      nextSteps: await this.suggestNextSteps(rangeTurns),
      confidence: this.calculateSummaryConfidence(rangeTurns),
      turnRange: {
        start: rangeTurns[0]?.turnNumber || 0,
        end: rangeTurns[rangeTurns.length - 1]?.turnNumber || 0
      },
      createdAt: new Date()
    };

    const summaries = this.conversationSummaries.get(conversationId) || [];
    summaries.push(summary);
    this.conversationSummaries.set(conversationId, summaries);

    return summary;
  }

  // Helper methods for analysis
  private async extractTopics(content: string): Promise<string[]> {
    const words = content.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const topicWords = words.slice(0, 5); // Simple topic extraction
    return [...new Set(topicWords)];
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'negative' | 'neutral' | 'mixed'> {
    const positiveWords = ['good', 'great', 'excellent', 'thank', 'appreciate', 'helpful'];
    const negativeWords = ['bad', 'terrible', 'confused', 'frustrated', 'wrong', 'issue'];
    
    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > 0 && negativeCount > 0) return 'mixed';
    return 'neutral';
  }

  private async analyzeComplexity(content: string): Promise<number> {
    const technicalTerms = ['implementation', 'algorithm', 'architecture', 'optimization'];
    const termCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
    const wordCount = content.split(' ').length;
    
    let complexity = 0.3; // Base complexity
    complexity += Math.min(wordCount / 100, 0.3); // Length factor
    complexity += Math.min(termCount * 0.2, 0.4); // Technical terms
    
    return Math.min(complexity, 1.0);
  }

  private areTopicsRelated(topics1: string[], topics2: string[]): boolean {
    // Simple heuristic - check if any words are similar or related
    const related = [
      ['code', 'programming', 'development'],
      ['design', 'ui', 'interface'],
      ['data', 'database', 'storage'],
      ['api', 'service', 'endpoint']
    ];

    for (const group of related) {
      const has1 = topics1.some(t => group.some(g => t.includes(g)));
      const has2 = topics2.some(t => group.some(g => t.includes(g)));
      if (has1 && has2) return true;
    }

    return false;
  }

  private async generateTopicBridge(fromTopic: string, toTopic: string): Promise<string> {
    return `[Continuing from our discussion about ${fromTopic} to explore ${toTopic}]`;
  }

  private async analyzeQueryContext(query: string, turns: ConversationTurn[]): Promise<{
    strategy: string;
    needsHistory: boolean;
    topicRelevance: number;
    recentTurnsWeight: number;
  }> {
    const lowerQuery = query.toLowerCase();
    
    let strategy = 'recent_focus';
    let needsHistory = false;
    
    // Check if query references conversation history
    if (/\b(previous|earlier|before|last|first)\b/.test(lowerQuery)) {
      strategy = 'historical_reference';
      needsHistory = true;
    }
    
    // Check if query continues current topic
    const currentTopics = turns.length > 0 ? turns[turns.length - 1].topics : [];
    const queryTopics = await this.extractTopics(query);
    const topicOverlap = queryTopics.filter(qt => currentTopics.some(ct => ct.includes(qt))).length;
    const topicRelevance = topicOverlap / Math.max(queryTopics.length, 1);
    
    if (topicRelevance > 0.5) {
      strategy = 'topic_continuation';
    }

    return {
      strategy,
      needsHistory,
      topicRelevance,
      recentTurnsWeight: strategy === 'recent_focus' ? 0.8 : 0.4
    };
  }

  private async selectRelevantTurns(
    turns: ConversationTurn[],
    queryAnalysis: any,
    options: any
  ): Promise<ConversationTurn[]> {
    if (queryAnalysis.strategy === 'historical_reference') {
      return turns; // Include full history for historical queries
    }
    
    if (options.prioritizeRecentTurns) {
      return turns.slice(-10); // Last 10 turns
    }

    // Select based on topic relevance
    const relevantTurns = turns.filter(turn => {
      if (turns.indexOf(turn) >= turns.length - 5) return true; // Always include recent
      return turn.complexity > 0.5 || turn.satisfactionScore > 0.7; // Include complex/successful turns
    });

    return relevantTurns.slice(-15); // Limit to 15 turns
  }

  private async createOptimizedMessageSequence(
    turns: ConversationTurn[],
    maxTokens: number,
    options: any
  ): Promise<ChatMessage[]> {
    const messages: ChatMessage[] = [];
    let currentTokens = 0;
    
    // Add turns in chronological order, but compress if needed
    for (const turn of turns.reverse()) {
      const turnMessages = [turn.userMessage];
      if (turn.assistantMessage) {
        turnMessages.push(turn.assistantMessage);
      }
      
      const turnTokens = turnMessages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
      
      if (currentTokens + turnTokens <= maxTokens) {
        messages.unshift(...turnMessages);
        currentTokens += turnTokens;
      } else {
        // Compress or skip this turn
        break;
      }
    }
    
    return messages;
  }

  private async generateTopicBridges(
    conversationId: string,
    relevantTurns: ConversationTurn[]
  ): Promise<string[]> {
    const transitions = this.topicTransitions.get(conversationId) || [];
    const bridges: string[] = [];
    
    transitions
      .filter(t => t.transitionType === 'abrupt' && t.bridgeContent)
      .forEach(t => {
        if (t.bridgeContent) bridges.push(t.bridgeContent);
      });
    
    return bridges;
  }

  // Health calculation methods
  private calculateContinuityScore(turns: ConversationTurn[], transitions: TopicTransition[]): number {
    if (turns.length === 0) return 1.0;
    
    const abruptTransitions = transitions.filter(t => t.transitionType === 'abrupt').length;
    const totalTransitions = transitions.length;
    
    if (totalTransitions === 0) return 1.0;
    return 1.0 - (abruptTransitions / totalTransitions);
  }

  private calculateTopicCoherence(turns: ConversationTurn[]): number {
    if (turns.length < 2) return 1.0;
    
    let coherentTransitions = 0;
    for (let i = 1; i < turns.length; i++) {
      const prevTopics = new Set(turns[i-1].topics);
      const currentTopics = new Set(turns[i].topics);
      const overlap = [...prevTopics].filter(t => currentTopics.has(t)).length;
      
      if (overlap > 0) coherentTransitions++;
    }
    
    return coherentTransitions / (turns.length - 1);
  }

  private calculateResponseQuality(turns: ConversationTurn[]): number {
    if (turns.length === 0) return 1.0;
    
    const avgComplexity = turns.reduce((sum, t) => sum + t.complexity, 0) / turns.length;
    const avgSatisfaction = turns.reduce((sum, t) => sum + t.satisfactionScore, 0) / turns.length;
    
    return (avgComplexity + avgSatisfaction) / 2;
  }

  private calculateUserSatisfaction(turns: ConversationTurn[]): number {
    if (turns.length === 0) return 0.5;
    
    const positiveSentiment = turns.filter(t => t.sentiment === 'positive').length;
    const negativeSentiment = turns.filter(t => t.sentiment === 'negative').length;
    
    return (positiveSentiment - negativeSentiment + turns.length) / (2 * turns.length);
  }

  private calculateContextUtilization(turns: ConversationTurn[]): number {
    // Simplified - in practice would analyze how well context is used
    return turns.length > 0 ? 0.8 : 0.0;
  }

  private async detectConversationIssues(
    turns: ConversationTurn[],
    transitions: TopicTransition[]
  ): Promise<ConversationIssue[]> {
    const issues: ConversationIssue[] = [];
    
    // Detect abrupt topic jumps
    const abruptTransitions = transitions.filter(t => t.transitionType === 'abrupt');
    abruptTransitions.forEach(t => {
      issues.push({
        type: 'topic_jump',
        severity: 'medium',
        description: `Abrupt topic change from ${t.fromTopic} to ${t.toTopic}`,
        turnNumber: t.turnNumber,
        suggestedFix: 'Add transitional context or bridge content',
        timestamp: t.timestamp
      });
    });
    
    // Detect repetitive patterns
    const recentTurns = turns.slice(-5);
    const topicFreq = new Map<string, number>();
    recentTurns.forEach(turn => {
      turn.topics.forEach(topic => {
        topicFreq.set(topic, (topicFreq.get(topic) || 0) + 1);
      });
    });
    
    topicFreq.forEach((count, topic) => {
      if (count >= 4) {
        issues.push({
          type: 'repetition',
          severity: 'low',
          description: `Topic "${topic}" appears repeatedly in recent conversation`,
          turnNumber: turns.length,
          suggestedFix: 'Vary discussion topics or provide closure',
          timestamp: new Date()
        });
      }
    });
    
    return issues;
  }

  // Summary generation methods
  private async generateSummaryContent(turns: ConversationTurn[]): Promise<string> {
    const topics = [...new Set(turns.flatMap(t => t.topics))].slice(0, 3);
    const userMessages = turns.map(t => t.userMessage.content.slice(0, 100)).join('. ');
    
    return `Discussion covered: ${topics.join(', ')}. Key user inputs: ${userMessages}`;
  }

  private async extractKeyPoints(turns: ConversationTurn[]): Promise<string[]> {
    return turns
      .filter(t => t.complexity > 0.5)
      .map(t => t.userMessage.content.slice(0, 100))
      .slice(0, 5);
  }

  private async extractDecisions(turns: ConversationTurn[]): Promise<string[]> {
    return turns
      .filter(t => t.userMessage.content.toLowerCase().includes('decide') || 
                   t.userMessage.content.toLowerCase().includes('choose'))
      .map(t => t.userMessage.content.slice(0, 100))
      .slice(0, 3);
  }

  private async extractUnresolvedItems(turns: ConversationTurn[]): Promise<string[]> {
    return turns
      .filter(t => t.userMessage.content.includes('?') && t.satisfactionScore < 0.6)
      .map(t => t.userMessage.content.slice(0, 100))
      .slice(0, 3);
  }

  private async suggestNextSteps(turns: ConversationTurn[]): Promise<string[]> {
    const lastTurn = turns[turns.length - 1];
    if (!lastTurn) return [];
    
    return [`Follow up on: ${lastTurn.topics[0]}`];
  }

  private calculateSummaryConfidence(turns: ConversationTurn[]): number {
    return Math.min(turns.length / 10, 1.0);
  }

  // Additional helper methods for context window and topic analysis would go here...
  private async analyzeContextWindow(turns: ConversationTurn[]): Promise<any> {
    return {
      optimalSize: Math.min(turns.length * 2, 20),
      priorityMessages: turns.slice(-3).map(t => t.id),
      compressionRate: 0.3
    };
  }

  private async analyzeTopicFlow(turns: ConversationTurn[]): Promise<any> {
    const recentTopics = turns.slice(-3).flatMap(t => t.topics);
    const topicFreq = new Map<string, number>();
    
    recentTopics.forEach(topic => {
      topicFreq.set(topic, (topicFreq.get(topic) || 0) + 1);
    });
    
    const sortedTopics = Array.from(topicFreq.entries()).sort((a, b) => b[1] - a[1]);
    
    return {
      activeTopic: sortedTopics[0]?.[0] || 'general',
      relatedTopics: sortedTopics.slice(1, 4).map(([topic]) => topic),
      confidence: sortedTopics[0]?.[1] / recentTopics.length || 0
    };
  }

  private async determineResponseStrategy(current: ConversationTurn, recent: ConversationTurn[]): Promise<any> {
    const avgComplexity = recent.reduce((sum, t) => sum + t.complexity, 0) / recent.length;
    
    return {
      style: current.sentiment === 'positive' ? 'conversational' : 'supportive',
      complexity: avgComplexity > 0.7 ? 'advanced' : 'intermediate',
      length: current.userMessage.content.length > 200 ? 'detailed' : 'moderate'
    };
  }

  private async cleanupOldData(conversationId: string): Promise<void> {
    const maxTurns = this.config.maxTurnsInMemory || 100;
    
    const turns = this.conversationTurns.get(conversationId) || [];
    if (turns.length > maxTurns) {
      const trimmedTurns = turns.slice(-maxTurns);
      this.conversationTurns.set(conversationId, trimmedTurns);
    }
  }

  // Public API methods
  getConversationHealth(conversationId: string): ConversationHealth | null {
    return this.conversationHealth.get(conversationId) || null;
  }

  getConversationSummaries(conversationId: string): ConversationSummary[] {
    return this.conversationSummaries.get(conversationId) || [];
  }

  getTopicTransitions(conversationId: string): TopicTransition[] {
    return this.topicTransitions.get(conversationId) || [];
  }

  clearConversationData(conversationId: string): void {
    this.conversationTurns.delete(conversationId);
    this.conversationBranches.delete(conversationId);
    this.topicTransitions.delete(conversationId);
    this.conversationSummaries.delete(conversationId);
    this.conversationHealth.delete(conversationId);
  }

  getSystemStats(): {
    totalConversations: number;
    totalTurns: number;
    averageHealthScore: number;
    commonIssues: string[];
  } {
    const healthScores = Array.from(this.conversationHealth.values()).map(h => h.continuityScore);
    
    return {
      totalConversations: this.conversationTurns.size,
      totalTurns: Array.from(this.conversationTurns.values()).reduce((sum, turns) => sum + turns.length, 0),
      averageHealthScore: healthScores.length > 0 ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length : 0,
      commonIssues: ['topic_jump', 'repetition'] // Would be calculated from actual data
    };
  }
}

export default ConversationFlowManager;
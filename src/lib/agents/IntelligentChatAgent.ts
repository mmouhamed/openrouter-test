'use client';

/**
 * Intelligent Chat Agent - Next-Generation Conversation Management
 * 
 * Features:
 * - Unified context/memory management
 * - Real-time web search integration
 * - Multi-modal content processing
 * - Conversation continuity preservation
 * - Adaptive learning and personalization
 * - External information synthesis
 */

import { ChatMessage, Attachment } from '@/contexts/ChatContext';
import { MemoryManager } from '@/lib/memory/MemoryManager';
import { AdvancedContextEngine, EnhancedMessage } from '@/lib/context/AdvancedContextEngine';
import { EnsembleNeuroFusion31 } from '@/utils/EnsembleNeuroFusion31';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
  source: 'web' | 'knowledge' | 'realtime';
}

export interface AgentCapabilities {
  webSearch: boolean;
  imageProcessing: boolean;
  codeAnalysis: boolean;
  realTimeData: boolean;
  multilingualSupport: boolean;
  contextualLearning: boolean;
}

export interface ConversationState {
  id: string;
  userId: string;
  currentTopic: string;
  topicHistory: string[];
  emotionalContext: 'neutral' | 'positive' | 'negative' | 'curious' | 'frustrated';
  complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  preferredStyle: 'conversational' | 'technical' | 'creative' | 'analytical';
  contextContinuity: number; // 0-1 score
  externalFactsUsed: WebSearchResult[];
  lastUpdated: Date;
}

export interface AgentResponse {
  content: string;
  confidence: number;
  sources: WebSearchResult[];
  contextUsed: EnhancedMessage[];
  processingStrategy: string;
  continuityScore: number;
  suggestions?: string[];
  metadata: {
    responseTime: number;
    modelsUsed: string[];
    externalSourcesQueried: number;
    contextTokensUsed: number;
  };
}

export class IntelligentChatAgent {
  private memoryManager: MemoryManager;
  private contextEngine: AdvancedContextEngine;
  private neuralFusion: EnsembleNeuroFusion31;
  private conversationStates: Map<string, ConversationState> = new Map();
  private capabilities: AgentCapabilities;
  private webSearchApiKey?: string;
  private isProcessing = false;

  constructor(config: {
    memoryConfig?: Partial<MemoryConfig>;
    contextConfig?: Partial<ContextEngineConfig>;
    neuralConfig?: Partial<NeuralConfig>;
    capabilities?: Partial<AgentCapabilities>;
    webSearchApiKey?: string;
  } = {}) {
    this.memoryManager = new MemoryManager(config.memoryConfig || {
      maxContextTokens: 12000, // Increased for richer context
      slidingWindowSize: 25,
      summaryThreshold: 30,
      compressionTarget: 0.3,
      semanticSearchThreshold: 0.7
    });

    this.contextEngine = new AdvancedContextEngine(config.contextConfig || {
      maxContextTokens: 12000,
      optimalContextTokens: 8000,
      importanceThreshold: 0.4,
      recencyWeight: 0.3,
      relevanceWeight: 0.5,
      importanceWeight: 0.2
    });

    this.neuralFusion = new EnsembleNeuroFusion31(config.neuralConfig || {
      enableNeuralAnalytics: true,
      enableAdaptiveFusion: true,
      enableVisionFallback: true,
      enablePredictiveRouting: true,
      enableMultiModelFusion: true,
      learningMode: true
    });

    this.capabilities = {
      webSearch: true,
      imageProcessing: true,
      codeAnalysis: true,
      realTimeData: true,
      multilingualSupport: true,
      contextualLearning: true,
      ...config.capabilities
    };

    this.webSearchApiKey = config.webSearchApiKey;
  }

  /**
   * Main agent processing method
   */
  async processConversation(
    conversationId: string,
    userId: string,
    currentMessage: string,
    attachments: Attachment[] = [],
    conversationHistory: ChatMessage[] = [],
    options: {
      forceWebSearch?: boolean;
      preferredStyle?: string;
      maxSources?: number;
      includeImages?: boolean;
    } = {}
  ): Promise<AgentResponse> {
    if (this.isProcessing) {
      throw new Error('Agent is currently processing another request');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // 1. Initialize or update conversation state
      const conversationState = await this.updateConversationState(
        conversationId, 
        userId, 
        currentMessage, 
        conversationHistory
      );

      // 2. Analyze message intent and context requirements
      const intentAnalysis = await this.analyzeMessageIntent(
        currentMessage, 
        attachments, 
        conversationState
      );

      // 3. Determine information needs
      const informationNeeds = await this.assessInformationNeeds(
        intentAnalysis, 
        conversationState
      );

      // 4. Gather external information if needed
      let externalSources: WebSearchResult[] = [];
      if (informationNeeds.needsExternalInfo || options.forceWebSearch) {
        externalSources = await this.gatherExternalInformation(
          currentMessage,
          intentAnalysis.searchQueries,
          options.maxSources || 5
        );
      }

      // 5. Optimize conversation context
      const optimizedContext = await this.buildUnifiedContext(
        conversationId,
        conversationHistory,
        currentMessage,
        conversationState,
        externalSources
      );

      // 6. Process through enhanced neural fusion
      const neuralResponse = await this.processWithEnhancedFusion(
        currentMessage,
        attachments,
        optimizedContext,
        externalSources,
        conversationState,
        options
      );

      // 7. Enhance response with agent intelligence
      const enhancedResponse = await this.enhanceResponse(
        neuralResponse,
        conversationState,
        externalSources,
        optimizedContext
      );

      // 8. Update conversation state
      await this.updatePostProcessingState(
        conversationId,
        enhancedResponse,
        externalSources
      );

      const processingTime = Date.now() - startTime;

      return {
        content: enhancedResponse.content,
        confidence: enhancedResponse.confidence,
        sources: externalSources,
        contextUsed: optimizedContext as EnhancedMessage[],
        processingStrategy: neuralResponse.strategy || 'adaptive',
        continuityScore: conversationState.contextContinuity,
        suggestions: enhancedResponse.suggestions,
        metadata: {
          responseTime: processingTime,
          modelsUsed: neuralResponse.modelsUsed || ['primary'],
          externalSourcesQueried: externalSources.length,
          contextTokensUsed: this.estimateTokens(optimizedContext.map(m => m.content).join(' '))
        }
      };

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Update or create conversation state
   */
  private async updateConversationState(
    conversationId: string,
    userId: string,
    currentMessage: string,
    history: ChatMessage[]
  ): Promise<ConversationState> {
    let state = this.conversationStates.get(conversationId);

    if (!state) {
      state = {
        id: conversationId,
        userId,
        currentTopic: this.extractPrimaryTopic(currentMessage),
        topicHistory: [],
        emotionalContext: 'neutral',
        complexityLevel: 'intermediate',
        preferredStyle: 'conversational',
        contextContinuity: 1.0,
        externalFactsUsed: [],
        lastUpdated: new Date()
      };
    }

    // Update state based on conversation analysis
    const topicShift = await this.detectTopicShift(state, currentMessage, history);
    const emotionalState = await this.analyzeEmotionalContext(currentMessage, history);
    const complexityLevel = await this.assessComplexityLevel(currentMessage, history);

    state.currentTopic = topicShift.newTopic || state.currentTopic;
    if (topicShift.isShift) {
      state.topicHistory.push(state.currentTopic);
      state.contextContinuity = Math.max(0.1, state.contextContinuity - 0.2);
    } else {
      state.contextContinuity = Math.min(1.0, state.contextContinuity + 0.1);
    }

    state.emotionalContext = emotionalState;
    state.complexityLevel = complexityLevel;
    state.lastUpdated = new Date();

    this.conversationStates.set(conversationId, state);
    return state;
  }

  /**
   * Analyze message intent and determine processing strategy
   */
  private async analyzeMessageIntent(
    message: string, 
    attachments: Attachment[], 
    state: ConversationState
  ): Promise<{
    primaryIntent: string;
    secondaryIntents: string[];
    needsExternalInfo: boolean;
    preferredStrategy: 'quick' | 'comprehensive' | 'creative' | 'analytical';
    searchQueries: string[];
    visualContentAnalysis?: boolean;
  }> {
    const lowerMessage = message.toLowerCase();
    
    // Determine primary intent
    let primaryIntent = 'general_inquiry';
    if (lowerMessage.includes('what is') || lowerMessage.includes('define')) {
      primaryIntent = 'definition_request';
    } else if (lowerMessage.includes('how to') || lowerMessage.includes('explain')) {
      primaryIntent = 'explanation_request';
    } else if (lowerMessage.includes('create') || lowerMessage.includes('generate')) {
      primaryIntent = 'creation_request';
    } else if (lowerMessage.includes('analyze') || lowerMessage.includes('review')) {
      primaryIntent = 'analysis_request';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('contrast')) {
      primaryIntent = 'comparison_request';
    }

    // Determine if external information is needed
    const needsExternalInfo = 
      lowerMessage.includes('current') ||
      lowerMessage.includes('latest') ||
      lowerMessage.includes('recent') ||
      lowerMessage.includes('news') ||
      lowerMessage.includes('today') ||
      /\b(2024|2025)\b/.test(lowerMessage) ||
      primaryIntent === 'definition_request';

    // Generate search queries if needed
    const searchQueries: string[] = [];
    if (needsExternalInfo) {
      searchQueries.push(message);
      
      // Extract key terms for additional searches
      const keyTerms = this.extractKeyTerms(message);
      keyTerms.forEach(term => {
        searchQueries.push(`${term} latest information 2024`);
      });
    }

    return {
      primaryIntent,
      secondaryIntents: [],
      needsExternalInfo,
      preferredStrategy: this.determineProcessingStrategy(primaryIntent, state),
      searchQueries,
      visualContentAnalysis: attachments.some(a => a.mimeType.startsWith('image/'))
    };
  }

  /**
   * Assess information needs beyond conversation context
   */
  private async assessInformationNeeds(
    intentAnalysis: any,
    state: ConversationState
  ): Promise<{
    needsExternalInfo: boolean;
    informationType: 'factual' | 'current_events' | 'technical' | 'creative';
    searchDepth: 'shallow' | 'moderate' | 'deep';
    trustLevel: 'high' | 'medium' | 'low';
  }> {
    return {
      needsExternalInfo: intentAnalysis.needsExternalInfo,
      informationType: this.categorizeInformationType(intentAnalysis.primaryIntent),
      searchDepth: state.complexityLevel === 'expert' ? 'deep' : 'moderate',
      trustLevel: 'high'
    };
  }

  /**
   * Gather external information using web search
   */
  private async gatherExternalInformation(
    query: string,
    searchQueries: string[],
    maxSources: number
  ): Promise<WebSearchResult[]> {
    if (!this.capabilities.webSearch) {
      return [];
    }

    try {
      // This would integrate with your web search capability
      // For now, return mock results to show the structure
      const sources: WebSearchResult[] = [];
      
      for (const searchQuery of searchQueries.slice(0, 3)) {
        // TODO: Implement actual web search integration
        // You can use services like:
        // - Perplexity API
        // - Google Custom Search
        // - Bing Search API
        // - SerpAPI
        
        // Mock search results for demonstration
        sources.push({
          title: `Information about: ${searchQuery}`,
          url: `https://example.com/search/${encodeURIComponent(searchQuery)}`,
          snippet: `Recent information related to ${searchQuery}...`,
          relevanceScore: 0.85,
          source: 'web'
        });
      }

      return sources.slice(0, maxSources);
    } catch (error) {
      console.warn('External information gathering failed:', error);
      return [];
    }
  }

  /**
   * Build unified context from multiple sources
   */
  private async buildUnifiedContext(
    conversationId: string,
    history: ChatMessage[],
    currentMessage: string,
    state: ConversationState,
    externalSources: WebSearchResult[]
  ): Promise<ChatMessage[]> {
    // Get optimized context from memory manager
    const memoryContext = await this.memoryManager.getOptimizedContext(
      conversationId,
      history,
      currentMessage
    );

    // Get enhanced context from context engine
    const enhancedContext = await this.contextEngine.getOptimizedContext(
      conversationId,
      history,
      currentMessage,
      {
        communicationStyle: state.preferredStyle as any,
        technicalLevel: state.complexityLevel as any,
        preferredDetail: 'moderate' as any,
        learningStyle: 'practical' as any,
        domainExpertise: []
      }
    );

    // Merge and deduplicate contexts
    const combinedContext = this.mergeContexts(memoryContext, enhancedContext);

    // Add external information as context if available
    if (externalSources.length > 0) {
      const externalContext: ChatMessage = {
        id: `external-${Date.now()}`,
        role: 'assistant',
        content: this.formatExternalSources(externalSources),
        timestamp: new Date()
      };
      combinedContext.unshift(externalContext);
    }

    return combinedContext;
  }

  /**
   * Process through enhanced neural fusion with agent intelligence
   */
  private async processWithEnhancedFusion(
    message: string,
    attachments: Attachment[],
    context: ChatMessage[],
    externalSources: WebSearchResult[],
    state: ConversationState,
    options: any
  ): Promise<any> {
    // Create enhanced system prompt
    const systemPrompt = this.buildSystemPrompt(state, externalSources, context);

    // Configure ensemble processing
    const ensembleOptions = {
      userId: state.userId,
      conversationId: state.id,
      conversationContext: context,
      systemPrompt,
      forceEnsemble: state.complexityLevel === 'expert' || externalSources.length > 0,
      ensembleStrategy: this.determineEnsembleStrategy(state, externalSources, attachments),
      agentMode: true, // Special flag for agent processing
      contextualAwareness: true,
      externalFactsAvailable: externalSources.length > 0
    };

    // Process through neural fusion
    return await this.neuralFusion.processEnsembleRequest(
      message,
      attachments,
      ensembleOptions
    );
  }

  /**
   * Enhance response with agent intelligence
   */
  private async enhanceResponse(
    neuralResponse: any,
    state: ConversationState,
    sources: WebSearchResult[],
    context: any[]
  ): Promise<{
    content: string;
    confidence: number;
    suggestions?: string[];
  }> {
    let content = neuralResponse.response || neuralResponse.content;
    let confidence = neuralResponse.confidence || 0.8;

    // Add source citations if external sources were used
    if (sources.length > 0) {
      content += '\n\n**Sources:**\n';
      sources.forEach((source, index) => {
        content += `${index + 1}. [${source.title}](${source.url})\n`;
      });
    }

    // Add conversation continuity improvements
    if (state.contextContinuity < 0.5) {
      content = this.improveContextualContinuity(content, state, context);
    }

    // Generate follow-up suggestions
    const suggestions = this.generateFollowUpSuggestions(content, state);

    return {
      content,
      confidence,
      suggestions
    };
  }

  /**
   * Update conversation state after processing
   */
  private async updatePostProcessingState(
    conversationId: string,
    response: any,
    sources: WebSearchResult[]
  ): Promise<void> {
    const state = this.conversationStates.get(conversationId);
    if (state) {
      state.externalFactsUsed.push(...sources);
      state.lastUpdated = new Date();
      
      // Keep only recent external facts (last 10)
      state.externalFactsUsed = state.externalFactsUsed.slice(-10);
    }
  }

  // Helper methods
  private extractPrimaryTopic(message: string): string {
    const words = message.toLowerCase().split(' ').filter(word => word.length > 3);
    return words.slice(0, 3).join(' ') || 'general';
  }

  private async detectTopicShift(
    state: ConversationState, 
    message: string, 
    history: ChatMessage[]
  ): Promise<{ isShift: boolean; newTopic?: string }> {
    const currentTopicWords = state.currentTopic.toLowerCase().split(' ');
    const messageWords = message.toLowerCase().split(' ');
    
    const overlap = currentTopicWords.filter(word => messageWords.includes(word)).length;
    const overlapRatio = overlap / Math.max(currentTopicWords.length, 1);
    
    if (overlapRatio < 0.3) {
      return {
        isShift: true,
        newTopic: this.extractPrimaryTopic(message)
      };
    }
    
    return { isShift: false };
  }

  private async analyzeEmotionalContext(
    message: string, 
    history: ChatMessage[]
  ): Promise<ConversationState['emotionalContext']> {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('great') || lowerMessage.includes('awesome')) {
      return 'positive';
    }
    if (lowerMessage.includes('confused') || lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      return 'frustrated';
    }
    if (lowerMessage.includes('?') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return 'curious';
    }
    
    return 'neutral';
  }

  private async assessComplexityLevel(
    message: string, 
    history: ChatMessage[]
  ): Promise<ConversationState['complexityLevel']> {
    const technicalTerms = ['algorithm', 'implementation', 'architecture', 'optimization', 'paradigm'];
    const advancedTerms = ['machine learning', 'neural network', 'quantum', 'distributed systems'];
    
    const lowerMessage = message.toLowerCase();
    const techCount = technicalTerms.filter(term => lowerMessage.includes(term)).length;
    const advancedCount = advancedTerms.filter(term => lowerMessage.includes(term)).length;
    
    if (advancedCount > 0) return 'expert';
    if (techCount > 1) return 'advanced';
    if (techCount > 0 || message.length > 200) return 'intermediate';
    return 'basic';
  }

  private determineProcessingStrategy(intent: string, state: ConversationState): 'quick' | 'comprehensive' | 'creative' | 'analytical' {
    if (intent === 'creation_request') return 'creative';
    if (intent === 'analysis_request') return 'analytical';
    if (state.complexityLevel === 'expert') return 'comprehensive';
    return 'quick';
  }

  private categorizeInformationType(intent: string): 'factual' | 'current_events' | 'technical' | 'creative' {
    if (intent === 'definition_request') return 'factual';
    if (intent === 'creation_request') return 'creative';
    return 'technical';
  }

  private extractKeyTerms(message: string): string[] {
    const words = message.split(' ')
      .filter(word => word.length > 3)
      .filter(word => !/^(the|and|or|but|with|for|from|this|that|what|how|when|where|why)$/i.test(word))
      .slice(0, 5);
    
    return [...new Set(words)];
  }

  private mergeContexts(context1: ChatMessage[], context2: ChatMessage[]): ChatMessage[] {
    const seen = new Set<string>();
    const merged: ChatMessage[] = [];
    
    [...context1, ...context2].forEach(msg => {
      if (!seen.has(msg.id)) {
        seen.add(msg.id);
        merged.push(msg);
      }
    });
    
    return merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private formatExternalSources(sources: WebSearchResult[]): string {
    return `[External Knowledge Context]\n\n${sources.map(source => 
      `• ${source.title}: ${source.snippet}`
    ).join('\n\n')}\n\n[End External Context]\n\nPlease use this external information when relevant to provide accurate and up-to-date responses.`;
  }

  private buildSystemPrompt(
    state: ConversationState, 
    sources: WebSearchResult[], 
    context: ChatMessage[]
  ): string {
    let prompt = `You are an intelligent AI assistant with enhanced contextual awareness. 

Current conversation context:
- Topic: ${state.currentTopic}
- User's complexity level: ${state.complexityLevel}
- Preferred communication style: ${state.preferredStyle}
- Emotional context: ${state.emotionalContext}
- Conversation continuity: ${Math.round(state.contextContinuity * 100)}%

Instructions:
1. Maintain conversation continuity by referencing previous discussion points when relevant
2. Adapt your response complexity to match the user's level
3. Use the provided conversation context to give more relevant responses
4. If external sources are provided, integrate them naturally into your response
5. Be aware of topic shifts and acknowledge them appropriately`;

    if (sources.length > 0) {
      prompt += `\n6. You have access to current external information - use it to provide up-to-date and accurate responses`;
    }

    return prompt;
  }

  private determineEnsembleStrategy(
    state: ConversationState, 
    sources: WebSearchResult[], 
    attachments: Attachment[]
  ): string {
    if (attachments.length > 0) return 'parallel';
    if (sources.length > 0) return 'consensus';
    if (state.complexityLevel === 'expert') return 'synthesis';
    return 'sequential';
  }

  private improveContextualContinuity(
    content: string, 
    state: ConversationState, 
    context: any[]
  ): string {
    // Add context bridging if continuity is low
    if (state.topicHistory.length > 0) {
      const lastTopic = state.topicHistory[state.topicHistory.length - 1];
      return `Building on our discussion about ${lastTopic}, ${content}`;
    }
    return content;
  }

  private generateFollowUpSuggestions(content: string, state: ConversationState): string[] {
    const suggestions: string[] = [];
    
    if (state.emotionalContext === 'curious') {
      suggestions.push('Tell me more about this topic');
      suggestions.push('Can you provide examples?');
    }
    
    if (state.complexityLevel === 'basic') {
      suggestions.push('Explain this in simpler terms');
      suggestions.push('What should I know next?');
    }
    
    if (state.complexityLevel === 'expert') {
      suggestions.push('What are the advanced considerations?');
      suggestions.push('How does this compare to alternatives?');
    }
    
    return suggestions.slice(0, 3);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Public methods for external use
  getConversationState(conversationId: string): ConversationState | null {
    return this.conversationStates.get(conversationId) || null;
  }

  clearConversationState(conversationId: string): void {
    this.conversationStates.delete(conversationId);
  }

  updateCapabilities(capabilities: Partial<AgentCapabilities>): void {
    this.capabilities = { ...this.capabilities, ...capabilities };
  }

  getSystemStatus(): {
    isProcessing: boolean;
    activeConversations: number;
    capabilities: AgentCapabilities;
    memoryStatus: any;
  } {
    return {
      isProcessing: this.isProcessing,
      activeConversations: this.conversationStates.size,
      capabilities: this.capabilities,
      memoryStatus: 'active' // Could be enhanced with actual memory stats
    };
  }
}

// Type definitions for configuration
interface MemoryConfig {
  maxContextTokens: number;
  slidingWindowSize: number;
  summaryThreshold: number;
  compressionTarget: number;
  semanticSearchThreshold: number;
}

interface ContextEngineConfig {
  maxContextTokens: number;
  optimalContextTokens: number;
  importanceThreshold: number;
  recencyWeight: number;
  relevanceWeight: number;
  importanceWeight: number;
}

interface NeuralConfig {
  enableNeuralAnalytics: boolean;
  enableAdaptiveFusion: boolean;
  enableVisionFallback: boolean;
  enablePredictiveRouting: boolean;
  enableMultiModelFusion: boolean;
  learningMode: boolean;
}

export default IntelligentChatAgent;
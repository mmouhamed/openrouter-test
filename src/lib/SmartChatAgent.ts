export interface ModelCapabilities {
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  optimalTokenRange: [number, number];
  costEfficiency: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
  reasoning: 'basic' | 'advanced' | 'expert';
}

export interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  domain: string;
  requiresReasoning: boolean;
  requiresCreativity: boolean;
  requiresSpeed: boolean;
  estimatedTokens: number;
  keywords: string[];
  intent: 'question' | 'task' | 'creative' | 'technical' | 'analysis';
}

export interface RoutingDecision {
  primaryModel: string;
  fallbackModels: string[];
  strategy: 'single' | 'sequential' | 'ensemble';
  reasoning: string;
  confidence: number;
}

export interface SmartRecommendation {
  id: string;
  text: string;
  category: 'follow_up' | 'related' | 'deeper' | 'practical' | 'alternative';
  reasoning: string;
  confidence: number;
}

export class SmartChatAgent {
  private models: ModelCapabilities[] = [
    {
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      name: 'Llama 3.3 70B',
      strengths: ['reasoning', 'analysis', 'complex_tasks', 'technical_writing'],
      weaknesses: ['speed', 'creative_writing'],
      optimalTokenRange: [100, 8000],
      costEfficiency: 'medium',
      speed: 'slow',
      reasoning: 'expert'
    },
    {
      id: 'meta-llama/llama-3.3-8b-instruct:free',
      name: 'Llama 3.3 8B',
      strengths: ['speed', 'efficiency', 'quick_responses', 'simple_tasks'],
      weaknesses: ['complex_reasoning', 'long_context'],
      optimalTokenRange: [10, 2000],
      costEfficiency: 'high',
      speed: 'fast',
      reasoning: 'basic'
    },
    {
      id: 'microsoft/wizardlm-2-8x22b:free',
      name: 'WizardLM 2 8x22B',
      strengths: ['creativity', 'nuanced_understanding', 'complex_reasoning', 'writing'],
      weaknesses: ['speed'],
      optimalTokenRange: [50, 6000],
      costEfficiency: 'high',
      speed: 'medium',
      reasoning: 'expert'
    },
    {
      id: 'openai/gpt-oss-20b:free',
      name: 'GPT OSS 20B',
      strengths: ['balanced_performance', 'general_tasks', 'coding', 'analysis'],
      weaknesses: ['specialized_domains'],
      optimalTokenRange: [30, 4000],
      costEfficiency: 'high',
      speed: 'medium',
      reasoning: 'advanced'
    }
  ];

  private conversationHistory: Array<{
    role: string;
    content: string;
    model?: string;
    timestamp: Date;
    analysis?: QueryAnalysis;
  }> = [];

  private conversationMemory = {
    topics: new Set<string>(),
    userPreferences: new Set<string>(),
    previousQuestions: [] as string[],
    contextPatterns: new Map<string, number>(),
    lastDomain: '',
    userExpertiseLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced'
  };

  analyzeQuery(query: string, context: string[] = []): QueryAnalysis {
    const words = query.toLowerCase().split(/\s+/);
    const estimatedTokens = Math.ceil(query.length / 4);
    
    // Enhanced complexity analysis with memory context
    const complexityIndicators = {
      simple: ['what', 'when', 'who', 'where', 'is', 'are', 'can', 'will'],
      medium: ['how', 'why', 'explain', 'describe', 'compare', 'difference'],
      complex: ['analyze', 'evaluate', 'synthesize', 'comprehensive', 'detailed', 'implement', 'algorithm', 'optimization']
    };

    let complexity: QueryAnalysis['complexity'] = 'simple';
    
    // Check if this builds on previous conversation
    const buildOnPrevious = this.checkIfBuildsOnPrevious(query);
    if (buildOnPrevious) {
      complexity = 'medium'; // Context-dependent queries are at least medium complexity
    }
    
    if (complexityIndicators.complex.some(indicator => query.toLowerCase().includes(indicator))) {
      complexity = 'complex';
    } else if (complexityIndicators.medium.some(indicator => query.toLowerCase().includes(indicator))) {
      complexity = 'medium';
    }

    // Adjust complexity based on conversation depth
    if (this.conversationHistory.length > 3 && this.isFollowUpQuestion(query)) {
      complexity = complexity === 'simple' ? 'medium' : 'complex';
    }

    // Enhanced domain detection with memory context
    const domains = {
      technical: ['code', 'programming', 'algorithm', 'software', 'development', 'api', 'database'],
      creative: ['write', 'story', 'creative', 'poem', 'design', 'artistic', 'imagine'],
      analytical: ['analyze', 'compare', 'evaluate', 'assess', 'review', 'critique'],
      educational: ['explain', 'teach', 'learn', 'understand', 'definition', 'concept'],
      practical: ['how to', 'guide', 'steps', 'tutorial', 'instruction', 'implement']
    };

    let domain = 'general';
    for (const [domainName, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => query.toLowerCase().includes(keyword))) {
        domain = domainName;
        break;
      }
    }

    // Use previous domain if query seems to continue the conversation
    if (domain === 'general' && this.conversationMemory.lastDomain && this.isFollowUpQuestion(query)) {
      domain = this.conversationMemory.lastDomain;
    }

    // Update memory
    this.conversationMemory.lastDomain = domain;
    this.conversationMemory.topics.add(domain);

    // Intent detection
    let intent: QueryAnalysis['intent'] = 'question';
    if (query.toLowerCase().includes('create') || query.toLowerCase().includes('generate') || query.toLowerCase().includes('write')) {
      intent = 'creative';
    } else if (query.toLowerCase().includes('analyze') || query.toLowerCase().includes('compare')) {
      intent = 'analysis';
    } else if (query.toLowerCase().includes('how to') || query.toLowerCase().includes('implement')) {
      intent = 'task';
    } else if (domain === 'technical') {
      intent = 'technical';
    }

    // Feature requirements
    const requiresReasoning = complexity !== 'simple' || intent === 'analysis';
    const requiresCreativity = intent === 'creative' || query.toLowerCase().includes('creative');
    const requiresSpeed = query.length < 50 && complexity === 'simple';

    return {
      complexity,
      domain,
      requiresReasoning,
      requiresCreativity,
      requiresSpeed,
      estimatedTokens,
      keywords: words.filter(word => word.length > 3),
      intent
    };
  }

  routeQuery(analysis: QueryAnalysis, context: string[] = []): RoutingDecision {
    const scores = this.models.map(model => ({
      model: model.id,
      score: this.calculateModelScore(model, analysis),
      reasoning: this.getModelReasoningForQuery(model, analysis)
    }));

    scores.sort((a, b) => b.score - a.score);

    const primaryModel = scores[0].model;
    const fallbackModels = scores.slice(1).map(s => s.model);

    // Strategy decision
    let strategy: RoutingDecision['strategy'] = 'single';
    if (analysis.complexity === 'complex' && analysis.requiresReasoning) {
      strategy = 'ensemble'; // Use multiple models for complex queries
    } else if (analysis.estimatedTokens > 1000) {
      strategy = 'sequential'; // Break down large queries
    }

    return {
      primaryModel,
      fallbackModels,
      strategy,
      reasoning: scores[0].reasoning,
      confidence: scores[0].score / 100
    };
  }

  private calculateModelScore(model: ModelCapabilities, analysis: QueryAnalysis): number {
    let score = 50; // Base score

    // Complexity scoring
    if (analysis.complexity === 'complex' && model.reasoning === 'expert') {
      score += 30;
    } else if (analysis.complexity === 'medium' && model.reasoning !== 'basic') {
      score += 20;
    } else if (analysis.complexity === 'simple' && model.speed === 'fast') {
      score += 25;
    }

    // Domain-specific scoring
    const domainScoring = {
      technical: { reasoning: 25, speed: 10 },
      creative: { creativity: 30, reasoning: 15 },
      analytical: { reasoning: 35, speed: 5 },
      educational: { reasoning: 20, clarity: 20 },
      practical: { speed: 20, efficiency: 15 }
    };

    const domainBonus = domainScoring[analysis.domain as keyof typeof domainScoring];
    if (domainBonus) {
      if ('reasoning' in domainBonus && domainBonus.reasoning && model.reasoning === 'expert') score += domainBonus.reasoning;
      if ('speed' in domainBonus && domainBonus.speed && model.speed === 'fast') score += domainBonus.speed;
      if ('creativity' in domainBonus && domainBonus.creativity && model.strengths.includes('creativity')) score += 25;
    }

    // Token range optimization
    const [minTokens, maxTokens] = model.optimalTokenRange;
    if (analysis.estimatedTokens >= minTokens && analysis.estimatedTokens <= maxTokens) {
      score += 15;
    } else if (analysis.estimatedTokens > maxTokens) {
      score -= 20;
    }

    // Speed requirements
    if (analysis.requiresSpeed && model.speed === 'fast') {
      score += 20;
    }

    // Reasoning requirements
    if (analysis.requiresReasoning && model.reasoning === 'expert') {
      score += 25;
    }

    // Creativity requirements
    if (analysis.requiresCreativity && model.strengths.includes('creativity')) {
      score += 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  private getModelReasoningForQuery(model: ModelCapabilities, analysis: QueryAnalysis): string {
    const reasons = [];

    if (analysis.complexity === 'complex' && model.reasoning === 'expert') {
      reasons.push('excellent complex reasoning capabilities');
    }
    if (analysis.requiresSpeed && model.speed === 'fast') {
      reasons.push('fast response time');
    }
    if (analysis.requiresCreativity && model.strengths.includes('creativity')) {
      reasons.push('strong creative abilities');
    }
    if (analysis.domain === 'technical' && model.strengths.includes('reasoning')) {
      reasons.push('technical expertise');
    }
    if (model.costEfficiency === 'high') {
      reasons.push('cost-efficient');
    }

    return `Selected for ${reasons.join(', ')}`;
  }

  generateRecommendations(query: string, response: string, analysis: QueryAnalysis): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    // Context-aware recommendations based on conversation memory
    const conversationContext = this.buildConversationContext();
    const userLevel = this.conversationMemory.userExpertiseLevel;

    // Follow-up questions based on domain and intent
    if (analysis.domain === 'technical') {
      if (userLevel === 'beginner') {
        recommendations.push({
          id: 'tech_basics',
          text: `Can you explain the basic concepts behind this?`,
          category: 'deeper',
          reasoning: 'Beginner user would benefit from foundational understanding',
          confidence: 0.9
        });
      } else {
        recommendations.push({
          id: 'tech_implementation',
          text: `How would you implement this in a real project?`,
          category: 'practical',
          reasoning: 'Advanced technical queries benefit from implementation guidance',
          confidence: 0.8
        });
      }
      
      recommendations.push({
        id: 'tech_alternatives',
        text: `What are alternative approaches to this solution?`,
        category: 'alternative',
        reasoning: 'Exploring alternatives deepens technical understanding',
        confidence: 0.7
      });
    }

    if (analysis.domain === 'creative') {
      recommendations.push({
        id: 'creative_variations',
        text: `Can you create variations of this with different styles?`,
        category: 'related',
        reasoning: 'Creative content benefits from style exploration',
        confidence: 0.75
      });
    }

    if (analysis.complexity === 'simple') {
      recommendations.push({
        id: 'deeper_dive',
        text: `Can you provide a more detailed explanation of this concept?`,
        category: 'deeper',
        reasoning: 'Simple queries can be expanded for deeper understanding',
        confidence: 0.6
      });
    }

    // Content-based recommendations
    if (response.includes('advantage') || response.includes('benefit')) {
      recommendations.push({
        id: 'disadvantages',
        text: `What are the potential drawbacks or limitations?`,
        category: 'follow_up',
        reasoning: 'Balance perspective by exploring limitations',
        confidence: 0.8
      });
    }

    if (response.includes('example') || response.includes('for instance')) {
      recommendations.push({
        id: 'more_examples',
        text: `Can you provide more examples or use cases?`,
        category: 'related',
        reasoning: 'Examples help reinforce understanding',
        confidence: 0.7
      });
    }

    // Domain-specific smart suggestions
    if (analysis.intent === 'question') {
      recommendations.push({
        id: 'practical_application',
        text: `How can I apply this knowledge practically?`,
        category: 'practical',
        reasoning: 'Questions benefit from practical application guidance',
        confidence: 0.6
      });
    }

    // Context-aware recommendations
    const historyCount = this.conversationHistory.length;
    if (historyCount > 2) {
      const recentTopics = this.extractTopicsFromHistory();
      if (recentTopics.length > 1) {
        recommendations.push({
          id: 'connect_topics',
          text: `How do these concepts relate to what we discussed earlier?`,
          category: 'follow_up',
          reasoning: 'Connecting conversation topics enhances learning',
          confidence: 0.65
        });
      }
    }

    // Limit and sort recommendations
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4);
  }

  generateUsageSuggestions(userContext: { previousQueries: string[], preferences?: string[] }): string[] {
    const suggestions = [];

    const recentQueries = userContext.previousQueries.slice(-5);
    const commonDomains = this.extractCommonDomains(recentQueries);

    // Personalized suggestions based on usage patterns
    if (commonDomains.includes('technical')) {
      suggestions.push(
        'Ask about code optimization techniques',
        'Request architecture design patterns',
        'Explore debugging strategies'
      );
    }

    if (commonDomains.includes('creative')) {
      suggestions.push(
        'Try brainstorming creative solutions',
        'Ask for story or content ideas',
        'Explore different writing styles'
      );
    }

    if (commonDomains.includes('analytical')) {
      suggestions.push(
        'Request comparative analysis',
        'Ask for pros and cons evaluation',
        'Explore different perspectives'
      );
    }

    // General discovery suggestions
    suggestions.push(
      'Ask "What would you recommend I learn next?"',
      'Try "Explain this like I\'m 5"',
      'Request "Show me an example"',
      'Ask "What are common mistakes in..."'
    );

    return suggestions.slice(0, 6);
  }

  private extractTopicsFromHistory(): string[] {
    return this.conversationHistory
      .slice(-5)
      .map(entry => entry.analysis?.keywords || [])
      .flat()
      .filter((keyword, index, arr) => arr.indexOf(keyword) === index);
  }

  private extractCommonDomains(queries: string[]): string[] {
    const domainCounts: Record<string, number> = {};
    
    queries.forEach(query => {
      const analysis = this.analyzeQuery(query);
      domainCounts[analysis.domain] = (domainCounts[analysis.domain] || 0) + 1;
    });

    return Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([domain]) => domain)
      .slice(0, 3);
  }

  private checkIfBuildsOnPrevious(query: string): boolean {
    const contextWords = ['this', 'that', 'it', 'them', 'they', 'above', 'earlier', 'previous', 'continue', 'also', 'additionally'];
    return contextWords.some(word => query.toLowerCase().includes(word));
  }

  private isFollowUpQuestion(query: string): boolean {
    const followUpIndicators = [
      'what about', 'how about', 'can you also', 'what if', 'but what',
      'and what', 'also', 'additionally', 'furthermore', 'moreover',
      'expand on', 'tell me more', 'go deeper', 'elaborate'
    ];
    return followUpIndicators.some(indicator => query.toLowerCase().includes(indicator));
  }

  private detectUserExpertiseLevel(query: string): 'beginner' | 'intermediate' | 'advanced' {
    const beginnerIndicators = ['simple', 'basic', 'beginner', 'explain like', 'what is', 'help me understand'];
    const advancedIndicators = ['optimize', 'algorithm', 'implementation', 'architecture', 'pattern', 'best practice'];
    
    if (beginnerIndicators.some(indicator => query.toLowerCase().includes(indicator))) {
      return 'beginner';
    }
    if (advancedIndicators.some(indicator => query.toLowerCase().includes(indicator))) {
      return 'advanced';
    }
    return 'intermediate';
  }

  private updateConversationMemory(query: string, analysis: QueryAnalysis) {
    // Update user expertise level
    const detectedLevel = this.detectUserExpertiseLevel(query);
    if (detectedLevel !== 'intermediate') {
      this.conversationMemory.userExpertiseLevel = detectedLevel;
    }

    // Track question patterns
    this.conversationMemory.previousQuestions.push(query);
    if (this.conversationMemory.previousQuestions.length > 10) {
      this.conversationMemory.previousQuestions = this.conversationMemory.previousQuestions.slice(-8);
    }

    // Update context patterns
    analysis.keywords.forEach(keyword => {
      const count = this.conversationMemory.contextPatterns.get(keyword) || 0;
      this.conversationMemory.contextPatterns.set(keyword, count + 1);
    });
  }

  private buildConversationContext(): {
    recentTopics: string[];
    commonKeywords: string[];
    conversationFlow: string;
    userExpertise: string;
  } {
    const recentTopics = Array.from(this.conversationMemory.topics).slice(-5);
    const commonKeywords = Array.from(this.conversationMemory.contextPatterns.entries())
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);

    const conversationFlow = this.conversationHistory.length > 0 
      ? `Conversation has been focused on ${this.conversationMemory.lastDomain} topics`
      : 'New conversation';

    return {
      recentTopics,
      commonKeywords,
      conversationFlow,
      userExpertise: this.conversationMemory.userExpertiseLevel
    };
  }

  addToHistory(role: string, content: string, model?: string, analysis?: QueryAnalysis) {
    this.conversationHistory.push({
      role,
      content,
      model,
      timestamp: new Date(),
      analysis
    });

    // Update memory if it's a user query
    if (role === 'user' && analysis) {
      this.updateConversationMemory(content, analysis);
    }

    // Keep history manageable
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-15);
    }
  }

  getOptimalModel(query: string, context: string[] = []): {
    model: string;
    reasoning: string;
    alternatives: string[];
    confidence: number;
  } {
    const analysis = this.analyzeQuery(query, context);
    const routing = this.routeQuery(analysis, context);

    return {
      model: routing.primaryModel,
      reasoning: routing.reasoning,
      alternatives: routing.fallbackModels,
      confidence: routing.confidence
    };
  }

  async processQuery(query: string, context: string[] = []): Promise<{
    analysis: QueryAnalysis;
    routing: RoutingDecision;
    modelRecommendation: string;
    suggestions: SmartRecommendation[];
    usageHints: string[];
  }> {
    const analysis = this.analyzeQuery(query, context);
    const routing = this.routeQuery(analysis, context);
    
    // Add to history for context-aware recommendations
    this.addToHistory('user', query, undefined, analysis);

    const suggestions = this.generateRecommendations(query, '', analysis);
    const usageHints = this.generateUsageSuggestions({
      previousQueries: this.conversationHistory.map(h => h.content).slice(-10)
    });

    return {
      analysis,
      routing,
      modelRecommendation: routing.primaryModel,
      suggestions,
      usageHints
    };
  }
}

// Singleton instance
export const smartChatAgent = new SmartChatAgent();
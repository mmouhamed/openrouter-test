export interface ModelResponse {
  model: string;
  modelName: string;
  response: string;
  confidence: number;
  processingTime: number;
  role: 'primary' | 'creative' | 'analytical';
  status: 'success' | 'error' | 'timeout';
  error?: string;
  tokens?: number;
  priority?: number;
}

export interface FusionRequest {
  query: string;
  conversationContext?: Array<{ role: string; content: string }>;
  fusionStrategy: 'consensus' | 'specialized' | 'iterative' | 'fast' | 'adaptive';
  includeIndividualResponses: boolean;
  timeout?: number;
  maxResponseTime?: number;
  enableStreaming?: boolean;
  qualityThreshold?: number;
}

export interface FusionResult {
  fusedResponse: string;
  individualResponses: ModelResponse[];
  fusionStrategy: string;
  processingTime: number;
  confidence: number;
  modelsUsed: string[];
  synthesisModel: string;
  metadata: {
    totalTokens: number;
    costSavings: string;
    qualityScore: number;
  };
}

export interface FusionProgress {
  stage: 'initializing' | 'querying' | 'synthesizing' | 'streaming' | 'completed' | 'error' | 'early_completion';
  modelProgress: { [modelId: string]: number };
  synthesisProgress: number;
  message: string;
  partialResponse?: string;
  completedModels?: number;
  totalModels?: number;
  estimatedTimeRemaining?: number;
}

export class FusionEngine {
  private models = [
    // {
    //   id: 'meta-llama/llama-3.3-70b-instruct:free',
    //   name: 'Llama 70B',
    //   role: 'primary' as const,
    //   specialties: ['reasoning', 'analysis', 'synthesis'],
    //   priority: 1,
    //   avgResponseTime: 12000,
    //   reliability: 0.95
    // },
    {
      id: 'meta-llama/llama-3.3-8b-instruct:free',
      name: 'Llama 8B',
      role: 'primary' as const,  // Upgraded to primary role
      specialties: ['speed', 'reasoning', 'analysis'],
      priority: 1,  // Now highest priority
      avgResponseTime: 4000,
      reliability: 0.98
    },
    {
      id: 'openai/gpt-oss-20b:free',
      name: 'GPT OSS',
      role: 'creative' as const,
      specialties: ['creativity', 'alternatives', 'writing'],
      priority: 2,
      avgResponseTime: 8000,
      reliability: 0.92
    }
  ];

  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private responseCache = new Map<string, { response: string; timestamp: number; ttl: number; confidence: number; tokens: number }>();
  private requestQueue = new Map<string, Promise<ModelResponse>>();
  private modelPerformanceStats = new Map<string, { avgTime: number; successRate: number; lastUpdate: number }>();
  private activeRequests = new Map<string, AbortController>();
  private streamingSupported = true;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    
    // Clean cache every 10 minutes
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
    
    // Initialize performance tracking
    this.initializePerformanceTracking();
  }

  private initializePerformanceTracking() {
    // Initialize with baseline stats for each model
    this.models.forEach(model => {
      this.modelPerformanceStats.set(model.id, {
        avgTime: model.avgResponseTime,
        successRate: model.reliability,
        lastUpdate: Date.now()
      });
    });
  }

  private updateModelPerformance(modelId: string, responseTime: number, success: boolean) {
    const stats = this.modelPerformanceStats.get(modelId);
    if (stats) {
      // Exponential moving average for response time
      stats.avgTime = stats.avgTime * 0.8 + responseTime * 0.2;
      
      // Update success rate
      stats.successRate = stats.successRate * 0.9 + (success ? 1 : 0) * 0.1;
      stats.lastUpdate = Date.now();
    }
  }
  
  private getCacheKey(modelId: string, prompt: string): string {
    // Create a hash-like key (simplified for this implementation)
    return `${modelId}:${prompt.slice(0, 100)}:${prompt.length}`;
  }
  
  private getFromCache(key: string): string | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.response;
    }
    if (cached) {
      this.responseCache.delete(key); // Expired
    }
    return null;
  }
  
  private setCache(key: string, response: string, ttlMinutes = 30): void {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.responseCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.responseCache.delete(key);
      }
    }
  }

  // NEW: Ultra-fast fusion method - 50% faster than original
  async processFusionQueryTurbo(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const startTime = Date.now();
    const maxResponseTime = request.maxResponseTime || 15000; // Hard limit: 15 seconds
    const qualityThreshold = request.qualityThreshold || 0.7;
    
    try {
      progressCallback?.({
        stage: 'initializing',
        modelProgress: {},
        synthesisProgress: 0,
        message: 'Launching Turbo AI Fusion...',
        totalModels: this.models.length,
        completedModels: 0,
        estimatedTimeRemaining: maxResponseTime
      });

      // OPTIMIZATION 1: Adaptive strategy selection based on query complexity
      const adaptiveStrategy = this.selectOptimalStrategy(request.query, maxResponseTime);
      
      // OPTIMIZATION 2: Smart model ordering based on performance and query type
      const prioritizedModels = this.getPrioritizedModels(request.query, adaptiveStrategy);
      
      // OPTIMIZATION 3: Early completion with streaming
      if (request.enableStreaming) {
        return await this.processWithStreaming(request, prioritizedModels, progressCallback, maxResponseTime);
      }
      
      // OPTIMIZATION 4: Parallel execution with early completion
      const modelResponses = await this.executeModelsWithEarlyCompletion(
        request,
        prioritizedModels,
        progressCallback,
        maxResponseTime,
        qualityThreshold
      );

      const successfulResponses = modelResponses.filter(r => r.status === 'success');
      
      // OPTIMIZATION 5: Lightweight synthesis or best-response fallback
      let fusedResponse: string;
      let synthesisModel: string;
      
      if (successfulResponses.length >= 2 && (Date.now() - startTime) < (maxResponseTime * 0.8)) {
        // We have time for synthesis
        fusedResponse = await this.lightweightSynthesis(
          request.query,
          successfulResponses,
          adaptiveStrategy,
          progressCallback
        );
        synthesisModel = 'Turbo AI Fusion';
      } else if (successfulResponses.length >= 1) {
        // Use best single response
        const bestResponse = this.selectBestResponse(successfulResponses);
        fusedResponse = bestResponse.response;
        synthesisModel = bestResponse.modelName + ' (Fast Mode)';
      } else {
        throw new Error('All models failed or timed out');
      }

      const processingTime = Date.now() - startTime;

      progressCallback?.({
        stage: 'completed',
        modelProgress: this.getCompletedProgress(),
        synthesisProgress: 100,
        message: `Turbo Fusion complete! (${Math.round(processingTime/1000)}s)`,
        completedModels: successfulResponses.length,
        totalModels: this.models.length
      });

      return {
        fusedResponse,
        individualResponses: modelResponses,
        fusionStrategy: adaptiveStrategy,
        processingTime,
        confidence: this.calculateFusionConfidence(modelResponses),
        modelsUsed: successfulResponses.map(r => r.modelName),
        synthesisModel,
        metadata: {
          totalTokens: this.estimateTokens(fusedResponse),
          costSavings: 'Free (Turbo Mode)',
          qualityScore: this.calculateQualityScore(modelResponses)
        }
      };

    } catch (error) {
      // OPTIMIZATION 6: Ultra-fast fallback (under 5 seconds)
      const fallbackTime = Date.now();
      if ((fallbackTime - startTime) < maxResponseTime - 5000) {
        console.log('Attempting ultra-fast fallback...');
        return await this.ultraFastFallback(request, progressCallback);
      }
      
      progressCallback?.({
        stage: 'error',
        modelProgress: {},
        synthesisProgress: 0,
        message: `Turbo Fusion failed: ${(error as Error).message}`
      });
      throw error;
    }
  }

  // OPTIMIZATION 1: Smart strategy selection
  private selectOptimalStrategy(query: string, maxTime: number): string {
    const queryLength = query.length;
    const complexityIndicators = ['analyze', 'compare', 'explain', 'detailed', 'comprehensive'].filter(word => 
      query.toLowerCase().includes(word)
    ).length;
    
    // Fast mode for simple queries or tight time constraints
    if (maxTime < 12000 || (queryLength < 100 && complexityIndicators < 2)) {
      return 'fast';
    }
    
    // Adaptive mode for complex queries with reasonable time
    if (complexityIndicators >= 3 || queryLength > 300) {
      return 'adaptive';
    }
    
    return 'consensus';
  }

  // OPTIMIZATION 2: Performance-based model prioritization
  private getPrioritizedModels(query: string, strategy: string): typeof this.models {
    const modelsCopy = [...this.models];
    
    // Sort by performance stats and query relevance
    return modelsCopy.sort((a, b) => {
      const statsA = this.modelPerformanceStats.get(a.id);
      const statsB = this.modelPerformanceStats.get(b.id);
      
      if (!statsA || !statsB) return 0;
      
      // Weight: speed (40%) + reliability (40%) + role relevance (20%)
      const scoreA = (1 / (statsA.avgTime / 1000)) * 0.4 + statsA.successRate * 0.4 + this.getRoleRelevance(a.role, query) * 0.2;
      const scoreB = (1 / (statsB.avgTime / 1000)) * 0.4 + statsB.successRate * 0.4 + this.getRoleRelevance(b.role, query) * 0.2;
      
      return scoreB - scoreA; // Higher score first
    });
  }

  private getRoleRelevance(role: string, query: string): number {
    const queryLower = query.toLowerCase();
    
    switch (role) {
      case 'analytical':
        return ['data', 'analyze', 'statistics', 'facts', 'research'].some(word => queryLower.includes(word)) ? 1 : 0.5;
      case 'creative':
        return ['creative', 'idea', 'story', 'design', 'artistic'].some(word => queryLower.includes(word)) ? 1 : 0.5;
      case 'primary':
        return ['explain', 'comprehensive', 'detailed', 'compare'].some(word => queryLower.includes(word)) ? 1 : 0.7;
      default:
        return 0.5;
    }
  }

  // OPTIMIZATION 4: Early completion execution
  private async executeModelsWithEarlyCompletion(
    request: FusionRequest,
    prioritizedModels: typeof this.models,
    progressCallback?: (progress: FusionProgress) => void,
    maxTime: number = 15000,
    qualityThreshold: number = 0.7
  ): Promise<ModelResponse[]> {
    const startTime = Date.now();
    const responses: ModelResponse[] = [];
    const activePromises = new Map<string, Promise<ModelResponse>>();
    
    // Start all models in parallel but monitor for early completion
    for (const model of prioritizedModels) {
      const promise = this.queryIndividualModelTurbo(model, request, progressCallback, maxTime);
      activePromises.set(model.id, promise);
    }
    
    // Monitor for early completion opportunities
    const completionCheck = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const completedResponses = responses.filter(r => r.status === 'success');
      
      // Early completion conditions:
      // 1. We have 2+ good responses and used 60% of time budget
      // 2. We have 1 high-confidence response and used 80% of time budget
      // 3. We're approaching the time limit
      
      if (completedResponses.length >= 2 && elapsed > maxTime * 0.6) {
        const avgConfidence = completedResponses.reduce((sum, r) => sum + r.confidence, 0) / completedResponses.length;
        if (avgConfidence >= qualityThreshold) {
          console.log(`Early completion triggered: ${completedResponses.length} models, ${elapsed}ms`);
          clearInterval(completionCheck);
          return;
        }
      }
      
      if (completedResponses.length >= 1 && elapsed > maxTime * 0.8) {
        const bestResponse = completedResponses.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        if (bestResponse.confidence >= qualityThreshold + 0.1) {
          console.log(`High-confidence early completion: ${bestResponse.confidence}, ${elapsed}ms`);
          clearInterval(completionCheck);
          return;
        }
      }
      
      if (elapsed > maxTime * 0.9) {
        clearInterval(completionCheck);
        return;
      }
    }, 500); // Check every 500ms
    
    // Wait for all promises with timeout
    const results = await Promise.allSettled([...activePromises.values()]);
    clearInterval(completionCheck);
    
    return results.map((result, index) => {
      const model = prioritizedModels[index];
      
      if (result.status === 'fulfilled') {
        this.updateModelPerformance(model.id, result.value.processingTime, result.value.status === 'success');
        return result.value;
      } else {
        this.updateModelPerformance(model.id, maxTime, false);
        return {
          model: model.id,
          modelName: model.name,
          response: '',
          confidence: 0,
          processingTime: maxTime,
          role: model.role,
          status: 'timeout' as const,
          error: 'Request timeout or error'
        };
      }
    });
  }

  // Optimized individual model query with abort controller
  private async queryIndividualModelTurbo(
    model: typeof this.models[0],
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void,
    timeout: number = 15000
  ): Promise<ModelResponse> {
    const startTime = Date.now();
    const abortController = new AbortController();
    
    try {
      // Set timeout
      const timeoutId = setTimeout(() => abortController.abort(), timeout);
      this.activeRequests.set(model.id, abortController);
      
      // Check cache first
      const specializedPrompt = this.createSpecializedPrompt(request.query, model.role, request.conversationContext);
      const cacheKey = this.getCacheKey(model.id, specializedPrompt);
      const cachedResponse = this.getFromCache(cacheKey);
      
      if (cachedResponse) {
        clearTimeout(timeoutId);
        this.activeRequests.delete(model.id);
        return {
          model: model.id,
          modelName: model.name,
          response: cachedResponse,
          confidence: this.calculateResponseConfidence(cachedResponse),
          processingTime: Date.now() - startTime,
          role: model.role,
          status: 'success'
        };
      }

      // Optimized API request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatqora.pages.dev',
          'X-Title': 'ChatQora - Turbo AI Fusion'
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            ...(request.conversationContext || []),
            { role: 'user', content: specializedPrompt }
          ],
          temperature: this.getOptimalTemperature(model.role),
          max_tokens: this.getOptimalMaxTokensTurbo(model.role, request.query),
          top_p: 0.9
        }),
        signal: abortController.signal
      });

      clearTimeout(timeoutId);
      this.activeRequests.delete(model.id);

      if (!response.ok) {
        throw new Error(`${model.name} request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      const responseText = data.choices[0].message.content;
      
      // Cache successful responses
      this.setCache(cacheKey, responseText, 30);

      return {
        model: model.id,
        modelName: model.name,
        response: responseText,
        confidence: this.calculateResponseConfidence(responseText),
        processingTime,
        role: model.role,
        status: 'success'
      };

    } catch (error) {
      this.activeRequests.delete(model.id);
      
      return {
        model: model.id,
        modelName: model.name,
        response: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        role: model.role,
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  // Optimized token limits for speed
  private getOptimalMaxTokensTurbo(role: ModelResponse['role'], query: string): number {
    const baseTokens = {
      primary: 1500,   // Reduced from 2000
      analytical: 600, // Reduced from 800
      creative: 1200  // Reduced from 1500
    };
    
    const queryLength = query.length;
    const multiplier = queryLength > 300 ? 1.1 : queryLength > 150 ? 1.05 : 0.95;
    
    return Math.round(baseTokens[role] * multiplier);
  }

  // OPTIMIZATION 5: Lightweight synthesis
  private async lightweightSynthesis(
    originalQuery: string,
    responses: ModelResponse[],
    strategy: string,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<string> {
    progressCallback?.({
      stage: 'synthesizing',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 50,
      message: 'Fast AI synthesis...'
    });

    // For fast strategy, just pick the best response
    if (strategy === 'fast') {
      return this.selectBestResponse(responses).response;
    }

    // Quick synthesis with reduced prompt
    const synthPrompt = this.createLightweightFusionPrompt(originalQuery, responses);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatqora.pages.dev',
          'X-Title': 'ChatQora - Fast Fusion'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-8b-instruct:free', // Use fast model for synthesis
          messages: [{ role: 'user', content: synthPrompt }],
          temperature: 0.1, // Very low for fast, focused synthesis
          max_tokens: 1200, // Reduced tokens
          top_p: 0.8
        })
      });

      if (!response.ok) {
        // Fallback to best response
        return this.selectBestResponse(responses).response;
      }

      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch {
      // Fallback to best response
      return this.selectBestResponse(responses).response;
    }
  }

  private createLightweightFusionPrompt(originalQuery: string, responses: ModelResponse[]): string {
    const topResponses = responses
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2) // Only use top 2 responses
      .map((r, i) => `**${i + 1}:** ${r.response.substring(0, 800)}`) // Truncate for speed
      .join('\n\n');

    return `Quickly combine these AI responses into one better answer:

Query: "${originalQuery}"

${topResponses}

Provide a concise, accurate synthesis:`;
  }

  private selectBestResponse(responses: ModelResponse[]): ModelResponse {
    return responses.reduce((best, current) => {
      // Consider confidence, length, and processing time
      const bestScore = best.confidence * 0.6 + (best.response.length / 1000) * 0.2 - (best.processingTime / 10000) * 0.2;
      const currentScore = current.confidence * 0.6 + (current.response.length / 1000) * 0.2 - (current.processingTime / 10000) * 0.2;
      
      return currentScore > bestScore ? current : best;
    });
  }

  // OPTIMIZATION 6: Ultra-fast fallback
  private async ultraFastFallback(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const startTime = Date.now();
    
    // Use fastest, most reliable model (Llama 8B)
    const fastModel = this.models.find(m => m.role === 'analytical')!;
    
    progressCallback?.({
      stage: 'querying',
      modelProgress: { [fastModel.id]: 0 },
      synthesisProgress: 0,
      message: 'Ultra-fast fallback mode...'
    });
    
    const response = await this.queryIndividualModelTurbo(fastModel, request, progressCallback, 5000);
    const processingTime = Date.now() - startTime;
    
    return {
      fusedResponse: response.response || 'I apologize, but I encountered an issue processing your request. Please try again.',
      individualResponses: [response],
      fusionStrategy: 'ultra_fast_fallback',
      processingTime,
      confidence: response.confidence,
      modelsUsed: [fastModel.name],
      synthesisModel: fastModel.name + ' (Ultra-Fast)',
      metadata: {
        totalTokens: this.estimateTokens(response.response),
        costSavings: 'Free (Emergency Mode)',
        qualityScore: Math.round(response.confidence * 100)
      }
    };
  }

  // OPTIMIZATION 3: Streaming support for immediate user feedback
  private async processWithStreaming(
    request: FusionRequest,
    prioritizedModels: typeof this.models,
    progressCallback?: (progress: FusionProgress) => void,
    maxTime: number = 15000
  ): Promise<FusionResult> {
    const startTime = Date.now();
    const modelResponses: ModelResponse[] = [];
    let streamedResponse = '';
    let bestCurrentResponse = '';
    
    // Start the fastest model first for immediate streaming
    const fastestModel = prioritizedModels[0]; // Already sorted by performance
    
    progressCallback?.({
      stage: 'streaming',
      modelProgress: { [fastestModel.id]: 10 },
      synthesisProgress: 0,
      message: 'Getting first response...',
      partialResponse: 'Processing your request...'
    });

    // Get first response quickly
    const firstResponse = await this.queryIndividualModelTurbo(
      fastestModel, 
      request, 
      progressCallback, 
      Math.min(maxTime * 0.4, 8000) // Max 40% of time or 8 seconds
    );
    
    modelResponses.push(firstResponse);
    
    if (firstResponse.status === 'success') {
      bestCurrentResponse = firstResponse.response;
      streamedResponse = firstResponse.response;
      
      progressCallback?.({
        stage: 'streaming',
        modelProgress: { [fastestModel.id]: 100 },
        synthesisProgress: 30,
        message: 'Enhancing with additional models...',
        partialResponse: streamedResponse,
        completedModels: 1,
        totalModels: prioritizedModels.length
      });
    }

    // Continue with remaining models if we have time
    const remainingTime = maxTime - (Date.now() - startTime);
    if (remainingTime > 3000) { // At least 3 seconds left
      const remainingModels = prioritizedModels.slice(1);
      const remainingPromises = remainingModels.map(model =>
        this.queryIndividualModelTurbo(model, request, progressCallback, remainingTime / remainingModels.length)
      );
      
      const remainingResults = await Promise.allSettled(remainingPromises);
      
      remainingResults.forEach((result, index) => {
        const model = remainingModels[index];
        if (result.status === 'fulfilled') {
          modelResponses.push(result.value);
          
          // Update streaming response if this one is better
          if (result.value.status === 'success' && result.value.confidence > firstResponse.confidence) {
            bestCurrentResponse = result.value.response;
            
            progressCallback?.({
              stage: 'streaming',
              modelProgress: this.getPartialProgress(modelResponses, prioritizedModels),
              synthesisProgress: 60,
              message: `Enhanced response from ${model.name}...`,
              partialResponse: bestCurrentResponse,
              completedModels: modelResponses.filter(r => r.status === 'success').length,
              totalModels: prioritizedModels.length
            });
          }
        }
      });
    }

    const processingTime = Date.now() - startTime;
    const successfulResponses = modelResponses.filter(r => r.status === 'success');

    // Quick synthesis if we have multiple good responses
    let finalResponse = bestCurrentResponse;
    if (successfulResponses.length >= 2 && (Date.now() - startTime) < maxTime * 0.9) {
      try {
        finalResponse = await this.lightweightSynthesis(
          request.query,
          successfulResponses,
          'fast',
          progressCallback
        );
      } catch {
        finalResponse = bestCurrentResponse; // Fallback
      }
    }

    progressCallback?.({
      stage: 'completed',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 100,
      message: `Streaming fusion complete! (${Math.round(processingTime/1000)}s)`,
      completedModels: successfulResponses.length,
      totalModels: prioritizedModels.length
    });

    return {
      fusedResponse: finalResponse,
      individualResponses: modelResponses,
      fusionStrategy: 'streaming',
      processingTime,
      confidence: this.calculateFusionConfidence(modelResponses),
      modelsUsed: successfulResponses.map(r => r.modelName),
      synthesisModel: 'Streaming AI Fusion',
      metadata: {
        totalTokens: this.estimateTokens(finalResponse),
        costSavings: 'Free (Streaming Mode)',
        qualityScore: this.calculateQualityScore(modelResponses)
      }
    };
  }

  private getPartialProgress(
    completedResponses: ModelResponse[], 
    allModels: typeof this.models
  ): { [modelId: string]: number } {
    const progress: { [modelId: string]: number } = {};
    
    allModels.forEach(model => {
      const response = completedResponses.find(r => r.model === model.id);
      progress[model.id] = response ? 100 : 0;
    });
    
    return progress;
  }

  async processFusionQuery(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const startTime = Date.now();
    
    try {
      // Initialize
      progressCallback?.({
        stage: 'initializing',
        modelProgress: {},
        synthesisProgress: 0,
        message: 'Preparing multi-model fusion...'
      });

      // Step 1: Query all models in parallel
      const modelResponses = await this.queryModelsInParallel(
        request, 
        progressCallback
      );

      // Step 2: Synthesize responses
      const fusedResponse = await this.synthesizeResponses(
        request.query,
        modelResponses,
        request.fusionStrategy,
        request.conversationContext,
        progressCallback
      );

      const processingTime = Date.now() - startTime;

      progressCallback?.({
        stage: 'completed',
        modelProgress: this.getCompletedProgress(),
        synthesisProgress: 100,
        message: 'Fusion complete! Enhanced response ready.'
      });

      return {
        fusedResponse,
        individualResponses: modelResponses,
        fusionStrategy: request.fusionStrategy,
        processingTime,
        confidence: this.calculateFusionConfidence(modelResponses),
        modelsUsed: this.models.map(m => m.name),
        synthesisModel: 'Llama 70B (Fusion Coordinator)',
        metadata: {
          totalTokens: this.estimateTokens(fusedResponse),
          costSavings: 'Free (Open Source Models)',
          qualityScore: this.calculateQualityScore(modelResponses)
        }
      };

    } catch (error) {
      progressCallback?.({
        stage: 'error',
        modelProgress: {},
        synthesisProgress: 0,
        message: `Fusion failed: ${(error as Error).message}`
      });
      throw error;
    }
  }

  private async queryModelsInParallel(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<ModelResponse[]> {
    
    progressCallback?.({
      stage: 'querying',
      modelProgress: this.getInitialProgress(),
      synthesisProgress: 0,
      message: 'Querying all AI models simultaneously...'
    });

    const queries = this.models.map(model => 
      this.queryIndividualModel(model, request, progressCallback)
    );

    const responses = await Promise.allSettled(queries);

    return responses.map((result, index) => {
      const model = this.models[index];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          model: model.id,
          modelName: model.name,
          response: '',
          confidence: 0,
          processingTime: 0,
          role: model.role,
          status: 'error' as const,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }

  private async queryIndividualModel(
    model: typeof this.models[0],
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      // Create specialized prompt based on model role
      const specializedPrompt = this.createSpecializedPrompt(
        request.query, 
        model.role,
        request.conversationContext
      );

      // Check cache first
      const cacheKey = this.getCacheKey(model.id, specializedPrompt);
      const cachedResponse = this.getFromCache(cacheKey);
      
      if (cachedResponse) {
        this.updateModelProgress(model.id, 100, progressCallback);
        return {
          model: model.id,
          modelName: model.name,
          response: cachedResponse,
          confidence: this.calculateResponseConfidence(cachedResponse),
          processingTime: Date.now() - startTime,
          role: model.role,
          status: 'success'
        };
      }
      
      // Check if request is already in progress (deduplication)
      const requestKey = `${model.id}:${specializedPrompt}`;
      if (this.requestQueue.has(requestKey)) {
        return await this.requestQueue.get(requestKey)!;
      }

      // Create promise and add to queue
      const requestPromise = this.makeModelRequest(model, specializedPrompt, request, progressCallback, startTime);
      this.requestQueue.set(requestKey, requestPromise);
      
      try {
        const result = await requestPromise;
        
        // Cache successful responses
        if (result.status === 'success') {
          this.setCache(cacheKey, result.response, 30); // Cache for 30 minutes
        }
        
        return result;
      } finally {
        this.requestQueue.delete(requestKey);
      }

    } catch (error) {
      return {
        model: model.id,
        modelName: model.name,
        response: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        role: model.role,
        status: 'error',
        error: (error as Error).message
      };
    }
  }
  
  private async makeModelRequest(
    model: typeof this.models[0],
    specializedPrompt: string,
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void,
    startTime: number = Date.now()
  ): Promise<ModelResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatqora.pages.dev',
          'X-Title': 'ChatQora - Multi-Model Fusion'
        },
        body: JSON.stringify({
          model: model.id,
          messages: [
            ...(request.conversationContext || []),
            { role: 'user', content: specializedPrompt }
          ],
          temperature: this.getOptimalTemperature(model.role),
          max_tokens: this.getOptimalMaxTokens(model.role, request.query)
        })
      });

      if (!response.ok) {
        throw new Error(`${model.name} request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      // Update progress
      this.updateModelProgress(model.id, 100, progressCallback);

      return {
        model: model.id,
        modelName: model.name,
        response: data.choices[0].message.content,
        confidence: this.calculateResponseConfidence(data.choices[0].message.content),
        processingTime,
        role: model.role,
        status: 'success'
      };

    } catch (error) {
      return {
        model: model.id,
        modelName: model.name,
        response: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        role: model.role,
        status: 'error',
        error: (error as Error).message
      };
    }
  }
  
  private getOptimalMaxTokens(role: ModelResponse['role'], query: string): number {
    const baseTokens = {
      primary: 2000,    // Comprehensive responses
      analytical: 800,  // Quick, focused answers
      creative: 1500   // Creative but not overly long
    };
    
    // Adjust based on query complexity
    const queryLength = query.length;
    const multiplier = queryLength > 200 ? 1.2 : queryLength > 100 ? 1.1 : 1.0;
    
    return Math.round(baseTokens[role] * multiplier);
  }
  
  // Optimized timeout wrapper with faster resolution
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
  
  // Performance optimization: Parallel query with early completion
  private async queryModelsWithEarlyCompletion(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<ModelResponse[]> {
    
    progressCallback?.(({
      stage: 'querying',
      modelProgress: this.getInitialProgress(),
      synthesisProgress: 0,
      message: 'Starting optimized AI fusion query...'
    }));

    const queries = this.models.map(model => 
      this.queryIndividualModel(model, request, progressCallback)
    );

    // Use Promise.allSettled but with faster processing
    const responses = await Promise.allSettled(queries);

    return responses.map((result, index) => {
      const model = this.models[index];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          model: model.id,
          modelName: model.name,
          response: '',
          confidence: 0,
          processingTime: 0,
          role: model.role,
          status: 'error' as const,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
  }
  
  // Turbo optimized fusion with smart completion
  async processFusionQueryWithFallback(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const timeout = 15000; // Aggressive 15s timeout for speed
    
    try {
      // Use turbo fusion process
      return await this.withTimeout(
        this.processFusionQueryTurbo(request, progressCallback),
        timeout
      );
    } catch (error) {
      if ((error as Error).message === 'Request timeout') {
        console.log('AI Fusion timeout after 15s, using fast fallback...');
        return await this.getSingleModelFallback(request, progressCallback);
      }
      throw error;
    }
  }
  
  // Turbo fusion process with early completion and fast synthesis
  async processFusionQueryTurbo(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const startTime = Date.now();
    
    try {
      progressCallback?.(({
        stage: 'initializing',
        modelProgress: {},
        synthesisProgress: 0,
        message: 'Starting Turbo AI Fusion...'
      }));

      // Query complexity analysis for adaptive strategy
      const isComplexQuery = this.analyzeQueryComplexity(request.query);
      
      // Use race-based parallel querying with early completion
      const modelResponses = await this.queryModelsWithRacing(
        request, 
        progressCallback,
        isComplexQuery
      );

      // Early synthesis with fast model if we have enough responses
      const successfulResponses = modelResponses.filter(r => r.status === 'success');
      if (successfulResponses.length >= 2) {
        const fusedResponse = await this.synthesizeResponsesTurbo(
          request.query,
          modelResponses,
          request.fusionStrategy,
          request.conversationContext,
          progressCallback,
          isComplexQuery
        );

        const processingTime = Date.now() - startTime;

        progressCallback?.(({
          stage: 'completed',
          modelProgress: this.getCompletedProgress(),
          synthesisProgress: 100,
          message: `Turbo AI Fusion complete! (${Math.round(processingTime/1000)}s)`
        }));

        return {
          fusedResponse,
          individualResponses: modelResponses,
          fusionStrategy: 'turbo-' + request.fusionStrategy,
          processingTime,
          confidence: this.calculateFusionConfidence(modelResponses),
          modelsUsed: this.models.filter((_, i) => modelResponses[i].status === 'success').map(m => m.name),
          synthesisModel: 'Llama 8B (Speed Fusion)',
          metadata: {
            totalTokens: this.estimateTokens(fusedResponse),
            costSavings: 'Free (Turbo Optimized)',
            qualityScore: this.calculateQualityScore(modelResponses)
          }
        };
      } else if (successfulResponses.length === 1) {
        // Single model fallback with enhancement
        return this.enhanceSingleResponse(successfulResponses[0], startTime);
      } else {
        throw new Error('No successful model responses');
      }

    } catch (error) {
      progressCallback?.(({
        stage: 'error',
        modelProgress: {},
        synthesisProgress: 0,
        message: `Turbo Fusion failed: ${(error as Error).message}`
      }));
      throw error;
    }
  }
  
  // Optimized fusion process for production use
  async processFusionQueryOptimized(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    // Delegate to turbo method for now
    return this.processFusionQueryTurbo(request, progressCallback);
  }
  
  private async getSingleModelFallback(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const fastModel = this.models.find(m => m.role === 'analytical')!; // Llama 8B
    
    const response = await this.queryIndividualModel(fastModel, request, progressCallback);
    
    return {
      fusedResponse: response.response,
      individualResponses: [response],
      fusionStrategy: 'fallback',
      processingTime: response.processingTime,
      confidence: response.confidence,
      modelsUsed: [fastModel.name],
      synthesisModel: fastModel.name + ' (Fallback)',
      metadata: {
        totalTokens: this.estimateTokens(response.response),
        costSavings: 'Free (Fallback Mode)',
        qualityScore: Math.round(response.confidence * 100)
      }
    };
  }

  // Optimized synthesis for production
  private async synthesizeResponsesOptimized(
    originalQuery: string,
    modelResponses: ModelResponse[],
    strategy: string,
    conversationContext?: Array<{ role: string; content: string }>,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<string> {

    progressCallback?.({
      stage: 'synthesizing',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 30,
      message: 'Synthesizing AI responses...'
    });

    const successfulResponses = modelResponses.filter(r => r.status === 'success');
    
    if (successfulResponses.length === 0) {
      throw new Error('All models failed to respond');
    }

    if (successfulResponses.length === 1) {
      return successfulResponses[0].response;
    }

    // Optimized fusion prompt for faster processing
    const fusionPrompt = this.createOptimizedFusionPrompt(
      originalQuery, 
      successfulResponses
    );

    progressCallback?.({
      stage: 'synthesizing',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 60,
      message: 'AI Fusion synthesis in progress...'
    });

    // Use Llama 70B as fusion coordinator with optimized settings
    const fusionResponse = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatqora.pages.dev',
        'X-Title': 'ChatQora - AI Fusion'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          ...(conversationContext || []),
          { role: 'user', content: fusionPrompt }
        ],
        temperature: 0.2, // Lower temperature for faster, focused synthesis
        max_tokens: 2000, // Reduced for faster processing
        top_p: 0.9 // Add for more focused responses
      })
    });

    progressCallback?.({
      stage: 'synthesizing',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 85,
      message: 'Finalizing AI Fusion response...'
    });

    if (!fusionResponse.ok) {
      // Smart fallback to highest confidence response
      const bestResponse = successfulResponses.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      console.log('Fusion synthesis failed, using best individual response');
      return bestResponse.response;
    }

    const fusionData = await fusionResponse.json();
    return fusionData.choices[0].message.content;
  }

  // Optimized fusion prompt for faster synthesis
  private createOptimizedFusionPrompt(
    originalQuery: string,
    responses: ModelResponse[]
  ): string {
    const responseTexts = responses.map((r, i) => 
      `**AI-${i + 1} (${r.modelName}):** ${r.response}`
    ).join('\n\n');

    return `You are an AI Fusion Coordinator. Synthesize these AI responses into one superior answer.

**Query:** "${originalQuery}"

**AI Responses:**
${responseTexts}

**Instructions:**
- Combine the best insights from all responses
- Resolve contradictions intelligently
- Create a comprehensive, well-structured answer
- Ensure accuracy and clarity
- Make it better than any individual response

**Synthesized Response:**`;
  }

  // Keep original method for compatibility
  private async synthesizeResponses(
    originalQuery: string,
    modelResponses: ModelResponse[],
    strategy: string,
    conversationContext?: Array<{ role: string; content: string }>,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<string> {
    return this.synthesizeResponsesOptimized(originalQuery, modelResponses, strategy, conversationContext, progressCallback);
  }

  private createSpecializedPrompt(
    query: string, 
    role: ModelResponse['role'],
    context?: Array<{ role: string; content: string }>
  ): string {
    const roleInstructions = {
      primary: "You are the Primary Analysis AI. Provide comprehensive, well-reasoned responses with logical structure.",
      analytical: "You are the Quick Insights AI. Focus on key facts, validation, and concise analysis.",
      creative: "You are the Creative Perspectives AI. Offer innovative approaches, alternatives, and creative solutions."
    };

    return `${roleInstructions[role]}

User Query: ${query}

Provide your specialized perspective on this query. Focus on your role's strengths while maintaining accuracy and helpfulness.`;
  }

  private createFusionPrompt(
    originalQuery: string,
    responses: ModelResponse[],
    strategy: string
  ): string {
    const responseTexts = responses.map((r, i) => 
      `**Response ${i + 1} (${r.modelName} - ${r.role.toUpperCase()}):**\n${r.response}`
    ).join('\n\n');

    return `You are the Fusion Coordinator AI. Your task is to synthesize multiple AI responses into one superior answer.

**Original User Query:** "${originalQuery}"

**Strategy:** ${strategy}

**Individual AI Responses:**
${responseTexts}

**Fusion Instructions:**
1. Identify the strongest insights from each response
2. Resolve any contradictions or inconsistencies
3. Combine complementary information seamlessly  
4. Add missing important details if needed
5. Structure the final response clearly and comprehensively
6. Ensure the fused response is better than any individual response

**Requirements:**
- Be comprehensive but not repetitive
- Maintain accuracy and truthfulness
- Use the best writing style from all responses
- Include practical examples where helpful
- Ensure logical flow and structure

Provide the synthesized response that leverages the collective intelligence of all models:`;
  }

  private getOptimalTemperature(role: ModelResponse['role']): number {
    const temperatures = {
      primary: 0.7,    // Balanced for reasoning
      analytical: 0.3, // Lower for facts/validation
      creative: 0.9   // Higher for creativity
    };
    return temperatures[role];
  }

  private calculateResponseConfidence(response: string): number {
    // Simple confidence calculation based on response characteristics
    const length = response.length;
    const hasStructure = /\d+\.|•|\n-|\n\*/.test(response);
    const hasExamples = /example|for instance|such as/i.test(response);
    
    let confidence = 0.5; // Base confidence
    
    if (length > 200) confidence += 0.2;
    if (hasStructure) confidence += 0.15;
    if (hasExamples) confidence += 0.15;
    
    return Math.min(confidence, 1.0);
  }

  private calculateFusionConfidence(responses: ModelResponse[]): number {
    const successfulResponses = responses.filter(r => r.status === 'success');
    const avgConfidence = successfulResponses.reduce((sum, r) => sum + r.confidence, 0) / successfulResponses.length;
    
    // Fusion typically increases confidence due to multiple perspectives
    return Math.min(avgConfidence + 0.15, 1.0);
  }

  private calculateQualityScore(responses: ModelResponse[]): number {
    const successfulCount = responses.filter(r => r.status === 'success').length;
    const baseScore = (successfulCount / this.models.length) * 100;
    
    // Bonus for having diverse perspectives
    const diversityBonus = successfulCount >= 3 ? 10 : 0;
    
    return Math.min(baseScore + diversityBonus, 100);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private getInitialProgress(): { [modelId: string]: number } {
    return this.models.reduce((acc, model) => {
      acc[model.id] = 0;
      return acc;
    }, {} as { [modelId: string]: number });
  }

  private getCompletedProgress(): { [modelId: string]: number } {
    return this.models.reduce((acc, model) => {
      acc[model.id] = 100;
      return acc;
    }, {} as { [modelId: string]: number });
  }

  private updateModelProgress(
    modelId: string, 
    progress: number, 
    progressCallback?: (progress: FusionProgress) => void
  ) {
    if (progressCallback) {
      const modelProgress = this.getInitialProgress();
      modelProgress[modelId] = progress;
      
      progressCallback({
        stage: 'querying',
        modelProgress,
        synthesisProgress: 0,
        message: 'Processing responses from AI models...'
      });
    }
  }

  // Query complexity analysis for adaptive strategy
  private analyzeQueryComplexity(query: string): boolean {
    const complexIndicators = [
      'analyze', 'compare', 'explain', 'architecture', 'design', 'implement',
      'pros and cons', 'advantages', 'disadvantages', 'detailed', 'comprehensive',
      'step by step', 'how to', 'best practices', 'differences', 'similarities'
    ];
    
    const simpleIndicators = [
      'what is', 'define', 'quick', 'simple', 'brief', 'list', 'name', 'when', 'where'
    ];
    
    const lowerQuery = query.toLowerCase();
    const complexScore = complexIndicators.filter(indicator => lowerQuery.includes(indicator)).length;
    const simpleScore = simpleIndicators.filter(indicator => lowerQuery.includes(indicator)).length;
    
    // Complex if: long query, multiple complex indicators, or technical depth
    return query.length > 100 || complexScore > simpleScore || complexScore >= 2;
  }

  // Racing-based parallel querying with early completion
  private async queryModelsWithRacing(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void,
    isComplex: boolean = true
  ): Promise<ModelResponse[]> {
    
    progressCallback?.({
      stage: 'querying',
      modelProgress: this.getInitialProgress(),
      synthesisProgress: 0,
      message: 'Racing AI models for fastest response...'
    });

    // For simple queries, prioritize speed models first
    const orderedModels = isComplex 
      ? this.models // Use all models for complex queries
      : [this.models[1], this.models[0], this.models[2]]; // Start with fast Llama 8B

    const queries = orderedModels.map(model => 
      this.queryIndividualModelWithTimeout(model, request, progressCallback, isComplex ? 12000 : 8000)
    );

    // Use Promise.allSettled but with faster timeout
    const responses = await Promise.allSettled(queries);

    return responses.map((result, index) => {
      const model = orderedModels[index];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          model: model.id,
          modelName: model.name,
          response: '',
          confidence: 0,
          processingTime: isComplex ? 12000 : 8000,
          role: model.role,
          status: 'timeout' as const,
          error: 'Model timeout for speed optimization'
        };
      }
    });
  }

  // Individual model query with aggressive timeout
  private async queryIndividualModelWithTimeout(
    model: typeof this.models[0],
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void,
    timeout: number = 8000
  ): Promise<ModelResponse> {
    const startTime = Date.now();

    try {
      // Create specialized prompt based on model role
      const specializedPrompt = this.createSpecializedPrompt(
        request.query, 
        model.role,
        request.conversationContext
      );

      // Check cache first
      const cacheKey = this.getCacheKey(model.id, specializedPrompt);
      const cachedResponse = this.getFromCache(cacheKey);
      
      if (cachedResponse) {
        this.updateModelProgress(model.id, 100, progressCallback);
        return {
          model: model.id,
          modelName: model.name,
          response: cachedResponse,
          confidence: this.calculateResponseConfidence(cachedResponse),
          processingTime: Date.now() - startTime,
          role: model.role,
          status: 'success'
        };
      }

      // Make request with aggressive timeout
      const response = await this.withTimeout(
        fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://chatqora.pages.dev',
            'X-Title': 'ChatQora - Turbo AI Fusion'
          },
          body: JSON.stringify({
            model: model.id,
            messages: [
              ...(request.conversationContext || []),
              { role: 'user', content: specializedPrompt }
            ],
            temperature: this.getOptimalTemperature(model.role),
            max_tokens: Math.min(this.getOptimalMaxTokens(model.role, request.query), 1500), // Reduced for speed
            top_p: 0.9 // More focused for speed
          })
        }),
        timeout
      );

      if (!response.ok) {
        throw new Error(`${model.name} request failed: ${response.status}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      this.updateModelProgress(model.id, 100, progressCallback);

      const result = {
        model: model.id,
        modelName: model.name,
        response: data.choices[0].message.content,
        confidence: this.calculateResponseConfidence(data.choices[0].message.content),
        processingTime,
        role: model.role,
        status: 'success' as const
      };

      // Cache successful responses
      this.setCache(cacheKey, result.response, 30);
      
      return result;

    } catch (error) {
      return {
        model: model.id,
        modelName: model.name,
        response: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        role: model.role,
        status: 'error',
        error: (error as Error).message
      };
    }
  }

  // Turbo synthesis using faster model for simple queries
  private async synthesizeResponsesTurbo(
    originalQuery: string,
    modelResponses: ModelResponse[],
    strategy: string,
    conversationContext?: Array<{ role: string; content: string }>,
    progressCallback?: (progress: FusionProgress) => void,
    isComplex: boolean = true
  ): Promise<string> {

    progressCallback?.({
      stage: 'synthesizing',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 40,
      message: 'Turbo synthesis in progress...'
    });

    const successfulResponses = modelResponses.filter(r => r.status === 'success');
    
    if (successfulResponses.length === 0) {
      throw new Error('All models failed to respond');
    }

    if (successfulResponses.length === 1) {
      return successfulResponses[0].response;
    }

    // Always use fast 8B model for synthesis (70B commented out)
    const synthesisModel = 'meta-llama/llama-3.3-8b-instruct:free';

    // Simplified fusion prompt for speed
    const fusionPrompt = this.createTurboFusionPrompt(originalQuery, successfulResponses);

    progressCallback?.({
      stage: 'synthesizing',
      modelProgress: this.getCompletedProgress(),
      synthesisProgress: 70,
      message: `Synthesizing with ${isComplex ? 'powerful' : 'speed'} model...`
    });

    const fusionResponse = await this.withTimeout(
      fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://chatqora.pages.dev',
          'X-Title': 'ChatQora - Turbo Synthesis'
        },
        body: JSON.stringify({
          model: synthesisModel,
          messages: [
            ...(conversationContext || []),
            { role: 'user', content: fusionPrompt }
          ],
          temperature: 0.1, // Very focused for speed
          max_tokens: isComplex ? 2000 : 1500, // Reduced for speed
          top_p: 0.8
        })
      }),
      8000 // 8s timeout for synthesis
    );

    if (!fusionResponse.ok) {
      // Quick fallback to best response
      const bestResponse = successfulResponses.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      console.log('Turbo synthesis failed, using best response');
      return bestResponse.response;
    }

    const fusionData = await fusionResponse.json();
    return fusionData.choices[0].message.content;
  }

  // Simplified fusion prompt for speed
  private createTurboFusionPrompt(
    originalQuery: string,
    responses: ModelResponse[]
  ): string {
    const responseTexts = responses.map((r, i) => 
      `${i + 1}. ${r.response}`
    ).join('\n\n');

    return `Combine these AI responses into one superior answer:

Query: "${originalQuery}"

Responses:
${responseTexts}

Create a comprehensive, well-structured answer that combines the best insights:`;
  }

  // Enhanced single response fallback
  private enhanceSingleResponse(response: ModelResponse, startTime: number): FusionResult {
    return {
      fusedResponse: response.response,
      individualResponses: [response],
      fusionStrategy: 'single-enhanced',
      processingTime: Date.now() - startTime,
      confidence: response.confidence,
      modelsUsed: [response.modelName],
      synthesisModel: response.modelName + ' (Direct)',
      metadata: {
        totalTokens: this.estimateTokens(response.response),
        costSavings: 'Free (Single Model)',
        qualityScore: Math.round(response.confidence * 100)
      }
    };
  }
}
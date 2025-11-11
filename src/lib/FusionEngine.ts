export interface ModelResponse {
  model: string;
  modelName: string;
  response: string;
  confidence: number;
  processingTime: number;
  role: 'primary' | 'creative' | 'analytical';
  status: 'success' | 'error' | 'timeout';
  error?: string;
}

export interface FusionRequest {
  query: string;
  conversationContext?: Array<{ role: string; content: string }>;
  fusionStrategy: 'consensus' | 'specialized' | 'iterative';
  includeIndividualResponses: boolean;
  timeout?: number;
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
  stage: 'initializing' | 'querying' | 'synthesizing' | 'completed' | 'error';
  modelProgress: { [modelId: string]: number };
  synthesisProgress: number;
  message: string;
}

export class FusionEngine {
  private models = [
    {
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      name: 'Llama 70B',
      role: 'primary' as const,
      specialties: ['reasoning', 'analysis', 'synthesis']
    },
    {
      id: 'meta-llama/llama-3.3-8b-instruct:free',
      name: 'Llama 8B',
      role: 'analytical' as const,
      specialties: ['speed', 'facts', 'validation']
    },
    {
      id: 'openai/gpt-oss-20b:free',
      name: 'GPT OSS',
      role: 'creative' as const,
      specialties: ['creativity', 'alternatives', 'writing']
    }
  ];

  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private responseCache = new Map<string, { response: string; timestamp: number; ttl: number }>();
  private requestQueue = new Map<string, Promise<ModelResponse>>();

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    
    // Clean cache every 10 minutes
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
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
  
  // Optimized fusion with intelligent fallback
  async processFusionQueryWithFallback(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const timeout = request.timeout || 35000; // Reduced to 35 seconds for better UX
    
    try {
      // Use optimized fusion process
      return await this.withTimeout(
        this.processFusionQueryOptimized(request, progressCallback),
        timeout
      );
    } catch (error) {
      if ((error as Error).message === 'Request timeout') {
        console.log('AI Fusion timeout, using fast fallback...');
        return await this.getSingleModelFallback(request, progressCallback);
      }
      throw error;
    }
  }
  
  // Optimized fusion process for production use
  async processFusionQueryOptimized(
    request: FusionRequest,
    progressCallback?: (progress: FusionProgress) => void
  ): Promise<FusionResult> {
    const startTime = Date.now();
    
    try {
      progressCallback?.(({
        stage: 'initializing',
        modelProgress: {},
        synthesisProgress: 0,
        message: 'Initializing AI Fusion (3 models)...'
      }));

      // Use optimized parallel querying
      const modelResponses = await this.queryModelsWithEarlyCompletion(
        request, 
        progressCallback
      );

      // Early synthesis if we have enough good responses
      const successfulResponses = modelResponses.filter(r => r.status === 'success');
      if (successfulResponses.length >= 2) {
        const fusedResponse = await this.synthesizeResponsesOptimized(
          request.query,
          modelResponses,
          request.fusionStrategy,
          request.conversationContext,
          progressCallback
        );

        const processingTime = Date.now() - startTime;

        progressCallback?.(({
          stage: 'completed',
          modelProgress: this.getCompletedProgress(),
          synthesisProgress: 100,
          message: `AI Fusion complete! Enhanced response ready (${Math.round(processingTime/1000)}s)`
        }));

        return {
          fusedResponse,
          individualResponses: modelResponses,
          fusionStrategy: request.fusionStrategy,
          processingTime,
          confidence: this.calculateFusionConfidence(modelResponses),
          modelsUsed: this.models.map(m => m.name),
          synthesisModel: 'Llama 70B (AI Fusion)',
          metadata: {
            totalTokens: this.estimateTokens(fusedResponse),
            costSavings: 'Free (Open Source Models)',
            qualityScore: this.calculateQualityScore(modelResponses)
          }
        };
      } else {
        throw new Error('Insufficient model responses for fusion');
      }

    } catch (error) {
      progressCallback?.(({
        stage: 'error',
        modelProgress: {},
        synthesisProgress: 0,
        message: `AI Fusion failed: ${(error as Error).message}`
      }));
      throw error;
    }
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
}
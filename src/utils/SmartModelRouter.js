/**
 * Smart Model Router - Intelligent AI model selection for optimal performance
 * 
 * Based on comprehensive testing of free models on OpenRouter:
 * - Llama 3.3 8B: 100% reliable, fast (1-2s), primary choice
 * - GPT OSS 20B: 78% reliable, exceptional quality (1752 tokens), complex requests
 * - Qwen2.5 VL 32B: Limited availability, vision only, heavy rate limiting
 */

export class SmartModelRouter {
  constructor() {
    this.models = {
      primary: 'meta-llama/llama-3.3-8b-instruct:free',
      quality: 'openai/gpt-oss-20b:free', 
      vision: 'qwen/qwen2.5-vl-32b-instruct:free'
    };
    
    this.rateLimiting = {
      lastGptRequest: 0,
      lastVisionRequest: 0,
      minGptInterval: 25000,    // 25 seconds for GPT OSS 20B
      minVisionInterval: 300000  // 5 minutes for vision model (heavily rate limited)
    };
    
    this.stats = {
      totalRequests: 0,
      modelUsage: {},
      failures: {},
      successStreak: {}
    };

    // Initialize model stats
    Object.values(this.models).forEach(model => {
      this.stats.modelUsage[model] = 0;
      this.stats.failures[model] = 0;
      this.stats.successStreak[model] = 0;
    });
  }

  /**
   * Main routing method - analyzes request and routes to optimal model
   */
  async routeRequest(message, attachments = [], options = {}) {
    this.stats.totalRequests++;
    
    try {
      // Determine request type and optimal model
      const routingDecision = this.analyzeRequest(message, attachments, options);
      
      // Get response with intelligent fallback
      const response = await this.getResponse(routingDecision);
      
      // Track success
      this.trackSuccess(routingDecision.model);
      
      return {
        ...response,
        routingInfo: {
          strategy: routingDecision.strategy,
          model: routingDecision.model,
          reason: routingDecision.reason,
          complexity: routingDecision.complexity
        }
      };
    } catch (error) {
      // Handle failures with smart fallback
      return await this.handleFailure(message, attachments, error, options);
    }
  }

  /**
   * Analyze request type and determine routing strategy
   */
  analyzeRequest(message, attachments, options) {
    // Vision request detection
    if (attachments && attachments.length > 0) {
      return this.routeVisionRequest(message, attachments);
    }
    
    // Text request routing
    return this.routeTextRequest(message, options);
  }

  /**
   * Handle vision requests with fallback strategy
   */
  routeVisionRequest(message, attachments) {
    const timeSinceVision = Date.now() - this.rateLimiting.lastVisionRequest;
    const visionReliability = this.getModelReliability('vision');
    
    // Check if vision model is likely to be rate limited
    if (timeSinceVision < this.rateLimiting.minVisionInterval || visionReliability < 0.3) {
      return {
        strategy: 'vision_fallback',
        model: this.models.primary,
        message: this.generateVisionFallbackMessage(message),
        attachments: [], // Remove attachments for text-only model
        requiresImageAnalysis: false,
        fallbackReason: timeSinceVision < this.rateLimiting.minVisionInterval ? 
          'Vision model rate limited' : 'Vision model unreliable',
        reason: 'Vision analysis unavailable - providing text assistance'
      };
    }
    
    this.rateLimiting.lastVisionRequest = Date.now();
    return {
      strategy: 'vision',
      model: this.models.vision,
      message,
      attachments,
      requiresImageAnalysis: true,
      reason: 'Vision model available for image analysis'
    };
  }

  /**
   * Route text requests based on complexity and model availability
   */
  routeTextRequest(message, options = {}) {
    const complexity = this.assessComplexity(message);
    const qualityPriority = options.qualityPriority || complexity.isComplex;
    const timeSinceGpt = Date.now() - this.rateLimiting.lastGptRequest;
    const gptReliability = this.getModelReliability('quality');
    
    // Use GPT OSS 20B for high quality when available and reliable
    if (qualityPriority && 
        !options.fallback && // Don't use GPT if this is already a fallback attempt
        timeSinceGpt > this.rateLimiting.minGptInterval && 
        gptReliability > 0.5) {
      
      this.rateLimiting.lastGptRequest = Date.now();
      return {
        strategy: 'quality',
        model: this.models.quality,
        message,
        complexity,
        reason: `High-quality response requested (complexity: ${complexity.score}, available)`
      };
    }
    
    // Default to reliable Llama 3.3 8B
    return {
      strategy: 'reliable',
      model: this.models.primary,
      message,
      complexity,
      reason: qualityPriority ? 
        'Primary model (GPT unavailable/rate limited)' : 
        'Primary reliable model for standard request'
    };
  }

  /**
   * Assess message complexity for routing decisions
   */
  assessComplexity(message) {
    const indicators = {
      technical: /\b(explain|algorithm|code|function|programming|technical|implementation|architecture|design|system|recursion|quantum|database)\b/i,
      educational: /\b(learn|teach|tutorial|guide|how to|step by step|comprehensive|detailed|thorough)\b/i,
      analytical: /\b(analyze|compare|evaluate|pros and cons|advantages|disadvantages|assessment|review)\b/i,
      creative: /\b(write|create|generate|story|poem|essay|article|blog|creative|compose)\b/i,
      longForm: message.length > 200,
      coding: /\b(python|javascript|java|code|function|class|method|variable|loop|if|else)\b/i,
      mathematical: /\b(calculate|formula|equation|math|statistics|probability|fibonacci)\b/i
    };
    
    const matches = Object.entries(indicators).filter(([key, regex]) => 
      key === 'longForm' ? regex : regex.test(message)
    );
    
    const score = matches.length + (message.length > 500 ? 2 : 0);
    
    return {
      isComplex: score >= 2 || matches.some(([key]) => key === 'technical' || key === 'coding'),
      indicators: matches.map(([key]) => key),
      score,
      requiresQuality: score >= 3 || matches.some(([key]) => 
        ['technical', 'educational', 'analytical'].includes(key)
      )
    };
  }

  /**
   * Execute the routing decision and get response
   */
  async getResponse(routingDecision) {
    const { strategy, model, message, attachments } = routingDecision;
    
    if (strategy === 'vision_fallback') {
      return {
        response: routingDecision.message,
        model: 'system_fallback',
        strategy: 'vision_fallback',
        fallbackReason: routingDecision.fallbackReason,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };
    }
    
    try {
      const response = await this.callModel(model, message, attachments);
      return {
        ...response,
        strategy,
        actualModel: model
      };
    } catch (error) {
      throw new ModelError(error.message, model, strategy);
    }
  }

  /**
   * Handle model failures with intelligent fallback
   */
  async handleFailure(originalMessage, attachments, error, options) {
    console.log(`Model failure (${error.model}): ${error.message}`);
    this.trackFailure(error.model, error.message);
    
    // If GPT OSS 20B failed, fall back to Llama 3.3 8B
    if (error.model === this.models.quality) {
      console.log('GPT OSS 20B failed - falling back to Llama 3.3 8B');
      return await this.routeRequest(originalMessage, attachments, {
        ...options,
        qualityPriority: false,
        fallback: true
      });
    }
    
    // If vision failed, provide helpful fallback
    if (error.model === this.models.vision) {
      return {
        response: this.generateVisionFallbackMessage(originalMessage),
        model: 'system_fallback',
        strategy: 'vision_error_fallback',
        error: error.message,
        routingInfo: {
          strategy: 'vision_error_fallback',
          reason: 'Vision model failed - providing text assistance'
        }
      };
    }
    
    // If primary model failed, this is serious
    throw new Error('Primary model unavailable. Service temporarily down.');
  }

  /**
   * Generate helpful fallback message for vision requests
   */
  generateVisionFallbackMessage(originalMessage) {
    const responses = [
      `I can see you've shared an image, but I'm currently unable to analyze images directly. However, I'd be happy to help! Could you describe what you see in the image, and I'll provide assistance based on your description?`,
      
      `Image analysis is temporarily unavailable, but I'm here to help in other ways! Please describe the image or tell me what specific information you're looking for, and I'll do my best to assist you.`,
      
      `I notice you've included an image with your message "${originalMessage}". While I can't analyze the image right now, I can help if you describe what's in the image or what you'd like to know about it.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Make API call to selected model
   */
  async callModel(model, message, attachments = []) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        model,
        attachments,
        conversationContext: []
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ModelError(errorData.error || 'Unknown error', model);
    }
    
    return await response.json();
  }

  /**
   * Analytics and reliability tracking
   */
  getModelReliability(modelType) {
    const model = this.models[modelType];
    const usage = this.stats.modelUsage[model] || 0;
    const failures = this.stats.failures[model] || 0;
    
    if (usage === 0) return 1.0; // No data, assume good
    return Math.max(0, (usage - failures) / usage);
  }

  trackSuccess(model) {
    this.stats.modelUsage[model] = (this.stats.modelUsage[model] || 0) + 1;
    this.stats.successStreak[model] = (this.stats.successStreak[model] || 0) + 1;
  }

  trackFailure(model, reason) {
    this.stats.failures[model] = (this.stats.failures[model] || 0) + 1;
    this.stats.modelUsage[model] = (this.stats.modelUsage[model] || 0) + 1;
    this.stats.successStreak[model] = 0; // Reset success streak
    
    console.log(`Model failure tracked: ${model} - ${reason}`);
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    const stats = { ...this.stats };
    stats.reliability = {};
    stats.nextAvailable = {};
    
    Object.keys(this.models).forEach(type => {
      const model = this.models[type];
      stats.reliability[type] = this.getModelReliability(type);
      
      // Calculate when rate-limited models will be available
      if (type === 'quality') {
        const timeUntilAvailable = Math.max(0, 
          this.rateLimiting.minGptInterval - (Date.now() - this.rateLimiting.lastGptRequest)
        );
        stats.nextAvailable[type] = timeUntilAvailable;
      } else if (type === 'vision') {
        const timeUntilAvailable = Math.max(0,
          this.rateLimiting.minVisionInterval - (Date.now() - this.rateLimiting.lastVisionRequest)
        );
        stats.nextAvailable[type] = timeUntilAvailable;
      }
    });
    
    // Calculate distribution
    const totalRequests = Object.values(this.stats.modelUsage).reduce((a, b) => a + b, 0);
    stats.distribution = {};
    Object.keys(this.models).forEach(type => {
      const model = this.models[type];
      stats.distribution[type] = totalRequests > 0 ? 
        ((this.stats.modelUsage[model] || 0) / totalRequests * 100).toFixed(1) + '%' : '0%';
    });
    
    return stats;
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage() {
    const stats = this.getStats();
    const messages = [];
    
    // Primary model status
    if (stats.reliability.primary > 0.95) {
      messages.push("🟢 Primary AI model running smoothly");
    } else {
      messages.push("🟡 Primary AI model experiencing issues");
    }
    
    // Quality model status
    if (stats.nextAvailable.quality > 0) {
      const minutes = Math.ceil(stats.nextAvailable.quality / 60000);
      messages.push(`🟡 High-quality mode available in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    } else if (stats.reliability.quality > 0.7) {
      messages.push("🟢 High-quality mode available");
    } else {
      messages.push("🔴 High-quality mode temporarily unavailable");
    }
    
    // Vision model status
    if (stats.nextAvailable.vision > 0) {
      const minutes = Math.ceil(stats.nextAvailable.vision / 60000);
      messages.push(`🔴 Image analysis available in ${minutes} minute${minutes !== 1 ? 's' : ''}`);
    } else if (stats.reliability.vision > 0.3) {
      messages.push("🟡 Image analysis available (limited)");
    } else {
      messages.push("🔴 Image analysis currently unavailable");
    }
    
    return messages;
  }
}

/**
 * Custom error class for model-related errors
 */
export class ModelError extends Error {
  constructor(message, model, strategy = null) {
    super(message);
    this.name = 'ModelError';
    this.model = model;
    this.strategy = strategy;
  }
}

/**
 * Singleton instance for global use
 */
export const modelRouter = new SmartModelRouter();

/**
 * React hook for easy integration
 */
export const useSmartModelRouter = () => {
  const [stats, setStats] = useState(modelRouter.getStats());
  
  const routeRequest = async (message, attachments = [], options = {}) => {
    const result = await modelRouter.routeRequest(message, attachments, options);
    setStats(modelRouter.getStats()); // Update stats after each request
    return result;
  };
  
  const refreshStats = () => {
    setStats(modelRouter.getStats());
  };
  
  return {
    routeRequest,
    stats,
    refreshStats,
    statusMessage: modelRouter.getStatusMessage()
  };
};
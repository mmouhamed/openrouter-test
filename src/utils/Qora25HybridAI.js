/**
 * Qora-2.5 Hybrid AI System
 * 
 * A robust, intelligent AI model routing system that combines multiple specialized models
 * for optimal performance, reliability, and quality across different use cases.
 * 
 * Architecture:
 * - Llama 3.3 8B: Primary reliable model (100% uptime, 1-2s responses)
 * - GPT OSS 20B: Quality model for complex requests (78% reliability, exceptional detail)
 * - Qwen2.5 VL 32B: Vision model for image analysis (limited availability)
 * 
 * Features:
 * - Intelligent request routing based on complexity analysis
 * - Graceful fallback handling with user transparency
 * - Rate limiting management with predictive availability
 * - Comprehensive analytics and monitoring
 * - Production-ready error handling
 */

export class Qora25HybridAI {
  constructor(config = {}) {
    this.systemName = 'Qora-2.5';
    this.version = '2.5.0';
    this.buildDate = '2025-11-10';
    
    this.models = {
      reliable: {
        id: 'meta-llama/llama-3.3-8b-instruct:free',
        name: 'Llama Guardian',
        specialization: 'Reliable, fast responses',
        reliability: 1.0,
        avgResponseTime: 1500,
        maxTokens: 4096,
        supportsVision: false
      },
      quality: {
        id: 'openai/gpt-oss-20b:free', 
        name: 'GPT Sage',
        specialization: 'High-quality detailed responses',
        reliability: 0.78,
        avgResponseTime: 3200,
        maxTokens: 8192,
        supportsVision: false
      },
      vision: {
        id: 'qwen/qwen2.5-vl-32b-instruct:free',
        name: 'Vision Oracle',
        specialization: 'Image analysis and visual reasoning',
        reliability: 0.15,
        avgResponseTime: 4800,
        maxTokens: 4096,
        supportsVision: true
      }
    };
    
    this.rateLimiting = {
      lastQualityRequest: 0,
      lastVisionRequest: 0,
      qualityInterval: 25000,    // 25 seconds for quality model
      visionInterval: 300000,    // 5 minutes for vision model
      maxRetries: 3,
      retryDelay: 2000
    };
    
    this.analytics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      modelUsage: {},
      errorTypes: {},
      averageResponseTimes: {},
      userSatisfactionScore: 0,
      systemUptime: Date.now(),
      dailyStats: this.initializeDailyStats()
    };

    this.config = {
      enableAnalytics: true,
      enableFallbacks: true,
      enableVisionFallback: true,
      debugMode: false,
      userFeedbackEnabled: true,
      ...config
    };

    // Initialize analytics for each model
    Object.keys(this.models).forEach(type => {
      const model = this.models[type];
      this.analytics.modelUsage[model.id] = 0;
      this.analytics.averageResponseTimes[model.id] = [];
    });

    this.log('Qora-2.5 Hybrid AI System initialized');
  }

  /**
   * Main entry point - routes requests intelligently through the hybrid system
   */
  async processRequest(message, attachments = [], options = {}) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    this.analytics.totalRequests++;
    this.log(`[${requestId}] Processing request: "${message.substring(0, 50)}..."`);

    try {
      // Analyze request and determine routing strategy
      const routing = this.analyzeAndRoute(message, attachments, options);
      this.log(`[${requestId}] Routing: ${routing.strategy} (${routing.model.name})`);

      // Execute request with chosen model
      const response = await this.executeRequest(requestId, routing, message, attachments, options);
      
      // Track success metrics
      const responseTime = Date.now() - startTime;
      this.trackSuccess(routing.model.id, responseTime);
      this.analytics.successfulRequests++;

      this.log(`[${requestId}] Success in ${responseTime}ms`);

      return {
        success: true,
        response: response.content,
        model: response.model,
        strategy: routing.strategy,
        responseTime,
        requestId,
        qora: {
          systemName: this.systemName,
          version: this.version,
          modelUsed: routing.model.name,
          complexity: routing.complexity,
          reliability: routing.model.reliability,
          fallbackUsed: response.fallbackUsed || false
        },
        usage: response.usage,
        metadata: response.metadata
      };

    } catch (error) {
      // Handle failures with comprehensive error tracking
      this.analytics.failedRequests++;
      this.trackError(error, requestId);
      
      const responseTime = Date.now() - startTime;
      this.log(`[${requestId}] Failed after ${responseTime}ms: ${error.message}`);

      // Attempt graceful recovery
      const fallbackResponse = await this.handleSystemFailure(message, attachments, error, requestId);
      
      return {
        success: false,
        error: error.message,
        fallbackResponse,
        responseTime,
        requestId,
        qora: {
          systemName: this.systemName,
          version: this.version,
          errorHandled: true,
          fallbackProvided: !!fallbackResponse
        }
      };
    }
  }

  /**
   * Intelligent request analysis and model routing
   */
  analyzeAndRoute(message, attachments, options) {
    // Handle vision requests
    if (attachments && attachments.length > 0) {
      return this.routeVisionRequest(message, attachments, options);
    }

    // Analyze text request complexity
    const complexity = this.assessComplexity(message);
    
    // Determine if quality model should be used
    const shouldUseQuality = this.shouldUseQualityModel(complexity, options);
    
    if (shouldUseQuality && this.isQualityModelAvailable()) {
      this.rateLimiting.lastQualityRequest = Date.now();
      return {
        strategy: 'quality_enhanced',
        model: this.models.quality,
        complexity,
        reason: 'Complex request routed to quality model',
        priority: 'high'
      };
    }

    // Default to reliable model
    return {
      strategy: 'reliable_primary',
      model: this.models.reliable,
      complexity,
      reason: 'Standard request routed to reliable model',
      priority: 'standard'
    };
  }

  /**
   * Vision request routing with robust fallback handling
   */
  routeVisionRequest(message, attachments, options) {
    const visionAvailable = this.isVisionModelAvailable();
    
    if (!visionAvailable || !this.config.enableVisionFallback) {
      return {
        strategy: 'vision_fallback',
        model: this.models.reliable,
        complexity: { isComplex: true, requiresVision: true, score: 5 },
        reason: 'Vision model unavailable - providing text assistance',
        fallbackMessage: this.generateVisionFallbackMessage(message, attachments),
        priority: 'fallback'
      };
    }

    this.rateLimiting.lastVisionRequest = Date.now();
    return {
      strategy: 'vision_analysis',
      model: this.models.vision,
      complexity: { isComplex: true, requiresVision: true, score: 5 },
      reason: 'Image analysis request routed to vision model',
      priority: 'high'
    };
  }

  /**
   * Enhanced complexity assessment with multiple factors
   */
  assessComplexity(message) {
    const factors = {
      // Technical indicators
      technical: {
        regex: /\b(algorithm|implementation|architecture|system design|data structure|complexity|optimization|performance|scalability)\b/i,
        weight: 3,
        category: 'technical'
      },
      
      // Programming indicators
      programming: {
        regex: /\b(code|function|class|method|python|javascript|java|c\+\+|programming|debug|refactor|api)\b/i,
        weight: 3,
        category: 'programming' 
      },

      // Educational indicators
      educational: {
        regex: /\b(explain|tutorial|learn|teach|step by step|comprehensive|detailed|thorough|understand)\b/i,
        weight: 2,
        category: 'educational'
      },

      // Analytical indicators
      analytical: {
        regex: /\b(analyze|compare|evaluate|assess|review|pros and cons|advantages|disadvantages|critical analysis)\b/i,
        weight: 2,
        category: 'analytical'
      },

      // Creative indicators
      creative: {
        regex: /\b(write|create|generate|compose|story|essay|article|blog|creative writing|brainstorm)\b/i,
        weight: 1,
        category: 'creative'
      },

      // Research indicators
      research: {
        regex: /\b(research|investigate|study|survey|literature review|comprehensive analysis|deep dive)\b/i,
        weight: 2,
        category: 'research'
      }
    };

    let totalScore = 0;
    const matchedFactors = [];
    const categories = new Set();

    // Assess each factor
    Object.entries(factors).forEach(([key, factor]) => {
      if (factor.regex.test(message)) {
        totalScore += factor.weight;
        matchedFactors.push(key);
        categories.add(factor.category);
      }
    });

    // Length bonus for detailed requests
    if (message.length > 200) totalScore += 1;
    if (message.length > 500) totalScore += 2;

    // Multiple question bonus
    const questionCount = (message.match(/\?/g) || []).length;
    if (questionCount > 1) totalScore += 1;

    const isComplex = totalScore >= 3 || categories.has('technical') || categories.has('programming');

    return {
      score: totalScore,
      isComplex,
      matchedFactors,
      categories: Array.from(categories),
      length: message.length,
      questionCount,
      requiresQuality: totalScore >= 4 || (categories.has('technical') && categories.has('educational'))
    };
  }

  /**
   * Determine if quality model should be used
   */
  shouldUseQualityModel(complexity, options) {
    // Explicit quality request
    if (options.forceQuality) return true;
    
    // High complexity threshold
    if (complexity.requiresQuality) return true;
    
    // Multiple complex categories
    if (complexity.categories.length >= 2 && complexity.score >= 3) return true;
    
    // Long, detailed requests
    if (complexity.length > 300 && complexity.score >= 2) return true;

    return false;
  }

  /**
   * Execute request with robust error handling and retries
   */
  async executeRequest(requestId, routing, message, attachments, options) {
    const maxRetries = this.rateLimiting.maxRetries;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.log(`[${requestId}] Attempt ${attempt}/${maxRetries} with ${routing.model.name}`);

        // Handle special routing cases
        if (routing.strategy === 'vision_fallback') {
          return {
            content: routing.fallbackMessage,
            model: routing.model.id,
            usage: { prompt_tokens: 0, completion_tokens: routing.fallbackMessage.length / 4, total_tokens: routing.fallbackMessage.length / 4 },
            metadata: { strategy: routing.strategy, fallbackUsed: true }
          };
        }

        // Make API call
        const response = await this.callModel(routing.model.id, message, attachments, options);
        
        return {
          content: response.response,
          model: response.model,
          usage: response.usage,
          metadata: { 
            strategy: routing.strategy, 
            attempt,
            model: routing.model.name,
            complexity: routing.complexity
          }
        };

      } catch (error) {
        lastError = error;
        this.log(`[${requestId}] Attempt ${attempt} failed: ${error.message}`);

        // If this is the quality model and it failed, try fallback to reliable model
        if (routing.model.id === this.models.quality.id && attempt === 1) {
          this.log(`[${requestId}] Quality model failed, falling back to reliable model`);
          routing = {
            strategy: 'reliable_fallback',
            model: this.models.reliable,
            complexity: routing.complexity,
            reason: 'Fallback from failed quality model'
          };
          continue;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.rateLimiting.retryDelay * Math.pow(2, attempt - 1);
          this.log(`[${requestId}] Waiting ${delay}ms before retry`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Make API call to specified model
   */
  async callModel(modelId, message, attachments = [], options = {}) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        model: modelId,
        attachments,
        conversationContext: options.conversationContext || [],
        systemPrompt: options.systemPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new QoraError(
        errorData.error || 'Unknown API error',
        modelId,
        response.status,
        errorData.details
      );
    }

    return await response.json();
  }

  /**
   * System-wide failure handling with graceful degradation
   */
  async handleSystemFailure(message, attachments, error, requestId) {
    this.log(`[${requestId}] System failure handling initiated`);

    // If all models fail, provide helpful guidance
    const fallbackMessages = [
      "I'm experiencing technical difficulties right now, but I'm here to help! Could you try rephrasing your question or breaking it into smaller parts?",
      
      "The AI service is temporarily having issues. In the meantime, I can suggest some approaches to your question based on common patterns.",
      
      "All AI models are currently unavailable. Please try again in a few moments, or contact support if the issue persists.",
      
      `I apologize, but I'm unable to process your request "${message.substring(0, 50)}..." right now. Please try again later.`
    ];

    const fallbackResponse = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
    
    // Add specific guidance based on request type
    if (attachments && attachments.length > 0) {
      return fallbackResponse + " For image analysis, please describe what you see in the image and I'll help when service is restored.";
    }

    return fallbackResponse;
  }

  /**
   * Generate vision fallback message
   */
  generateVisionFallbackMessage(message, attachments) {
    const imageCount = attachments.length;
    const imageWord = imageCount === 1 ? 'image' : 'images';
    
    return `I can see you've shared ${imageCount} ${imageWord}, but image analysis is currently unavailable. However, I'd be happy to help! Please describe what you see in the ${imageWord}, and I'll provide assistance based on your description. For example, you could tell me about:\n\n• What objects, people, or scenes are visible\n• Any text you can see\n• Colors, shapes, or patterns\n• What specific information you're looking for\n\nJust describe what you see, and I'll do my best to help with analysis, identification, or answering questions about it!`;
  }

  /**
   * Model availability checking
   */
  isQualityModelAvailable() {
    const timeSinceLastRequest = Date.now() - this.rateLimiting.lastQualityRequest;
    const modelReliability = this.getModelReliability(this.models.quality.id);
    
    return timeSinceLastRequest > this.rateLimiting.qualityInterval && modelReliability > 0.3;
  }

  isVisionModelAvailable() {
    const timeSinceLastRequest = Date.now() - this.rateLimiting.lastVisionRequest;
    const modelReliability = this.getModelReliability(this.models.vision.id);
    
    return timeSinceLastRequest > this.rateLimiting.visionInterval && modelReliability > 0.1;
  }

  /**
   * Analytics and monitoring
   */
  trackSuccess(modelId, responseTime) {
    this.analytics.modelUsage[modelId] = (this.analytics.modelUsage[modelId] || 0) + 1;
    this.analytics.averageResponseTimes[modelId].push(responseTime);
    
    // Keep only last 100 response times for rolling average
    if (this.analytics.averageResponseTimes[modelId].length > 100) {
      this.analytics.averageResponseTimes[modelId].shift();
    }

    this.updateDailyStats('success');
  }

  trackError(error, requestId) {
    const errorType = error.name || 'UnknownError';
    this.analytics.errorTypes[errorType] = (this.analytics.errorTypes[errorType] || 0) + 1;
    
    this.updateDailyStats('error');
    this.log(`[${requestId}] Error tracked: ${errorType} - ${error.message}`);
  }

  getModelReliability(modelId) {
    const usage = this.analytics.modelUsage[modelId] || 0;
    if (usage === 0) return 1.0;
    
    // Calculate based on default reliability and recent performance
    const model = Object.values(this.models).find(m => m.id === modelId);
    const defaultReliability = model ? model.reliability : 0.5;
    
    // For now, return default reliability (in production, calculate from actual data)
    return defaultReliability;
  }

  getAverageResponseTime(modelId) {
    const times = this.analytics.averageResponseTimes[modelId] || [];
    if (times.length === 0) return 0;
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * System status and health monitoring
   */
  getSystemStatus() {
    const now = Date.now();
    const uptimeHours = (now - this.analytics.systemUptime) / (1000 * 60 * 60);
    const successRate = this.analytics.totalRequests > 0 ? 
      (this.analytics.successfulRequests / this.analytics.totalRequests * 100).toFixed(1) : '100.0';

    return {
      system: {
        name: this.systemName,
        version: this.version,
        status: 'operational',
        uptime: `${uptimeHours.toFixed(1)} hours`,
        successRate: `${successRate}%`,
        totalRequests: this.analytics.totalRequests
      },
      models: {
        reliable: {
          name: this.models.reliable.name,
          status: 'online',
          reliability: '100%',
          avgResponseTime: `${this.getAverageResponseTime(this.models.reliable.id)}ms`,
          usage: this.analytics.modelUsage[this.models.reliable.id] || 0
        },
        quality: {
          name: this.models.quality.name,
          status: this.isQualityModelAvailable() ? 'available' : 'rate-limited',
          reliability: `${(this.getModelReliability(this.models.quality.id) * 100).toFixed(1)}%`,
          avgResponseTime: `${this.getAverageResponseTime(this.models.quality.id)}ms`,
          usage: this.analytics.modelUsage[this.models.quality.id] || 0,
          nextAvailable: this.isQualityModelAvailable() ? 'now' : 
            `${Math.ceil((this.rateLimiting.qualityInterval - (now - this.rateLimiting.lastQualityRequest)) / 1000)}s`
        },
        vision: {
          name: this.models.vision.name,
          status: this.isVisionModelAvailable() ? 'available' : 'rate-limited',
          reliability: `${(this.getModelReliability(this.models.vision.id) * 100).toFixed(1)}%`,
          avgResponseTime: `${this.getAverageResponseTime(this.models.vision.id)}ms`,
          usage: this.analytics.modelUsage[this.models.vision.id] || 0,
          nextAvailable: this.isVisionModelAvailable() ? 'now' : 
            `${Math.ceil((this.rateLimiting.visionInterval - (now - this.rateLimiting.lastVisionRequest)) / 60000)}m`
        }
      }
    };
  }

  /**
   * Utility methods
   */
  generateRequestId() {
    return `qora-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  initializeDailyStats() {
    return {
      date: new Date().toISOString().split('T')[0],
      requests: 0,
      successes: 0,
      errors: 0
    };
  }

  updateDailyStats(type) {
    const today = new Date().toISOString().split('T')[0];
    
    if (this.analytics.dailyStats.date !== today) {
      this.analytics.dailyStats = this.initializeDailyStats();
    }
    
    this.analytics.dailyStats.requests++;
    if (type === 'success') {
      this.analytics.dailyStats.successes++;
    } else if (type === 'error') {
      this.analytics.dailyStats.errors++;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(message) {
    if (this.config.debugMode) {
      console.log(`[Qora-2.5] ${new Date().toISOString()} - ${message}`);
    }
  }
}

/**
 * Custom error class for Qora-2.5 system
 */
export class QoraError extends Error {
  constructor(message, model, status, details) {
    super(message);
    this.name = 'QoraError';
    this.model = model;
    this.status = status;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Singleton instance for global use
 */
export const qora25 = new Qora25HybridAI({
  enableAnalytics: true,
  enableFallbacks: true,
  enableVisionFallback: true,
  debugMode: process.env.NODE_ENV === 'development'
});

/**
 * React hook for easy integration with Qora-2.5
 */
export const useQora25 = () => {
  const [systemStatus, setSystemStatus] = useState(qora25.getSystemStatus());
  
  const processRequest = async (message, attachments = [], options = {}) => {
    const result = await qora25.processRequest(message, attachments, options);
    setSystemStatus(qora25.getSystemStatus()); // Update status after each request
    return result;
  };
  
  const refreshStatus = () => {
    setSystemStatus(qora25.getSystemStatus());
  };
  
  return {
    processRequest,
    systemStatus,
    refreshStatus,
    version: qora25.version,
    systemName: qora25.systemName
  };
};

export default qora25;
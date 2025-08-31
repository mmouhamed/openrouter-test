/**
 * Unified AI Provider - Practical Usage Examples
 * Shows how to use the same interface with different providers
 */

import { UnifiedAIProvider } from '@/lib/unified-ai-provider';
import { ChatMessage } from '@/types/conversation';

// ============================================
// BASIC USAGE - Switch providers easily
// ============================================

// Example 1: Using OpenRouter (for premium models)
const openRouterProvider = new UnifiedAIProvider({
  provider: 'openrouter',
  model: 'anthropic/claude-3-opus',  // Premium model
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultParams: {
    temperature: 0.7,
    max_tokens: 1000
  }
});

// Example 2: Using Hugging Face (for free/open models)
const huggingFaceProvider = new UnifiedAIProvider({
  provider: 'huggingface',
  model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  apiKey: process.env.HUGGINGFACE_API_KEY,
  defaultParams: {
    max_new_tokens: 500,
    temperature: 0.8
  }
});

// Example 3: Using Ollama (for local/private)
const ollamaProvider = new UnifiedAIProvider({
  provider: 'ollama',
  model: 'llama2:13b',
  baseUrl: 'http://localhost:11434',  // Local Ollama instance
  defaultParams: {
    temperature: 0.5,
    num_predict: 500
  }
});

// ============================================
// DYNAMIC PROVIDER SWITCHING
// ============================================

async function smartProviderSelection(messages: ChatMessage[]) {
  // Estimate complexity based on message content
  const lastMessage = messages[messages.length - 1].content;
  const isComplex = lastMessage.includes('code') || 
                    lastMessage.includes('analyze') ||
                    lastMessage.length > 500;

  // Choose provider based on task complexity
  const provider = new UnifiedAIProvider({
    provider: isComplex ? 'openrouter' : 'huggingface',
    model: isComplex 
      ? 'openai/gpt-4-turbo-preview'  // Complex tasks
      : 'mistralai/Mixtral-8x7B-Instruct-v0.1',  // Simple tasks
  });

  const response = await provider.chat(messages);
  console.log(`Used ${response.provider} with ${response.model}`);
  return response;
}

// ============================================
// FALLBACK STRATEGY
// ============================================

async function chatWithFallback(messages: ChatMessage[]) {
  const providers = [
    { provider: 'openrouter', model: 'openai/gpt-3.5-turbo' },
    { provider: 'huggingface', model: 'mistralai/Mixtral-8x7B-Instruct-v0.1' },
    { provider: 'ollama', model: 'llama2' }
  ];

  for (const config of providers) {
    try {
      const provider = new UnifiedAIProvider(config as any);
      const response = await provider.chat(messages);
      console.log(`Success with ${config.provider}`);
      return response;
    } catch (error) {
      console.log(`Failed with ${config.provider}, trying next...`);
      continue;
    }
  }
  
  throw new Error('All providers failed');
}

// ============================================
// COST OPTIMIZATION STRATEGY
// ============================================

class CostOptimizedAI {
  private providers: Map<string, UnifiedAIProvider>;
  private costPerToken: Map<string, number>;

  constructor() {
    // Initialize providers
    this.providers = new Map([
      ['gpt-4', new UnifiedAIProvider({
        provider: 'openrouter',
        model: 'openai/gpt-4'
      })],
      ['gpt-3.5', new UnifiedAIProvider({
        provider: 'openrouter',
        model: 'openai/gpt-3.5-turbo'
      })],
      ['mixtral', new UnifiedAIProvider({
        provider: 'huggingface',
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
      })],
      ['local', new UnifiedAIProvider({
        provider: 'ollama',
        model: 'llama2'
      })]
    ]);

    // Cost per 1K tokens (example rates)
    this.costPerToken = new Map([
      ['gpt-4', 0.03],      // $0.03 per 1K tokens
      ['gpt-3.5', 0.001],   // $0.001 per 1K tokens
      ['mixtral', 0],       // Free (Hugging Face)
      ['local', 0]          // Free (local)
    ]);
  }

  async chat(messages: ChatMessage[], maxBudget: number = 0.01) {
    // Estimate token count (rough approximation)
    const estimatedTokens = messages.reduce((sum, msg) => 
      sum + msg.content.length / 4, 0
    );

    // Select provider based on budget
    let selectedProvider = 'local';
    for (const [name, provider] of this.providers) {
      const cost = (this.costPerToken.get(name) || 0) * (estimatedTokens / 1000);
      if (cost <= maxBudget) {
        selectedProvider = name;
        if (name === 'gpt-4') break; // Prefer best model if budget allows
      }
    }

    console.log(`Selected ${selectedProvider} based on budget ${maxBudget}`);
    return this.providers.get(selectedProvider)!.chat(messages);
  }
}

// ============================================
// LOAD BALANCING
// ============================================

class LoadBalancedAI {
  private providers: UnifiedAIProvider[];
  private currentIndex = 0;

  constructor() {
    this.providers = [
      new UnifiedAIProvider({
        provider: 'huggingface',
        model: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
      }),
      new UnifiedAIProvider({
        provider: 'huggingface',
        model: 'meta-llama/Llama-2-70b-chat-hf'
      }),
      new UnifiedAIProvider({
        provider: 'huggingface',
        model: 'google/flan-t5-xxl'
      })
    ];
  }

  async chat(messages: ChatMessage[]) {
    // Round-robin load balancing
    const provider = this.providers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.providers.length;
    
    return provider.chat(messages);
  }
}

// ============================================
// PRIVACY-AWARE ROUTING
// ============================================

async function privacyAwareChat(
  messages: ChatMessage[],
  containsSensitiveData: boolean
) {
  // Use local model for sensitive data
  const provider = new UnifiedAIProvider({
    provider: containsSensitiveData ? 'ollama' : 'openrouter',
    model: containsSensitiveData ? 'llama2' : 'openai/gpt-3.5-turbo',
    baseUrl: containsSensitiveData ? 'http://localhost:11434' : undefined
  });

  const response = await provider.chat(messages);
  
  if (containsSensitiveData) {
    console.log('✅ Processed locally for privacy');
  }
  
  return response;
}

// ============================================
// SPECIALIZED TASK ROUTING
// ============================================

async function taskBasedRouting(
  messages: ChatMessage[],
  taskType: 'code' | 'creative' | 'analysis' | 'translation'
) {
  const taskToProvider: Record<string, any> = {
    code: {
      provider: 'openrouter',
      model: 'openai/gpt-4-turbo-preview'  // Best for code
    },
    creative: {
      provider: 'openrouter',
      model: 'anthropic/claude-3-opus'  // Best for creative writing
    },
    analysis: {
      provider: 'huggingface',
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1'  // Good for analysis
    },
    translation: {
      provider: 'huggingface',
      model: 'google/flan-t5-xxl'  // Specialized for translation
    }
  };

  const config = taskToProvider[taskType];
  const provider = new UnifiedAIProvider(config);
  
  return provider.chat(messages);
}

// ============================================
// REAL-WORLD REACT COMPONENT EXAMPLE
// ============================================

import { useState, useCallback } from 'react';

export function AIProviderComponent() {
  const [provider, setProvider] = useState<'openrouter' | 'huggingface' | 'ollama'>('huggingface');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      // Create provider based on current selection
      const aiProvider = new UnifiedAIProvider({
        provider,
        model: provider === 'openrouter' 
          ? 'openai/gpt-3.5-turbo'
          : provider === 'huggingface'
          ? 'mistralai/Mixtral-8x7B-Instruct-v0.1'
          : 'llama2'
      });

      // Get AI response
      const response = await aiProvider.chat(updatedMessages);
      
      // Add AI message
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        model: response.model,
        timestamp: new Date(),
        usage: response.usage
      };
      
      setMessages([...updatedMessages, aiMessage]);
      
      // Track costs if available
      if (response.usage) {
        console.log('Token usage:', response.usage);
      }
      
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, provider]);

  return {
    provider,
    setProvider,
    messages,
    sendMessage,
    isLoading
  };
}

// ============================================
// MONITORING AND ANALYTICS
// ============================================

class MonitoredAIProvider extends UnifiedAIProvider {
  private metrics: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageLatency: number;
    errorRate: number;
  } = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageLatency: 0,
    errorRate: 0
  };

  async chat(messages: ChatMessage[]) {
    const startTime = Date.now();
    
    try {
      this.metrics.totalRequests++;
      const response = await super.chat(messages);
      
      // Track metrics
      const latency = Date.now() - startTime;
      this.metrics.averageLatency = 
        (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) 
        / this.metrics.totalRequests;
      
      if (response.usage) {
        this.metrics.totalTokens += response.usage.total_tokens || 0;
        // Calculate cost based on provider and model
        this.metrics.totalCost += this.calculateCost(response);
      }
      
      return response;
      
    } catch (error) {
      this.metrics.errorRate = 
        (this.metrics.errorRate * (this.metrics.totalRequests - 1) + 1) 
        / this.metrics.totalRequests;
      throw error;
    }
  }

  private calculateCost(response: any): number {
    // Implement cost calculation based on provider/model
    const rates: Record<string, number> = {
      'openai/gpt-4': 0.03,
      'openai/gpt-3.5-turbo': 0.001,
      // Add more rates
    };
    
    const rate = rates[response.model] || 0;
    return (response.usage?.total_tokens || 0) * rate / 1000;
  }

  getMetrics() {
    return this.metrics;
  }
}

export {
  smartProviderSelection,
  chatWithFallback,
  CostOptimizedAI,
  LoadBalancedAI,
  privacyAwareChat,
  taskBasedRouting,
  MonitoredAIProvider
};
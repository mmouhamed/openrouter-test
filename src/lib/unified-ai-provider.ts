import { ChatMessage } from '@/types/conversation';

export type AIProvider = 'openrouter' | 'huggingface' | 'ollama';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  defaultParams?: Record<string, any>;
}

export interface UnifiedAIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  metadata?: Record<string, any>;
}

export class UnifiedAIProvider {
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  async chat(messages: ChatMessage[]): Promise<UnifiedAIResponse> {
    switch (this.config.provider) {
      case 'openrouter':
        return this.openRouterChat(messages);
      case 'huggingface':
        return this.huggingFaceChat(messages);
      case 'ollama':
        return this.ollamaChat(messages);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  private async openRouterChat(messages: ChatMessage[]): Promise<UnifiedAIResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey || process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window?.location?.origin || 'http://localhost:3000',
        'X-Title': 'AI Chat Hub'
      },
      body: JSON.stringify({
        model: this.config.model || 'openai/gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        ...this.config.defaultParams
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      provider: 'openrouter',
      model: this.config.model || 'openai/gpt-3.5-turbo',
      usage: data.usage
    };
  }

  private async huggingFaceChat(messages: ChatMessage[]): Promise<UnifiedAIResponse> {
    const prompt = messages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${this.config.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1'}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey || process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt + '\nAssistant:',
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            ...this.config.defaultParams
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = Array.isArray(data) 
      ? data[0]?.generated_text || ''
      : data.generated_text || '';

    return {
      content: aiResponse,
      provider: 'huggingface',
      model: this.config.model || 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    };
  }

  private async ollamaChat(messages: ChatMessage[]): Promise<UnifiedAIResponse> {
    const response = await fetch(
      `${this.config.baseUrl || 'http://localhost:11434'}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'llama2',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: false,
          ...this.config.defaultParams
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();

    return {
      content: data.message.content,
      provider: 'ollama',
      model: this.config.model || 'llama2',
      metadata: {
        total_duration: data.total_duration,
        eval_count: data.eval_count
      }
    };
  }

  async listModels(): Promise<string[]> {
    switch (this.config.provider) {
      case 'openrouter':
        const orResponse = await fetch('https://openrouter.ai/api/v1/models');
        const orData = await orResponse.json();
        return orData.data.map((m: any) => m.id);
        
      case 'huggingface':
        return [
          'mistralai/Mixtral-8x7B-Instruct-v0.1',
          'meta-llama/Llama-2-70b-chat-hf',
          'google/flan-t5-xxl',
          'bigscience/bloom',
          'EleutherAI/gpt-neox-20b',
        ];
        
      case 'ollama':
        const ollamaResponse = await fetch(`${this.config.baseUrl || 'http://localhost:11434'}/api/tags`);
        const ollamaData = await ollamaResponse.json();
        return ollamaData.models.map((m: any) => m.name);
        
      default:
        return [];
    }
  }
}
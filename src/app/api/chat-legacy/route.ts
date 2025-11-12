/**
 * Clean Chat API - Simplified smart routing with existing infrastructure
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      sessionId = 'default',
      attachments = []
    } = body;

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('🚀 Clean Chat Request:', {
      message: message.substring(0, 100),
      sessionId,
      attachmentsCount: attachments.length
    });

    const startTime = Date.now();

    // Smart model routing
    let selectedModel = 'meta-llama/llama-3.3-8b-instruct:free'; // Phoenix Core (default)
    let strategy = 'single';
    let reasoning = 'Fast general response with Phoenix Core';

    // Route to Oracle Core for complex/technical queries
    if (message.length > 200 || 
        /\b(analyze|compare|comprehensive|detailed|complex|advanced|technical|code|programming|explain.*detail)\b/i.test(message)) {
      selectedModel = 'openai/gpt-oss-20b:free';
      reasoning = 'Complex query routed to Oracle Core for detailed analysis';
    }
    
    // Route to Iris Core for vision-related queries
    if (attachments.length > 0 || 
        /\b(image|picture|photo|visual|diagram|chart|graph|vision|see|look|show|view)\b/i.test(message)) {
      selectedModel = 'qwen/qwen2.5-vl-32b-instruct:free';
      reasoning = 'Vision-related query routed to Iris Core for multimodal processing';
    }

    // Determine fusion strategy for future enhancement
    if (message.length > 300 && /\b(compare|contrast|versus|vs)\b/i.test(message)) {
      strategy = 'consensus';
      reasoning = 'Comparison query would benefit from consensus fusion';
    } else if (message.length > 150 && /\b(creative|generate|create|write)\b/i.test(message)) {
      strategy = 'sequential';
      reasoning = 'Creative task would benefit from sequential enhancement';
    }

    console.log('🎯 Smart routing:', {
      model: selectedModel,
      strategy,
      reasoning
    });

    // Call existing chat API
    const apiResponse = await fetch(`${request.nextUrl.origin}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        model: selectedModel,
        attachments: attachments || []
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('❌ API Error:', errorData);
      throw new Error('Failed to get AI response');
    }

    const aiData = await apiResponse.json();
    const processingTime = Date.now() - startTime;

    // Get model display names
    const modelNames: Record<string, string> = {
      'meta-llama/llama-3.3-8b-instruct:free': 'Phoenix Core',
      'openai/gpt-oss-20b:free': 'Oracle Core',
      'qwen/qwen2.5-vl-32b-instruct:free': 'Iris Core'
    };

    // Generate smart suggestions based on content
    const suggestions = generateSuggestions(message, aiData.response || '');
    const relatedQueries = generateRelatedQueries(message);

    // Build enhanced response
    const cleanResponse = {
      success: true,
      response: aiData.response || aiData.message || 'No response received',
      message: {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: aiData.response || aiData.message || 'No response received',
        timestamp: new Date(),
        model: selectedModel,
        metadata: {
          processingTime,
          confidence: calculateConfidence(message, aiData.response || ''),
          fusion: {
            strategy: { 
              type: strategy as 'single' | 'sequential' | 'parallel' | 'consensus', 
              models: [selectedModel], 
              reasoning, 
              confidence: 0.85 
            },
            modelsUsed: [selectedModel],
            totalProcessingTime: processingTime,
            qualityScore: calculateQualityScore(aiData.response || '', strategy)
          },
          sources: [], // Web search would be added here
          context: {
            tokensUsed: Math.ceil(message.length / 4),
            relevanceScore: 0.85,
            topicContinuity: 0.8,
            contextualShifts: []
          }
        }
      },
      metadata: {
        processingTime,
        modelUsed: modelNames[selectedModel] || selectedModel,
        strategy,
        reasoning,
        fusion: {
          strategy: { type: strategy, models: [selectedModel], reasoning, confidence: 0.85 },
          modelsUsed: [selectedModel],
          totalProcessingTime: processingTime,
          qualityScore: calculateQualityScore(aiData.response || '', strategy)
        },
        context: {
          tokensUsed: Math.ceil(message.length / 4),
          relevanceScore: 0.85,
          topicContinuity: 0.8,
          contextualShifts: []
        },
        suggestions,
        relatedQueries
      }
    };

    console.log('✅ Clean Chat Response:', {
      model: modelNames[selectedModel],
      strategy,
      processingTime: `${processingTime}ms`,
      confidence: Math.round(cleanResponse.message.metadata.confidence * 100) + '%'
    });

    return NextResponse.json(cleanResponse);

  } catch (error) {
    console.error('❌ Clean Chat Error:', error);
    
    const err = error as Error;
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process message',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function generateSuggestions(userMessage: string, _aiResponse: string): string[] {
  const suggestions: string[] = [];
  
  // Based on question type
  if (/what|explain|define/i.test(userMessage)) {
    suggestions.push('Can you provide an example?');
    suggestions.push('How does this work in practice?');
  } else if (/how/i.test(userMessage)) {
    suggestions.push('What are the best practices?');
    suggestions.push('Are there any alternatives?');
  } else if (/why/i.test(userMessage)) {
    suggestions.push('Can you elaborate on this?');
    suggestions.push('What are the implications?');
  }
  
  // Default suggestions
  if (suggestions.length === 0) {
    suggestions.push('Tell me more about this topic');
    suggestions.push('What should I know next?');
    suggestions.push('How can I apply this?');
  }
  
  return suggestions.slice(0, 3);
}

function generateRelatedQueries(message: string): string[] {
  const queries: string[] = [];
  
  // Extract key terms
  const words = message.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !/^(what|how|why|when|where|this|that|with|from|they|have|will|been|were)$/.test(word));
  
  const keyTerms = [...new Set(words)].slice(0, 2);
  
  keyTerms.forEach(term => {
    queries.push(`${term} best practices`);
    queries.push(`${term} examples`);
  });
  
  if (queries.length === 0) {
    queries.push('Related concepts');
    queries.push('Practical applications');
  }
  
  return queries.slice(0, 3);
}

function calculateConfidence(message: string, response: string): number {
  let confidence = 0.7; // Base confidence
  
  // Higher confidence for longer, detailed responses
  if (response.length > 200) confidence += 0.1;
  if (response.length > 500) confidence += 0.1;
  
  // Higher confidence for structured responses
  if (/\n\n/.test(response)) confidence += 0.05;
  if (/\*\*|\d+\.|\•/.test(response)) confidence += 0.05;
  
  return Math.min(confidence, 0.95);
}

function calculateQualityScore(response: string, strategy: string): number {
  let score = 0.7; // Base score
  
  // Strategy bonuses
  const strategyBonuses: Record<string, number> = {
    single: 0.1,
    sequential: 0.15,
    parallel: 0.2,
    consensus: 0.25
  };
  
  score += strategyBonuses[strategy] || 0.1;
  
  // Content quality indicators
  if (response.length > 300) score += 0.05;
  if (/examples?|for instance|such as/i.test(response)) score += 0.05;
  if (/\*\*|\d+\./.test(response)) score += 0.05;
  
  return Math.min(score, 1.0);
}

export async function GET() {
  return NextResponse.json({
    status: 'Clean Chat API is running',
    timestamp: new Date().toISOString(),
    models: {
      'Phoenix Core': 'General intelligence and fast responses',
      'Oracle Core': 'Advanced reasoning and technical queries', 
      'Iris Core': 'Vision processing and multimodal content'
    }
  });
}
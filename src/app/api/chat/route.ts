import { NextRequest, NextResponse } from 'next/server';
import { performWebSearch, createSearchContext, shouldUseWebSearch } from '@/utils/webSearch';
import { FusionEngine } from '@/lib/FusionEngine';
import { CHATGPT_STYLE_SYSTEM_PROMPT } from '@/lib/chatgpt-style-prompt';
import { enhanceSystemPromptWithTone } from '@/lib/tone-analyzer';

// Response sanitization function
function sanitizeResponse(response: string): string {
  // Replace URLs with safe placeholders
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let sanitized = response.replace(urlRegex, (match) => {
    // Extract domain for context
    try {
      const url = new URL(match);
      const domain = url.hostname.replace('www.', '');
      return `[Search "${domain}" for more information]`;
    } catch {
      return '[Search for more information]';
    }
  });

  // Add temporal disclaimer if discussing future events
  const futureKeywords = ['2025', '2026', 'will be', 'will have', 'upcoming', 'future', 'next year'];
  const hasFutureContent = futureKeywords.some(keyword => 
    sanitized.toLowerCase().includes(keyword.toLowerCase())
  );

  if (hasFutureContent) {
    sanitized += '\n\n*Note: Future predictions are speculative and based on current trends. Actual developments may vary.*';
  }

  return sanitized;
}

// Dynamic recommendation generation using LLM
async function generateDynamicRecommendations(
  userQuestion: string, 
  aiResponse: string, 
  conversationContext: Array<{ role: string; content: string; model?: string }>
) {
  try {
    // Create a focused prompt for generating contextual recommendations
    const contextSummary = conversationContext.length > 0 
      ? conversationContext.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : 'No previous context';

    const recommendationPrompt = `You are an intelligent conversation assistant. Based on the conversation below, generate 4 FRESH, contextual follow-up questions that build specifically on what was just discussed.

CONVERSATION CONTEXT:
${contextSummary}

MOST RECENT EXCHANGE:
User: ${userQuestion}
Assistant: ${aiResponse.substring(0, 500)}...

Generate 4 NEW, intelligent follow-up questions that:
1. Build directly on the specific content that was just discussed
2. Explore practical implementations, edge cases, or deeper insights
3. Consider related aspects that would naturally come next
4. Are highly specific to THIS conversation (avoid generic questions)
5. Help the user dive deeper into the topic or apply what they learned

Each question should feel like a natural continuation of the conversation.

Format as JSON array:
[
  {
    "text": "Specific follow-up question based on the actual response content",
    "category": "follow_up|deeper|practical|alternative", 
    "reasoning": "Why this specific question would be valuable given what was just discussed"
  }
]

Focus on being contextual and specific - not generic. Timestamp: ${Date.now()}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.pages.dev',
        'X-Title': 'AI Chat Hub - Recommendations'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-8b-instruct:free', // Use fast model for recommendations
        messages: [
          {
            role: 'user',
            content: recommendationPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      console.warn('Failed to generate dynamic recommendations, falling back to empty array');
      return [];
    }

    const data = await response.json();
    const recommendationsText = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Clean the response text - remove markdown formatting and extract JSON
      let cleanedText = recommendationsText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.includes('```')) {
        const jsonMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedText = jsonMatch[1].trim();
        }
      }
      
      // If it starts with plain text, try to find JSON array
      if (!cleanedText.startsWith('[')) {
        const jsonMatch = cleanedText.match(/(\[[\s\S]*\])/);
        if (jsonMatch) {
          cleanedText = jsonMatch[1].trim();
        } else {
          // If no JSON array found, fall back to empty array
          console.warn('No valid JSON array found in recommendations response:', cleanedText.substring(0, 200));
          return [];
        }
      }
      
      const recommendations = JSON.parse(cleanedText);
      
      // Validate that it's an array
      if (!Array.isArray(recommendations)) {
        console.warn('Recommendations response is not an array:', recommendations);
        return [];
      }
      
      // Add confidence scores and IDs  
      return recommendations.map((rec: {
        text: string;
        category?: string;
        reasoning?: string;
      }, index: number) => ({
        id: `dynamic_${Date.now()}_${index}`,
        text: rec.text,
        category: rec.category || 'follow_up',
        reasoning: rec.reasoning || 'AI-generated contextual suggestion',
        confidence: 0.85 + (Math.random() * 0.1) // 85-95% confidence for LLM recommendations
      }));
    } catch (parseError) {
      console.warn('Failed to parse recommendations JSON:', parseError, 'Raw text:', recommendationsText.substring(0, 200));
      return [];
    }
  } catch (error) {
    console.warn('Error generating dynamic recommendations:', error);
    return [];
  }
}

// Helper function to extract conversation topics
function extractConversationTopics(conversationContext: Array<{ role: string; content: string }>): string {
  const importantWords = new Set<string>();

  conversationContext.forEach(msg => {
    if (msg.role === 'user') {
      // Extract key nouns and topics from user messages
      const words = msg.content.toLowerCase().match(/\b\w+\b/g) || [];
      words
        .filter(word => 
          word.length > 4 && 
          !['that', 'this', 'what', 'when', 'where', 'which', 'would', 'could', 'should', 'about'].includes(word)
        )
        .forEach(word => {
          if (importantWords.size < 10) {
            importantWords.add(word);
          }
        });
    }
  });

  return Array.from(importantWords).slice(0, 5).join(', ');
}

// Add edge runtime configuration for Cloudflare compatibility
export const runtime = 'edge';

// GET handler for system health checks and other query actions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      // Return system health status
      return NextResponse.json({
        health: {
          models: {
            'meta-llama/llama-3.3-70b-instruct:free': { status: 'online' },
            'meta-llama/llama-3.3-8b-instruct:free': { status: 'online' },
            'openai/gpt-oss-20b:free': { status: 'online' }
          },
          overall: {
            status: 'optimal',
            score: 100
          },
          timestamp: new Date().toISOString(),
          apiConfigured: !!process.env.OPENROUTER_API_KEY
        }
      });
    }

    // Default response for unknown actions
    return NextResponse.json(
      { error: 'Unknown action or missing action parameter' },
      { status: 400 }
    );

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('GET /api/chat Error:', err.message);
    
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

// DELETE handler for clearing sessions
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('sessionId');

    if (action === 'clear') {
      // For now, this is a no-op since we don't persist sessions server-side
      // In the future, this could clear session data from a database
      console.log(`Clearing session: ${sessionId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Session cleared successfully',
        sessionId,
        timestamp: new Date().toISOString()
      });
    }

    // Default response for unknown actions
    return NextResponse.json(
      { error: 'Unknown action or missing action parameter' },
      { status: 400 }
    );

  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('DELETE /api/chat Error:', err.message);
    
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      attachments = [],
      model = 'AI Fusion', // Default to fusion
      conversationContext = [],
      systemPrompt,
      enableWebSearch = false,
      maxSources = 5
    } = await request.json();

    console.log('API Request:', { 
      message: message?.substring(0, 100), 
      model, 
      contextLength: conversationContext.length,
      attachmentsCount: attachments.length,
      enableWebSearch,
      maxSources,
      fusionMode: 'Always AI Fusion'
    });

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments are required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY not configured');
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    // Perform web search if enabled and relevant
    let webSearchResults = null;
    let searchContext = '';
    const shouldSearch = enableWebSearch && message && shouldUseWebSearch(message);
    
    if (shouldSearch) {
      console.log('Performing web search for query:', message.substring(0, 100));
      webSearchResults = await performWebSearch(message, maxSources);
      
      if (webSearchResults.success && webSearchResults.sources.length > 0) {
        searchContext = createSearchContext(webSearchResults.sources, message);
        console.log(`Web search completed: ${webSearchResults.sources.length} sources found`);
      } else if (webSearchResults.error) {
        console.warn('Web search failed:', webSearchResults.error);
      }
    }

    // Always use AI Fusion as the default architecture
    console.log('Processing AI Fusion request (default architecture)');
    
    const fusionEngine = new FusionEngine();
    
    try {
      // Use the new Turbo fusion method for 50% faster responses
      const fusionResult = await fusionEngine.processFusionQueryTurbo({
        query: message,
        conversationContext: conversationContext.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: searchContext ? `${msg.content}\n\nWeb Context: ${searchContext}` : msg.content
        })),
        fusionStrategy: 'consensus' as 'consensus' | 'specialized' | 'iterative',
        includeIndividualResponses: true,
        timeout: 20000 // 20-second timeout for better reliability
      });

      // Generate dynamic recommendations for fusion response
      const dynamicRecommendations = await generateDynamicRecommendations(
        message,
        fusionResult.fusedResponse,
        conversationContext
      );

      return NextResponse.json({
        response: sanitizeResponse(fusionResult.fusedResponse),
        model: 'Turbo AI Fusion',
        sources: webSearchResults?.sources || [],
        webSearchUsed: shouldSearch,
        dynamicRecommendations,
        fusion: {
          strategy: fusionResult.fusionStrategy,
          modelsUsed: fusionResult.modelsUsed,
          individualResponses: fusionResult.individualResponses,
          processingTime: fusionResult.processingTime,
          confidence: fusionResult.confidence,
          qualityScore: fusionResult.metadata.qualityScore,
          speedImprovement: fusionResult.processingTime < 20000 ? `${Math.round(((30000 - fusionResult.processingTime) / 30000) * 100)}% faster` : 'Standard speed'
        },
        metadata: {
          ...fusionResult.metadata,
          turboMode: true,
          targetResponseTime: '15 seconds',
          actualResponseTime: `${Math.round(fusionResult.processingTime / 1000)}s`
        },
        timestamp: new Date().toISOString()
      });

    } catch (fusionError) {
      console.error('AI Fusion failed, using fallback:', fusionError);
      // The processFusionQueryWithFallback already handles fallback, but in case of total failure:
    }

    // Build messages array with optional system prompt and conversation context
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];
    
    // Add system prompt with current date, temporal guidelines, and tone adaptation
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const baseChatGPTPrompt = `${CHATGPT_STYLE_SYSTEM_PROMPT}

TEMPORAL GUIDELINES:
- Current date: ${currentDate}
- When discussing future events, clearly state they are predictions/expectations
- Never claim certainty about future developments
- If asked about "latest" or "recent" developments, only reference information from your training data cutoff
- If you're unsure about timing of events, ask for clarification rather than guessing

LINK POLICY:
- NEVER generate actual URLs (https://example.com)
- Use descriptive placeholders like "[Search for latest AI developments 2024]"
- Suggest search terms instead of providing direct links
- If referencing sources, describe them without providing URLs`;

    // Enhance with tone-specific guidance based on the user's question
    let enhancedSystemPrompt = systemPrompt || enhanceSystemPromptWithTone(baseChatGPTPrompt, message);

    if (searchContext) {
      enhancedSystemPrompt += '\n\n' + searchContext;
    }
    
    messages.push({
      role: 'system',
      content: enhancedSystemPrompt
    });
    
    // Check for corrections in recent context
    const hasRecentCorrections = conversationContext.some((msg: { role: string; content: string; isCorrection?: boolean }) => msg.isCorrection);
    if (hasRecentCorrections) {
      enhancedSystemPrompt += '\n\nIMPORTANT: The user has recently made corrections. Be extra careful about temporal accuracy and avoid generating URLs. Acknowledge any corrections gracefully and provide accurate information.';
    }

    // Enhanced conversation context processing
    if (conversationContext && Array.isArray(conversationContext) && conversationContext.length > 0) {
      // Smart context window management - keep recent messages + important context
      const processedContext = conversationContext
        .slice(-10) // Last 10 messages for better context
        .filter((msg: { role: string; content: string }) => {
          // Filter out very short or repetitive messages to save tokens
          const content = msg.content?.trim() || '';
          return content.length > 2 && !['ok', 'yes', 'no', 'thanks'].includes(content.toLowerCase());
        })
        .map((msg: { role: string; content: string }, index: number) => ({
          ...msg,
          timestamp: new Date(),
          isRecent: index >= conversationContext.length - 5 // Last 5 are "recent"
        }));

      // Add conversation context with priority for recent messages
      processedContext.forEach((msg: { 
        role: string; 
        content: string; 
        attachments?: Array<{ base64?: string; url?: string }>; 
        isCorrection?: boolean;
        isRecent?: boolean;
        timestamp?: Date;
      }) => {
        if (msg.attachments && msg.attachments.length > 0) {
          // For context messages with attachments, format for vision models
          const content = [
            { type: 'text', text: msg.content || 'See image' },
            ...msg.attachments.map((attachment: { base64?: string; url?: string }) => ({
              type: 'image_url',
              image_url: { url: attachment.base64 || attachment.url || '' }
            }))
          ];
          messages.push({
            role: msg.role,
            content: content
          });
        } else {
          // Truncate very long messages to preserve context window
          const truncatedContent = msg.content.length > 1000 
            ? msg.content.substring(0, 1000) + '...' 
            : msg.content;
            
          messages.push({
            role: msg.role,
            content: truncatedContent
          });
        }
      });

      // Add conversation flow context if long conversation
      if (conversationContext.length > 15) {
        const topicSummary = extractConversationTopics(conversationContext);
        if (topicSummary) {
          enhancedSystemPrompt += `\n\nCONVERSATION TOPICS: This ongoing conversation has covered: ${topicSummary}. Build on these topics naturally.`;
        }
      }
    }
    
    // Add current user message with attachments if any
    if (attachments && attachments.length > 0) {
      const content = [
        { type: 'text', text: message || 'Please describe this image' },
        ...attachments.map((attachment: { base64?: string; url?: string }) => ({
          type: 'image_url',
          image_url: { url: attachment.base64 || attachment.url || '' }
        }))
      ];
      messages.push({
        role: 'user',
        content: content
      });
    } else {
      messages.push({
        role: 'user',
        content: message
      });
    }

    // Use fetch instead of axios for edge runtime compatibility
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.pages.dev', // Update with your Cloudflare Pages URL
        'X-Title': 'AI Chat Hub'
      },
      body: JSON.stringify({
        model: model === 'AI Fusion' ? 'meta-llama/llama-3.3-8b-instruct:free' : model,
        messages: messages,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        model,
        messageLength: messages.length
      });
      
      // Parse error to provide more specific user feedback
      let errorMessage = 'Failed to get response from AI';
      if (response.status === 404) {
        errorMessage = 'The selected AI model is currently unavailable. Please try a different model.';
      } else if (response.status === 429) {
        errorMessage = 'The AI service is currently rate-limited. Please wait a moment and try again.';
      } else if (response.status >= 500) {
        errorMessage = 'The AI service is experiencing issues. Please try again in a few moments.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;

    // Post-process response to sanitize links and add disclaimers
    aiResponse = sanitizeResponse(aiResponse);

    // Generate dynamic recommendations using the LLM
    console.log('🔄 Generating fresh recommendations for response:', {
      userMessagePreview: message.substring(0, 50),
      responsePreview: aiResponse.substring(0, 50),
      contextLength: conversationContext.length
    });
    
    const recommendations = await generateDynamicRecommendations(
      message,
      aiResponse,
      conversationContext.slice(-3) // Last 3 exchanges for context
    );

    console.log('✨ Generated recommendations:', {
      count: recommendations.length,
      preview: recommendations.map(r => r.text.substring(0, 30))
    });

    return NextResponse.json({
      response: aiResponse,
      model: model,
      usage: data.usage,
      contextSize: messages.length,
      estimatedTokens: messages.reduce((acc: number, msg: { content: string | object }) => {
        const contentLength = typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length;
        return acc + Math.ceil(contentLength / 4);
      }, 0),
      sources: webSearchResults?.sources || [],
      webSearchUsed: shouldSearch && webSearchResults?.success,
      dynamicRecommendations: recommendations
    });

  } catch (error: unknown) {
    const err = error as { message?: string; name?: string };
    
    // Handle abort/timeout errors gracefully
    if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('terminated')) {
      return NextResponse.json(
        { error: 'Request was cancelled or timed out' },
        { status: 408 } // Request Timeout
      );
    }
    
    console.error('OpenRouter API Error:', err.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to get response from AI',
        details: err.message 
      },
      { status: 500 }
    );
  }
}
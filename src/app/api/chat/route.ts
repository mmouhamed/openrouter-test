import { NextRequest, NextResponse } from 'next/server';
import { performWebSearch, createSearchContext, shouldUseWebSearch } from '@/utils/webSearch';

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
            'gpt-4': { status: 'online' }
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
      model = 'meta-llama/llama-3.3-70b-instruct:free',
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
      maxSources
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

    // Build messages array with optional system prompt and conversation context
    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add conversation context if provided
    if (conversationContext && Array.isArray(conversationContext) && conversationContext.length > 0) {
      conversationContext.forEach((msg: { role: string; content: string; attachments?: Array<{ base64?: string; url?: string }> }) => {
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
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
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
        model: model,
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
    const aiResponse = data.choices[0].message.content;

    return NextResponse.json({
      response: aiResponse,
      model: model,
      usage: data.usage,
      contextSize: messages.length,
      estimatedTokens: messages.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0)
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
import { NextRequest, NextResponse } from 'next/server';

// Add edge runtime configuration for Cloudflare compatibility
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      model = 'meta-llama/llama-3.3-70b-instruct:free',
      conversationContext = [],
      systemPrompt
    } = await request.json();

    console.log('API Request:', { 
      message: message?.substring(0, 100), 
      model, 
      contextLength: conversationContext.length 
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
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
    const messages: Array<{ role: string; content: string }> = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add conversation context if provided
    if (conversationContext && Array.isArray(conversationContext) && conversationContext.length > 0) {
      conversationContext.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

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
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
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